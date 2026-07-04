import fs from "fs";
import path from "path";
import { videoSchema } from "../src/schema";
import { buildTimeline } from "../src/timeline";
import { resolveDimensions } from "../src/format";
import { readManifest } from "./lib/cache";

/**
 * Write project.json — a cross-session snapshot of the current spec's scene and
 * asset status (which scenes still need media/voiceover/captions, what's cached).
 * Regenerate any time with `npm run project`.
 */
async function main() {
  const root = process.cwd();
  const propsPath = path.join(root, "props.json");
  const hasProps = fs.existsSync(propsPath);
  const spec = hasProps
    ? videoSchema.parse(JSON.parse(fs.readFileSync(propsPath, "utf8")))
    : null;
  const manifest = readManifest();

  const scenes = (spec?.scenes ?? []).map((s, i) => ({
    index: i,
    kind: s.kind,
    durationInSeconds: s.durationInSeconds,
    media:
      s.backgroundMedia.type === "none"
        ? "none"
        : s.backgroundMedia.src
          ? "ready"
          : s.backgroundMedia.query
            ? "needs-fetch"
            : "empty",
    voiceover: s.voiceover.src ? "ready" : s.voiceover.text ? "needs-tts" : "none",
    captions: s.captions.captions.length > 0 ? "ready" : "none",
  }));

  const dims = spec ? resolveDimensions(spec) : null;
  const frames = spec ? buildTimeline(spec.scenes, spec.fps).totalFrames : 0;

  const state = {
    version: 1,
    hasProps,
    title: spec?.title ?? null,
    format: spec?.format ?? null,
    size: dims,
    fps: spec?.fps ?? null,
    durationSeconds: spec ? Number((frames / spec.fps).toFixed(1)) : null,
    music: spec ? { mood: spec.music.mood, src: spec.music.src } : null,
    captions: spec ? { enabled: spec.captions.enabled, style: spec.captions.style } : null,
    scenes,
    assets: manifest.map((m) => ({ file: m.file, source: m.source, license: m.license })),
  };

  fs.writeFileSync(path.join(root, "project.json"), JSON.stringify(state, null, 2));
  console.log(
    `✓ project.json — ${scenes.length} scene(s), ${state.durationSeconds ?? "?"}s, ${manifest.length} cached asset(s)`,
  );
}

main().catch((err) => {
  console.error("\n✗ project failed:", err?.message || err);
  process.exit(1);
});
