import { staticFile } from "remotion";
import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import type { MediaLayer, SceneProps, VideoProps } from "./schema";

/**
 * Media probing for calculateMetadata. Uses mediabunny over a URL source
 * (staticFile in Studio, the served asset URL during a Node render) so the same
 * code path works in the browser and on the server. Node-only scripts use
 * scripts/lib/media.ts (FilePathSource) instead.
 */
const isUrl = (s: string) => /^https?:\/\//.test(s);
const toUrl = (src: string) => (isUrl(src) ? src : staticFile(src));

function makeInput(src: string): Input {
  return new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(toUrl(src), { getRetryDelay: () => null }),
  });
}

export async function probeDuration(src: string): Promise<number | null> {
  try {
    const d = await makeInput(src).computeDuration();
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

export async function probeSize(
  src: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const track = await makeInput(src).getPrimaryVideoTrack();
    if (!track) return null;
    return { width: track.displayWidth, height: track.displayHeight };
  } catch {
    return null;
  }
}

/** Played seconds for a clip after trim + speed, given its source length. */
export function clipPlayedSeconds(
  media: MediaLayer,
  sourceDurationSeconds: number,
): number {
  const end =
    media.trimEnd > 0
      ? Math.min(media.trimEnd, sourceDurationSeconds)
      : sourceDurationSeconds;
  const start = Math.min(Math.max(0, media.trimStart), end);
  const raw = Math.max(0, end - start);
  return raw / (media.speed > 0 ? media.speed : 1);
}

/** Rewrite fitToMedia scenes' durations from their probed clip length. */
export async function resolveSceneDurations(
  video: VideoProps,
): Promise<SceneProps[]> {
  return Promise.all(
    video.scenes.map(async (scene) => {
      const m = scene.backgroundMedia;
      // A fitToMedia video clip sets the scene length…
      if (scene.fitToMedia && m.type === "video" && m.src) {
        const dur = await probeDuration(m.src);
        if (dur != null) {
          const played = clipPlayedSeconds(m, dur);
          if (played > 0) return { ...scene, durationInSeconds: played };
        }
        return scene;
      }
      // …otherwise a fitScene voiceover drives it (+ a short tail after narration).
      const vo = scene.voiceover;
      if (vo.fitScene && vo.src) {
        const dur = await probeDuration(vo.src);
        if (dur != null && dur > 0) {
          return { ...scene, durationInSeconds: dur + 0.6 };
        }
      }
      return scene;
    }),
  );
}

/** Composition size from the first video clip, when matchMediaSize is set. */
export async function resolveCompositionSize(
  video: VideoProps,
  fallback: { width: number; height: number },
): Promise<{ width: number; height: number }> {
  if (!video.matchMediaSize) return fallback;
  const clip = video.scenes.find(
    (s) => s.backgroundMedia.type === "video" && s.backgroundMedia.src,
  );
  if (!clip) return fallback;
  return (await probeSize(clip.backgroundMedia.src)) ?? fallback;
}
