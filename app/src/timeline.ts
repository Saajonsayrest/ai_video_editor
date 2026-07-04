import type { SceneProps, TransitionType, VideoProps } from "./schema";

/**
 * The one place scene/transition frame math lives. Both Root.tsx
 * (calculateMetadata → total duration) and AiVideo.tsx (rendering + audio
 * placement) use this, so the timeline they agree on can never drift.
 *
 * Transitions overlap the two scenes they sit between, so they SHORTEN the total
 * and pull later scenes earlier (see the transitions skill rule). We clamp each
 * transition so neither adjacent scene is shorter than the transitions touching
 * it (a TransitionSeries hard requirement). `startFrame` is each scene's start in
 * composition time — used to place voiceover/SFX and to sync audio visualization.
 */
export type TimelineTransition = {
  type: TransitionType;
  direction: SceneProps["transition"]["direction"];
  frames: number;
};

export type TimelineEntry = {
  scene: SceneProps;
  frames: number;
  startFrame: number;
  /** Transition entering this scene from the previous one; null on scene 0 or "none". */
  transitionIn: TimelineTransition | null;
};

export type Timeline = {
  entries: TimelineEntry[];
  totalFrames: number;
};

export function buildTimeline(scenes: SceneProps[], fps: number): Timeline {
  const sceneFrames = scenes.map((s) =>
    Math.max(1, Math.round(s.durationInSeconds * fps)),
  );

  // Frames for the transition entering each scene (scene 0 has none).
  const transitions = scenes.map((s, i) => {
    if (i === 0 || s.transition.type === "none") return 0;
    const raw = Math.max(0, Math.round(s.transition.durationInFrames));
    if (raw === 0) return 0;
    const maxByNeighbours =
      Math.floor(Math.min(sceneFrames[i - 1], sceneFrames[i]) / 2) - 1;
    return Math.max(0, Math.min(raw, maxByNeighbours));
  });

  // Composition-time start of each scene (transitions pull later scenes earlier).
  const startFrames: number[] = [];
  for (let i = 0; i < scenes.length; i++) {
    startFrames[i] =
      i === 0 ? 0 : startFrames[i - 1] + sceneFrames[i - 1] - transitions[i];
  }

  const entries: TimelineEntry[] = scenes.map((scene, i) => ({
    scene,
    frames: sceneFrames[i],
    startFrame: startFrames[i],
    transitionIn:
      transitions[i] > 0
        ? {
            type: scene.transition.type,
            direction: scene.transition.direction,
            frames: transitions[i],
          }
        : null,
  }));

  const totalFrames = Math.max(
    1,
    sceneFrames.reduce((a, b) => a + b, 0) -
      transitions.reduce((a, b) => a + b, 0),
  );

  return { entries, totalFrames };
}

export function totalDurationInFrames(video: VideoProps): number {
  return buildTimeline(video.scenes, video.fps).totalFrames;
}
