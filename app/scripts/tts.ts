import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { synthesizeVoice, type TtsEngine } from "./lib/tts";
import { probeFileDuration } from "./lib/media";

/**
 * Generate voiceover for every scene that has `voiceover.text` but no `src`,
 * writing the (cached) audio path back into the props file. Run before render so
 * calculateMetadata can size fitScene scenes to the narration.
 *
 *   npm run tts                       # props.json, kokoro (→ say fallback)
 *   npm run tts -- --engine say       # force the fast macOS draft voice
 *   npm run tts -- variants/a.json
 */
async function main() {
  const args = process.argv.slice(2);
  let engine: TtsEngine | "auto" = "auto";
  const ei = args.indexOf("--engine");
  if (ei >= 0) {
    engine = args[ei + 1] as TtsEngine;
    args.splice(ei, 2);
  }
  const file = args[0] || "props.json";
  const abs = path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ ${file} not found`);
    process.exit(1);
  }

  const spec = videoSchema.parse(JSON.parse(fs.readFileSync(abs, "utf8")));
  let count = 0;
  for (const scene of spec.scenes) {
    const vo = scene.voiceover;
    if (!vo.text.trim() || vo.src) continue;
    const voice = vo.voice || spec.brand.voice || "af_heart";
    const preview = vo.text.length > 48 ? `${vo.text.slice(0, 48)}…` : vo.text;
    process.stdout.write(`  VO (${voice}): "${preview}" … `);
    const res = await synthesizeVoice(vo.text, voice, { engine });
    if (!res) {
      console.log("failed — no TTS engine available");
      continue;
    }
    vo.src = res.src;
    const dur = await probeFileDuration(res.src);
    console.log(
      `${res.engine}${res.cached ? " (cached)" : ""} → ${res.src}` +
        (dur ? ` — ${dur.toFixed(1)}s` : ""),
    );
    count++;
  }

  if (count > 0) {
    fs.writeFileSync(abs, JSON.stringify(spec, null, 2));
    console.log(`\n✓ Wrote ${count} voiceover(s) into ${file}`);
  } else {
    console.log("No voiceovers to generate.");
  }
}

main().catch((err) => {
  console.error("\n✗ tts failed:", err?.message || err);
  process.exit(1);
});
