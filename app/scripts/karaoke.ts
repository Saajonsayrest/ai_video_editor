import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { generatedFile, hashKey, publicRef } from "./lib/cache";
import { transcribeToCaptions } from "./lib/captions";
import { runFfmpeg } from "./lib/ffmpeg";
import { resolvePublic } from "./lib/media";
import { separateStems } from "./lib/stems";

/**
 * Turn any video/song into a ready-to-render karaoke props file: fullscreen
 * footage + word-level karaoke captions (matchMediaSize keeps the composition
 * sized to the source). --instrumental additionally strips the vocals (via
 * demucs) so it plays as a true sing-along track.
 *
 *   npm run karaoke -- input/ingest/<hash>.mp4
 *   npm run karaoke -- input/ingest/<hash>.mp4 --instrumental
 *   npm run karaoke -- input/ingest/<hash>.mp4 --lang multi   # non-English lyrics
 *   npm run karaoke -- input/ingest/<hash>.mp4 --out my-karaoke.json
 *
 * Writes a NEW file (default karaoke-props.json) rather than props.json, so
 * it never clobbers whatever you're already working on.
 */
async function main() {
  const args = process.argv.slice(2);
  const file = args[0];
  if (!file || file.startsWith("--")) {
    console.error(
      "Usage: npm run karaoke -- <video/audio file under public/> [--instrumental] [--lang multi] [--out file.json]",
    );
    process.exit(1);
  }
  const wantInstrumental = args.includes("--instrumental");
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : "karaoke-props.json";
  const multi = args.includes("--lang") && args[args.indexOf("--lang") + 1] === "multi";

  console.log(`  Transcribing "${file}" for captions…`);
  const captions = await transcribeToCaptions(file, {
    model: multi ? "small" : undefined,
    language: multi ? "auto" : undefined,
  });
  if (captions.length === 0) {
    console.error("✗ No speech/lyrics detected — check the file has an audible vocal track.");
    process.exit(1);
  }

  let videoSrc = file;
  if (wantInstrumental) {
    console.log("  Separating vocals (demucs) for an instrumental sing-along track…");
    const stems = separateStems(file);
    if (!stems) {
      console.warn("  ⚠ Instrumental separation unavailable — keeping original audio (with vocals).");
    } else {
      const abs = resolvePublic(file);
      const muxed = generatedFile(`karaoke-${hashKey("karaoke-instrumental", file)}.mp4`);
      const res = runFfmpeg([
        "-y",
        "-i",
        abs,
        "-i",
        resolvePublic(stems.instrumental),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "copy",
        "-shortest",
        muxed,
      ]);
      if (res.status === 0 && fs.existsSync(muxed)) {
        videoSrc = publicRef(muxed);
        console.log(`  ✓ Instrumental track muxed → public/${videoSrc}`);
      } else {
        console.warn(`  ⚠ Muxing instrumental failed; keeping original audio.\n${res.stderr.slice(-400)}`);
      }
    }
  }

  const spec = videoSchema.parse({
    title: "Karaoke",
    matchMediaSize: true,
    captions: { enabled: true, style: "highlight", position: "bottom", combineWithinMs: 1200 },
    scenes: [
      {
        kind: "media",
        fitToMedia: true,
        backgroundMedia: { type: "video", src: videoSrc, fit: "cover", muted: false, volume: 1 },
        captions: { captions },
      },
    ],
  });

  const outAbs = path.join(process.cwd(), outFile);
  fs.writeFileSync(outAbs, JSON.stringify(spec, null, 2));
  console.log(`\n✓ Wrote ${outFile} (${captions.length} caption tokens)`);
  console.log(
    `\nRender it with:\n` +
      `  cp ${outFile} props.json && npm run render\n` +
      `or directly:\n` +
      `  npx remotion render src/index.ts AiVideo public/output/karaoke.mp4 --props=${outFile}`,
  );
}

main().catch((err) => {
  console.error("\n✗ karaoke failed:", err?.message || err);
  process.exit(1);
});
