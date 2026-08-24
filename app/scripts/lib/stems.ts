import fs from "fs";
import path from "path";
import { PUBLIC_DIR, hashKey, publicRef } from "./cache";
import { resolvePublic } from "./media";
import { ensurePyEnv, runInPyEnv } from "./pyenv";

/**
 * Vocal/instrumental separation via demucs (MIT — github.com/adefossez/demucs).
 * On-demand local Python venv (see lib/pyenv.ts), CPU inference (no CUDA on a
 * Mac) — a few seconds of processing per second of audio.
 */
const TOOL = "demucs";
const PY312 = fs.existsSync("/opt/homebrew/bin/python3.12")
  ? "/opt/homebrew/bin/python3.12"
  : fs.existsSync("/usr/local/bin/python3.12")
    ? "/usr/local/bin/python3.12"
    : "python3";

const STEMS_DIR = path.join(PUBLIC_DIR, "input", "generated", "stems");

function ensureInstalled(): boolean {
  const r = ensurePyEnv(TOOL, ["demucs", "numpy"], PY312);
  if (!r.ok) console.warn(`  [demucs] setup failed:\n${r.log}`);
  return r.ok;
}

export type StemsResult = { vocals: string; instrumental: string; cached: boolean };

/** Split `file`'s audio into vocals + instrumental (drums/bass/other summed).
 * Cached by content-path hash. Returns null (with a log line) if demucs isn't
 * available. */
export function separateStems(file: string): StemsResult | null {
  const abs = resolvePublic(file);
  const key = hashKey("stems", file);
  const outDir = path.join(STEMS_DIR, key);
  const trackName = path.parse(abs).name;
  const vocalsAbs = path.join(outDir, "htdemucs", trackName, "vocals.wav");
  const instAbs = path.join(outDir, "htdemucs", trackName, "no_vocals.wav");

  if (fs.existsSync(vocalsAbs) && fs.existsSync(instAbs)) {
    return { vocals: publicRef(vocalsAbs), instrumental: publicRef(instAbs), cached: true };
  }

  if (!ensureInstalled()) return null;
  fs.mkdirSync(outDir, { recursive: true });
  console.log("  [demucs] separating vocals/instrumental (CPU — a few seconds per second of audio)…");
  const res = runInPyEnv(TOOL, ["-m", "demucs", "--two-stems", "vocals", "-d", "cpu", "-o", outDir, abs], {});
  if (res.status !== 0 || !fs.existsSync(vocalsAbs) || !fs.existsSync(instAbs)) {
    console.warn(`  [demucs] separation failed:\n${res.stderr.slice(-800)}`);
    return null;
  }
  return { vocals: publicRef(vocalsAbs), instrumental: publicRef(instAbs), cached: false };
}
