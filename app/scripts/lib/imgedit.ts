import fs from "fs";
import path from "path";
import { PUBLIC_DIR, hashKey, publicRef } from "./cache";
import { resolvePublic } from "./media";
import { ensurePyEnv, runInPyEnv } from "./pyenv";

/**
 * Free local AI image editing via IOPaint (Apache-2.0 —
 * github.com/Sanster/IOPaint): object/watermark/blemish removal and inpaint,
 * powered by LaMa. On-demand local Python venv (see lib/pyenv.ts).
 */
const TOOL = "iopaint";
const PY312 = fs.existsSync("/opt/homebrew/bin/python3.12")
  ? "/opt/homebrew/bin/python3.12"
  : fs.existsSync("/usr/local/bin/python3.12")
    ? "/usr/local/bin/python3.12"
    : "python3";

const GENERATED_DIR = path.join(PUBLIC_DIR, "input", "generated");

function ensureInstalled(): boolean {
  const r = ensurePyEnv(TOOL, ["iopaint"], PY312);
  if (!r.ok) console.warn(`  [iopaint] setup failed:\n${r.log}`);
  return r.ok;
}

export type EditResult = { src: string; cached: boolean };

/** Remove/inpaint a masked region of an image (object, watermark, blemish
 * removal). `maskFile` is a black/white image (white = area to remove/fill)
 * — auto-resized to match `file` if dimensions differ. Cached by
 * content-path + mask-path hash. Returns null (with a log line) if IOPaint
 * isn't available. */
export function removeObject(file: string, maskFile: string): EditResult | null {
  const key = hashKey("iopaint-erase", file, maskFile);
  const outAbs = path.join(GENERATED_DIR, `iopaint-${key}${path.extname(file) || ".png"}`);
  if (fs.existsSync(outAbs)) return { src: publicRef(outAbs), cached: true };

  if (!ensureInstalled()) return null;

  const inputAbs = resolvePublic(file);
  const tmpOutDir = path.join(GENERATED_DIR, `iopaint-tmp-${key}`);
  fs.mkdirSync(tmpOutDir, { recursive: true });
  console.log("  [iopaint] erasing masked region (LaMa, CPU — downloads ~200MB on first use)…");
  const res = runInPyEnv(
    TOOL,
    [
      "-m",
      "iopaint",
      "run",
      "--model",
      "lama",
      "--device",
      "cpu",
      "--image",
      inputAbs,
      "--mask",
      resolvePublic(maskFile),
      "--output",
      tmpOutDir,
    ],
    {},
  );

  const produced = path.join(tmpOutDir, path.basename(inputAbs));
  if (res.status !== 0 || !fs.existsSync(produced)) {
    console.warn(`  [iopaint] erase failed:\n${res.stderr.slice(-800)}`);
    fs.rmSync(tmpOutDir, { recursive: true, force: true });
    return null;
  }

  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  fs.renameSync(produced, outAbs);
  fs.rmSync(tmpOutDir, { recursive: true, force: true });
  return { src: publicRef(outAbs), cached: false };
}
