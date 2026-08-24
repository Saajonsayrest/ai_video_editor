---
name: new-video
description: Create a new video from a plain-English brief. Write app/props.json to the schema, fetch any needed free assets, and render. Use when the user asks to make/create a video, teaser, ad, or reel from a description.
---

# /new-video

You are the engine — turn the brief into `app/props.json` and render it, for $0.
All commands run in `app/`. Read `app/CLAUDE.md` for the full schema + conventions.

1. **Design the spec.** From the brief pick: `format` (landscape/portrait/square),
   an ordered set of scene `kind`s (hook → … → cta), `transition`s and
   `textAnimation`s, brand `palette`/`fonts`, and the copy. Write `app/props.json`
   as a *partial* spec — omit anything that should default. Leave asset fields empty
   but set intent: `backgroundMedia.query` for stock, `voiceover.text` for narration,
   `music.mood` for music.
2. **Validate:** `npm run validate` — fix any errors; note the duration/size.
3. **Fill assets** (only what the brief needs; each no-ops safely if unconfigured):
   - `npm run fetch-broll` (stock; needs a Pexels/Pixabay key)
   - `npm run tts` (local kokoro voiceover)
   - `npm run captions` (whisper karaoke captions)
   - `npm run music` (pick from the local library by mood)
4. **Preview a frame** before the full render:
   `npx remotion still src/index.ts AiVideo public/output/preview.png --frame=<n> --props=props.json`,
   then look at it. Adjust the spec if the layout/colors are off.
5. **Render:** `npm run render` (→ `public/output/video.mp4`). For social, use
   `/make-ads`. Run `npm run project` to record state.

Keep it tight and on-brand: one message per scene, big readable text, purposeful motion.
