import { AbsoluteFill, Audio, Sequence, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import type { VideoProps } from "./schema";
import type { TimelineTransition } from "./timeline";
import { buildTimeline } from "./timeline";
import { BrandProvider } from "./theme";
import { SceneRouter } from "./scenes";
import { CaptionsOverlay } from "./components/Captions";
import { resolveSrc } from "./url";
import { sfxUrl } from "./sfx-library";
import { makeMusicVolume, type DuckRange } from "./audio";

/** Build the concrete <TransitionSeries.Transition> for a timeline transition.
 * Each branch constructs its own presentation so the differing presentation
 * types never need to be unified. */
function makeTransition(
  t: TimelineTransition,
  key: string,
  width: number,
  height: number,
): React.ReactNode {
  const timing = linearTiming({ durationInFrames: t.frames });
  switch (t.type) {
    case "slide":
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={slide({ direction: t.direction })}
          timing={timing}
        />
      );
    case "wipe":
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={wipe({ direction: t.direction })}
          timing={timing}
        />
      );
    case "flip":
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={flip({ direction: t.direction })}
          timing={timing}
        />
      );
    case "clockWipe":
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={clockWipe({ width, height })}
          timing={timing}
        />
      );
    default:
      return (
        <TransitionSeries.Transition
          key={key}
          presentation={fade()}
          timing={timing}
        />
      );
  }
}

/** Lays scenes on a TransitionSeries and mixes the audio graph (music with
 * auto-ducking, per-scene voiceover, timed SFX), all wrapped in the brand theme. */
export const AiVideo: React.FC<VideoProps> = (props) => {
  const { fps, width, height } = useVideoConfig();
  const timeline = buildTimeline(props.scenes, fps);

  const visuals: React.ReactNode[] = [];
  timeline.entries.forEach((entry, i) => {
    if (entry.transitionIn) {
      visuals.push(makeTransition(entry.transitionIn, `t-${i}`, width, height));
    }
    const showCaptions =
      props.captions.enabled && entry.scene.captions.captions.length > 0;
    visuals.push(
      <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={entry.frames}>
        <>
          <SceneRouter
            scene={entry.scene}
            sceneFrames={entry.frames}
            sceneStartFrame={entry.startFrame}
          />
          {showCaptions ? (
            <CaptionsOverlay
              captions={entry.scene.captions.captions}
              config={props.captions}
            />
          ) : null}
        </>
      </TransitionSeries.Sequence>,
    );
  });

  const music = props.music;
  const duckRanges: DuckRange[] = timeline.entries
    .filter((e) => e.scene.voiceover.src)
    .map((e) => ({ start: e.startFrame, end: e.startFrame + e.frames }));
  const musicVolume = makeMusicVolume(music, timeline.totalFrames, fps, duckRanges);

  const voiceTracks = timeline.entries.map((e, i) =>
    e.scene.voiceover.src ? (
      <Sequence key={`vo-${i}`} from={e.startFrame} durationInFrames={e.frames}>
        <Audio
          src={resolveSrc(e.scene.voiceover.src)}
          volume={() => e.scene.voiceover.volume}
        />
      </Sequence>
    ) : null,
  );

  const sfxTracks = timeline.entries.flatMap((e, i) =>
    e.scene.sfx.map((s, j) => {
      const src = s.src ? resolveSrc(s.src) : sfxUrl(s.name);
      if (!src) return null;
      return (
        <Sequence
          key={`sfx-${i}-${j}`}
          from={e.startFrame + Math.round(s.atSeconds * fps)}
        >
          <Audio src={src} volume={() => s.volume} />
        </Sequence>
      );
    }),
  );

  return (
    <BrandProvider brand={props.brand}>
      <AbsoluteFill style={{ backgroundColor: props.brand.palette.background }}>
        <TransitionSeries>{visuals}</TransitionSeries>
        {music.src ? (
          <Audio src={resolveSrc(music.src)} loop volume={musicVolume} />
        ) : null}
        {voiceTracks}
        {sfxTracks}
      </AbsoluteFill>
    </BrandProvider>
  );
};
