import fs from "fs";
import { spawnSync } from "child_process";
import { generatedFile, hashKey, publicRef } from "./cache";

/**
 * Free, local text-to-speech. Primary engine is kokoro-js (Kokoro-82M, Apache-2.0,
 * on-device ONNX — downloads the model once on first use). Falls back to macOS
 * `say` for drafts. Paid engines (ElevenLabs) belong in scripts/lib/genvideo.ts.
 * Results are cached by hash(text+voice) so nothing is regenerated.
 */
export type TtsEngine = "kokoro" | "say";
export type TtsResult = { src: string; engine: TtsEngine; cached: boolean };

const KOKORO_MODEL =
  process.env.KOKORO_MODEL || "onnx-community/Kokoro-82M-v1.0-ONNX";

// Minimal structural types — decoupled from kokoro-js / transformers internals.
interface KokoroAudio {
  save(path: string): Promise<void>;
}
interface KokoroInstance {
  generate(text: string, opts: { voice: string }): Promise<KokoroAudio>;
}
interface KokoroModule {
  KokoroTTS: {
    from_pretrained(
      id: string,
      opts: { dtype?: string; device?: string },
    ): Promise<KokoroInstance>;
  };
}

let kokoroPromise: Promise<KokoroInstance> | null = null;
function getKokoro(): Promise<KokoroInstance> {
  if (!kokoroPromise) {
    kokoroPromise = import("kokoro-js").then((m) =>
      (m as unknown as KokoroModule).KokoroTTS.from_pretrained(KOKORO_MODEL, {
        dtype: "q8",
        device: "cpu",
      }),
    );
  }
  return kokoroPromise;
}

async function kokoroGenerate(
  text: string,
  voice: string,
  absWav: string,
): Promise<boolean> {
  const audio = await (await getKokoro()).generate(text, { voice });
  await audio.save(absWav);
  return fs.existsSync(absWav);
}

function sayGenerate(text: string, absWav: string): boolean {
  if (process.platform !== "darwin") return false;
  // Write WAV directly — Remotion's bundled ffmpeg can't demux say's AIFF.
  const said = spawnSync(
    "say",
    ["-o", absWav, "--file-format=WAVE", "--data-format=LEI16@22050", text],
    { encoding: "utf8" },
  );
  return said.status === 0 && fs.existsSync(absWav);
}

/** Synthesize (cached) VO for `text`/`voice`. `engine: "auto"` tries kokoro then
 * `say`. Returns null if neither engine is available. */
export async function synthesizeVoice(
  text: string,
  voice: string,
  opts: { engine?: TtsEngine | "auto" } = {},
): Promise<TtsResult | null> {
  const clean = text.trim();
  if (!clean) return null;
  const wav = generatedFile(`vo-${hashKey("vo", voice, clean)}.wav`);
  if (fs.existsSync(wav)) {
    return { src: publicRef(wav), engine: "kokoro", cached: true };
  }

  const engine = opts.engine ?? "auto";
  if (engine === "say") {
    return sayGenerate(clean, wav)
      ? { src: publicRef(wav), engine: "say", cached: false }
      : null;
  }

  try {
    if (await kokoroGenerate(clean, voice, wav)) {
      return { src: publicRef(wav), engine: "kokoro", cached: false };
    }
  } catch (err) {
    console.warn(
      `  [tts] kokoro unavailable (${(err as Error).message}); trying macOS 'say'…`,
    );
  }
  return sayGenerate(clean, wav)
    ? { src: publicRef(wav), engine: "say", cached: false }
    : null;
}
