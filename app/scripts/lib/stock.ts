import fs from "fs";
import path from "path";
import {
  findAsset,
  generatedFile,
  hashKey,
  PUBLIC_DIR,
  publicRef,
  recordAsset,
} from "./cache";

/**
 * Free stock footage/photos from Pexels and/or Pixabay (free API keys, commercial
 * use, no attribution required). Env-gated: with no key it no-ops with a clear
 * log line so the pipeline never breaks. Results are cached + license-recorded;
 * an already-cached query is never re-fetched. Picks the first result
 * deterministically (no unseeded randomness → reproducible renders).
 */
export type StockType = "image" | "video";
export type Orientation = "landscape" | "portrait" | "square";
export type StockProvider = "pexels" | "pixabay";

const LICENSES: Record<StockProvider, string> = {
  pexels: "Pexels License (free, commercial use, no attribution required)",
  pixabay: "Pixabay Content License (free, commercial use, no attribution required)",
};

function extFromUrl(url: string, fallback: string): string {
  const m = /\.(jpe?g|png|webp|gif|mp4|mov|webm)(?:\?|$)/i.exec(url);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : fallback;
}

async function download(url: string, abs: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  fs.writeFileSync(abs, Buffer.from(await res.arrayBuffer()));
}

// --- Pexels ---
interface PexelsResponse {
  photos?: { src: { large2x: string; large: string; original: string } }[];
  videos?: { video_files: { link: string; file_type: string; width: number | null }[] }[];
}

async function pexelsFind(
  query: string,
  type: StockType,
  orientation: Orientation,
  key: string,
): Promise<string | null> {
  const base =
    type === "video"
      ? "https://api.pexels.com/videos/search"
      : "https://api.pexels.com/v1/search";
  const url = `${base}?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=1`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status}`);
  const data = (await res.json()) as PexelsResponse;
  if (type === "video") {
    const files = data.videos?.[0]?.video_files.filter((f) => f.file_type === "video/mp4") ?? [];
    const pick =
      files.sort((a, b) => (b.width ?? 0) - (a.width ?? 0)).find((f) => (f.width ?? 0) <= 1920) ??
      files[0];
    return pick?.link ?? null;
  }
  const p = data.photos?.[0]?.src;
  return p ? p.large2x || p.large || p.original : null;
}

// --- Pixabay ---
interface PixabayResponse {
  hits?: {
    largeImageURL?: string;
    videos?: { large?: { url: string }; medium?: { url: string } };
  }[];
}

async function pixabayFind(
  query: string,
  type: StockType,
  orientation: Orientation,
  key: string,
): Promise<string | null> {
  const dir = orientation === "portrait" ? "vertical" : orientation === "landscape" ? "horizontal" : "all";
  const base = type === "video" ? "https://pixabay.com/api/videos/" : "https://pixabay.com/api/";
  const extra = type === "video" ? "" : `&image_type=photo&orientation=${dir}`;
  const url = `${base}?key=${key}&q=${encodeURIComponent(query)}&per_page=3&safesearch=true${extra}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pixabay ${res.status}`);
  const data = (await res.json()) as PixabayResponse;
  const hit = data.hits?.[0];
  if (!hit) return null;
  return type === "video" ? (hit.videos?.large?.url || hit.videos?.medium?.url || null) : hit.largeImageURL ?? null;
}

/** Cache an arbitrary media URL and record its provenance (also used directly). */
export async function cacheFromUrl(
  url: string,
  meta: { source: string; query: string; license: string; type: StockType },
): Promise<{ src: string; cached: boolean }> {
  const key = hashKey("url", url);
  const ext = extFromUrl(url, meta.type === "video" ? "mp4" : "jpg");
  const abs = generatedFile(`asset-${key}.${ext}`);
  if (findAsset(key) && fs.existsSync(abs)) return { src: publicRef(abs), cached: true };
  await download(url, abs);
  recordAsset({
    hash: key,
    file: publicRef(abs),
    source: meta.source,
    query: meta.query,
    license: meta.license,
    url,
    date: new Date().toISOString(),
  });
  return { src: publicRef(abs), cached: false };
}

/** Fetch one stock asset by query. Returns null (with a log) when no key is set
 * or nothing matches — the pipeline continues with text-only scenes. */
export async function fetchStock(opts: {
  query: string;
  type: StockType;
  orientation: Orientation;
  provider?: StockProvider;
}): Promise<{ src: string; cached: boolean } | null> {
  const pexKey = process.env.PEXELS_API_KEY;
  const pixKey = process.env.PIXABAY_API_KEY;
  const provider = opts.provider ?? (pexKey ? "pexels" : pixKey ? "pixabay" : null);
  if (!provider) {
    console.warn(
      `  [stock] No PEXELS_API_KEY / PIXABAY_API_KEY set — skipping "${opts.query}" (scene renders text-only).`,
    );
    return null;
  }

  const key = hashKey("stock", provider, opts.type, opts.query, opts.orientation);
  const cached = findAsset(key);
  if (cached && fs.existsSync(path.join(PUBLIC_DIR, cached.file))) {
    return { src: cached.file, cached: true };
  }

  let url: string | null = null;
  if (provider === "pexels" && pexKey) {
    url = await pexelsFind(opts.query, opts.type, opts.orientation, pexKey);
  } else if (provider === "pixabay" && pixKey) {
    url = await pixabayFind(opts.query, opts.type, opts.orientation, pixKey);
  }
  if (!url) {
    console.warn(`  [stock] No ${provider} ${opts.type} result for "${opts.query}".`);
    return null;
  }

  const ext = extFromUrl(url, opts.type === "video" ? "mp4" : "jpg");
  const abs = generatedFile(`stock-${key}.${ext}`);
  await download(url, abs);
  recordAsset({
    hash: key,
    file: publicRef(abs),
    source: provider,
    query: opts.query,
    license: LICENSES[provider],
    url,
    date: new Date().toISOString(),
  });
  return { src: publicRef(abs), cached: false };
}
