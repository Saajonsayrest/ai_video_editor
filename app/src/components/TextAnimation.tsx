import React, { useState, useEffect } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { TextAnimationKind } from "../schema";

/**
 * One text-reveal component driven by the scene's `textAnimation` choice.
 * Animations use individual CSS transform props (`scale`, `translate`) so they
 * stay editable in Studio (per the text-animations skill rule). Typewriter uses
 * string slicing — never per-character opacity.
 */
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

type Props = {
  text: string;
  kind: TextAnimationKind;
  delay?: number;
  highlightWord?: string;
  highlightColor?: string;
  style?: React.CSSProperties;
};

const Typewriter: React.FC<{ text: string; delay: number }> = ({
  text,
  delay,
}) => {
  const frame = useCurrentFrame();
  const CHAR_FRAMES = 1.4;
  const local = Math.max(0, frame - delay);
  const chars = Math.min(text.length, Math.floor(local / CHAR_FRAMES));
  const done = chars >= text.length;
  const cursor = interpolate(frame % 16, [0, 8, 16], [1, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {text.slice(0, chars)}
      <span style={{ opacity: done ? 0 : cursor }}>▌</span>
    </>
  );
};

const WordHighlight: React.FC<{
  text: string;
  word: string;
  color: string;
  delay: number;
}> = ({ text, word, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = word ? text.indexOf(word) : -1;
  if (idx < 0) return <>{text}</>;
  const pre = text.slice(0, idx);
  const post = text.slice(idx + word.length);
  const progress = spring({
    fps,
    frame,
    config: { damping: 200 },
    delay: delay + 8,
    durationInFrames: 16,
  });
  const scaleX = Math.max(0, Math.min(1, progress));
  return (
    <>
      {pre}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: "1.02em",
            transform: `translateY(-50%) scaleX(${scaleX})`,
            transformOrigin: "left center",
            backgroundColor: color,
            borderRadius: "0.16em",
            zIndex: 0,
          }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>{word}</span>
      </span>
      {post}
    </>
  );
};

const StaggeredReveal: React.FC<{
  text: string;
  delay: number;
  style?: React.CSSProperties;
}> = ({ text, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const isCentered = style?.textAlign === "center";

  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: isCentered ? "center" : "flex-start",
        rowGap: "0.2em",
        columnGap: "0.28em",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delay + i * 3.5;
        const p = spring({
          fps,
          frame,
          delay: wordDelay,
          config: { mass: 1.0, damping: 28, stiffness: 65 },
        });
        const translateY = interpolate(p, [0, 1], [14, 0]);
        const opacity = interpolate(p, [0, 0.7], [0, 1]);
        return (
          <div
            key={i}
            style={{
              display: "inline-block",
              padding: "0.08em 0.15em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${translateY}px)`,
                opacity,
              }}
            >
              {word}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const FisheyeText: React.FC<{
  text: string;
  delay: number;
  style?: React.CSSProperties;
}> = ({ text, delay, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [mapDataUrl, setMapDataUrl] = useState("");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.createImageData(256, 256);
    const data = imgData.data;

    const cx = 128;
    const cy = 128;
    const R = 128;

    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * 256 + x) * 4;

        if (r === 0) {
          data[idx] = 128;
          data[idx + 1] = 128;
        } else {
          const intensity = r < R ? Math.cos((r / R) * Math.PI / 2) : 0;
          const ux = (dx / R) * intensity;
          const uy = (dy / R) * intensity;

          data[idx] = Math.max(0, Math.min(255, Math.round(128 + 127 * ux)));
          data[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + 127 * uy)));
        }
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    setMapDataUrl(canvas.toDataURL());
  }, []);

  const progress = spring({
    fps,
    frame,
    delay,
    config: { mass: 0.9, damping: 15, stiffness: 85 },
  });

  const displacementScale = interpolate(progress, [0, 0.7, 1], [0, 85, 50]);
  const textScale = interpolate(progress, [0, 1], [0.82, 1]);
  const opacity = interpolate(progress, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const filterId = `fisheye-filter-${delay}`;

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
      {mapDataUrl && (
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feImage
                href={mapDataUrl}
                result="map"
                x="0"
                y="0"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      <div
        style={{
          ...style,
          opacity,
          transform: `scale(${textScale})`,
          filter: mapDataUrl ? `url(#${filterId})` : undefined,
          transformOrigin: "center center",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const AnimatedText: React.FC<Props> = ({
  text,
  kind,
  delay = 0,
  highlightWord = "",
  highlightColor = "rgba(110,168,254,0.5)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (kind === "stagger-reveal") {
    return <StaggeredReveal text={text} delay={delay} style={style} />;
  }
  if (kind === "typewriter") {
    return (
      <div style={style}>
        <Typewriter text={text} delay={delay} />
      </div>
    );
  }
  if (kind === "word-highlight") {
    const fadeIn = interpolate(frame, [delay, delay + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE,
    });
    return (
      <div style={{ ...style, opacity: fadeIn }}>
        <WordHighlight
          text={text}
          word={highlightWord}
          color={highlightColor}
          delay={delay}
        />
      </div>
    );
  }
  if (kind === "fisheye") {
    return <FisheyeText text={text} delay={delay} style={style} />;
  }

  let anim: React.CSSProperties = {};
  if (kind === "fade") {
    anim = {
      opacity: interpolate(frame, [delay, delay + 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE,
      }),
    };
  } else if (kind === "slide-up") {
    const p = spring({ fps, frame, delay, config: { mass: 1, damping: 26, stiffness: 92 } });
    anim = {
      opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
      translate: `0px ${interpolate(p, [0, 1], [36, 0])}px`,
    };
  } else if (kind === "spring-in") {
    const p = spring({ fps, frame, delay, config: { mass: 0.9, damping: 22, stiffness: 108 } });
    anim = {
      opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
      scale: interpolate(p, [0, 1], [0.94, 1]),
      translate: `0px ${interpolate(p, [0, 1], [28, 0])}px`,
    };
  }

  return <div style={{ ...style, ...anim }}>{text}</div>;
};
