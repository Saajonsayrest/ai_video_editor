/**
 * Format-aware type scale + safe areas. Text is sized relative to the composition
 * width, with a heavier factor for narrow (portrait) frames so headlines stay
 * readable at video-viewing distance (see the video-layout skill rule).
 */
export type TypeScale = {
  eyebrow: number;
  headline: number;
  subtitle: number;
  body: number;
  label: number;
  stat: number;
  quote: number;
};

export function getTypeScale(width: number, height: number): TypeScale {
  const aspect = width / height;
  // landscape (wide) can use a smaller fraction of width; portrait needs more.
  const headlineFactor = aspect >= 1.4 ? 0.055 : aspect <= 0.8 ? 0.082 : 0.078;
  const headline = Math.round(width * headlineFactor);
  return {
    headline,
    subtitle: Math.round(headline * 0.42),
    eyebrow: Math.round(headline * 0.28),
    body: Math.round(headline * 0.36),
    label: Math.round(headline * 0.3),
    stat: Math.round(headline * 2.2),
    quote: Math.round(headline * 0.82),
  };
}

/** Keep key content off the edges. Scales with the frame; roomier on the short axis. */
export function safeAreaInsets(
  width: number,
  height: number,
): { x: number; y: number } {
  // Portrait (reels/stories) keeps more bottom/top room so lower-thirds clear
  // the platform caption bar + right-side icon rail.
  const yFactor = width / height <= 0.8 ? 0.12 : 0.09;
  return { x: Math.round(width * 0.07), y: Math.round(height * yFactor) };
}
