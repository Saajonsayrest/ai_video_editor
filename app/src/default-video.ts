import brandJson from "../brand.json";
import { videoSchema, type VideoProps } from "./schema";

/**
 * The Studio default + zero-setup demo (`npm run render`). Written as a PARTIAL
 * spec and run through the schema so it also proves the "partial specs render"
 * promise — every omitted field is filled by a default. The AI/human workflow
 * overwrites props.json, which the render script feeds in as inputProps.
 */
export const defaultVideo: VideoProps = videoSchema.parse({
  title: "Remotion × Claude — Studio",
  format: "landscape",
  fps: 30,
  brand: brandJson,
  scenes: [
    {
      kind: "hook",
      durationInSeconds: 3.2,
      textAnimation: "spring-in",
      content: {
        eyebrow: "Remotion × Claude",
        title: "Videos, written by Claude",
        subtitle:
          "A plain-English brief becomes a rendered, on-brand MP4 — for $0.",
      },
    },
    {
      kind: "stat",
      durationInSeconds: 3,
      transition: { type: "slide", direction: "from-right" },
      textAnimation: "fade",
      content: {
        eyebrow: "Cost per render",
        stat: {
          value: "$0.00",
          label: "100% local + free-tier. No paid API on the default path.",
        },
      },
    },
    {
      kind: "product",
      durationInSeconds: 4.4,
      transition: { type: "wipe", direction: "from-right" },
      textAnimation: "slide-up",
      content: {
        eyebrow: "One schema, everything",
        title: "Everything is a prop",
        bullets: [
          "7 scene kinds + cinematic transitions",
          "Karaoke captions from local Whisper",
          "Local voiceover & free stock b-roll",
          "16:9 · 9:16 · 1:1 from one spec",
        ],
      },
    },
    {
      kind: "quote",
      durationInSeconds: 3.6,
      transition: { type: "fade" },
      textAnimation: "fade",
      content: {
        quote: {
          text: "Tell Claude what to change — it patches the spec and re-renders.",
          author: "The workflow",
        },
      },
    },
    {
      kind: "comparison",
      durationInSeconds: 3.8,
      transition: { type: "slide", direction: "from-left" },
      content: {
        title: "Before vs. after",
        comparison: {
          leftTitle: "Manual editing",
          leftItems: ["Hours in a timeline", "Re-cut per format", "Assets scattered"],
          rightTitle: "This studio",
          rightItems: ["One brief", "All formats at once", "Cached + licensed"],
        },
      },
    },
    {
      kind: "media",
      durationInSeconds: 3.4,
      transition: { type: "flip", direction: "from-right" },
      textAnimation: "word-highlight",
      content: {
        title: "Drop in your footage",
        highlightWord: "footage",
        subtitle: "Trim, splice, PiP, silence-cut — your clips, edited by prompt.",
      },
    },
    {
      kind: "cta",
      durationInSeconds: 3.2,
      transition: { type: "fade" },
      textAnimation: "spring-in",
      content: {
        title: "Ready to render",
        subtitle: "Zero keys required.",
        cta: { label: "npm run render", url: "github.com/your/repo" },
      },
    },
  ],
});
