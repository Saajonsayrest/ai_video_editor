---
name: edit-video
description: Apply an edit instruction to the current video by patching app/props.json minimally and re-rendering, reusing cached assets. Use when the user asks to change/tweak/fix an existing video (e.g. "punchier hook", "swap the music", "make it 9:16", "slower outro").
---

# /edit-video

Patch, don't rebuild. All commands run in `app/`; schema is in `app/CLAUDE.md`.

1. **Locate the change.** Read `app/props.json` and identify only the field(s) the
   instruction touches (a scene's `content`, a `transition`, `brand.palette`,
   `format`, a `voiceover.text`, `music`, etc.).
2. **Patch minimally.** Edit only those fields. Do NOT regenerate untouched scenes.
   **Reuse cached assets** — files in `public/input/generated/` are keyed by hash and
   listed in `manifest.json`; leave a `src` alone unless its input changed.
3. **Re-run only affected steps.** e.g. changed `voiceover.text` → `npm run tts` then
   `npm run captions`; changed `backgroundMedia.query` → `npm run fetch-broll`;
   changed `music.mood` → `npm run music`. Unchanged inputs stay cached (no refetch).
4. **Validate + render:** `npm run validate`, then `npm run render` (or `/make-ads`).
   Update state with `npm run project`.

If the user asks for the same video in another aspect ratio, just change `format`
(or use `npm run render:formats`) — the layout is format-aware.
