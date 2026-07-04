# public/

Two folders, one job each:

```
public/
  input/    ← PUT YOUR FILES HERE   (videos, music, logos, images — all together)
  output/   ← YOUR FINISHED VIDEO   (public/output/video.mp4 after `npm run render`)
```

## Using your files

Drop everything into `public/input/` and reference each by name **including the
`input/` prefix** (the path relative to `public/`):

| File on disk | Reference as |
|---|---|
| `public/input/intro.mp4` | `input/intro.mp4` |
| `public/input/track.mp3` | `input/track.mp3` |
| `public/input/brand.png` | `input/brand.png` |

Only rule: **unique filenames** (don't have two `clip.mp4`).

Then tell me the edit in plain English — e.g. *"trim input/intro.mp4 to 20s, add
captions, put input/brand.png top-left, music input/track.mp3 underneath"* — and
I'll wire it in.

## Formats that work
- **Video:** `.mp4` (H.264) is safest; `.mov`, `.webm` also fine
- **Audio:** `.mp3`, `.wav`, `.m4a`, `.aac`
- **Images/logos:** `.png` (transparent logos), `.jpg`, `.webp`

Heavy media in both folders is git-ignored (folders are kept).
