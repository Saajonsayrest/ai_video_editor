# Music library

No free song-generation API exists, so music is a small **local, tagged library**.

1. Download free tracks (see sources below) into this folder.
2. Describe each in [`music-manifest.json`](./music-manifest.json) with `mood`, `genre`,
   `bpm`, `source`, and `license`.
3. In a spec, set `music.mood` (e.g. `"upbeat energetic"`) and run `npm run music` — the
   best-tagged track fills `music.src`. Or set `music.src` directly.

The audio files themselves are git-ignored; only this README and the manifest are tracked.

## Free, commercially-usable sources

| Source | License |
|---|---|
| [Pixabay Music](https://pixabay.com/music/) | Pixabay Content License — free, commercial, no attribution |
| YouTube Audio Library (in YouTube Studio) | Varies per track — check each; many free |
| [Kevin MacLeod / incompetech](https://incompetech.com/music/royalty-free/) | CC-BY 4.0 — free **with credit** |

Do **not** add MusicGen weights (CC-BY-NC) or unofficial Suno/Udio wrappers — their terms
forbid this use. Record every track's real source + license in the manifest.
