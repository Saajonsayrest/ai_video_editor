import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import {
  cacheFromUrl,
  fetchStock,
  type Orientation,
  type StockType,
} from "./lib/stock";

/**
 * Fill scene backgroundMedia that has a `query` (and no `src`) with free stock
 * from Pexels/Pixabay, cached + license-recorded. No key → graceful no-op.
 *
 *   npm run fetch-broll                                   # process props.json
 *   npm run fetch-broll -- --query "city night aerial" --type video
 *   npm run fetch-broll -- --url https://…/photo.jpg --type image
 */
async function main() {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const url = flag("--url");
  if (url) {
    const type = (flag("--type") as StockType) || "image";
    const r = await cacheFromUrl(url, {
      source: "url",
      query: url,
      license: "(user-provided URL — verify the source license)",
      type,
    });
    console.log(`✓ ${r.cached ? "cached" : "fetched"} → ${r.src}`);
    return;
  }

  const query = flag("--query");
  if (query) {
    const type = (flag("--type") as StockType) || "image";
    const orientation = (flag("--orientation") as Orientation) || "landscape";
    const r = await fetchStock({ query, type, orientation });
    if (!r) process.exit(1);
    console.log(`✓ ${r.cached ? "cached" : "fetched"} → ${r.src}`);
    return;
  }

  // Default: process props.json.
  const abs = path.join(process.cwd(), "props.json");
  if (!fs.existsSync(abs)) {
    console.error("✗ props.json not found — write a spec first, or use --query / --url.");
    process.exit(1);
  }
  const spec = videoSchema.parse(JSON.parse(fs.readFileSync(abs, "utf8")));
  let count = 0;
  for (let i = 0; i < spec.scenes.length; i++) {
    const bm = spec.scenes[i].backgroundMedia;
    if (!bm.query || bm.src || bm.type === "none") continue;
    process.stdout.write(`  Scene ${i + 1}: "${bm.query}" (${bm.type}) … `);
    const r = await fetchStock({ query: bm.query, type: bm.type, orientation: spec.format });
    if (r) {
      bm.src = r.src;
      console.log(`${r.cached ? "cached" : "fetched"} → ${r.src}`);
      count++;
    } else {
      console.log("skipped");
    }
  }
  if (count > 0) {
    fs.writeFileSync(abs, JSON.stringify(spec, null, 2));
    console.log(`\n✓ Filled ${count} scene(s) with stock into props.json`);
  } else {
    console.log("No stock fetched (need a PEXELS_API_KEY/PIXABAY_API_KEY and scenes with media.query).");
  }
}

main().catch((err) => {
  console.error("\n✗ fetch-broll failed:", err?.message || err);
  process.exit(1);
});
