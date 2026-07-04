import { useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { GlassCard } from "../components/GlassCard";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { TITLE_TONE, toneColors } from "../titleTone";
import { Eyebrow, Headline, Subtitle } from "./parts";
import type { SceneComponentProps } from "./types";

/** Full-bleed background media with a lower-third text block. Falls back to a
 * centered layout when no media src is set (so it still renders). */
export const MediaScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height } = useVideoConfig();
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  const hasMedia =
    scene.backgroundMedia.type !== "none" && scene.backgroundMedia.src.length > 0;
  const col = toneColors(TITLE_TONE);
  const hasText = !!(c.eyebrow || c.title || c.subtitle);

  if (!hasText) {
    return (
      <SceneFrame
        scene={scene}
        sceneFrames={sceneFrames}
        align="center"
        justify="center"
      >
        {null}
      </SceneFrame>
    );
  }

  const body = (
    <>
      <Eyebrow
        text={c.eyebrow}
        size={s.eyebrow}
        accent={hasMedia ? col.eyebrow : accent}
      />
      <Headline
        text={c.title}
        size={hasMedia ? Math.round(s.headline * 0.82) : s.headline}
        kind={scene.textAnimation}
        accent={accent}
        color={hasMedia ? col.title : undefined}
        maxWidth={width * 0.82}
        highlightWord={c.highlightWord}
      />
      <Subtitle
        text={c.subtitle}
        size={s.subtitle}
        maxWidth={width * 0.7}
        color={hasMedia ? col.subtitle : undefined}
      />
    </>
  );
  return (
    <SceneFrame
      scene={scene}
      sceneFrames={sceneFrames}
      align={hasMedia ? "flex-start" : "center"}
      justify={hasMedia ? "flex-start" : "center"}
    >
      {hasMedia ? (
        <GlassCard align="flex-start" tone={TITLE_TONE}>{body}</GlassCard>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: Math.round(height * 0.005),
            maxWidth: width * 0.85,
          }}
        >
          {body}
        </div>
      )}
    </SceneFrame>
  );
};
