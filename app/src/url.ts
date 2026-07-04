import { staticFile } from "remotion";

/** Resolve a schema `src` (public-relative path or absolute URL) for a Remotion
 * media component. Shared by video, image, audio, and SFX layers. */
export const isUrl = (s: string) => /^https?:\/\//.test(s);
export const resolveSrc = (s: string) => (isUrl(s) ? s : staticFile(s));
