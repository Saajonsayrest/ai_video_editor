import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { defaultVideo } from "../src/default-video";
import brandJson from "../brand.json";
import { bundleProject, renderThumbnail, renderVideo } from "./lib/renderer";

/**
 * Batch / A-B render: apply each variant's patch over a base spec and render an
 * MP4 + thumbnail per variant. Great for testing different hooks/CTAs.
 *
 *   npm run batch -- variants.json
 *
 * variants.json:
 *   {
 *     "base": "props.json",              // optional: path or inline spec; else the demo
 *     "variants": [
 *       { "name": "hook-a", "patch": { "scenes": [ ... ] } },
 *       { "name": "cta-b",  "patch": { "brand": { "palette": { "accent": "#ff5c8a" } } } }
 *     ]
 *   }
 */
type Variant = { name: string; patch?: unknown };
type BatchFile = { base?: unknown; variants: Variant[] };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge b over a (objects recurse; arrays/primitives replace). */
function deepMerge(a: unknown, b: unknown): unknown {
  if (!isObject(a) || !isObject(b)) return b === undefined ? a : b;
  const out: Record<string, unknown> = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = isObject(a[k]) && isObject(b[k]) ? deepMerge(a[k], b[k]) : b[k];
  }
  return out;
}

async function main() {
  const root = process.cwd();
  const file = process.argv[2] || "variants.json";
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.error(`✗ ${file} not found. See the header of scripts/batch.ts for its shape.`);
    process.exit(1);
  }
  const batch = JSON.parse(fs.readFileSync(abs, "utf8")) as BatchFile;
  if (!Array.isArray(batch.variants) || batch.variants.length === 0) {
    console.error("✗ variants.json needs a non-empty `variants` array.");
    process.exit(1);
  }

  let base: unknown = defaultVideo;
  if (typeof batch.base === "string") {
    base = JSON.parse(fs.readFileSync(path.join(root, batch.base), "utf8"));
  } else if (isObject(batch.base)) {
    base = batch.base;
  } else if (fs.existsSync(path.join(root, "props.json"))) {
    base = JSON.parse(fs.readFileSync(path.join(root, "props.json"), "utf8"));
  }
  // brand.json is the fallback for a base that omits "brand" — deepMerge lets
  // an explicit "brand" in that base still win.
  if (base !== defaultVideo) {
    base = deepMerge({ brand: brandJson }, base);
  }

  console.log("Bundling…");
  const serveUrl = await bundleProject();
  const outDir = path.join(root, "public/output/batch");
  fs.mkdirSync(outDir, { recursive: true });

  for (const v of batch.variants) {
    const merged = videoSchema.parse(deepMerge(base, v.patch ?? {}));
    const inputProps = merged as unknown as Record<string, unknown>;
    console.log(`\n▶ ${v.name}`);
    const info = await renderVideo(
      serveUrl,
      inputProps,
      path.join(outDir, `${v.name}.mp4`),
      `${v.name} `,
    );
    await renderThumbnail(
      serveUrl,
      inputProps,
      path.join(outDir, `${v.name}.png`),
      Math.floor(info.durationInFrames / 3),
    );
    console.log(`  ✓ ${info.width}×${info.height} → public/output/batch/${v.name}.mp4 (+ .png)`);
  }
  console.log(`\n✓ Rendered ${batch.variants.length} variant(s) → public/output/batch/`);
}

main().catch((err) => {
  console.error("\n✗ batch failed:", err?.message || err);
  process.exit(1);
});
