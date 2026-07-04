import { useCurrentFrame, useVideoConfig } from "remotion";
import { useWindowedAudioData, visualizeAudio } from "@remotion/media-utils";
import { SceneFrame } from "../components/SceneFrame";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";
import { resolveSrc } from "../url";
import { Eyebrow, Headline } from "./parts";
import type { SceneComponentProps } from "./types";

/** Frequency-bar visualization synced to the audio. Kept as a child so the
 * useWindowedAudioData hook only mounts when there's a source; `frame` is passed
 * in (composition time) so it stays in sync with the globally-playing music. */
const Bars: React.FC<{
  src: string;
  frame: number;
  accent: string;
  mirror: boolean;
}> = ({ src, frame, accent, mirror }) => {
  const { fps, width, height } = useVideoConfig();
  const { audioData, dataOffsetInSeconds } = useWindowedAudioData({
    src,
    frame,
    fps,
    windowInSeconds: 30,
  });
  if (!audioData) return null;
  const freqs = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64,
    optimizeFor: "speed",
    dataOffsetInSeconds,
  }).slice(0, 48);
  // Low frequencies dominate raw magnitudes — log-scale to dB for a balanced
  // spectrum (per the audio-visualization skill rule).
  const bars = freqs.map((v) => {
    if (v <= 0) return 0;
    const db = 20 * Math.log10(v);
    return Math.max(0, Math.min(1, (db + 90) / 65));
  });
  const maxH = height * 0.34;
  return (
    <div
      style={{
        display: "flex",
        alignItems: mirror ? "center" : "flex-end",
        justifyContent: "center",
        gap: Math.max(2, width * 0.004),
        height: maxH,
        width: "100%",
      }}
    >
      {bars.map((amp, i) => {
        return (
          <div
            key={i}
            style={{
              width: width * 0.008,
              height: Math.max(2, amp * maxH),
              borderRadius: 999,
              background: accent,
              opacity: 0.45 + 0.55 * amp,
            }}
          />
        );
      })}
    </div>
  );
};

/** Music-video style scene: headline over an audio-reactive spectrum. */
export const AudiovizScene: React.FC<SceneComponentProps> = ({
  scene,
  sceneFrames,
  sceneStartFrame,
}) => {
  const { width, height } = useVideoConfig();
  const localFrame = useCurrentFrame();
  const frame = localFrame + sceneStartFrame;
  const t = useTheme();
  const s = getTypeScale(width, height);
  const c = scene.content;
  const accent = scene.accent || t.palette.accent;
  const src = c.audioSrc ? resolveSrc(c.audioSrc) : "";
  return (
    <SceneFrame scene={scene} sceneFrames={sceneFrames} align="center" justify="center">
      <Eyebrow text={c.eyebrow} size={s.eyebrow} accent={accent} />
      <Headline
        text={c.title}
        size={Math.round(s.headline * 0.8)}
        kind={scene.textAnimation}
        accent={accent}
        maxWidth={width * 0.82}
        highlightWord={c.highlightWord}
      />
      {src ? (
        <Bars src={src} frame={frame} accent={accent} mirror={c.vizStyle !== "bars"} />
      ) : null}
    </SceneFrame>
  );
};
