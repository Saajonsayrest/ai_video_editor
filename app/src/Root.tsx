import "./index.css";
import { Composition } from "remotion";
import { AiVideo } from "./AiVideo";
import { defaultVideo } from "./default-video";
import { videoSchema } from "./schema";
import { resolveDimensions } from "./format";
import { buildTimeline } from "./timeline";
import { resolveCompositionSize, resolveSceneDurations } from "./media";

export const RemotionRoot: React.FC = () => {
  const dims = resolveDimensions(defaultVideo);
  return (
    <Composition
      id="AiVideo"
      component={AiVideo}
      schema={videoSchema}
      // Real values come from calculateMetadata (format/media → size, timeline → frames).
      durationInFrames={1}
      fps={defaultVideo.fps}
      width={dims.width}
      height={dims.height}
      defaultProps={defaultVideo}
      calculateMetadata={async ({ props }) => {
        // Apply schema defaults here too, so a partial props.json passed via
        // --props (preview/CLI) renders just like one built through render.ts.
        const parsed = videoSchema.parse(props);
        // Probe fitToMedia clips so scene lengths match the real footage.
        const scenes = await resolveSceneDurations(parsed);
        const { width, height } = await resolveCompositionSize(
          parsed,
          resolveDimensions(parsed),
        );
        return {
          durationInFrames: buildTimeline(scenes, parsed.fps).totalFrames,
          fps: parsed.fps,
          width,
          height,
          props: { ...parsed, scenes },
        };
      }}
    />
  );
};
