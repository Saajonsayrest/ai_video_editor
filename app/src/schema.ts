import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/**
 * Single source of truth for the video's data shape (schema v2).
 *
 * Everything is defaulted, so a partial / hand-patched props.json still renders:
 * a scene with no fields becomes a valid (empty) "hook". Renderers switch on
 * `kind`. The zod schema is passed to the <Composition> so props are editable
 * visually in Remotion Studio (color pickers via @remotion/zod-types).
 *
 * NOTE: this file's zod *values* are imported by src/Root.tsx (for the Studio
 * schema) and by the scripts (for validation). Components import ONLY the
 * inferred *types* below.
 */

export const FORMATS = ["landscape", "portrait", "square"] as const;
export const SCENE_KINDS = [
  "hook",
  "media",
  "product",
  "quote",
  "stat",
  "comparison",
  "audioviz",
  "cta",
] as const;
export const TEXT_ANIMATIONS = [
  "none",
  "fade",
  "slide-up",
  "spring-in",
  "typewriter",
  "word-highlight",
  "stagger-reveal",
  "fisheye",
] as const;
export const TRANSITION_TYPES = [
  "none",
  "fade",
  "slide",
  "wipe",
  "flip",
  "clockWipe",
] as const;
export const TRANSITION_DIRECTIONS = [
  "from-left",
  "from-right",
  "from-top",
  "from-bottom",
] as const;
export const FIT_MODES = ["cover", "contain"] as const;
export const LOGO_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
  "top-center",
] as const;
export const OVERLAY_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
] as const;

/** A full-bleed background layer behind the scene text. */
export const mediaLayerSchema = z.object({
  type: z.enum(["none", "image", "video"]).default("none"),
  /** Path under public/ (e.g. "input/clip.mp4") or an https URL. */
  src: z.string().default(""),
  /** Stock search query — the stock adapter fills `src` from this. */
  query: z.string().default(""),
  /** Text-to-media prompt — the (paid, off-by-default) genvideo adapter uses this. */
  prompt: z.string().default(""),
  fit: z.enum(FIT_MODES).default("cover"),
  /** Object-position framing (e.g. "center", "top", "50% 20%"). */
  objectPosition: z.string().default("center"),
  /** Ken Burns pan/zoom for still images (ignored for video). */
  kenBurns: z
    .enum(["none", "zoom-in", "zoom-out", "pan-left", "pan-right"])
    .default("none"),
  opacity: z.number().min(0).max(1).default(1),
  /** Darkening overlay for text legibility over media (0 = none). */
  scrim: z.number().min(0).max(1).default(0.35),
  // --- editing, video only ---
  /** Seconds to skip from the start of the source. */
  trimStart: z.number().min(0).default(0),
  /** Second in the source to end at (0 = play to the end). */
  trimEnd: z.number().min(0).default(0),
  /** Playback speed multiplier. */
  speed: z.number().min(0.1).max(8).default(1),
  /** Mute the clip's own audio (background media is muted by default). */
  muted: z.boolean().default(true),
  /** Clip volume 0–1 when not muted. */
  volume: z.number().min(0).max(1).default(1),
  // --- aesthetic grade / vertical fill ---
  /** CSS filter applied to the footage pixels (color grade), e.g.
   * "saturate(1.08) contrast(0.96) brightness(1.05)". Empty ⇒ none. */
  filter: z.string().default(""),
  /** Portrait fill: render a blurred, scaled copy of the clip behind a sharp,
   * contained copy so a landscape source never leaves bare bands (fills the top
   * wall). Ignored for images / when the source already covers. */
  blurFill: z.boolean().default(false),
  /** Zoom applied to the sharp layer when blurFill is on (1 = fit width). Higher =
   * bigger subject, less blurred fill. */
  fillZoom: z.number().min(0.5).max(3).default(1),
  /** Static vertical re-center (% of frame height), applied after fillZoom/cover
   * scale. Negative shifts the visible crop DOWN the source (crops more off the
   * top); positive shifts it UP. Use when the source's aspect ratio already
   * matches the composition (so objectPosition has no slack to reposition). */
  cropOffsetY: z.number().min(-50).max(50).default(0),
});

/** A small positioned layer on top of the scene (PiP clip, product shot, badge). */
export const overlaySchema = z.object({
  type: z.enum(["image", "video"]).default("image"),
  src: z.string().default(""),
  position: z.enum(OVERLAY_POSITIONS).default("bottom-right"),
  /** Width as a percentage of the composition width. */
  width: z.number().min(1).max(100).default(28),
  opacity: z.number().min(0).max(1).default(1),
  radius: z.number().min(0).default(16),
  // --- editing, for video overlays / picture-in-picture ---
  trimStart: z.number().min(0).default(0),
  trimEnd: z.number().min(0).default(0),
  speed: z.number().min(0.1).max(8).default(1),
  muted: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(1),
});

