import { removeBg } from "./lib/bgremove";

/**
 * Remove the background from an image (product cutouts), writing a transparent
 * PNG to the asset cache. Requires the opt-in AGPL-3.0 @imgly package — see
 * scripts/lib/bgremove.ts.
 *
 *   npm run cutout -- input/product.jpg
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run cutout -- <image under public/>");
    process.exit(1);
  }
  const out = await removeBg(file);
  if (!out) process.exit(1);
  console.log(`✓ cutout → ${out}`);
}

main().catch((err) => {
  console.error("\n✗ cutout failed:", err?.message || err);
  process.exit(1);
});
