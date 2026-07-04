import { analyzeSilence } from "./lib/silence";

/**
 * Report silence in a clip so trims can be applied (schema `trimStart`/`trimEnd`)
 * or the clip spliced on its non-silent ranges.
 *
 *   npm run silence -- input/interview.mp4
 *   npm run silence -- input/interview.mp4 0.35   # min silence seconds
 */
async function main() {
  const file = process.argv[2];
  const minSilence = process.argv[3] ? parseFloat(process.argv[3]) : 0.5;
  if (!file) {
    console.error(
      "Usage: npm run silence -- <file under public/> [minSilenceSeconds]\n" +
        "  e.g. npm run silence -- input/interview.mp4",
    );
    process.exit(1);
  }

  const r = await analyzeSilence(file, minSilence);
  const s = (n: number) => `${n.toFixed(2)}s`;

  console.log(`\nSilence report — ${r.file}`);
  console.log(
    `  duration ${r.durationSeconds != null ? s(r.durationSeconds) : "?"}   ` +
      `threshold ${r.thresholdDb.toFixed(1)}dB   silences ${r.silences.length}`,
  );
  for (const seg of r.silences) {
    console.log(`    silent  ${s(seg.start)} → ${s(seg.end)}  (${s(seg.end - seg.start)})`);
  }
  console.log(`\n  Trim leading/trailing silence:`);
  console.log(
    `    trimStart: ${r.suggestedTrimStart.toFixed(2)}   ` +
      `trimEnd: ${r.suggestedTrimEnd ? r.suggestedTrimEnd.toFixed(2) : "0 (none)"}`,
  );
  console.log(`\n  Non-silent ranges (for splicing into clips):`);
  for (const seg of r.nonSilentRanges) console.log(`    ${s(seg.start)} → ${s(seg.end)}`);
  console.log("");
}

main().catch((err) => {
  console.error("\n✗ silence failed:", err?.message || err);
  process.exit(1);
});
