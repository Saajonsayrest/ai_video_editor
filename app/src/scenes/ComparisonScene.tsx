import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { withAlpha } from "../color";
import { Headline } from "./parts";
import type { SceneComponentProps } from "./types";

const Column: React.FC<{
  title: string;
  items: string[];
  accent: string;
  fontHeading: string;
  fontBody: string;
  surface: string;
  textColor: string;
  labelSize: number;
  bodySize: number;
  fromX: number;
  delay: number;
}> = ({
  title,
  items,
  accent,
  fontHeading,
  fontBody,
  surface,
  textColor,
  labelSize,
  bodySize,
  fromX,
  delay,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        flex: 1,
        maxWidth: 620,
        background: surface,
        borderRadius: 24,
        border: `2px solid ${withAlpha(accent, 0.5)}`,
        padding: bodySize,
        display: "flex",
        flexDirection: "column",
        gap: bodySize * 0.6,
        opacity: p,
        translate: `${interpolate(p, [0, 1], [fromX, 0])}px 0px`,
      }}
    >
      <div
        style={{
          fontFamily: fontHeading,
          fontSize: labelSize,
          fontWeight: 800,
          color: accent,
        }}
      >
        {title}
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          style={{ fontFamily: fontBody, fontSize: bodySize, color: textColor }}
        >
          {it}
        </div>
      ))}
    </div>
  );
};

/** Two side-by-side cards — the one scene where side-by-side is the point. */
export const ComparisonScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height } = useVideoConfig();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const cmp = scene.content.comparison;
  const accent = scene.accent || t.palette.accent;
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="center">
      {scene.content.title ? (
        <Headline
          text={scene.content.title}
          size={Math.round(s.headline * 0.7)}
          kind="fade"
          accent={accent}
          maxWidth={width * 0.85}
          delay={2}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          gap: Math.round(width * 0.035),
          width: "100%",
          justifyContent: "center",
          alignItems: "stretch",
          marginTop: Math.round(height * 0.025),
        }}
      >
        <Column
          title={cmp.leftTitle}
          items={cmp.leftItems}
          accent={t.palette.muted}
          fontHeading={t.fonts.heading}
          fontBody={t.fonts.body}
          surface={withAlpha(t.palette.surface, 0.7)}
          textColor={t.palette.muted}
          labelSize={s.body}
          bodySize={s.label}
          fromX={-40}
          delay={8}
        />
        <Column
          title={cmp.rightTitle}
          items={cmp.rightItems}
          accent={accent}
          fontHeading={t.fonts.heading}
          fontBody={t.fonts.body}
          surface={withAlpha(t.palette.surface, 0.95)}
          textColor={t.palette.text}
          labelSize={s.body}
          bodySize={s.label}
          fromX={40}
          delay={14}
        />
      </div>
    </SceneFrame>
  );
};
