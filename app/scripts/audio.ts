import {
  atempo,
  concatAudio,
  duckMusicUnderVoice,
  extractAudio,
  fade,
  fitToDuration,
  loudnorm,
  mixTracks,
  trim,
  type MixTrack,
} from "./lib/audio";
import { separateStems } from "./lib/stems";

/**
 * Free local audio toolkit CLI — one subcommand per scripts/lib/audio.ts op,
 * so the agent (or you) can drive mixing/mastering directly without writing
 * throwaway scripts. All outputs are cached wavs under public/input/generated/.
 *
 *   npm run audio -- extract input/clip.mp4
 *   npm run audio -- loudnorm input/vo.wav [-16]
 *   npm run audio -- fade input/music.mp3 1.5 2
 *   npm run audio -- atempo input/vo.wav 1.15
 *   npm run audio -- trim input/clip.wav 2.5 [8]
 *   npm run audio -- fit input/vo.wav 3.2
 *   npm run audio -- mix "input/vo.wav:1:0" "input/music.mp3:0.5:0"
 *   npm run audio -- duck input/music.mp3 input/vo.wav [0.28]
 *   npm run audio -- concat input/a.wav input/b.wav
 *   npm run audio -- stems input/song.mp3
 */
function parseMixTrack(spec: string): MixTrack {
  const [file, volume, startSec] = spec.split(":");
  return {
    file,
    volume: volume !== undefined && volume !== "" ? parseFloat(volume) : undefined,
    startSec: startSec !== undefined && startSec !== "" ? parseFloat(startSec) : undefined,
  };
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  switch (cmd) {
    case "extract": {
      const r = extractAudio(args[0]);
      console.log(`✓ ${r.cached ? "cached" : "extracted"} → public/${r.src}`);
      break;
    }
    case "loudnorm": {
      const r = loudnorm(args[0], args[1] ? parseFloat(args[1]) : undefined);
      console.log(`✓ ${r.cached ? "cached" : "normalized"} → public/${r.src}`);
      break;
    }
    case "fade": {
      const r = await fade(args[0], parseFloat(args[1] ?? "1"), parseFloat(args[2] ?? "1"));
      console.log(`✓ ${r.cached ? "cached" : "faded"} → public/${r.src}`);
      break;
    }
    case "atempo": {
      const r = atempo(args[0], parseFloat(args[1] ?? "1"));
      console.log(`✓ ${r.cached ? "cached" : "tempo-shifted"} → public/${r.src}`);
      break;
    }
    case "trim": {
      const r = trim(args[0], parseFloat(args[1] ?? "0"), args[2] ? parseFloat(args[2]) : undefined);
      console.log(`✓ ${r.cached ? "cached" : "trimmed"} → public/${r.src}`);
      break;
    }
    case "fit": {
      const r = fitToDuration(args[0], parseFloat(args[1] ?? "0"));
      console.log(`✓ ${r.cached ? "cached" : "fitted"} → public/${r.src}`);
      break;
    }
    case "mix": {
      const r = mixTracks(args.map(parseMixTrack));
      console.log(`✓ ${r.cached ? "cached" : "mixed"} → public/${r.src}`);
      break;
    }
    case "duck": {
      const r = await duckMusicUnderVoice(args[0], args[1], args[2] ? parseFloat(args[2]) : undefined);
      console.log(`✓ ${r.cached ? "cached" : "ducked+mixed"} → public/${r.src}`);
      break;
    }
    case "concat": {
      const r = concatAudio(args);
      console.log(`✓ ${r.cached ? "cached" : "concatenated"} → public/${r.src}`);
      break;
    }
    case "stems": {
      const r = separateStems(args[0]);
      if (!r) process.exit(1);
      console.log(`✓ ${r.cached ? "cached" : "separated"}`);
      console.log(`  vocals:       public/${r.vocals}`);
      console.log(`  instrumental: public/${r.instrumental}`);
      break;
    }
    default:
      console.error(
        "Usage: npm run audio -- <extract|loudnorm|fade|atempo|trim|fit|mix|duck|concat|stems> …\n" +
          "  See scripts/audio.ts header for examples.",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n✗ audio failed:", err?.message || err);
  process.exit(1);
});
