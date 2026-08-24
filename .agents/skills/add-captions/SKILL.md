---
name: add-captions
description: Add or restyle TikTok-style karaoke captions on the current video, export standalone .srt/.vtt subtitle files, or turn any video/song into a karaoke sing-along (optionally vocals-removed). Transcribes locally with whisper, or imports an .srt. Use when the user asks for captions, subtitles, karaoke text, word-by-word highlighting, or a karaoke version of a video.
---

# /add-captions

Free, local, word-level captions. Commands run in `app/`.

1. **Ensure timed audio exists.** Captions come from a scene's `voiceover.src` (run
   `npm run tts` first if only `voiceover.text` is set) or a video clip's audio.
2. **Generate:**
   - Whisper transcription: `npm run captions` — transcribes each scene's VO/footage
     into word-level `scene.captions.captions` and sets `captions.enabled`.
     (First run builds whisper.cpp + downloads the model; `WHISPER_MODEL=large-v3-turbo`
     for best quality, default `base.en` for speed.)
   - Import existing subtitles: `npm run captions -- --srt input/subs.srt [--scene N]`.
3. **Style.** Set `captions.style` to `highlight`, `box`, `chunk` (UPPERCASE), or
   `underline`; `captions.position` to bottom/center/top; `combineWithinMs` controls
   words-per-page. These are on the video-level `captions` object.
4. **Render:** `npm run render`. Check a mid-VO frame to confirm timing/legibility.

## Standalone subtitle export (no props.json needed)

`npm run captions -- --file <video/audio> --export <out.srt|out.vtt>` — transcribes a
file directly (e.g. something from `/ingest-video`) and writes a standard subtitle
file. Add `--lang multi` for non-English audio.

## Karaoke version of a video/song

`npm run karaoke -- <video/audio file>` — transcribes it and writes a ready-to-render
`karaoke-props.json` (fullscreen footage + word-highlight captions, sized to match the
source). Never touches your working `props.json`.

- `--instrumental` — separates vocals from music (demucs) and mutes onto the
  instrumental so it plays as a true sing-along track.
- `--lang multi` — non-English lyrics.
- Render with `cp karaoke-props.json props.json && npm run render`, or point
  `npx remotion render` at `--props=karaoke-props.json` directly.
