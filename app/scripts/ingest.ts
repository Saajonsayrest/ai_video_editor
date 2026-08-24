import { ingestUrl } from "./lib/ingest";

/**
 * Download a video (YouTube/etc.) via yt-dlp for use as footage/audio source —
 * ingest.ts's own docstring covers the rights reminder. Cached by URL hash.
 *
 *   npm run ingest -- https://www.youtube.com/watch?v=…
 */
async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run ingest -- <video URL>");
    process.exit(1);
  }

  const r = await ingestUrl(url);
  if (!r) process.exit(1);

  console.log(`✓ ${r.cached ? "cached" : "downloaded"}: "${r.title}"`);
  console.log(`  video: public/${r.videoSrc}`);
  if (r.audioSrc) console.log(`  audio: public/${r.audioSrc}`);
  console.log(
    `\nUse as footage:  backgroundMedia.src = "${r.videoSrc}"\n` +
      `Karaoke/dub/captions: npm run karaoke -- ${r.videoSrc}   or   npm run dub -- ${r.videoSrc} --lang ne`,
  );
}

main().catch((err) => {
  console.error("\n✗ ingest failed:", err?.message || err);
  process.exit(1);
});
