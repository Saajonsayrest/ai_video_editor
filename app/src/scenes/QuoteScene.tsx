import { useVideoConfig } from "remotion";
import { AnimatedText } from "../components/TextAnimation";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { withAlpha } from "../color";
import type { SceneComponentProps } from "./types";

/** Large pull-quote with an oversized quotation mark and an attributed author. */
export const QuoteScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height } = useVideoConfig();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  const text = c.quote.text || c.title;
  const kind = scene.textAnimation === "none" ? "fade" : scene.textAnimation;
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="center">
      <div
        style={{
          fontFamily: t.fonts.heading,
          fontSize: s.stat,
          lineHeight: 0.5,
          height: s.stat * 0.5,
          color: withAlpha(accent, 0.55),
        }}
      >
        &ldquo;
      </div>
      <AnimatedText
        text={text}
        kind={kind}
        delay={4}
        style={{
          fontFamily: t.fonts.heading,
          fontSize: s.quote,
          fontWeight: 600,
          fontStyle: "italic",
          lineHeight: 1.2,
          maxWidth: width * 0.82,
          margin: 0,
        }}
      />
      {c.quote.author ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: Math.round(height * 0.02),
          }}
        >
          <span style={{ width: 44, height: 2, background: accent }} />
          <span
            style={{
              fontFamily: t.fonts.body,
              fontSize: s.body,
              color: t.palette.muted,
            }}
          >
            {c.quote.author}
          </span>
        </div>
      ) : null}
    </SceneFrame>
  );
};
