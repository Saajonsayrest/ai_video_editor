/**
 * Curated names → Remotion's free hosted SFX library (https://remotion.media).
 * Referenced by `sfx.name` in the schema and played through core <Audio>. The
 * P5 asset cache can pre-download these for fully offline, reproducible renders.
 */
export const SFX_LIBRARY: Record<string, string> = {
  whoosh: "https://remotion.media/whoosh.wav",
  whip: "https://remotion.media/whip.wav",
  "page-turn": "https://remotion.media/page-turn.wav",
  switch: "https://remotion.media/switch.wav",
  click: "https://remotion.media/mouse-click.wav",
  ding: "https://remotion.media/ding.wav",
  shutter: "https://remotion.media/shutter-modern.wav",
  boom: "https://remotion.media/vine-boom.wav",
  "record-scratch": "https://remotion.media/record-scratch.wav",
};

export const SFX_NAMES = Object.keys(SFX_LIBRARY);

/** Resolve an SFX name to its hosted URL, or null if unknown. */
export function sfxUrl(name: string): string | null {
  return SFX_LIBRARY[name] ?? null;
}