export const transitionSchema = z.object({
  type: z.enum(TRANSITION_TYPES).default("fade"),
  direction: z.enum(TRANSITION_DIRECTIONS).default("from-right"),
  durationInFrames: z.number().int().min(0).max(90).default(15),
});

/** Per-scene voiceover. `text` is the TTS script; `src` is filled by the TTS
 * adapter (kokoro, cached). When fitScene is set, the scene's length follows the
 * generated audio (resolved in calculateMetadata). */
export const voiceoverSchema = z.object({
  text: z.string().default(""),
  src: z.string().default(""),
  voice: z.string().default(""), // "" = brand voice
  volume: z.number().min(0).max(1).default(1),
  fitScene: z.boolean().default(true),
});

/** A one-shot sound effect within a scene. `name` looks up the built-in SFX
 * library; an explicit `src` (path/URL) wins. */
export const sfxSchema = z.object({
  name: z.string().default(""),
  src: z.string().default(""),
  atSeconds: z.number().min(0).default(0),
  volume: z.number().min(0).max(1).default(0.8),
});

/** Background music, mixed under everything with fades + auto-ducking under VO. */
export const musicSchema = z.object({
  src: z.string().default(""),
  mood: z.string().default(""), // used by the picker to choose src from the library
  volume: z.number().min(0).max(1).default(0.7),
  loop: z.boolean().default(true),
  fadeInSeconds: z.number().min(0).default(1),
  fadeOutSeconds: z.number().min(0).default(1.5),
  duckUnderVoice: z.boolean().default(true),
  duckVolume: z.number().min(0).max(1).default(0.28),
  startFromSeconds: z.number().min(0).default(0),
});

/** A single caption token in @remotion/captions' Caption shape (word-level from
 * whisper.cpp, or from an imported .srt). Embedded in props for reproducibility. */
export const captionSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  timestampMs: z.number().nullable().default(null),
  confidence: z.number().nullable().default(null),
});

export const sceneCaptionsSchema = z.object({
  captions: z.array(captionSchema).default([]),
});

export const CAPTION_STYLES = ["highlight", "box", "chunk", "underline"] as const;
export const videoCaptionsSchema = z.object({
  enabled: z.boolean().default(true),
  style: z.enum(CAPTION_STYLES).default("highlight"),
  position: z.enum(["bottom", "center", "top"]).default("bottom"),
  /** How often caption pages switch — higher = more words per page. */
  combineWithinMs: z.number().min(200).max(4000).default(1200),
});

export const sceneContentSchema = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  /** For the "word-highlight" text animation: which word in `title` to highlight. */
  highlightWord: z.string().default(""),
  /** Feature/benefit lines (product, media). */
  bullets: z.array(z.string()).default([]),
  stat: z
    .object({ value: z.string().default(""), label: z.string().default("") })
    .default({}),
  quote: z
    .object({ text: z.string().default(""), author: z.string().default("") })
    .default({}),
  comparison: z
    .object({
      leftTitle: z.string().default("Before"),
      leftItems: z.array(z.string()).default([]),
      rightTitle: z.string().default("After"),
      rightItems: z.array(z.string()).default([]),
    })
    .default({}),
  cta: z
    .object({ label: z.string().default(""), url: z.string().default("") })
    .default({}),
  /** audioviz scene: audio file to visualize (falls back to the video's music). */
  audioSrc: z.string().default(""),
  vizStyle: z.enum(["bars", "mirror", "wave"]).default("mirror"),
});

/** A tiny cute accent (sparkle / doodle) that fades in on a
 * beat and out again. Kept sparse and positioned in empty frame space. */
export const accentSchema = z.object({
  /** Emoji or short glyph rendered as the accent. */
  emoji: z.string().default("✨"),
  /** Position as a percentage of the frame (0–100). */
  xPct: z.number().min(0).max(100).default(50),
  yPct: z.number().min(0).max(100).default(18),
  /** Size as a percentage of frame height. */
  sizePct: z.number().min(0).max(40).default(6),
  /** When it appears, relative to the scene start (seconds). */
  atSeconds: z.number().min(0).default(0),
  /** How long it stays at full opacity before fading out (seconds). */
  holdSeconds: z.number().min(0).default(1),
  /** Fade in/out duration (seconds). */
  fadeSeconds: z.number().min(0).default(0.4),
  /** Static rotation in degrees. */
  rotate: z.number().default(0),
});

/** Atmospheric post-effects layered over the scene for a warm, tactile feel. All
 * default to 0 (off) so existing specs render unchanged. */
export const sceneFxSchema = z.object({
  /** Film-grain strength (0–1). */
  grain: z.number().min(0).max(1).default(0),
  /** Edge vignette strength (0–1). */
  vignette: z.number().min(0).max(1).default(0),
  /** Soft highlight bloom / glow strength (0–1). */
  bloom: z.number().min(0).max(1).default(0),
  /** Warm soft-light wash strength (0–1). */
  warmth: z.number().min(0).max(1).default(0),
});

