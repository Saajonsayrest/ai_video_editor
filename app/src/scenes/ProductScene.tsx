import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { Eyebrow, Headline, Subtitle } from "./parts";
import type { SceneComponentProps } from "./types";

const Bullet: React.FC<{
  text: string;
  index: number;
  size: number;
  accent: string;
  fontFamily: string;
  color: string;
}> = ({ text, index, size, accent, fontFamily, color }) => {
  const frame = useCurrentFrame();
  const delay = 16 + index * 6;
  const p = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.55,
        opacity: p,
        translate: `${interpolate(p, [0, 1], [22, 0])}px 0px`,
      }}
    >
      <div
        style={{
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: 999,
          background: accent,
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily, fontSize: size, color }}>{text}</span>
    </div>
  );
};

/** Headline + benefit bullets revealed one after another. */
export const ProductScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height } = useVideoConfig();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="flex-start" justify="center">
      <Eyebrow text={c.eyebrow} size={s.eyebrow} accent={accent} />
      <Headline
        text={c.title}
        size={s.headline}
        kind={scene.textAnimation}
        accent={accent}
        maxWidth={width * 0.8}
        highlightWord={c.highlightWord}
      />
      <Subtitle text={c.subtitle} size={s.subtitle} maxWidth={width * 0.7} />
      {c.bullets.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: Math.round(height * 0.024),
            marginTop: Math.round(height * 0.022),
          }}
        >
          {c.bullets.map((b, i) => (
            <Bullet
              key={i}
              text={b}
              index={i}
              size={s.body}
              accent={accent}
              fontFamily={t.fonts.body}
              color={t.palette.text}
            />
          ))}
        </div>
      ) : null}
    </SceneFrame>
  );
};
