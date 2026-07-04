import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { bundleProject, renderThumbnail } from "./lib/renderer";

/**
 * Render a single frame to a PNG — thumbnails, OG images, poster frames.
 *
 *   npm run still                     # frame 0 → public/output/still.png
 *   npm run still -- 45               # frame 45
 *   npm run still -- 45 public/output/thumb.png
 */
async function main() {
  const root = process.cwd();
  const args = process.argv.slice(2);
  const frameArg = args.find((a) => /^\d+$/.test(a));
  const frame = frameArg ? parseInt(frameArg, 10) : 0;
  const out = args.find((a) => a.endsWith(".png")) || "public/output/still.png";

  const propsPath = path.join(root, "props.json");
  let inputProps: Record<string, unknown> | undefined;
  if (fs.existsSync(propsPath)) {
    inputProps = videoSchema.parse(
      JSON.parse(fs.readFileSync(propsPath, "utf8")),
    ) as unknown as Record<string, unknown>;
  }

  console.log("Bundling…");
  const serveUrl = await bundleProject();
  const outputLocation = path.join(root, out);
  fs.mkdirSync(path.dirname(outputLocation), { recursive: true });
  await renderThumbnail(serveUrl, inputProps, outputLocation, frame);
  console.log(`✓ Still → ${path.relative(root, outputLocation)} (frame ${frame})`);
}

main().catch((err) => {
  console.error("\n✗ still failed:", err?.message || err);
  process.exit(1);
});
