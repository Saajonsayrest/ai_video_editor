import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { FitText } from "../components/FitText";
import { Eyebrow } from "./parts";
import type { SceneComponentProps } from "./types";

/** One oversized number/metric with a supporting label. */
export const StatScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  const value = c.stat.value || c.title;
  const p = spring({ fps, frame, delay: 4, config: { damping: 200 } });
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="center">
      <Eyebrow text={c.eyebrow || c.subtitle} size={s.eyebrow} accent={accent} />
      <div
        style={{
          opacity: interpolate(p, [0, 1], [0, 1]),
          scale: interpolate(p, [0, 1], [0.8, 1]),
        }}
      >
        <FitText
          text={value}
          maxSize={s.stat}
          maxWidth={width * 0.88}
          fontFamily={t.fonts.heading}
          fontWeight={800}
          style={{ color: accent, lineHeight: 1 }}
        />
      </div>
      {c.stat.label ? (
        <div
          style={{
            fontFamily: t.fonts.body,
            fontSize: s.subtitle,
            color: t.palette.text,
            maxWidth: width * 0.7,
            marginTop: Math.round(height * 0.01),
          }}
        >
          {c.stat.label}
        </div>
      ) : null}
    </SceneFrame>
  );
};
