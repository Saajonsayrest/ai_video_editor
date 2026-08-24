import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import fs from "fs";
import path from "path";

/** Shared bundle + render helpers for all the render scripts (render, still,
 * render:formats, batch) — one place for the composition id and webpack setup. */
const COMPOSITION_ID = "AiVideo";

/** Renders always land on a fixed filename (video.mp4, video-portrait.mp4, …) — never
 * overwrite a prior render silently. If the target already exists, rename it aside with
 * a timestamp first, so every past render stays on disk under its own name. */
export function backupExisting(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.renameSync(filePath, path.join(dir, `${base}_${stamp}${ext}`));
}

export function bundleProject(): Promise<string> {
  return bundle({
    entryPoint: path.join(process.cwd(), "src/index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
}

export type RenderInfo = {
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
};

export async function renderVideo(
  serveUrl: string,
  inputProps: Record<string, unknown> | undefined,
  outputLocation: string,
  label = "",
): Promise<RenderInfo> {
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    onProgress: ({ progress }) =>
      process.stdout.write(`\r  ${label}${Math.round(progress * 100)}%   `),
  });
  process.stdout.write("\r");
  return {
    width: composition.width,
    height: composition.height,
    durationInFrames: composition.durationInFrames,
    fps: composition.fps,
  };
}

export async function renderThumbnail(
  serveUrl: string,
  inputProps: Record<string, unknown> | undefined,
  outputLocation: string,
  frame = 0,
): Promise<void> {
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps,
  });
  await renderStill({ composition, serveUrl, output: outputLocation, frame, inputProps });
}
