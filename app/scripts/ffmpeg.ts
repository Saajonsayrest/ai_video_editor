import { spawnSync } from "child_process";

/**
 * Passthrough to Remotion's bundled ffmpeg for plain cut/concat/convert jobs
 * that need no re-render. Everything after `--` is forwarded verbatim.
 *
 *   npm run ffmpeg -- -i public/input/a.mov public/output/a.mp4
 *   npm run ffmpeg -- -ss 00:00:05 -i public/input/a.mp4 -to 00:00:10 \
 *       -c:v libx264 -c:a aac public/output/cut.mp4
 */
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: npm run ffmpeg -- <ffmpeg args>\n" +
      "  Convert:  npm run ffmpeg -- -i public/input/a.mov public/output/a.mp4\n" +
      "  Cut:      npm run ffmpeg -- -ss 00:00:05 -i public/input/a.mp4 -to 00:00:10 -c:v libx264 -c:a aac public/output/cut.mp4",
  );
  process.exit(1);
}

const res = spawnSync("npx", ["remotion", "ffmpeg", ...args], { stdio: "inherit" });
process.exit(res.status ?? 0);
