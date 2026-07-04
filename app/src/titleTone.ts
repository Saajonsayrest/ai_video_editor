/**
 * Single source of truth for the title-card look, so the hook, item screens, and
 * end card never drift. Flip TITLE_TONE to switch the whole video between:
 *   "green" — deep forest-green glass card, cream + gold text
 *   "cream" — soft warm glass card, deep-green + rust text
 */
export type Tone = "green" | "cream";

export const TITLE_TONE: Tone = "green";

export const toneColors = (tone: Tone) =>
  tone === "cream"
    ? { eyebrow: "#B5593B", title: "#2D5A27", subtitle: "#4A5E42" }
    : { eyebrow: "#E7C77A", title: "#FBF6EC", subtitle: "#EDE3D0" };
