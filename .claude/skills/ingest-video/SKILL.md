---
name: ingest-video
description: Download a video from YouTube/etc. via yt-dlp for use as footage, karaoke, dubbing, or subtitle source. Use when the user gives a video URL and wants to use, edit, dub, caption, or karaoke-ify it.
---

# /ingest-video

Free video download via yt-dlp (Unlicense). Commands run in `app/`.

1. **Rights first.** Only ingest content you own or are authorized to reuse (your own
   channel, Creative Commons / public domain, explicit permission).
2. **Download:** `npm run ingest -- <url>` — saves an mp4 + a wav audio copy under
   `public/input/ingest/`, cached by URL hash (a repeat call is instant), records the
   source URL + any reported license in `public/input/generated/manifest.json`.
   Needs `yt-dlp` installed once: `brew install yt-dlp` (or `pipx install yt-dlp`).
3. **Use it as footage** — set a scene's `backgroundMedia.src` to the printed path.
4. **Or feed it to another recipe:**
   - `/add-captions` — subtitles or a karaoke version of the ingested video.
   - `/dub-video` — translate + re-voice it into another language.
