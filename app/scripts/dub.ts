import fs from "fs";
import path from "path";
import { DUB_LANGS, VOICED_LANGS, extractDubScript, synthesizeDub, type DubLang, type DubScript } from "./lib/dub";

/**
 * Two-step dubbing — no paid translation API: (1) transcribe the source and
 * write a reviewable dub-script.json with empty "translation" fields; (2)
 * after those are filled in (by the driving agent, using its own language
 * ability, or by hand), synthesize + mix + mux the dub.
 *
 *   npm run dub -- extract input/ingest/x.mp4 --lang ne
 *   … fill in each segment's "translation" in dub-script.json …
 *   npm run dub -- synthesize dub-script.json
 *
 * Voiced targets: en, ne, hi. "newari" has no free-commercial TTS anywhere —
 * synthesize still writes the filled-in translations as an .srt (original
 * audio untouched) rather than skipping the language entirely.
 */
async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  if (cmd === "extract") {
    const file = args[0];
    const langIdx = args.indexOf("--lang");
    const lang = (langIdx >= 0 ? args[langIdx + 1] : "") as DubLang;
    if (!file || !DUB_LANGS.includes(lang)) {
      console.error(`Usage: npm run dub -- extract <file> --lang <${DUB_LANGS.join("|")}>`);
      process.exit(1);
    }
    console.log(`  Transcribing "${file}" (multilingual auto-detect)…`);
    const script = await extractDubScript(file, lang);
    fs.writeFileSync(path.join(process.cwd(), "dub-script.json"), JSON.stringify(script, null, 2));
    console.log(
      `✓ Wrote dub-script.json — ${script.segments.length} segment(s), detected source language "${script.sourceLanguage}"`,
    );
    console.log(
      VOICED_LANGS.includes(lang)
        ? `\nFill in each segment's "translation" field (${lang}), then:\n  npm run dub -- synthesize dub-script.json`
        : `\nNewari has no free-commercial TTS — fill in each "translation" for a subtitle track, then:\n  npm run dub -- synthesize dub-script.json`,
    );
    return;
  }

  if (cmd === "synthesize") {
    const file = args[0] || "dub-script.json";
    const abs = path.join(process.cwd(), file);
    if (!fs.existsSync(abs)) {
      console.error(`✗ ${file} not found — run "npm run dub -- extract <file> --lang <xx>" first.`);
      process.exit(1);
    }
    const script = JSON.parse(fs.readFileSync(abs, "utf8")) as DubScript;
    const result = await synthesizeDub(script);
    if (!result) process.exit(1);
    if (result.mode === "dubbed") {
      console.log(`\n✓ Dubbed video → public/${result.outputVideo}`);
      if (result.skippedSegments > 0) {
        console.log(`  (${result.skippedSegments} segment(s) skipped — see warnings above)`);
      }
    } else {
      console.log(`\n✓ Subtitle track (no TTS available for this language) → public/${result.srtFile}`);
    }
    return;
  }

  console.error(
    "Usage:\n" +
      `  npm run dub -- extract <file> --lang <${DUB_LANGS.join("|")}>\n` +
      "  npm run dub -- synthesize [dub-script.json]",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("\n✗ dub failed:", err?.message || err);
  process.exit(1);
});
