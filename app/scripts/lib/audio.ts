import fs from "fs";
import { generatedFile, hashKey, publicRef } from "./cache";
import { runFfmpeg } from "./ffmpeg";
import { probeFileDuration, resolvePublic } from "./media";
import { analyzeSilence } from "./silence";

/**
 * Free local audio toolkit built on Remotion's bundled ffmpeg. That build is
 * compiled with a minimal filter set (see `ffmpeg -h filter=X`) — notably NO
 * `afade` and NO `sidechaincompress`. Fades are built from `volume` with a
 * per-frame expression; ducking is built from silencedetect (lib/silence.ts)
 * + windowed `volume(enable=between(...))`. Every op is cached by hash(op +
 * args), same convention as the rest of scripts/lib.
 */
export type AudioResult = { src: string; cached: boolean };

function cachedOut(op: string, ...keyParts: string[]): { abs: string; exists: boolean } {
  const abs = generatedFile(`audio-${op}-${hashKey(op, ...keyParts)}.wav`);
  return { abs, exists: fs.existsSync(abs) };
}

function run(args: string[], label: string): void {
  const res = runFfmpeg(args);
  if (res.status !== 0) {
    throw new Error(`[audio] ${label} failed:\n${res.stderr.slice(-800)}`);
  }
}

/** Extract (or pass through) a 44.1kHz stereo wav copy of a file's audio track. */
export function extractAudio(file: string): AudioResult {
  const { abs, exists } = cachedOut("extract", file);
  if (exists) return { src: publicRef(abs), cached: true };
  run(["-y", "-i", resolvePublic(file), "-vn", "-ar", "44100", "-ac", "2", abs], "extractAudio");
  return { src: publicRef(abs), cached: false };
}

/** Single-pass loudness normalize. -16 LUFS is a common video target; -14 fits
 * most social platforms. */
export function loudnorm(file: string, targetLufs = -16): AudioResult {
  const { abs, exists } = cachedOut("loudnorm", file, String(targetLufs));
  if (exists) return { src: publicRef(abs), cached: true };
  run(
    ["-y", "-i", resolvePublic(file), "-af", `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11`, "-ar", "44100", abs],
    "loudnorm",
  );
  return { src: publicRef(abs), cached: false };
}

/** Fade in/out (seconds), built from `volume=eval=frame` (no afade in this
 * ffmpeg build). Duration is probed automatically when not given. */
export async function fade(
  file: string,
  inSec: number,
  outSec: number,
  durationSec?: number,
): Promise<AudioResult> {
  const { abs, exists } = cachedOut("fade", file, String(inSec), String(outSec));
  if (exists) return { src: publicRef(abs), cached: true };

  const dur = durationSec ?? (await probeFileDuration(file)) ?? inSec + outSec;
  const fadeOutStart = Math.max(0, dur - outSec);
  const expr =
    inSec > 0 && outSec > 0
      ? `min(1\\,t/${inSec})*if(lt(t\\,${fadeOutStart})\\,1\\,max(0\\,1-(t-${fadeOutStart})/${outSec}))`
      : inSec > 0
        ? `min(1\\,t/${inSec})`
        : outSec > 0
          ? `if(lt(t\\,${fadeOutStart})\\,1\\,max(0\\,1-(t-${fadeOutStart})/${outSec}))`
          : "1";
  run(
    ["-y", "-i", resolvePublic(file), "-af", `volume=eval=frame:volume='${expr}'`, "-ar", "44100", abs],
    "fade",
  );
  return { src: publicRef(abs), cached: false };
}

/** Change playback speed without pitch shift (ffmpeg atempo; valid 0.5–100). */
export function atempo(file: string, factor: number): AudioResult {
  const clamped = Math.min(100, Math.max(0.5, factor));
  const { abs, exists } = cachedOut("atempo", file, String(clamped));
  if (exists) return { src: publicRef(abs), cached: true };
  run(["-y", "-i", resolvePublic(file), "-af", `atempo=${clamped}`, "-ar", "44100", abs], "atempo");
  return { src: publicRef(abs), cached: false };
}

/** Trim to [startSec, endSec) — endSec omitted plays to the end of the file. */
export function trim(file: string, startSec: number, endSec?: number): AudioResult {
  const { abs, exists } = cachedOut("trim", file, String(startSec), String(endSec ?? -1));
  if (exists) return { src: publicRef(abs), cached: true };
  const filter = endSec != null ? `atrim=start=${startSec}:end=${endSec}` : `atrim=start=${startSec}`;
  run(["-y", "-i", resolvePublic(file), "-af", filter, "-ar", "44100", abs], "trim");
  return { src: publicRef(abs), cached: false };
}

