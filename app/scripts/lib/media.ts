import path from "path";
import { ALL_FORMATS, FilePathSource, Input } from "mediabunny";

/**
 * Node-only media probing (reads files straight off disk). Browser/bundled code
 * uses src/media.ts (UrlSource) instead — FilePathSource must never reach the
 * video bundle.
 */
export function resolvePublic(file: string): string {
  if (path.isAbsolute(file)) return file;
  return path.join(process.cwd(), "public", file.replace(/^public\//, ""));
}

function inputFor(file: string): Input {
  return new Input({
    formats: ALL_FORMATS,
    source: new FilePathSource(resolvePublic(file)),
  });
}

export async function probeFileDuration(file: string): Promise<number | null> {
  try {
    const d = await inputFor(file).computeDuration();
    return Number.isFinite(d) ? d : null;
  } catch {
    return null;
  }
}

export async function probeFileSize(
  file: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const track = await inputFor(file).getPrimaryVideoTrack();
    if (!track) return null;
    return { width: track.displayWidth, height: track.displayHeight };
  } catch {
    return null;
  }
}