export const sceneSchema = z.object({
  /** Stable id, used for cache keys + minimal patching across sessions. */
  id: z.string().default(""),
  kind: z.enum(SCENE_KINDS).default("hook"),
  durationInSeconds: z.number().min(0.1).max(600).default(3.5),
  /** Derive this scene's length from its backgroundMedia video (after trim/speed). */
  fitToMedia: z.boolean().default(false),
  /** Any CSS background (solid or gradient). Empty ⇒ derived from the brand palette. */
  background: z.string().default(""),
  /** Accent color (bars, highlights). Empty ⇒ brand accent. Plain string so "" is allowed. */
  accent: z.string().default(""),
  backgroundMedia: mediaLayerSchema.default({}),
  overlays: z.array(overlaySchema).default([]),
  showLogo: z.boolean().default(false),
  logoPosition: z.enum(LOGO_POSITIONS).default("top-right"),
  /** Transition used to ENTER this scene from the previous one (ignored on scene 0). */
  transition: transitionSchema.default({}),
  textAnimation: z.enum(TEXT_ANIMATIONS).default("slide-up"),
  content: sceneContentSchema.default({}),
  voiceover: voiceoverSchema.default({}),
  sfx: z.array(sfxSchema).default([]),
  captions: sceneCaptionsSchema.default({}),
  /** Atmospheric post-effects (grain / vignette / bloom / warmth). */
  fx: sceneFxSchema.default({}),
  /** Accents that fade in on beats. */
  accents: z.array(accentSchema).default([]),
});

export const paletteSchema = z.object({
  primary: zColor(),
  secondary: zColor(),
  background: zColor(),
  surface: zColor(),
  text: zColor(),
  muted: zColor(),
  accent: zColor(),
});

export const fontsSchema = z.object({
  heading: z.string().default("Poppins"),
  body: z.string().default("DMSans"),
});

export const brandSchema = z.object({
  name: z.string().default("Acme Studio"),
  logo: z.string().default(""),
  tagline: z.string().default(""),
  palette: paletteSchema.default({
    primary: "#4f46e5",
    secondary: "#06b6d4",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#38bdf8",
  }),
  fonts: fontsSchema.default({}),
  voice: z.string().default("af_heart"),
});

export const videoSchema = z.object({
  title: z.string().default("Untitled Video"),
  format: z.enum(FORMATS).default("portrait"),
  fps: z.number().int().min(15).max(60).default(30),
  /** Explicit width override (0 = derived from format). */
  width: z.number().int().min(0).default(0),
  /** Explicit height override (0 = derived from format). */
  height: z.number().int().min(0).default(0),
  /** When true, composition dimensions follow the first scene's media. */
  matchMediaSize: z.boolean().default(false),
  brand: brandSchema.default({}),
  music: musicSchema.default({}),
  captions: videoCaptionsSchema.default({}),
  scenes: z.array(sceneSchema).default([
    {
      id: "scene-1",
      kind: "hook",
      durationInSeconds: 3.5,
      content: {
        eyebrow: "Introducing",
        title: "Declarative Video Editing",
        subtitle: "Built with Remotion & React",
      },
    },
  ]),
});

export type Format = (typeof FORMATS)[number];
export type SceneKind = (typeof SCENE_KINDS)[number];
export type TextAnimationKind = (typeof TEXT_ANIMATIONS)[number];
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export type TransitionDirection = (typeof TRANSITION_DIRECTIONS)[number];
export type MediaLayer = z.infer<typeof mediaLayerSchema>;
export type Overlay = z.infer<typeof overlaySchema>;
export type Transition = z.infer<typeof transitionSchema>;
export type SceneTransition = z.infer<typeof transitionSchema>;
export type Voiceover = z.infer<typeof voiceoverSchema>;
export type Sfx = z.infer<typeof sfxSchema>;
export type Music = z.infer<typeof musicSchema>;
export type MusicProps = z.infer<typeof musicSchema>;
export type CaptionToken = z.infer<typeof captionSchema>;
export type SceneCaptions = z.infer<typeof sceneCaptionsSchema>;
export type VideoCaptions = z.infer<typeof videoCaptionsSchema>;
export type SceneContent = z.infer<typeof sceneContentSchema>;
export type Accent = z.infer<typeof accentSchema>;
export type SceneFx = z.infer<typeof sceneFxSchema>;
export type SceneProps = z.infer<typeof sceneSchema>;
export type Palette = z.infer<typeof paletteSchema>;
export type Fonts = z.infer<typeof fontsSchema>;
export type BrandProps = z.infer<typeof brandSchema>;
export type VideoProps = z.infer<typeof videoSchema>;
