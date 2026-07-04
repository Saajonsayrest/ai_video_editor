import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { SCENE_KINDS, TEXT_ANIMATIONS, videoSchema } from "../src/schema";
import { maybeGenerateMedia } from "./lib/genvideo";

/**
 * ⚠ OPTIONAL, PAID PATH. This calls the Anthropic API to turn a brief into a spec.
 * The PRIMARY (free) path is Claude Code writing props.json directly in-session —
 * see app/CLAUDE.md and the /new-video skill. Use this only for headless/automated
 * generation where no interactive Claude session is available.
 *
 *   npm run generate -- "a 4-scene launch teaser for an AI notes app, upbeat, dark"
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const brief = (process.argv.slice(2).join(" ").trim() || process.env.BRIEF || "").trim();
if (!brief) {
  console.error('No brief provided.\n  npm run generate -- "your video brief here"');
  process.exit(1);
}

// Loose JSON Schema (additionalProperties allowed everywhere) — zod is the real
// validator. Enums are imported so they can't drift from src/schema.ts.
const inputSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    title: { type: "string" },
    format: { type: "string", enum: ["landscape", "portrait", "square"] },
    fps: { type: "integer" },
    brand: {
      type: "object",
      additionalProperties: true,
      description: "palette {primary, secondary, background, surface, text, muted, accent}; fonts {heading, body}; voice",
    },
    music: { type: "object", additionalProperties: true, description: "mood (tag), volume, duckUnderVoice" },
    captions: { type: "object", additionalProperties: true, description: "enabled, style (highlight/box/chunk/underline), position" },
    scenes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: true,
        properties: {
          kind: { type: "string", enum: [...SCENE_KINDS] },
          durationInSeconds: { type: "number" },
          transition: { type: "object", additionalProperties: true, description: "type: none/fade/slide/wipe/flip/clockWipe; direction" },
          textAnimation: { type: "string", enum: [...TEXT_ANIMATIONS] },
          content: {
            type: "object",
            additionalProperties: true,
            description: "title, subtitle, eyebrow, highlightWord, bullets[], stat{value,label}, quote{text,author}, comparison{leftTitle,leftItems[],rightTitle,rightItems[]}, cta{label,url}",
          },
          backgroundMedia: { type: "object", additionalProperties: true, description: "type: none/image/video; set `query` for free stock (leave `src` empty)" },
          voiceover: { type: "object", additionalProperties: true, description: "set `text` for narration (the free TTS step fills the audio)" },
        },
        required: ["kind"],
      },
    },
  },
  required: ["scenes"],
} as const;

async function main() {
  const client = new Anthropic();
  console.log(`Model: ${MODEL}\nBrief: ${brief}\n`);

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system:
      "You are a motion-graphics director for a free Remotion video studio. Emit ONE complete spec via the emit_video_spec tool. " +
      "Choose a format and 3–7 scenes; each scene's `kind` (hook, media, product, quote, stat, comparison, audioviz, cta) should fit its message, with content under `content`. " +
      "Add per-scene `transition` and `textAnimation`, and brand palette/fonts that match the mood. " +
      "Leave assets to the free local pipeline: set backgroundMedia.query for stock (not src), voiceover.text for narration, music.mood for music. " +
      "Do NOT invent file paths or use paid AI generation unless the brief explicitly asks. Keep titles short and punchy.",
    tools: [
      {
        name: "emit_video_spec",
        description: "Emit the final, complete video specification.",
        input_schema: inputSchema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: "emit_video_spec" },
    messages: [{ role: "user", content: brief }],
  });

  const toolUse = msg.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Expected a tool_use block; got stop_reason=${msg.stop_reason}`);
  }

  // zod validates + fills every default.
  let spec = videoSchema.parse(toolUse.input);
  spec = await maybeGenerateMedia(spec); // no-op without a paid gen key

  const outPath = path.join(process.cwd(), "props.json");
  fs.writeFileSync(outPath, JSON.stringify(spec, null, 2));
  const total = spec.scenes.reduce((s, sc) => s + sc.durationInSeconds, 0);
  console.log(
    `\n✓ Wrote props.json — ${spec.scenes.length} scenes, ~${total.toFixed(1)}s (${spec.format}).\n` +
      "  Next (free): npm run fetch-broll · npm run tts · npm run captions · npm run render",
  );
}

main().catch((err) => {
  console.error("\n✗ generate failed:", err?.message || err);
  process.exit(1);
});
