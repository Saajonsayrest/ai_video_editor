import type { Format, VideoProps } from "./schema";

/** Canonical dimensions for each format. Same props render to all three (P6). */
export const FORMAT_DIMENSIONS: Record<Format, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

/** Resolve the real pixel size: explicit width/height win, otherwise the format default. */
export function resolveDimensions(
  video: Pick<VideoProps, "format" | "width" | "height">,
): { width: number; height: number } {
  const base = FORMAT_DIMENSIONS[video.format] ?? FORMAT_DIMENSIONS.landscape;
  return {
    width: video.width > 0 ? video.width : base.width,
    height: video.height > 0 ? video.height : base.height,
  };
}
