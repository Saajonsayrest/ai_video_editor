import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { pickMusicByMood, readMusicLibrary } from "./lib/music";

/**
 * Resolve a spec's music.mood to a track from the local library, writing
 * music.src back into props.json.
 *
 *   npm run music                 # fills props.json music.src from music.mood
 */
async function main() {
  const file = process.argv[2] || "props.json";
  const abs = path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ ${file} not found`);
    process.exit(1);
  }
  const spec = videoSchema.parse(JSON.parse(fs.readFileSync(abs, "utf8")));

  if (spec.music.src) {
    console.log(`music.src already set (${spec.music.src}).`);
    return;
  }
  if (!spec.music.mood) {
    console.log("No music.mood to resolve. Set music.mood, or music.src directly.");
    return;
  }
  if (readMusicLibrary().length === 0) {
    console.log(
      "Music library is empty. Add tracks to public/input/music/ and describe them in\n" +
        "public/input/music/music-manifest.json (see its README).",
    );
    return;
  }

  const src = pickMusicByMood(spec.music.mood);
  if (!src) {
    console.log(`No track matched mood "${spec.music.mood}".`);
    return;
  }
  spec.music.src = src;
  fs.writeFileSync(abs, JSON.stringify(spec, null, 2));
  console.log(`✓ music.mood "${spec.music.mood}" → ${src}`);
}

main().catch((err) => {
  console.error("\n✗ music failed:", err?.message || err);
  process.exit(1);
});
