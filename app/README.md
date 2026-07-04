# Remotion × Claude — a free AI video studio

A **Claude-driven video creation + editing studio** built on [Remotion](https://remotion.dev).
Describe a video in plain English; Claude writes a validated spec (`props.json`) and renders
an MP4 — **transitions, karaoke captions, voiceover, stock b-roll, music, all three aspect
ratios** — using only local + free-tier tools. **$0 per render, no keys required.**

> **Claude Code is the engine.** In a Claude Code session, Claude writes/patches `props.json`
> directly (validated against the zod schema) and runs the scripts. The Anthropic API path
> (`npm run generate`) is optional. Full operating guide for Claude: [`CLAUDE.md`](./CLAUDE.md).

## Quick start

```bash
./setup.sh          # installs deps, makes folders + .env
npm run render      # renders the built-in demo → public/output/video.mp4  (zero keys)
npm run dev         # or open Remotion Studio to edit props visually
```

Then just talk to Claude: *"make a 30s 9:16 teaser for a coffee brand, upbeat"* → it writes
`props.json`, fetches assets, and renders. *"punchier hook, moodier music"* → it patches the
spec minimally and re-renders, reusing cached assets.

## What's free (and what a key unlocks)

| Capability | Free / local | Optional key |
|---|---|---|
| Scenes, transitions, text animation, brand kit | ✅ built-in | — |
| Edit your footage: trim, speed, PiP, silence-cut, crop | ✅ `<OffthreadVideo>` + mediabunny + ffmpeg | — |
| Voiceover | ✅ kokoro (local ONNX), `say` fallback | ElevenLabs (paid, commercial) |
| Karaoke captions | ✅ whisper.cpp (local, word-level) | — |
| Music | ✅ local tagged library (`public/input/music/`) | — |
| Stock b-roll (photos + video) | ✅ Pexels / Pixabay | free API key |
| 16:9 / 9:16 / 1:1 + A/B batch | ✅ same spec, format-aware | — |
| Background removal | ⚠ opt-in AGPL-3.0 (`@imgly/background-removal`) | — |
| AI image/video generation | — | fal.ai (FLUX.2/Veo/Kling) or Replicate |

## Scripts

| Command | What it does |
|---|---|
| `npm run render` / `render:formats` | Render `props.json` → MP4 (one / all three formats) |
| `npm run batch -- variants.json` | A/B render N patched variants + thumbnails |
| `npm run still -- <frame> [out]` | Single-frame PNG (thumbnail / OG image) |
| `npm run validate` | Zod-check `props.json` without rendering |
| `npm run tts` / `captions` / `fetch-broll` / `music` | Fill voiceover / captions / stock / music |
| `npm run silence -- <file>` / `ffmpeg -- <args>` | Silence detection / bundled ffmpeg |
| `npm run cutout -- <img>` | Background removal (opt-in AGPL) |
| `npm run project` | Write `project.json` state snapshot |
| `npm run generate -- "brief"` | **Optional paid** Anthropic brief→spec |
| `npm run dev` / `preview` / `lint` | Studio / Studio+props / eslint+tsc |

## Layout

```
brand.json           # brand kit (palette, fonts, logo, voice) → defaultProps
src/
  schema.ts          # zod schema — the single source of truth (v2)
  Root.tsx           # composition + calculateMetadata (size/duration from props & media)
  AiVideo.tsx        # TransitionSeries + the audio graph (music/VO/SFX + ducking)
  scenes/            # one component per scene kind
  components/        # SceneFrame, TextAnimation, Layers, Captions, FitText
  timeline.ts format.ts typography.ts theme.tsx fonts.ts media.ts audio.ts
scripts/
  render* still batch validate tts captions fetch-broll music silence ffmpeg cutout project
  lib/               # adapters: cache, stock, tts, captions, media, silence, music, bgremove,
                     #           renderer, ffmpeg, genvideo (paid upgrade point)
public/input/        # your footage/images/logos; music/; generated/ (asset cache + manifest)
public/output/       # renders
```

## Config

All optional — see [`.env.example`](./.env.example). No key is needed for the default path.
Free `PEXELS_API_KEY` / `PIXABAY_API_KEY` enable stock b-roll. Paid keys (`ANTHROPIC_API_KEY`,
`FAL_KEY`, `ELEVENLABS_API_KEY`) are documented but off by default.

Remotion is free for teams of ≤3 — see the [Remotion license](https://remotion.dev/license).
Agent skills (`remotion-best-practices` at the repo root; `/new-video`, `/edit-video`,
`/add-captions`, `/make-ads`, `/fetch-broll` in `.claude/skills/`) guide Claude when driving this project.
