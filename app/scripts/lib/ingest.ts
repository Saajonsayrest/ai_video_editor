import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  findAsset,
  PUBLIC_DIR,
  hashKey,
  publicRef,
  recordAsset,
} from "./cache";
import { runFfmpeg } from "./ffmpeg";

/**
 * Free video ingest from YouTube/etc. via yt-dlp (Unlicense — public domain).
 * ffmpeg alone cannot download from YouTube; yt-dlp resolves the stream and we
 * remux/extract with the bundled ffmpeg. Install once, system-wide:
 *
 *   brew install yt-dlp     # or: pipx install yt-dlp
 *
 * Only ingest content you own or are authorized to reuse (your own channel,
 * Creative Commons / public domain, or explicit permission) — this is a
 * capability, not a rights clearance.
 */
const INGEST_DIR = path.join(PUBLIC_DIR, "input", "ingest");

function ytDlpAvailable(): boolean {
  return spawnSync("yt-dlp", ["--version"], { encoding: "utf8" }).status === 0;
}

export type IngestResult = {
  videoSrc: string; // public-relative mp4
  audioSrc: string; // public-relative wav ("" if extraction failed)
  title: string;
  url: string;
  cached: boolean;
};

interface YtDlpInfo {
  title?: string;
  license?: string;
  uploader?: string;
}

/** Download (or reuse the cached copy of) a video URL. Returns null — with a
 * clear log line — if yt-dlp is missing or the URL can't be resolved. */
export async function ingestUrl(url: string): Promise<IngestResult | null> {
  if (!ytDlpAvailable()) {
    console.warn(
      "  [ingest] yt-dlp is not installed (free, Unlicense). Install it once with:\n" +
        "    brew install yt-dlp        # or: pipx install yt-dlp\n",
    );
    return null;
  }

  const key = hashKey("ingest", url);
  fs.mkdirSync(INGEST_DIR, { recursive: true });
  const videoAbs = path.join(INGEST_DIR, `${key}.mp4`);
  const audioAbs = path.join(INGEST_DIR, `${key}.wav`);
  const cached = findAsset(key);
  if (cached && fs.existsSync(videoAbs)) {
    return {
      videoSrc: publicRef(videoAbs),
      audioSrc: fs.existsSync(audioAbs) ? publicRef(audioAbs) : "",
      title: cached.query,
      url,
      cached: true,
    };
  }

  console.warn(
    "  [ingest] Rights reminder: only ingest content you own or are authorized to reuse\n" +
      "  (your own channel, Creative Commons / public domain, or explicit permission).",
  );

  const info = spawnSync("yt-dlp", ["-J", "--no-playlist", url], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  if (info.status !== 0) {
    console.warn(
      `  [ingest] yt-dlp could not resolve "${url}":\n` +
        info.stderr.split("\n").slice(0, 6).join("\n"),
    );
    return null;
  }

  let title = url;
  let licenseNote = "no license metadata — verify you have rights before commercial use";
  try {
    const meta = JSON.parse(info.stdout) as YtDlpInfo;
    title = meta.title ?? title;
    licenseNote = meta.license
      ? `source-reported license: ${meta.license} (uploader: ${meta.uploader ?? "unknown"}) — verify before commercial use`
      : `no license metadata (uploader: ${meta.uploader ?? "unknown"}) — verify you have rights before commercial use`;
  } catch {
    // Keep the defaults above; a bad JSON parse shouldn't block the download.
  }

  const dl = spawnSync(
    "yt-dlp",
    [
      "--no-playlist",
      "-f",
      "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "-o",
      videoAbs,
      url,
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 },
  );
  if (dl.status !== 0 || !fs.existsSync(videoAbs)) {
    console.warn(
      `  [ingest] download failed:\n` + dl.stderr.split("\n").slice(-10).join("\n"),
    );
    return null;
  }

  const conv = runFfmpeg(["-y", "-i", videoAbs, "-vn", "-ar", "44100", "-ac", "2", audioAbs]);
  const gotAudio = conv.status === 0 && fs.existsSync(audioAbs);
  if (!gotAudio) console.warn("  [ingest] audio extraction failed — video-only.");

  recordAsset({
    hash: key,
    file: publicRef(videoAbs),
    source: "yt-dlp",
    query: title,
    license: licenseNote,
    url,
    date: new Date().toISOString(),
  });

  return {
    videoSrc: publicRef(videoAbs),
    audioSrc: gotAudio ? publicRef(audioAbs) : "",
    title,
    url,
    cached: false,
  };
}
