---
name: fetch-broll
description: Fetch free stock photos/video (Pexels/Pixabay) for scenes that specify a media query, cached with license recorded. Use when the user asks for b-roll, stock footage, background images/video, or to fill scenes with visuals.
---

# /fetch-broll

Free stock b-roll, cached and license-tracked. Commands run in `app/`.

1. **Set queries.** In `app/props.json`, give scenes a `backgroundMedia` with
   `type` (`image`/`video`), a `query` (e.g. `"city night aerial"`), and empty `src`.
   Orientation follows the spec's `format`.
2. **Fetch:** `npm run fetch-broll` — fills each `src` from Pexels/Pixabay and records
   source/license in `public/input/generated/manifest.json`. Needs `PEXELS_API_KEY`
   and/or `PIXABAY_API_KEY` (free); with no key it no-ops and scenes stay text-only.
   - One-off: `npm run fetch-broll -- --query "coffee pour" --type video`
   - Cache any URL: `npm run fetch-broll -- --url https://…/photo.jpg --type image`
3. **Reuse.** An already-cached query is never re-fetched. For stills, add
   `backgroundMedia.kenBurns` (`zoom-in`/`pan-left`/…) for motion.
4. **Render:** `npm run render`.

Pexels/Pixabay are free for commercial use with no attribution required — but the
recorded license in the manifest is the source of truth; keep it accurate.
