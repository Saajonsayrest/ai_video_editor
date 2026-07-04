import fs from "fs";
import path from "path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { parseSrt, type Caption } from "@remotion/captions";
import { resolvePublic } from "./media";
import { runFfmpeg } from "./ffmpeg";

/**
 * Free, local transcription with whisper.cpp — word-level timestamps, no cloud.
 * The model builds/downloads on first use into ./whisper.cpp (gitignored).
 * Default model is base.en for speed; set WHISPER_MODEL=large-v3-turbo (and a
 * matching WHISPER_VERSION) for best quality.
 */
type WhisperModel =
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

let ready: Promise<void> | null = null;
function ensureWhisper(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION });
      await downloadWhisperModel({ model: WHISPER_MODEL, folder: WHISPER_DIR });
    })();
  }
  return ready;
}

/** Transcribe an audio/video file under public/ to word-level captions. */
export async function transcribeToCaptions(file: string): Promise<Caption[]> {
  const abs = resolvePublic(file);
  // whisper.cpp needs 16 kHz mono wav.
  const wav = `${abs.replace(/\.[^.]+$/, "")}.16k.wav`;
  const conv = runFfmpeg(["-y", "-i", abs, "-ar", "16000", "-ac", "1", wav]);
  if (conv.status !== 0 || !fs.existsSync(wav)) {
    throw new Error("ffmpeg 16kHz conversion failed");
  }
  try {
    await ensureWhisper();
    const output = await transcribe({
      model: WHISPER_MODEL,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      inputPath: wav,
      tokenLevelTimestamps: true,
    });
    return toCaptions({ whisperCppOutput: output }).captions;
  } finally {
    fs.rmSync(wav, { force: true });
  }
}

/** Parse an .srt file under public/ into captions. */
export function srtToCaptions(file: string): Caption[] {
  const text = fs.readFileSync(resolvePublic(file), "utf8");
  return parseSrt({ input: text }).captions;
}
