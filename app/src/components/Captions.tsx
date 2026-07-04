import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import type { VideoCaptions } from "../schema";
import { useTheme } from "../theme";
import { getTypeScale } from "../typography";

/**
 * TikTok-style karaoke captions: word-level pages from @remotion/captions with
 * the currently-spoken token highlighted. Rendered inside each scene's Sequence,
 * so useCurrentFrame is scene-local — matching the voiceover, which also starts
 * at the scene. Four style presets. Caption data is embedded in props.
 */
const Token: React.FC<{
  text: string;
  active: boolean;
  style: VideoCaptions["style"];
  accent: string;
  bg: string;
}> = ({ text, active, style, accent, bg }) => {
  const base: React.CSSProperties = { whiteSpace: "pre" };
  if (style === "box") {
    return (
      <span
        style={{
          ...base,
          color: active ? bg : "white",
          background: active ? accent : "transparent",
          borderRadius: "0.16em",
          padding: active ? "0 0.14em" : undefined,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {text}
      </span>
    );
  }
  if (style === "underline") {
    return (
      <span
        style={{
          ...base,
          color: active ? accent : "white",
          borderBottom: active ? `0.1em solid ${accent}` : undefined,
        }}
      >
        {text}
      </span>
    );
  }
  // "highlight" and "chunk" both recolor the active word (chunk also uppercases
  // via the container's textTransform).
  return (
    <span
      style={{ ...base, color: active ? accent : "rgba(255,255,255,0.94)" }}
    >
      {text}
    </span>
  );
};

export const CaptionsOverlay: React.FC<{
  captions: Caption[];
  config: VideoCaptions;
}> = ({ captions, config }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const theme = useTheme();
  const s = getTypeScale(width, height);
  const nowMs = (frame / fps) * 1000;

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: config.combineWithinMs,
      }),
    [captions, config.combineWithinMs],
  );

  let page = null;
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const next = pages[i + 1];
    const end = next ? next.startMs : p.startMs + config.combineWithinMs;
    if (nowMs >= p.startMs && nowMs < end) {
      page = p;
      break;
    }
  }
  if (!page) return null;

  const justify =
    config.position === "top"
      ? "flex-start"
      : config.position === "center"
        ? "center"
        : "flex-end";
  const padY = config.position === "center" ? 0 : Math.round(height * 0.11);

  return (
    <AbsoluteFill
      style={{
        justifyContent: justify,
        alignItems: "center",
        padding: `${padY}px ${Math.round(width * 0.08)}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: width * 0.86,
          fontFamily: theme.fonts.heading,
          fontWeight: 800,
          fontSize: Math.round(s.subtitle * 1.15),
          lineHeight: 1.25,
          textTransform: config.style === "chunk" ? "uppercase" : "none",
          textShadow: "0 3px 18px rgba(0,0,0,0.72)",
        }}
      >
        {page.tokens.map((tok) => (
          <Token
            key={tok.fromMs}
            text={tok.text}
            active={tok.fromMs <= nowMs && tok.toMs > nowMs}
            style={config.style}
            accent={theme.palette.accent}
            bg={theme.palette.background}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
