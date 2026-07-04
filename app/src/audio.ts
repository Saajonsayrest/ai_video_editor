import type { MusicProps } from "./schema";

/**
 * Music mixing math: base volume shaped by fade-in/out and ducked toward
 * `duckVolume` while any voiceover range is active (with short ramps so the duck
 * doesn't click). Used by the whole-composition music <Audio> volume callback,
 * whose frame argument equals the composition frame (it starts at frame 0).
 */
export type DuckRange = { start: number; end: number };

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function duckAmount(f: number, ranges: DuckRange[], ramp: number): number {
  let a = 0;
  for (const r of ranges) {
    if (f < r.start - ramp || f > r.end + ramp) continue;
    const rise = ramp > 0 ? clamp01((f - (r.start - ramp)) / ramp) : 1;
    const fall = ramp > 0 ? clamp01((r.end + ramp - f) / ramp) : 1;
    a = Math.max(a, Math.min(rise, fall));
  }
  return a;
}

export function makeMusicVolume(
  music: MusicProps,
  totalFrames: number,
  fps: number,
  duckRanges: DuckRange[],
): (f: number) => number {
  const fadeIn = Math.max(0, Math.round(music.fadeInSeconds * fps));
  const fadeOut = Math.max(0, Math.round(music.fadeOutSeconds * fps));
  const ramp = Math.max(1, Math.round(0.25 * fps));
  return (f: number) => {
    let v = music.volume;
    if (fadeIn > 0) v *= clamp01(f / fadeIn);
    if (fadeOut > 0) v *= clamp01((totalFrames - f) / fadeOut);
    if (music.duckUnderVoice && duckRanges.length > 0) {
      const d = duckAmount(f, duckRanges, ramp);
      v = v * (1 - d) + music.duckVolume * d;
    }
    return clamp01(v);
  };
}
