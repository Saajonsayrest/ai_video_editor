import fs from "fs";
import path from "path";
import { generatedFile, hashKey, publicRef } from "./cache";
import { ensurePyEnv, pyEnvDataDir, runInPyEnv } from "./pyenv";

/**
 * Multilingual (Nepali, Hindi, etc.) local neural TTS with Piper.
 *
 * ⚠ The maintained `piper-tts` pip package (OHF-Voice/piper1-gpl) is
 * **GPL-3.0-or-later**. Run as an arm's-length subprocess from an on-demand
 * local venv (see lib/pyenv.ts), never imported/linked into the codebase bundle.
 * The synthesized wav is your own output.
 */
const TOOL = "piper";

export type PiperLang = "ne" | "hi";
type VoiceDef = { id: string; lang2: string; region: string; speaker: string; quality: string };

const PIPER_VOICES: Record<PiperLang, VoiceDef> = {
  ne: { id: "ne_NP-google-medium", lang2: "ne", region: "ne_NP", speaker: "google", quality: "medium" },
  hi: { id: "hi_IN-pratham-medium", lang2: "hi", region: "hi_IN", speaker: "pratham", quality: "medium" },
};

function ensureInstalled(): boolean {
  const r = ensurePyEnv(TOOL, ["piper-tts"]);
  if (!r.ok) {
    console.warn(
      `  [piper] setup failed (GPL-3.0 tool, opt-in local venv):\n${r.log}`,
    );
  }
  return r.ok;
}

async function ensureVoice(voice: VoiceDef): Promise<{ onnx: string; config: string } | null> {
  const dir = pyEnvDataDir(TOOL);
  const onnx = path.join(dir, `${voice.id}.onnx`);
  const config = path.join(dir, `${voice.id}.onnx.json`);
  if (fs.existsSync(onnx) && fs.existsSync(config)) return { onnx, config };

  const base = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${voice.lang2}/${voice.region}/${voice.speaker}/${voice.quality}`;
  console.log(`  [piper] downloading voice "${voice.id}" (first use only)…`);
  for (const [url, dest] of [
    [`${base}/${voice.id}.onnx`, onnx],
    [`${base}/${voice.id}.onnx.json`, config],
  ] as const) {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  [piper] voice download failed (${res.status}): ${url}`);
      return null;
    }
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  return { onnx, config };
}

export type PiperResult = { src: string; cached: boolean };

/** Synthesize `text` in `lang` to a cached wav. Returns null (with a log line)
 * if the tool/voice isn't available — callers should fall back gracefully. */
export async function synthesizePiper(text: string, lang: PiperLang): Promise<PiperResult | null> {
  const clean = text.trim();
  if (!clean) return null;

  const wav = generatedFile(`piper-${hashKey("piper", lang, clean)}.wav`);
  if (fs.existsSync(wav)) return { src: publicRef(wav), cached: true };

  if (!ensureInstalled()) return null;
  const voice = PIPER_VOICES[lang];
  const model = await ensureVoice(voice);
  if (!model) return null;

  const res = runInPyEnv(TOOL, ["-m", "piper", "-m", model.onnx, "-c", model.config, "-f", wav], {
    input: clean,
  });
  if (res.status !== 0 || !fs.existsSync(wav)) {
    console.warn(`  [piper] synthesis failed:\n${res.stderr}`);
    return null;
  }
  return { src: publicRef(wav), cached: false };
}
