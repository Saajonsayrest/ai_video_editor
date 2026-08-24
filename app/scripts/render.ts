import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import brandJson from "../brand.json";
import { backupExisting, bundleProject, renderVideo } from "./lib/renderer";

/**
 * Render the AiVideo composition to public/output/video.mp4 using props.json (if
 * present). Programmatic Node render — no Studio needed. Runs on CI/servers too.
 */
async function main() {
  const root = process.cwd();
  const propsPath = path.join(root, "props.json");

  let inputProps: Record<string, unknown> | undefined;
  if (fs.existsSync(propsPath)) {
    const raw = JSON.parse(fs.readFileSync(propsPath, "utf8"));
    // brand.json is the fallback for an omitted "brand" key — spreading raw
    // AFTER it lets a props.json that DOES set "brand" still win.
    inputProps = videoSchema.parse({
      brand: brandJson,
      ...raw,
    }) as unknown as Record<string, unknown>;
    console.log(`Using props.json (${(inputProps.scenes as unknown[]).length} scenes)`);
  } else {
    console.log("No props.json found — rendering the default demo. Write a spec first for a custom video.");
  }

  console.log("Bundling…");
  const serveUrl = await bundleProject();

  const outDir = path.join(root, "public/output");
  fs.mkdirSync(outDir, { recursive: true });
  const outputLocation = path.join(outDir, "video.mp4");
  backupExisting(outputLocation);

  const info = await renderVideo(serveUrl, inputProps, outputLocation);
  console.log(
    `✓ Done → public/output/video.mp4 (${info.durationInFrames} frames @ ${info.fps}fps, ${info.width}×${info.height})`,
  );
}

main().catch((err) => {
  console.error("\n✗ render failed:", err?.message || err);
  process.exit(1);
});
