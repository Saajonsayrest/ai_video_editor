# 🎬 Declarative AI Video Studio (Remotion × AI)

A **free, local, developer-first video creation and editing studio** built on [Remotion](https://remotion.dev). Simply describe a video or request adjustments in plain English, and your AI coding assistant (such as **Antigravity**, **Gemini**, **Codex**, or **Claude**) will compile a validated JSON specification and render a polished MP4 video. Complete with kinetic text animations, automatic local voiceovers, stock B-roll, background music, audio mastering, stem separation, AI dubbing, inpainting, and multiple aspect ratios—**100% locally, with $0 cost per render and no API keys required.**

---

## 📌 Executive Overview

| Metric | Rating / Detail |
|---|---|
| ⏰ **Setup Time** | ~2 Minutes |
| 🟢 **Installation Difficulty** | Easy (Automated idempotent setup script) |
| 🟡 **Usage Difficulty** | Easy (AI-guided prompts) to Intermediate (Custom React/JSX edits) |
| 💵 **Cost per Render** | **$0.00** (Runs entirely on local CPU/GPU) |
| 🛡️ **Privacy & Security** | 100% Local & Isolated (User media, inputs, and outputs are strictly git-ignored) |

---

## 🔍 Features & Capabilities

### 1. Declarative Video Editing & Kinetic Typography
- **Deterministic Renders**: Every render is driven by a single validated JSON specification (`props.json`).
- **Scene Kinds**: `hook`, `media`, `product`, `quote`, `stat`, `comparison`, `audioviz`, `cta`.
- **Text Animations**: `slide-up`, `spring-in`, `typewriter`, `word-highlight`, `stagger-reveal`, `fisheye`, `fade`.
- **Media Controls**: Ken Burns motion for stills and video, `cropOffsetY`, `blurFill`, filters, and scrims.

### 2. Audio Processing & Mastering Toolkit
- **Loudness Normalization**: Single-pass `-16 LUFS` social audio mastering (`npm run audio -- loudnorm`).
- **Dynamic Fades & Transitions**: Smooth frame-interpolated audio fades.
- **Voice-Ducking**: Auto-duck background music beneath voiceovers.
- **Speed & Fitting**: Tempo shifts (`atempo`) and duration padding/clamping without pitch distortion.

### 3. Vocal & Instrumental Stem Separation
- **Demucs Separation**: Extract isolated vocals and instrumental backing tracks locally via on-demand Python virtualenvs.
- **Karaoke Mode**: Transform any song or video into a sing-along track with synchronized word-highlight captions (`npm run karaoke`).

### 4. Multilingual AI Dubbing Pipeline
- **Extract & Translate**: Transcribe footage into natural sentence segments, fill translations in-session, and re-voice with local neural TTS (Kokoro for English, Piper for Nepali/Hindi).
- **Time-Fitting & Muxing**: Automatically fits synthesized speech into original timing slots and mixes over the instrumental track.

### 5. Media Ingestion & AI Inpainting
- **yt-dlp Video Ingestion**: Download footage and extract clean audio tracks with license provenance tracking (`npm run ingest`).
- **Object & Watermark Removal**: Local AI inpainting powered by IOPaint and LaMa checkpoint (`npm run edit-image`).

---

## 🛡️ Strict Privacy & Git Protection

This repository is designed for clean public GitHub showcases and CV/portfolio profiles while handling sensitive temporary custom video editing locally:
* **All input and output media** (`input/`, `output/`, `app/public/input/`, `app/public/output/`) are strictly git-ignored.
* **All video/audio formats** (`*.mp4`, `*.mov`, `*.wav`, `*.mp3`, etc.), working session files (`props.json`, `dub-script.json`, `karaoke-props.json`, `project.json`), and `.pyenv/` virtual environments are excluded from git.
* Only clean code, components, templates, and documentation are tracked.

---

## 🛠️ Step-by-Step Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v20 or v22 LTS recommended) installed.

### 1. Run Setup Script
Navigate to the `app` directory and run the setup script:
```bash
cd app
./setup.sh
```

### 2. Render the Demo Video
Run the local compilation command to test your installation:
```bash
npm run render
```
Your finished video file will be saved directly to: `public/output/video.mp4`

### 3. Launch the Visual Preview Studio
Launch the interactive web browser preview to see your composition's timeline, assets, and frames in real-time:
```bash
npm run dev
```

---

## ⚡ Command Reference

| Command | What it does |
|---|---|
| `npm run validate` | Zod-check `props.json` (no render); prints duration/size |
| `npm run render` | Render `props.json` → `public/output/video.mp4` |
| `npm run render:formats` | Render same spec to landscape (16:9), portrait (9:16), square (1:1) + thumbnails |
| `npm run batch -- variants.json` | A/B: render N patched variants + thumbnails |
| `npm run still -- <frame> [out.png]` | Single-frame PNG (thumbnail/OG image) |
| `npm run tts [-- --engine say]` | Fill `voiceover.text` → cached VO audio (local Kokoro TTS) |
| `npm run captions` | Whisper transcription of VO/footage → karaoke captions or export `.srt`/`.vtt` |
| `npm run fetch-broll` | Stock photos/video from Pexels/Pixabay → local cache |
| `npm run ingest -- <url>` | Download video (yt-dlp) → mp4 + wav under `public/input/ingest/` |
| `npm run music` | Fill `music.src` from `music.mood` using the local music library |
| `npm run audio -- <op> …` | Mix, loudnorm, fade, atempo, trim, duck, concat, stems |
| `npm run karaoke -- <file> [--instrumental]` | Any video/song → ready-to-render karaoke spec |
| `npm run dub -- extract\|synthesize` | Dub a video into en/ne/hi (or subtitle generation) |
| `npm run silence -- input/clip.mp4` | Detect silence → suggested trims / splice ranges |
| `npm run ffmpeg -- <args>` | Bundled ffmpeg passthrough (cut/concat/convert) |
| `npm run edit-image -- input/x.jpg input/mask.png` | Inpainting object/watermark removal via IOPaint |
| `npm run dev` / `npm run preview` | Remotion Studio (demo / `props.json`) |
| `npm run lint` | ESLint + TypeScript typecheck |

---

## 🤖 AI-Agent Integration

Pre-configured skills exist in `.agents/skills/` and `.claude/skills/`:
* 🎯 `/new-video`: Declarative prompt-to-video generation.
* ✍️ `/edit-video`: Surgical timeline patching & asset reuse.
* 🎙️ `/add-captions`: TikTok-style karaoke captions & subtitle exports.
* 🌐 `/dub-video`: Multilingual video dubbing & translation.
* 🖼️ `/edit-image`: AI inpainting & watermark removal.
* 📥 `/ingest-video`: Free video download via yt-dlp.
* 🎬 `/make-ads`: Multi-format ad variants & batch rendering.
* 🎞️ `/fetch-broll`: Royalty-free stock media fetching.

---

## 📁 Repository Layout

```
├── .agents/                    # Multi-agent skill bindings (Antigravity/Gemini/Codex)
├── .claude/                    # Claude Code skill bindings
├── docs/                       # Architectural documentation
├── input/                      # Root input directory (.gitkeep)
├── output/                     # Root output directory (.gitkeep)
├── app/                        # Main video application folder
│   ├── brand.json              # Brand palette, active typography, and logo configuration
│   ├── props.json              # Current video specification layout
│   ├── setup.sh                # Main installation script
│   ├── package.json            # Node.js dependencies & execution scripts
│   ├── public/                 # Root asset folders
│   │   ├── input/              # Source clips, music, ingest, stems (git-ignored)
│   │   └── output/             # Rendered videos and thumbnails (git-ignored)
│   ├── scripts/                # Video studio scripts & adapter tools
│   │   └── lib/                # Modular adapters (audio, stems, dub, captions, tts, ingest, pyenv)
│   └── src/                    # React components, schemas, and Remotion rendering pipeline
├── DECISIONS.md                # Decision log
└── README.md                   # Main architecture and setup guide
```

---

## ⚖️ License

This repository is **private and unlicensed** by default (`"license": "UNLICENSED"`, `"private": true` inside `app/package.json`).
