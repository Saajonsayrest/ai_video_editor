import fs from "fs";
import { serializeSrt, type Caption } from "@remotion/captions";
import { atempo, fitToDuration, mixTracks } from "./audio";
import { transcribeToSegments } from "./captions";
import { generatedFile, hashKey, publicRef } from "./cache";
import { runFfmpeg } from "./ffmpeg";
import { probeFileDuration, resolvePublic } from "./media";
import { synthesizePiper, type PiperLang } from "./piper";
import { separateStems } from "./stems";
import { synthesizeVoice } from "./tts";

/**
 * Free local dubbing: whisper transcribes the source into natural segments →
 * a reviewable dub-script.json (translations start empty — the driving agent
 * fills them in; no paid translation API) → per-segment TTS, time-fit, mixed
 * over the demucs instrumental (drops the original voice, keeps music/SFX),
 * muxed back onto the source video.
 */
export type DubLang = "en" | "ne" | "hi" | "newari";
export const DUB_LANGS: DubLang[] = ["en", "ne", "hi", "newari"];
export const VOICED_LANGS: DubLang[] = ["en", "ne", "hi"];

export type DubSegment = { start: number; end: number; sourceText: string; translation: string };
export type DubScript = {
  sourceFile: string;
  sourceLanguage: string;
  targetLang: DubLang;
  segments: DubSegment[];
};

/** Step 1: transcribe the source into a reviewable dub-script.json (empty
 * "translation" fields to fill in before synthesizeDub()). Always uses a
 * multilingual model so any source language is auto-detected correctly. */
export async function extractDubScript(file: string, targetLang: DubLang): Promise<DubScript> {
  const { segments, language } = await transcribeToSegments(file, { model: "small" });
  return {
    sourceFile: file,
    sourceLanguage: language,
    targetLang,
    segments: segments.map((s) => ({ start: s.start, end: s.end, sourceText: s.text, translation: "" })),
  };
}

const ATEMPO_MIN = 0.8;
const ATEMPO_MAX = 1.25;

async function synthesizeSegment(text: string, lang: DubLang): Promise<{ src: string } | null> {
  if (lang === "en") {
    const r = await synthesizeVoice(text, "af_heart");
    return r ? { src: r.src } : null;
  }
  if (lang === "ne" || lang === "hi") {
    const r = await synthesizePiper(text, lang as PiperLang);
    return r ? { src: r.src } : null;
  }
  return null; // newari — handled as subtitles-only by synthesizeDub, never reaches here.
}

export type DubResult =
  | { mode: "dubbed"; outputVideo: string; skippedSegments: number }
  | { mode: "subtitles"; srtFile: string };

/** Step 2 — branches on targetLang:
 * - en/ne/hi: synthesize each segment, fit it into its timing slot (atempo
 *   clamped 0.8–1.25x, then exact trim/pad), lay all segments into one VO
 *   track, mix over the demucs instrumental, mux with the source video.
 * - newari: no TTS engine exists — write the filled-in translations as an
 *   .srt next to the source instead (original audio untouched). */
export async function synthesizeDub(script: DubScript): Promise<DubResult | null> {
  const untranslated = script.segments.filter((s) => !s.translation.trim());
  if (untranslated.length > 0) {
    console.warn(
      `  [dub] ${untranslated.length}/${script.segments.length} segment(s) still have an empty "translation" — fill in dub-script.json first.`,
    );
    return null;
  }

  if (script.targetLang === "newari") {
    const lines: Caption[][] = script.segments.map((s) => [
      {
        text: s.translation,
        startMs: Math.round(s.start * 1000),
        endMs: Math.round(s.end * 1000),
        timestampMs: null,
        confidence: null,
      },
    ]);
    const srt = serializeSrt({ lines });
    const abs = resolvePublic(script.sourceFile);
    const srtAbs = `${abs.replace(/\.[^.]+$/, "")}.newari.srt`;
    fs.writeFileSync(srtAbs, srt);
    return { mode: "subtitles", srtFile: publicRef(srtAbs) };
  }

  console.log("  [dub] Separating vocals/instrumental from the source…");
  const stems = separateStems(script.sourceFile);
  if (!stems) {
    console.warn("  [dub] demucs unavailable — cannot safely drop the original voice track.");
    return null;
  }

  let skipped = 0;
  const voClips: { file: string; startSec: number }[] = [];
  for (const seg of script.segments) {
    const slot = seg.end - seg.start;
    if (slot <= 0) continue;

    const synth = await synthesizeSegment(seg.translation, script.targetLang);
    if (!synth) {
      skipped++;
      continue;
    }

    let clip = synth.src;
    const rawDur = await probeFileDuration(clip);
    if (rawDur && rawDur > 0) {
      const factor = Math.min(ATEMPO_MAX, Math.max(ATEMPO_MIN, rawDur / slot));
      if (Math.abs(factor - 1) > 0.02) clip = atempo(clip, factor).src;
      const fittedDur = rawDur / factor;
      if (fittedDur > slot * 1.02) {
        console.warn(
          `  [dub] segment ${seg.start.toFixed(1)}-${seg.end.toFixed(1)}s overflows by ` +
            `${(fittedDur - slot).toFixed(2)}s even at ${ATEMPO_MAX}x — leaving it long ` +
            `(may overlap the next line) rather than chipmunking it.`,
        );
      }
    }
    clip = fitToDuration(clip, slot).src;
    voClips.push({ file: clip, startSec: seg.start });
  }

  if (voClips.length === 0) {
    console.warn("  [dub] No segments synthesized — nothing to mix.");
    return null;
  }

  const voTrack = mixTracks(voClips.map((c) => ({ file: c.file, startSec: c.startSec, volume: 1 })));
  const finalMix = mixTracks([
    { file: voTrack.src, volume: 1 },
    { file: stems.instrumental, volume: 0.8 },
  ]);

  const sourceAbs = resolvePublic(script.sourceFile);
  const key = hashKey("dub-mux", script.sourceFile, script.targetLang, JSON.stringify(script.segments));
  const outAbs = generatedFile(`dub-${script.targetLang}-${key}.mp4`);
  const res = runFfmpeg([
    "-y",
    "-i",
    sourceAbs,
    "-i",
    resolvePublic(finalMix.src),
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-shortest",
    outAbs,
  ]);
  if (res.status !== 0 || !fs.existsSync(outAbs)) {
    console.warn(`  [dub] mux failed:\n${res.stderr.slice(-800)}`);
    return null;
  }

  return { mode: "dubbed", outputVideo: publicRef(outAbs), skippedSegments: skipped };
}
