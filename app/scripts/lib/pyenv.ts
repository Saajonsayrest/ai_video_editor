import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * On-demand Python venvs for free CLI tools that have no Node equivalent
 * (demucs, IOPaint, piper-tts). One venv per tool under .pyenv/<tool>
 * (gitignored, never committed, never in package.json) — built the first time
 * that tool is used, same "install on first use" convention as whisper.cpp in
 * lib/captions.ts. Needs system `python3` (already required by nothing else
 * here, but ships with macOS dev tools / homebrew).
 */
const PYENV_ROOT = path.join(process.cwd(), ".pyenv");

/** Absolute path to `tool`'s venv interpreter (may not exist yet). */
export function pyEnvPython(tool: string): string {
  return path.join(
    PYENV_ROOT,
    tool,
    process.platform === "win32" ? "Scripts\\python.exe" : "bin/python3",
  );
}
const pythonBin = pyEnvPython;

/** Directory for caching data a tool downloads once and reuses (voice models,
 * checkpoints) — separate from the venv itself so re-installing the venv
 * doesn't re-download multi-hundred-MB model files. */
export function pyEnvDataDir(tool: string): string {
  const dir = path.join(PYENV_ROOT, `${tool}-data`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export type PyEnvResult = { python: string; ok: boolean; log: string };

/** Ensure `tool`'s venv exists with `packages` installed. Idempotent — a venv
 * whose marker packages are already importable is left alone. `baseInterpreter`
 * picks which system Python creates the venv (default python3) — some tools
 * pin dependency versions too old to have wheels for the newest Python. */
export function ensurePyEnv(
  tool: string,
  packages: string[],
  baseInterpreter = "python3",
): PyEnvResult {
  const dir = path.join(PYENV_ROOT, tool);
  const python = pythonBin(tool);

  if (!fs.existsSync(python)) {
    console.log(`  [pyenv] First use of "${tool}" — creating a local Python env…`);
    const mk = spawnSync(baseInterpreter, ["-m", "venv", dir], { encoding: "utf8" });
    if (mk.status !== 0) {
      return { python, ok: false, log: mk.stderr || "python3 -m venv failed" };
    }
    console.log(`  [pyenv] Installing ${packages.join(", ")} (first run only — this can take a few minutes)…`);
    const pip = spawnSync(
      python,
      ["-m", "pip", "install", "--quiet", "--upgrade", "pip", ...packages],
      { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 },
    );
    if (pip.status !== 0) {
      fs.rmSync(dir, { recursive: true, force: true }); // don't leave a half-built env behind
      return { python, ok: false, log: pip.stderr || "pip install failed" };
    }
  }
  return { python, ok: true, log: "" };
}

/** Run `python …args` inside `tool`'s venv (e.g. `["-m", "demucs", …]`). */
export function runInPyEnv(
  tool: string,
  args: string[],
  opts: { maxBuffer?: number; input?: string },
): { status: number; stdout: string; stderr: string } {
  const python = pythonBin(tool);
  const res = spawnSync(python, args, {
    encoding: "utf8",
    input: opts.input,
    maxBuffer: opts.maxBuffer ?? 1024 * 1024 * 64,
  });
  return { status: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}
