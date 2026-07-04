import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Accent } from "../schema";

/**
 * Sparse, cute accents (sparkle / sunflower / heart) that gently pop + fade in on
 * a beat, hold, then fade out. Timing is in seconds relative to the scene start
 * and driven entirely by the frame, so it's deterministic. Kept above the media
 * but pointer-inert; layout expects them placed in empty frame space.
 */
const AccentItem: React.FC<{ accent: Accent }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const start = accent.atSeconds * fps;
  const fade = Math.max(1, accent.fadeSeconds * fps);
  const hold = accent.holdSeconds * fps;
  const local = frame - start;
  const end = fade + hold + fade;
  if (local < 0 || local > end) return null;

  const opacity = interpolate(
    local,
    [0, fade, fade + hold, end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pop = spring({
    frame: local,
    fps,
    config: { damping: 13, mass: 0.7 },
    durationInFrames: Math.round(fade + 6),
  });
  const scale = interpolate(pop, [0, 1], [0.35, 1]);
  const float = interpolate(local, [0, end], [0, -height * 0.018]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${accent.xPct}%`,
        top: `${accent.yPct}%`,
        fontSize: `${(accent.sizePct / 100) * height}px`,
        lineHeight: 1,
        opacity,
        scale,
        rotate: `${accent.rotate}deg`,
        translate: `-50% calc(-50% + ${float}px)`,
        filter: "drop-shadow(0 4px 12px rgba(74,52,40,0.22))",
      }}
    >
      {accent.emoji}
    </div>
  );
};

export const Accents: React.FC<{ accents: Accent[] }> = ({ accents }) => {
  if (!accents.length) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {accents.map((a, i) => (
        <AccentItem key={i} accent={a} />
      ))}
    </AbsoluteFill>
  );
};
