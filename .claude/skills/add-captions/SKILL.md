---
name: add-captions
description: Add or restyle TikTok-style karaoke captions on the current video — transcribe voiceover/footage locally with whisper, or import an .srt. Use when the user asks for captions, subtitles, karaoke text, or word-by-word highlighting.
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
