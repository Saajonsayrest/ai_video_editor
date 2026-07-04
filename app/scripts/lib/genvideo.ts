import fs from "fs";
import path from "path";
import type { VideoProps } from "../../src/schema";

/**
 * Pluggable generative-video / -image adapter.
 *
 * Remotion EDITS video; it does not GENERATE footage. To turn a text prompt into
 * actual moving footage you need a generative model. This adapter targets
 * Replicate (one API in front of many video/image models) and is a no-op unless
 * REPLICATE_API_TOKEN is set — so the pipeline works with zero extra setup.
 *
 * A scene requests generation by leaving `media.src` empty and setting
 * `media.prompt` (with `media.type` "video" or "image"). We generate, download
 * into public/, and rewrite `media.src` to the local filename.
 *
 * Swap `REPLICATE_MODEL` for the model version you have access to, e.g.
 *   video: a text-to-video model version hash
 *   image: a text-to-image model version hash
 */

// AI-generated media lands next to your own files, in public/input/.
const INPUT_DIR = path.join(process.cwd(), "public", "input");

async function replicateGenerate(prompt: string): Promise<string | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  const version = process.env.REPLICATE_MODEL;
  if (!token || !version) return null;

  // Kick off a prediction.
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version, input: { prompt } }),
  });
  if (!create.ok) {
    console.warn(`  [genvideo] Replicate create failed: ${create.status} ${await create.text()}`);
    return null;
  }
  let pred = (await create.json()) as {
    id: string;
    status: string;
    output?: string | string[];
    urls: { get: string };
  };

  // Poll until done.
  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    await new Promise((r) => setTimeout(r, 2500));
    const poll = await fetch(pred.urls.get, {
      headers: { Authorization: `Bearer ${token}` },
    });
    pred = (await poll.json()) as typeof pred;
  }
  if (pred.status !== "succeeded" || !pred.output) return null;

  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  return url ?? null;
}

async function download(url: string, filename: string): Promise<string> {
  fs.mkdirSync(INPUT_DIR, { recursive: true });
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(INPUT_DIR, filename), buf);
  // staticFile() reference, relative to public/
  return `input/${filename}`;
}

/**
 * Fills in AI media for any scene that requested it. Returns the (possibly
 * mutated) spec. Safe to call unconditionally — it does nothing without a key.
 */
export async function maybeGenerateMedia(spec: VideoProps): Promise<VideoProps> {
  const wants = spec.scenes.some(
    (s) => s.backgroundMedia.type !== "none" && !s.backgroundMedia.src && s.backgroundMedia.prompt,
  );
  if (!wants) return spec;

  if (!process.env.REPLICATE_API_TOKEN || !process.env.REPLICATE_MODEL) {
    console.warn(
      "  [genvideo] Scenes requested AI media but REPLICATE_API_TOKEN / REPLICATE_MODEL are not set — skipping generation (text-only scenes will render).",
    );
    return spec;
  }

  for (let i = 0; i < spec.scenes.length; i++) {
    const s = spec.scenes[i];
    if (s.backgroundMedia.type === "none" || s.backgroundMedia.src || !s.backgroundMedia.prompt) continue;
    console.log(`  [genvideo] Generating ${s.backgroundMedia.type} for scene ${i + 1}: "${s.backgroundMedia.prompt}"`);
    const url = await replicateGenerate(s.backgroundMedia.prompt);
    if (!url) {
      console.warn(`  [genvideo] Generation failed for scene ${i + 1}; leaving it text-only.`);
      continue;
    }
    const ext = s.backgroundMedia.type === "video" ? "mp4" : "png";
    s.backgroundMedia.src = await download(url, `scene-${i + 1}.${ext}`);
    console.log(`  [genvideo] Saved public/${s.backgroundMedia.src}`);

  }
  return spec;
}
