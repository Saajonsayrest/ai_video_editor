import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { SceneFx } from "../schema";

/**
 * Warm atmospheric post-effects layered above the media and below the text:
 * a creamy soft-light wash, a soft highlight bloom, an edge vignette, and moving
 * film grain. Every layer is opacity-driven by `fx.*` and renders nothing at 0,
 * so scenes that don't opt in are untouched. Grain motion is derived from the
 * frame number (no randomness) to stay deterministic.
 */

// A tiny greyscale fractal-noise tile, inlined as an SVG data URI for the grain.
const GRAIN_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' " +
    "numOctaves='2' stitchTiles='stitch'/>" +
    "<feColorMatrix type='saturate' values='0'/></filter>" +
    "<rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

export const CozyFx: React.FC<{ fx: SceneFx }> = ({ fx }) => {
  const frame = useCurrentFrame();
  const anyOn = fx.warmth > 0 || fx.bloom > 0 || fx.vignette > 0 || fx.grain > 0;
  if (!anyOn) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {fx.warmth > 0 ? (
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, #ffe7c2 0%, #f7d9ae 45%, #f0c79a 100%)",
            mixBlendMode: "soft-light",
            opacity: fx.warmth,
          }}
        />
      ) : null}
      {fx.bloom > 0 ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 85% 55% at 50% 32%, rgba(255,244,214,0.9) 0%, rgba(255,244,214,0) 68%)",
            mixBlendMode: "screen",
            opacity: fx.bloom,
          }}
        />
      ) : null}
      {fx.vignette > 0 ? (
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 78% 78% at 50% 48%, rgba(0,0,0,0) 52%, rgba(58,34,18,0.9) 100%)",
            opacity: fx.vignette,
          }}
        />
      ) : null}
      {fx.grain > 0 ? (
        <AbsoluteFill
          style={{
            backgroundImage: GRAIN_TILE,
            backgroundSize: "170px 170px",
            backgroundPosition: `${(frame * 7) % 170}px ${(frame * 13) % 170}px`,
            mixBlendMode: "overlay",
            opacity: fx.grain * 0.5,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
