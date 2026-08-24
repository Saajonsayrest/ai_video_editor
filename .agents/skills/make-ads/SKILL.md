---
name: make-ads
description: Render the current spec as ready-to-post ads — all three aspect ratios and/or A/B variants, each with a thumbnail. Use when the user asks for ads, social cuts, all formats, multiple versions, or A/B variants.
---

# /make-ads

One spec → every placement. Commands run in `app/`; layout is already format-aware.

- **All three formats:** `npm run render:formats` → `public/output/video-{landscape,portrait,square}.mp4`
  plus a `.png` thumbnail each (16:9, 9:16, 1:1).
- **A/B variants:** write `app/variants.json`, then `npm run batch -- variants.json`:
  ```json
  {
    "base": "props.json",
    "variants": [
      { "name": "hook-a", "patch": { "scenes": [ /* full replacement scenes */ ] } },
      { "name": "accent-b", "patch": { "brand": { "palette": { "accent": "#ff5c8a" } } } }
    ]
  }
  ```
  Each `patch` is deep-merged over the base (objects merge; arrays replace). Outputs
  land in `public/output/batch/<name>.mp4` (+ thumbnail).
- **Thumbnail / OG image only:** `npm run still -- <frame> public/output/thumb.png`.

Keep hooks short and the CTA unmistakable.
