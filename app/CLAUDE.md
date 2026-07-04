# CLAUDE.md — how to drive this video studio

This is a **free, Claude-driven video creation + editing studio** built on Remotion.
The golden rule: **Claude Code is the engine.** When the user gives a brief or an edit
in plain English, *you* (the Claude session) write or patch `props.json` — validated
against the zod schema — and run the render scripts. **No paid API is on the default
path; every default capability is local or free-tier, $0 per render.**

Remotion renders **deterministically** from `props.json`. It does not generate anything.
Anything that can't be done for free is an **env-gated adapter** in `scripts/lib/` that
no-ops with a clear log line when its key is absent — `npm run render` with zero keys
always works.

## The two workflows

**New video** — the user describes a video ("a 30s 9:16 teaser for a coffee brand, upbeat"):
1. Write `props.json` by hand to the schema below (start from a partial spec — every field
   has a default). Pick `format`, scene `kind`s, `transition`s, `textAnimation`s, brand
   palette/fonts, and copy. Then `npm run validate` to confirm it parses and see the
   duration/size.
2. Fill assets (only what the brief needs, all optional):
   - `npm run fetch-broll` — download stock for scenes with a `backgroundMedia.query` (needs `PEXELS_API_KEY`/`PIXABAY_API_KEY`; no-ops without).
   - `npm run tts` — local kokoro voiceover for scenes with `voiceover.text`.
   - `npm run captions` — whisper transcription of the VO/footage → karaoke captions.
   - pick music by mood from the local library (see Music below).
3. `npm run render` (→ `public/output/video.mp4`), or `npm run render:formats` for all three
   aspect ratios, or `npm run still -- <frame>` for a thumbnail.

**Edit video** — the user asks for a change ("punchier hook, swap music to something moodier"):
1. **PATCH `props.json` minimally.** Change only the fields the instruction touches. Do NOT
   regenerate untouched scenes, and **reuse cached assets** (they're in
   `public/input/generated/`, keyed by hash — never re-fetch/re-generate what already exists).
2. Re-run only the steps whose inputs changed (e.g. new `voiceover.text` → `npm run tts`),
   then `npm run render`.

Always run `npm run validate` after editing `props.json`, and prefer a low-res sanity check
(`npx remotion still src/index.ts AiVideo out.png --frame=N --props=props.json`) before a full render.

## Commands

| Command | What it does |
|---|---|
| `npm run validate` | Zod-check `props.json` (no render); prints duration/size |
| `npm run render` | Render `props.json` → `public/output/video.mp4` (default demo with no props) |
| `npm run render:formats` | Same spec → landscape/portrait/square + thumbnails |
| `npm run batch -- variants.json` | A/B: render N patched variants + thumbnails |
| `npm run still -- <frame> [out.png]` | Single-frame PNG (thumbnail/OG image) |
| `npm run tts [-- --engine say]` | Fill `voiceover.text` → cached VO audio (kokoro; `say` fallback) |
| `npm run captions [-- --srt f.srt]` | Whisper transcribe VO/footage → karaoke captions, or import SRT |
| `npm run fetch-broll [-- --query "…" --type video]` | Stock photos/video from Pexels/Pixabay → cache |
| `npm run music` | Fill `music.src` from `music.mood` using the local library |
| `npm run silence -- input/clip.mp4` | Detect silence → suggested trims / splice ranges |
| `npm run ffmpeg -- <args>` | Bundled ffmpeg passthrough (cut/concat/convert, no re-render) |
| `npm run cutout -- input/x.jpg` | Background removal (opt-in AGPL — see below) |
| `npm run project` | Write `project.json` state summary (scene/asset status) |
| `npm run dev` / `npm run preview` | Remotion Studio (demo / `props.json`) |
| `npm run generate -- "brief"` | **OPTIONAL, PAID** — Anthropic API writes props.json (default path is you) |
| `npm run lint` | eslint + tsc |

## Schema (`src/schema.ts` — the single source of truth)

Everything is defaulted, so a partial `props.json` always renders. Top level:

- `title`, `format` (`landscape`/`portrait`/`square`), `fps`, `width`/`height` (0 ⇒ from format),
  `matchMediaSize` (size from first clip), `brand`, `music`, `captions`, `scenes[]`.

**brand** — `name`, `logo` (path under `public/`), `palette` {primary, secondary, background,
surface, text, muted, accent}, `fonts` {heading, body — names from `src/fonts.ts`}, `voice`
(kokoro voice id). Loaded from `brand.json` as defaultProps.

**scene** — `kind`, `durationInSeconds`, `fitToMedia` (length from clip), `transition`
{type: none/fade/slide/wipe/flip/clockWipe, direction, durationInFrames}, `textAnimation`
(none/fade/slide-up/spring-in/typewriter/word-highlight), `background` (CSS; "" ⇒ brand
gradient), `accent`, `backgroundMedia`, `overlays[]`, `showLogo`/`logoPosition`, `content`,
`voiceover`, `sfx[]`, `captions`.

