import { removeObject } from "./lib/imgedit";

/**
 * Free local AI image editing — object/watermark/blemish removal via IOPaint
 * (LaMa). Needs a mask image (white = area to remove, black = keep, same
 * canvas as the source — paint one in Preview/any editor, or generate one
 * programmatically).
 *
 *   npm run edit-image -- input/product.jpg input/product-mask.png
 */
async function main() {
  const [file, maskFile] = process.argv.slice(2);
  if (!file || !maskFile) {
    console.error(
      "Usage: npm run edit-image -- <image under public/> <mask under public/>\n" +
        "  Mask: white = remove/fill, black = keep. Same canvas as the source image.",
    );
    process.exit(1);
  }

  const r = removeObject(file, maskFile);
  if (!r) process.exit(1);
  console.log(`✓ ${r.cached ? "cached" : "erased"} → public/${r.src}`);
}

main().catch((err) => {
  console.error("\n✗ edit-image failed:", err?.message || err);
  process.exit(1);
});