/** Force a clip to an exact duration — trims if longer, pads with silence if
 * shorter. Used to fit dub segments precisely into their timing slot. */
export function fitToDuration(file: string, targetSec: number): AudioResult {
  const { abs, exists } = cachedOut("fit", file, String(targetSec));
  if (exists) return { src: publicRef(abs), cached: true };
  run(
    [
      "-y",
      "-i",
      resolvePublic(file),
      "-af",
      `atrim=start=0:end=${targetSec},apad=whole_dur=${targetSec}`,
      "-ar",
      "44100",
      abs,
    ],
    "fitToDuration",
  );
  return { src: publicRef(abs), cached: false };
}

export type MixTrack = { file: string; volume?: number; startSec?: number };

/** Mix N tracks, each with its own volume and start offset. Output duration
 * follows the longest track (post-offset). */
export function mixTracks(tracks: MixTrack[]): AudioResult {
  if (tracks.length === 0) throw new Error("mixTracks: need at least one track");
  const keyParts = tracks.flatMap((t) => [t.file, String(t.volume ?? 1), String(t.startSec ?? 0)]);
  const { abs, exists } = cachedOut("mix", ...keyParts);
  if (exists) return { src: publicRef(abs), cached: true };

  const inputs = tracks.flatMap((t) => ["-i", resolvePublic(t.file)]);
  const stages = tracks
    .map((t, i) => {
      const delayMs = Math.round((t.startSec ?? 0) * 1000);
      const delay = delayMs > 0 ? `,adelay=${delayMs}|${delayMs}` : "";
      return `[${i}:a]volume=${t.volume ?? 1}${delay}[a${i}]`;
    })
    .join(";");

  if (tracks.length === 1) {
    const filter = `${stages.replace("[a0]", "[out]")}`;
    run(["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-ar", "44100", abs], "mixTracks");
    return { src: publicRef(abs), cached: false };
  }

  const mixInputs = tracks.map((_, i) => `[a${i}]`).join("");
  const filter = `${stages};${mixInputs}amix=inputs=${tracks.length}:duration=longest:normalize=0[out]`;
  run(["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-ar", "44100", abs], "mixTracks");
  return { src: publicRef(abs), cached: false };
}

/** Duck `musicFile` under `voiceFile` wherever the voice has signal — built
 * from silencedetect (lib/silence.ts) + windowed `volume` (no
 * sidechaincompress in this ffmpeg build) — then mixes the ducked music with
 * the voice into one track. */
export async function duckMusicUnderVoice(
  musicFile: string,
  voiceFile: string,
  duckVolume = 0.28,
): Promise<AudioResult> {
  const { abs, exists } = cachedOut("duck", musicFile, voiceFile, String(duckVolume));
  if (exists) return { src: publicRef(abs), cached: true };

  const report = await analyzeSilence(voiceFile);
  const windows = report.nonSilentRanges;
  const duckFilter = windows.length
    ? windows
    .map((w) => `volume=enable='between(t\\,${w.start}\\,${w.end})':volume=${duckVolume}`)
        .join(",")
    : "acopy"; // no speech detected — pass the music through unchanged.

  const filter = `[0:a]${duckFilter}[music];[music][1:a]amix=inputs=2:duration=longest:normalize=0[out]`;
  run(
    [
      "-y",
      "-i",
      resolvePublic(musicFile),
      "-i",
      resolvePublic(voiceFile),
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-ar",
      "44100",
      abs,
    ],
    "duckMusicUnderVoice",
  );
  return { src: publicRef(abs), cached: false };
}

/** Concatenate audio files in order (re-encodes so differing source
 * codecs/rates don't break the concat filter). */
export function concatAudio(files: string[]): AudioResult {
  if (files.length === 0) throw new Error("concatAudio: need at least one file");
  const { abs, exists } = cachedOut("concat", ...files);
  if (exists) return { src: publicRef(abs), cached: true };

  if (files.length === 1) {
    run(["-y", "-i", resolvePublic(files[0]), "-ar", "44100", abs], "concatAudio");
    return { src: publicRef(abs), cached: false };
  }
  const inputs = files.flatMap((f) => ["-i", resolvePublic(f)]);
  const labels = files.map((_, i) => `[${i}:a]`).join("");
  const filter = `${labels}concat=n=${files.length}:v=0:a=1[out]`;
  run(["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-ar", "44100", abs], "concatAudio");
  return { src: publicRef(abs), cached: false };
}
