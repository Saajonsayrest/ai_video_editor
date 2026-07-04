import fs from "fs";
import path from "path";

/**
 * Local, tagged music library. No free song-generation API exists, so music is a
 * folder of tracks described in music-manifest.json. Claude picks by mood when a
 * spec sets music.mood. Deterministic: best tag overlap, else the first track.
 */
export type MusicTrack = {
  file: string; // filename under public/input/music/
  mood: string;
  genre: string;
  bpm: number;
  source: string;
  license: string;
};

const MANIFEST = path.join(process.cwd(), "public", "input", "music", "music-manifest.json");

export function readMusicLibrary(): MusicTrack[] {
  try {
    const data = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as { tracks?: MusicTrack[] };
    return Array.isArray(data.tracks) ? data.tracks : [];
  } catch {
    return [];
  }
}

/** Public-relative src of the track best matching `mood`, or null if empty. */
export function pickMusicByMood(mood: string): string | null {
  const tracks = readMusicLibrary();
  if (tracks.length === 0) return null;
  const words = mood.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const scored = tracks.map((t) => {
    const hay = `${t.mood} ${t.genre}`.toLowerCase();
    const score = words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
    return { t, score };
  });
  // Stable sort keeps manifest order among ties.
  scored.sort((a, b) => b.score - a.score);
  const track = scored[0].score > 0 ? scored[0].t : tracks[0];
  return `input/music/${track.file}`;
}
