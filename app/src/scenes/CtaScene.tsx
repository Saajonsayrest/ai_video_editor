import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { FitText } from "../components/FitText";
import { Headline, Subtitle } from "./parts";
import type { SceneComponentProps } from "./types";

/** Closing call-to-action: headline, subtitle, an accented button pill + URL. */
export const CtaScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  const p = spring({ fps, frame, delay: 12, config: { damping: 200 } });
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="center">
      <Headline
        text={c.title}
        size={s.headline}
        kind={scene.textAnimation}
        accent={accent}
        maxWidth={width * 0.82}
        highlightWord={c.highlightWord}
      />
      <Subtitle text={c.subtitle} size={s.subtitle} maxWidth={width * 0.66} />
      {c.cta.label ? (
        <div
          style={{
            marginTop: Math.round(height * 0.03),
            opacity: interpolate(p, [0, 1], [0, 1]),
            scale: interpolate(p, [0, 1], [0.9, 1]),
            background: accent,
            padding: `${Math.round(s.body * 0.55)}px ${Math.round(s.body * 1.2)}px`,
            borderRadius: 999,
          }}
        >
          <FitText
            text={c.cta.label}
            maxSize={s.body}
            maxWidth={width * 0.7}
            fontFamily={t.fonts.heading}
            fontWeight={800}
            style={{ color: t.palette.background }}
          />
        </div>
      ) : null}
      {c.cta.url ? (
        <div
          style={{
            fontFamily: t.fonts.body,
            fontSize: s.label,
            color: t.palette.muted,
            marginTop: Math.round(height * 0.014),
          }}
        >
          {c.cta.url}
        </div>
      ) : null}
    </SceneFrame>
  );
};
