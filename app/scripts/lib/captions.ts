import fs from "fs";
import path from "path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type Language,
} from "@remotion/install-whisper-cpp";
import { createTikTokStyleCaptions, parseSrt, serializeSrt, type Caption } from "@remotion/captions";
import { resolvePublic } from "./media";
import { runFfmpeg } from "./ffmpeg";

/**
 * Free, local transcription with whisper.cpp — word-level timestamps, no cloud.
 * The model builds/downloads on first use into ./whisper.cpp (gitignored).
 * Default model is base.en for speed; set WHISPER_MODEL=large-v3-turbo (and a
 * matching WHISPER_VERSION) for best quality.
 */
export type WhisperModel =
  | "tiny"
  | "tiny.en"
  | "base"
  | "base.en"
  | "small"
  | "small.en"
  | "medium"
  | "medium.en"
  | "large-v1"
  | "large-v2"
  | "large-v3"
  | "large-v3-turbo";

const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = process.env.WHISPER_VERSION || "1.5.5";
const WHISPER_MODEL = (process.env.WHISPER_MODEL || "base.en") as WhisperModel;

const ready = new Map<WhisperModel, Promise<void>>();
function ensureWhisper(model: WhisperModel): Promise<void> {
  let p = ready.get(model);
  if (!p) {
    p = (async () => {
      await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
      await downloadWhisperModel({ model, folder: WHISPER_DIR });
    })();
    ready.set(model, p);
  }
  return p;
}

/** Transcribe an audio/video file under public/ to word-level captions.
 * `model` defaults to the fast English-only model (env WHISPER_MODEL/base.en)
 * — pass a multilingual model (no ".en" suffix, e.g. "small" or
 * "large-v3-turbo") for non-English source audio. IMPORTANT: whisper.cpp's
 * own CLI default is `-l en` when no language is passed at all — a
 * multilingual MODEL alone does not turn on auto-detection; pass
 * `language: "auto"` explicitly too. */
export async function transcribeToCaptions(
  file: string,
  opts: { model?: WhisperModel; language?: Language } = {},
): Promise<Caption[]> {
  const model = opts.model ?? WHISPER_MODEL;
  const abs = resolvePublic(file);
  // whisper.cpp needs 16 kHz mono wav.
  const wav = `${abs.replace(/\.[^.]+$/, "")}.16k.wav`;
  const conv = runFfmpeg(["-y", "-i", abs, "-ar", "16000", "-ac", "1", wav]);
  if (conv.status !== 0 || !fs.existsSync(wav)) {
    throw new Error("ffmpeg 16kHz conversion failed");
  }
  try {
    await ensureWhisper(model);
    const output = await transcribe({
      model,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      inputPath: wav,
      tokenLevelTimestamps: true,
      language: opts.language,
    });
    return toCaptions({ whisperCppOutput: output }).captions;
  } finally {
    fs.rmSync(wav, { force: true });
  }
}

export type TranscriptSegment = { start: number; end: number; text: string };

/** Transcribe to natural whisper segments (sentences/phrases, whisper's own
 * chunking) rather than word-level tokens — the right granularity for
 * translation/dubbing (see lib/dub.ts). Always auto-detects the source
 * language and returns it. */
export async function transcribeToSegments(
  file: string,
  opts: { model?: WhisperModel } = {},
): Promise<{ segments: TranscriptSegment[]; language: string }> {
  const model = opts.model ?? WHISPER_MODEL;
  const abs = resolvePublic(file);
  const wav = `${abs.replace(/\.[^.]+$/, "")}.16k.wav`;
  const conv = runFfmpeg(["-y", "-i", abs, "-ar", "16000", "-ac", "1", wav]);
  if (conv.status !== 0 || !fs.existsSync(wav)) {
    throw new Error("ffmpeg 16kHz conversion failed");
  }
  try {
    await ensureWhisper(model);
    const output = await transcribe({
      model,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      inputPath: wav,
      language: "auto",
      tokenLevelTimestamps: false,
      tokensPerItem: 0,
    });
    const segments = output.transcription
      .map((item) => ({
        start: item.offsets.from / 1000,
        end: item.offsets.to / 1000,
        text: item.text.trim(),
      }))
      .filter((s) => s.text.length > 0);
    return { segments, language: output.result.language };
  } finally {
    fs.rmSync(wav, { force: true });
  }
}

/** Parse an .srt file under public/ into captions. */
export function srtToCaptions(file: string): Caption[] {
  const text = fs.readFileSync(resolvePublic(file), "utf8");
  return parseSrt({ input: text }).captions;
}

/** Render word-level captions to subtitle-file text, grouped into pages the
 * same way the on-screen renderer groups them (createTikTokStyleCaptions) so
 * the file matches what viewers see on screen. */
export function captionsToSrt(captions: Caption[], combineWithinMs = 1200): string {
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: combineWithinMs,
  });
  const lines: Caption[][] = pages.map((p) => [
    { text: p.text, startMs: p.startMs, endMs: p.startMs + p.durationMs, timestampMs: null, confidence: null },
  ]);
  return serializeSrt({ lines });
}

/** WebVTT is SRT with a header and "." instead of "," in timestamps — only
 * the timestamp lines are rewritten so a comma inside caption text is safe. */
export function captionsToVtt(captions: Caption[], combineWithinMs = 1200): string {
  const srt = captionsToSrt(captions, combineWithinMs);
  const body = srt.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/g,
    "$1.$2 --> $3.$4",
  );
  return `WEBVTT\n\n${body}\n`;
}
