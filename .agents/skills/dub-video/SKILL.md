---
name: dub-video
description: Dub a video into English, Nepali, or Hindi (or produce subtitles) using local transcription + TTS, with the driving agent doing the translation for free. Use when the user asks to dub, translate, or re-voice a video.
---

# /dub-video

Free local dubbing — transcribe → translate (done by you, the agent, for free — no
paid translation API) → synthesize → mix over the original music → mux. Commands run
in `app/`.

1. **Extract:** `npm run dub -- extract <file> --lang <en|ne|hi|newari>` — whisper
   transcribes the source (auto-detects its language) into natural sentence segments
   and writes `dub-script.json` with an empty `"translation"` per segment.
2. **Translate.** Open `dub-script.json` and fill in every `"translation"` field
   yourself, in the target language. This is the one step with no free API — it's why
   you (the agent) do it directly. Write natural sentences, not word-for-word — and
   flag anything you're unsure of for the user to double-check.
3. **Synthesize:** `npm run dub -- synthesize dub-script.json`.
   - en/ne/hi: each segment is voiced (kokoro for en, Piper for ne/hi), time-fit to
     its slot (sped up/slowed 0.8–1.25x, then exact trim/pad — never chipmunked; an
     overflowing segment is logged and left long rather than distorted), mixed over
     the demucs-separated instrumental (drops the original voice, keeps music/SFX),
     and muxed onto the source video.
   - newari: writes an `.srt` next to the source with your translations; the original audio stays untouched.
4. **Review before shipping.** Dubbed speech uses stock TTS voices. Listen to the result, especially any segment flagged as overflowing.
