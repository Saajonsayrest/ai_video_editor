import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { srtToCaptions, transcribeToCaptions } from "./lib/captions";

/**
 * Attach captions to a props file. By default transcribes each scene's voiceover
 * (or its video clip) with local whisper.cpp; --srt imports an existing subtitle
 * file into one scene. Captions are embedded in props and enabled.
 *
 *   npm run captions                              # transcribe VO/footage per scene
 *   npm run captions -- --srt input/subs.srt      # import into scene 0
 *   npm run captions -- --srt input/subs.srt --scene 2
 */
async function main() {
  const args = process.argv.slice(2);
  const propsFile = "props.json";
  const abs = path.join(process.cwd(), propsFile);
  if (!fs.existsSync(abs)) {
    console.error("✗ props.json not found — write a spec first.");
    process.exit(1);
  }
  const spec = videoSchema.parse(JSON.parse(fs.readFileSync(abs, "utf8")));

  const srtIdx = args.indexOf("--srt");
  if (srtIdx >= 0) {
    const srtFile = args[srtIdx + 1];
    const scIdx =
      args.indexOf("--scene") >= 0
        ? parseInt(args[args.indexOf("--scene") + 1], 10)
        : 0;
    if (!srtFile) {
      console.error("✗ --srt needs a file path");
      process.exit(1);
    }
    if (!spec.scenes[scIdx]) {
      console.error(`✗ scene ${scIdx} out of range`);
      process.exit(1);
    }
    const caps = srtToCaptions(srtFile);
    spec.scenes[scIdx].captions.captions = caps;
    spec.captions.enabled = true;
    fs.writeFileSync(abs, JSON.stringify(spec, null, 2));
    console.log(`✓ Imported ${caps.length} caption(s) from ${srtFile} → scene ${scIdx}`);
    return;
  }

  let count = 0;
  for (let i = 0; i < spec.scenes.length; i++) {
    const sc = spec.scenes[i];
    const source =
      sc.voiceover.src ||
      (sc.backgroundMedia.type === "video" ? sc.backgroundMedia.src : "");
    if (!source || sc.captions.captions.length > 0) continue;
    process.stdout.write(`  Scene ${i + 1}: transcribing ${source} … `);
    try {
      const caps = await transcribeToCaptions(source);
      sc.captions.captions = caps;
      console.log(`${caps.length} token(s)`);
      count++;
    } catch (err) {
      console.log(`failed: ${(err as Error).message}`);
    }
  }

  if (count > 0) {
    spec.captions.enabled = true;
    fs.writeFileSync(abs, JSON.stringify(spec, null, 2));
    console.log(`\n✓ Wrote captions for ${count} scene(s) into ${propsFile}`);
  } else {
    console.log("No captions generated (scenes need a voiceover.src or video clip).");
  }
}

main().catch((err) => {
  console.error("\n✗ captions failed:", err?.message || err);
  process.exit(1);
});