**scene kinds** — `hook` (headline+sub), `media` (full-bleed clip + lower-third), `product`
(headline + animated bullets), `quote` (pull-quote + author), `stat` (giant number + label),
`comparison` (before/after cards), `audioviz` (spectrum synced to `content.audioSrc`), `cta`
(headline + button). `content` is a superset: `eyebrow/title/subtitle/highlightWord/bullets[]`,
`stat{value,label}`, `quote{text,author}`, `comparison{leftTitle,leftItems[],rightTitle,rightItems[]}`,
`cta{label,url}`, `audioSrc/vizStyle`.

**backgroundMedia / overlays** — `type` (none/image/video), `src`, `query` (stock search),
`prompt` (paid gen), `fit`, `objectPosition`, `kenBurns` (none/zoom-in/zoom-out/pan-left/pan-right,
images only), `opacity`, `scrim`, and for video: `trimStart`/`trimEnd` (seconds), `speed`,
`muted`, `volume`.

**voiceover** — `text` (TTS input), `src` (cached audio), `voice`, `volume`, `fitScene`
(scene length follows the narration). **sfx** — `name` (built-in library) or `src`, `atSeconds`,
`volume`. **music** — `src`, `mood` (picker tag), `volume`, `loop`, `fadeInSeconds`/`fadeOutSeconds`,
`duckUnderVoice`/`duckVolume` (auto-ducks under VO). **captions** — `enabled`, `style`
(highlight/box/chunk/underline), `position`, `combineWithinMs`; per-scene `captions.captions[]`
holds the word-level data.

## Assets, cache & determinism

- Every fetched/generated asset lands in `public/input/generated/<hash>.<ext>` and is recorded
  in `public/input/generated/manifest.json` (source, query, license, url, date). **Never re-fetch
  an asset that already exists** — the scripts check the cache first.
- **No unseeded randomness.** Stock picks the first result; everything is a file on disk
  referenced by path. Same `props.json` → identical render.
- **License hygiene.** Pexels/Pixabay = free commercial, no attribution. Local library music:
  record each track's source + license in `music-manifest.json`. Never add MusicGen weights
  (CC-BY-NC) or unofficial Suno/Udio wrappers.

## Music (local library)

No free song-generation API exists — use a tagged local library:
- Drop tracks in `public/input/music/` and describe each in
  `public/input/music/music-manifest.json` (`file`, `mood`, `genre`, `bpm`, `source`, `license`).
  Free sources: Pixabay Music, YouTube Audio Library, Kevin MacLeod / incompetech (CC-BY, credit).
- When a spec sets `music.mood` and no `music.src`, pick a track: `scripts/lib/music.ts`
  `pickMusicByMood(mood)` returns the best tagged match (deterministic).

## Conventions & rules (do not break)

- **Video: `<OffthreadVideo>` from `remotion`. Audio: `<Audio>` from `remotion`.** NEVER use
  `@remotion/media`, `@remotion/webcodecs`, or `@remotion/media-parser`. Probe media durations/
  dimensions with **mediabunny** (`src/media.ts` for browser/render via UrlSource; `scripts/lib/media.ts`
  for Node via FilePathSource — never let FilePathSource reach the bundle).
- Animate off `useCurrentFrame()`; use individual transform props (`scale`, `translate`), never
  a `transform` string, never CSS transitions/Tailwind animations.
- Adapter/provider logic lives in `scripts/lib/` only — components stay pure and deterministic.
- Duration/size math lives in `src/timeline.ts` + `src/format.ts` and is shared by
  `Root.calculateMetadata` and `AiVideo` so they can't drift. `calculateMetadata` re-parses props
  through the schema, so partial specs render from any entry point (`--props`, Studio, render.ts).
- Strict TypeScript, no `any`. Keep `@remotion/*` pinned to the exact Remotion version.

## Adapters (`scripts/lib/`)

`cache.ts` (hash cache + manifest) · `stock.ts` (Pexels/Pixabay) · `tts.ts` (kokoro + say) ·
`captions.ts` (whisper.cpp + SRT) · `media.ts` (Node mediabunny probe) · `silence.ts` (ffmpeg) ·
`ffmpeg.ts` (bundled ffmpeg) · `music.ts` (mood picker) · `bgremove.ts` (AGPL opt-in) ·
`renderer.ts` (shared bundle/render) · `genvideo.ts` (**paid** image/video generation upgrade point).

## Paid upgrade points (all off by default, env-gated)

- **AI images/video**: `scripts/lib/genvideo.ts` — set `FAL_KEY` (FLUX.2 images, Veo/Kling video)
  or a Replicate token. Fills scene `backgroundMedia.prompt` scenes.
- **Premium/commercial voiceover**: ElevenLabs — add an adapter alongside `tts.ts`, gated on
  `ELEVENLABS_API_KEY` (their free tier is non-commercial + attribution — leave off by default).
- **Anthropic brief→spec**: `scripts/generate.ts` (`ANTHROPIC_API_KEY`). Optional; the primary
  path is you writing `props.json` in-session for $0.

## Background removal (opt-in, AGPL-3.0)

`@imgly/background-removal` is **AGPL-3.0** and is deliberately **not a dependency**. Using it
locally to cut out your own images is fine, but bundling it imposes AGPL on anyone who
distributes this repo. Enable knowingly with `npm i @imgly/background-removal`, then
`npm run cutout -- input/x.jpg`.
