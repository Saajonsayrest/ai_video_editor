import type { SceneProps } from "../schema";

/** Props every scene-kind component receives. `sceneFrames` is this scene's own
 * length (useVideoConfig reports the whole composition, not the sequence). */
export type SceneComponentProps = {
  scene: SceneProps;
  sceneFrames: number;
  /** This scene's start in composition time (for audio-synced visuals). */
  sceneStartFrame: number;
};
