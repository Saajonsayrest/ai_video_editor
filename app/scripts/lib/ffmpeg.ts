import { spawnSync } from "child_process";

/**
 * Run the ffmpeg that ships with Remotion — no separate install needed.
 * `npx remotion ffmpeg …` resolves the locally installed CLI.
 */
export type FfmpegResult = { status: number; stdout: string; stderr: string };

export function runFfmpeg(args: string[]): FfmpegResult {
  const res = spawnSync("npx", ["remotion", "ffmpeg", ...args], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 64,
  });
  return {
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? "",
  };
}
