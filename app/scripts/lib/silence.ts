import { runFfmpeg } from "./ffmpeg";
import { probeFileDuration, resolvePublic } from "./media";

/**
 * Adaptive silence detection (per the silence-detection skill rule): measure the
 * loudnorm gating threshold, then run silencedetect with it. Returns silent
 * ranges + suggested leading/trailing trims + the non-silent ranges for splicing.
 */
export type SilenceRange = { start: number; end: number };
export type SilenceReport = {
  file: string;
  durationSeconds: number | null;
  thresholdDb: number;
  silences: SilenceRange[];
  suggestedTrimStart: number;
  suggestedTrimEnd: number; // 0 = no trailing silence
  nonSilentRanges: SilenceRange[];
};

function measureThreshold(abs: string): number {
  const { stderr } = runFfmpeg([
    "-hide_banner",
    "-i",
    abs,
    "-map",
    "0:a",
    "-af",
    "loudnorm=print_format=json",
    "-f",
    "null",
    "-",
  ]);
  const open = stderr.lastIndexOf("{");
  const close = stderr.lastIndexOf("}");
  if (open >= 0 && close > open) {
    try {
      const j = JSON.parse(stderr.slice(open, close + 1)) as Record<string, string>;
      const t = parseFloat(j.input_thresh);
      if (Number.isFinite(t)) return t;
    } catch {
      /* fall through to default */
    }
  }
  return -50;
}

function detectSilences(
  abs: string,
  thresholdDb: number,
  minSilence: number,
): SilenceRange[] {
  const { stderr } = runFfmpeg([
    "-hide_banner",
    "-i",
    abs,
    "-map",
    "0:a",
    "-af",
    `silencedetect=noise=${thresholdDb}dB:d=${minSilence}`,
    "-f",
    "null",
    "-",
  ]);
  const ranges: SilenceRange[] = [];
  let cur: number | null = null;
  for (const line of stderr.split("\n")) {
    const s = /silence_start:\s*(-?[0-9.]+)/.exec(line);
    const e = /silence_end:\s*(-?[0-9.]+)/.exec(line);
    if (s) cur = Math.max(0, parseFloat(s[1]));
    else if (e && cur !== null) {
      ranges.push({ start: cur, end: parseFloat(e[1]) });
      cur = null;
    }
  }
  return ranges;
}

export async function analyzeSilence(
  file: string,
  minSilence = 0.5,
): Promise<SilenceReport> {
  const abs = resolvePublic(file);
  const thresholdDb = measureThreshold(abs);
  const silences = detectSilences(abs, thresholdDb, minSilence);
  const durationSeconds = await probeFileDuration(file);

  let suggestedTrimStart = 0;
  if (silences.length && silences[0].start <= 0.2) {
    suggestedTrimStart = silences[0].end;
  }

  let suggestedTrimEnd = 0;
  if (silences.length && durationSeconds != null) {
    const last = silences[silences.length - 1];
    if (last.end >= durationSeconds - 0.25) suggestedTrimEnd = last.start;
  }

  const end = durationSeconds ?? (silences.length ? silences[silences.length - 1].end : 0);
  const nonSilentRanges: SilenceRange[] = [];
  let cursor = suggestedTrimStart;
  for (const s of silences) {
    if (s.start > cursor + 0.05) nonSilentRanges.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  const tail = suggestedTrimEnd > 0 ? suggestedTrimEnd : end;
  if (tail > cursor + 0.05) nonSilentRanges.push({ start: cursor, end: tail });

  return {
    file,
    durationSeconds,
    thresholdDb,
    silences,
    suggestedTrimStart,
    suggestedTrimEnd,
    nonSilentRanges,
  };
}
