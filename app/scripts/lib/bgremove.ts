import fs from "fs";
import { generatedFile, hashKey, publicRef, recordAsset } from "./cache";
import { resolvePublic } from "./media";

/**
 * Local background removal via @imgly/background-removal.
 *
 * ⚠ That package is AGPL-3.0 (strong copyleft). It is deliberately NOT a
 * dependency of this project — using it locally to cut out your own images is
 * fine, but bundling it would impose AGPL on anyone who distributes this repo.
 * Enable it explicitly (understanding the copyleft implications):
 *
 *     npm i @imgly/background-removal
 *
 * The cutout PNG is your own image; the AGPL applies to the tool, not its output.
 */
interface ImglyModule {
  removeBackground(input: Blob | string): Promise<Blob>;
}

// String-typed specifier so tsc doesn't require the (uninstalled) module.
const IMGLY: string = "@imgly/background-removal";

export async function removeBg(file: string): Promise<string | null> {
  let mod: ImglyModule;
  try {
    mod = (await import(IMGLY)) as unknown as ImglyModule;
  } catch {
    console.warn(
      "  [cutout] @imgly/background-removal is not installed (AGPL-3.0, opt-in).\n" +
        "    Enable with:  npm i @imgly/background-removal",
    );
    return null;
  }

  const abs = resolvePublic(file);
  const blob = new Blob([fs.readFileSync(abs)]);
  const out = await mod.removeBackground(blob);
  const key = hashKey("cutout", file);
  const outAbs = generatedFile(`cutout-${key}.png`);
  fs.writeFileSync(outAbs, Buffer.from(await out.arrayBuffer()));
  recordAsset({
    hash: key,
    file: publicRef(outAbs),
    source: "@imgly/background-removal",
    query: file,
    license: "AGPL-3.0 (tool only; the output image is your own)",
    url: "",
    date: new Date().toISOString(),
  });
  return publicRef(outAbs);
}
