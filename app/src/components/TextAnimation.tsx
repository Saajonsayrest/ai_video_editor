import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TextAnimationKind } from "../schema";

/**
 * One text-reveal component driven by the scene's `textAnimation` choice.
 * Animations use individual CSS transform props (`scale`, `translate`) so they
 * stay editable in Studio (per the text-animations skill rule). Typewriter uses
 * string slicing — never per-character opacity.
 */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Props = {
  text: string;
  kind: TextAnimationKind;
  delay?: number;
  highlightWord?: string;
  highlightColor?: string;
  style?: React.CSSProperties;
};

const Typewriter: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const CHAR_FRAMES = 1.4;
  const local = Math.max(0, frame - delay);
  const chars = Math.min(text.length, Math.floor(local / CHAR_FRAMES));
  const done = chars >= text.length;
  const cursor = interpolate(frame % 16, [0, 8, 16], [1, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {text.slice(0, chars)}
      <span style={{ opacity: done ? 0 : cursor }}>▌</span>
    </>
  );
};

const WordHighlight: React.FC<{
  text: string;
  word: string;
  color: string;
  delay: number;
}> = ({ text, word, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = word ? text.indexOf(word) : -1;
  if (idx < 0) return <>{text}</>;
  const pre = text.slice(0, idx);
  const post = text.slice(idx + word.length);
  const progress = spring({
    fps,
    frame,
    config: { damping: 200 },
    delay: delay + 8,
    durationInFrames: 16,
  });
  const scaleX = Math.max(0, Math.min(1, progress));
  return (
    <>
      {pre}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: "1.02em",
            transform: `translateY(-50%) scaleX(${scaleX})`,
            transformOrigin: "left center",
            backgroundColor: color,
            borderRadius: "0.16em",
            zIndex: 0,
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>{word}</span>
      </span>
      {post}
    </>
  );
};

export const AnimatedText: React.FC<Props> = ({
  text,
  kind,
  delay = 0,
  highlightWord = "",
  highlightColor = "rgba(110,168,254,0.5)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (kind === "typewriter") {
    return (
      <div style={style}>
        <Typewriter text={text} delay={delay} />
      </div>
    );
  }
  if (kind === "word-highlight") {
    const fadeIn = interpolate(frame, [delay, delay + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });
    return (
      <div style={{ ...style, opacity: fadeIn }}>
        <WordHighlight
          text={text}
          word={highlightWord}
          color={highlightColor}
          delay={delay}
        />
      </div>
    );
  }

  let anim: React.CSSProperties = {};
  if (kind === "fade") {
    anim = {
      opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      }),
    };
  } else if (kind === "slide-up") {
    // Smooth, no-overshoot rise: critically damped spring for a soft ease-out.
    const p = spring({ fps, frame, delay, config: { mass: 1, damping: 26, stiffness: 92 } });
    anim = {
      opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
      translate: `0px ${interpolate(p, [0, 1], [36, 0])}px`,
    };
  } else if (kind === "spring-in") {
    // Gentle settle — a touch of scale, minimal bounce.
    const p = spring({ fps, frame, delay, config: { mass: 0.9, damping: 22, stiffness: 108 } });
    anim = {
      opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
      scale: interpolate(p, [0, 1], [0.94, 1]),
      translate: `0px ${interpolate(p, [0, 1], [28, 0])}px`,
    };
  }

  return <div style={{ ...style, ...anim }}>{text}</div>;
};
