import { AnimatedText } from "../components/TextAnimation";
import { useTheme } from "../theme";
import type { TextAnimationKind } from "../schema";
import { withAlpha } from "../color";

/** Small reusable text blocks shared across scene kinds. Each no-ops on empty text. */

export const Eyebrow: React.FC<{
  text: string;
  size: number;
  accent: string;
  delay?: number;
}> = ({ text, size, accent, delay = 2 }) => {
  const t = useTheme();
  if (!text) return null;
  return (
    <AnimatedText
      text={text}
      kind="fade"
      delay={delay}
      style={{
        fontFamily: t.fonts.body,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: 5,
        textTransform: "uppercase",
        color: accent,
        textShadow: "0 2px 12px rgba(40,24,14,0.35)",
      }}
    />
  );
};

export const Headline: React.FC<{
  text: string;
  size: number;
  kind: TextAnimationKind;
  accent: string;
  maxWidth: number;
  highlightWord?: string;
  delay?: number;
  /** Explicit text color (e.g. warm cream over footage). Falls back to inherit. */
  color?: string;
  fontStyle?: "normal" | "italic";
}> = ({
  text,
  size,
  kind,
  accent,
  maxWidth,
  highlightWord = "",
  delay = 4,
  color,
  fontStyle = "normal",
}) => {
  const t = useTheme();
  if (!text) return null;
  return (
    <AnimatedText
      text={text}
      kind={kind}
      delay={delay}
      highlightWord={highlightWord}
      highlightColor={withAlpha(accent, 0.5)}
      style={{
        fontFamily: t.fonts.heading,
        fontSize: size,
        fontWeight: 600,
        fontStyle,
        lineHeight: 1.1,
        letterSpacing: Math.round(size * 0.004),
        maxWidth,
        margin: 0,
        color,
        textShadow:
          "0 2px 10px rgba(40,24,14,0.30), 0 10px 40px rgba(40,24,14,0.28)",
      }}
    />
  );
};

export const Subtitle: React.FC<{
  text: string;
  size: number;
  maxWidth: number;
  delay?: number;
  color?: string;
}> = ({ text, size, maxWidth, delay = 16, color }) => {
  const t = useTheme();
  if (!text) return null;
  return (
    <AnimatedText
      text={text}
      kind="fade"
      delay={delay}
      style={{
        fontFamily: t.fonts.body,
        fontSize: size,
        fontWeight: 500,
        lineHeight: 1.3,
        letterSpacing: Math.round(size * 0.02),
        color: color ?? t.palette.muted,
        maxWidth,
        margin: 0,
        textShadow: "0 2px 12px rgba(40,24,14,0.35)",
      }}
    />
  );
};
