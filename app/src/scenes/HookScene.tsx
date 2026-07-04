import { useVideoConfig } from "remotion";
import { SceneFrame } from "../components/SceneFrame";
import { GlassCard } from "../components/GlassCard";
import { getTypeScale } from "../typography";
import { TITLE_TONE, toneColors } from "../titleTone";
import { Eyebrow, Headline, Subtitle } from "./parts";
import type { SceneComponentProps } from "./types";

/** Opener: the same green liquid-glass card as the item screens, so the title
 * design stays consistent across the whole video. */
export const HookScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
}) => {
  const { width, height } = useVideoConfig();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const col = toneColors(TITLE_TONE);
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="flex-start">
      <div style={{ height: Math.round(height * 0.02) }} />
      <GlassCard align="center" tone={TITLE_TONE}>
        <Eyebrow text={c.eyebrow} size={s.eyebrow} accent={col.eyebrow} />
        <Headline
          text={c.title}
          size={Math.round(s.headline * 0.92)}
          kind={scene.textAnimation}
          accent={col.eyebrow}
          color={col.title}
          maxWidth={width * 0.8}
          highlightWord={c.highlightWord}
        />
        <Subtitle
          text={c.subtitle}
          size={s.subtitle}
          maxWidth={width * 0.72}
          color={col.subtitle}
        />
      </GlassCard>
    </SceneFrame>
  );
};
