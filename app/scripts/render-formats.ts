import fs from "fs";
import path from "path";
import { videoSchema, type Format } from "../src/schema";
import { defaultVideo } from "../src/default-video";
import brandJson from "../brand.json";
import { backupExisting, bundleProject, renderThumbnail, renderVideo } from "./lib/renderer";

/**
 * Render the SAME spec to all three formats — 16:9, 9:16, 1:1 — plus a thumbnail
 * each. Layout is format-aware (safe areas + format type scale), so one spec
 * yields social-ready cuts for every placement.
 *
 *   npm run render:formats            # uses props.json, else the demo
 */
const FORMATS: Format[] = ["landscape", "portrait", "square"];

async function main() {
  const root = process.cwd();
  const propsPath = path.join(root, "props.json");
  const base = fs.existsSync(propsPath)
    ? videoSchema.parse({
        brand: brandJson,
        ...JSON.parse(fs.readFileSync(propsPath, "utf8")),
      })
    : defaultVideo;

  console.log("Bundling…");
  const serveUrl = await bundleProject();
  const outDir = path.join(root, "public/output");
  fs.mkdirSync(outDir, { recursive: true });

  for (const format of FORMATS) {
    const inputProps = { ...base, format } as unknown as Record<string, unknown>;
    console.log(`\n▶ ${format}`);
    const videoPath = path.join(outDir, `video-${format}.mp4`);
    const stillPath = path.join(outDir, `video-${format}.png`);
    backupExisting(videoPath);
    backupExisting(stillPath);
    const info = await renderVideo(serveUrl, inputProps, videoPath, `${format} `);
    await renderThumbnail(serveUrl, inputProps, stillPath, Math.floor(info.durationInFrames / 3));
    console.log(
      `  ✓ ${info.width}×${info.height}, ${info.durationInFrames}f → public/output/video-${format}.mp4 (+ .png)`,
    );
  }
  console.log("\n✓ All three formats rendered.");
}

main().catch((err) => {
  console.error("\n✗ render:formats failed:", err?.message || err);
  process.exit(1);
});
