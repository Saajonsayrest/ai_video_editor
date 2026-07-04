import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { buildTimeline } from "../src/timeline";
import { resolveDimensions } from "../src/format";

/**
 * Validate a props file against the zod schema WITHOUT rendering. This is the
 * cheap check for the Claude-first workflow: when Claude (or a human) hand-writes
 * or patches props.json, run `npm run validate` to confirm it's well-formed and
 * see the resolved duration/size before spending render time.
 *
 *   npm run validate            # checks props.json
 *   npm run validate -- foo.json
 */
const file = process.argv[2] || "props.json";
const abs = path.join(process.cwd(), file);

if (!fs.existsSync(abs)) {
  console.error(`✗ ${file} not found`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(abs, "utf8")) as unknown;
const result = videoSchema.safeParse(raw);

if (!result.success) {
  console.error(`✗ ${file} is invalid:\n`);
  for (const issue of result.error.issues) {
    console.error(`  • ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

const video = result.data;
const { width, height } = resolveDimensions(video);
const frames = buildTimeline(video.scenes, video.fps).totalFrames;
console.log(
  `✓ ${file} valid — ${video.scenes.length} scene(s), ` +
    `${(frames / video.fps).toFixed(1)}s @ ${width}×${height} (${video.format}), ${frames} frames`,
);
