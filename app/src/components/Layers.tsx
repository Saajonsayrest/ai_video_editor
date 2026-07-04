import {
  Img,
  OffthreadVideo,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { MediaLayer, Overlay, SceneProps } from "../schema";
import { useTheme } from "../theme";
import { resolveSrc } from "../url";

/** Slow pan/zoom transform for a still image, spanning the scene. */
function kenBurnsStyle(
  kind: MediaLayer["kenBurns"],
  frame: number,
  frames: number,
): React.CSSProperties {
  if (kind === "none") return {};
  const p = interpolate(frame, [0, Math.max(1, frames)], [0, 1], {
    extrapolateRight: "clamp",
  });
  switch (kind) {
    case "zoom-in":
      return { scale: 1 + 0.12 * p };
    case "zoom-out":
      return { scale: 1.12 - 0.12 * p };
    case "pan-left":
      return { scale: 1.1, translate: `${interpolate(p, [0, 1], [3, -3])}% 0%` };
    case "pan-right":
      return { scale: 1.1, translate: `${interpolate(p, [0, 1], [-3, 3])}% 0%` };
    default:
      return {};
  }
}

/**
 * Layered media: a full-bleed background (image/video, trimmable/speed-adjust for
 * video) behind the text, plus foreground overlays / picture-in-picture and an
 * optional brand logo watermark. Uses <OffthreadVideo> (never @remotion/media).
 */

/** Convert a trim expressed in seconds to a frame count, or undefined if 0. */
const framesOrUndef = (seconds: number, fps: number) =>
  seconds > 0 ? Math.round(seconds * fps) : undefined;

/** A gentle, always-moving push/pan for VIDEO (subtler than the stills Ken Burns),
 * so cuts feel alive and seamless rather than static-cut-static. Returns a scale
 * multiplier (composed with any base fill zoom) and a translate in percent. */
function videoKenBurns(
  kind: MediaLayer["kenBurns"],
  frame: number,
  frames: number,
): { scale: number; translate: string } {
  if (kind === "none") return { scale: 1, translate: "0% 0%" };
  const p = interpolate(frame, [0, Math.max(1, frames)], [0, 1], {
    extrapolateRight: "clamp",
  });
  switch (kind) {
    case "zoom-in":
      return { scale: 1 + 0.08 * p, translate: "0% 0%" };
    case "zoom-out":
      return { scale: 1.08 - 0.08 * p, translate: "0% 0%" };
    case "pan-left":
      return { scale: 1.06, translate: `${interpolate(p, [0, 1], [2, -2])}% 0%` };
    case "pan-right":
      return { scale: 1.06, translate: `${interpolate(p, [0, 1], [-2, 2])}% 0%` };
    default:
      return { scale: 1, translate: "0% 0%" };
  }
}

const Scrim: React.FC<{ amount: number }> = ({ amount }) =>
  amount > 0 ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, rgba(0,0,0,${amount * 0.4}), rgba(0,0,0,${amount}))`,
      }}
    />
  ) : null;

export const SceneBackground: React.FC<{
  media: MediaLayer;
  sceneFrames: number;
}> = ({ media, sceneFrames }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  if (media.type === "none" || !media.src) return null;
  const style: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: media.fit,
    objectPosition: media.objectPosition,
    opacity: media.opacity,
  };
  if (media.type === "video") {
    const trim = {
      playbackRate: media.speed,
      trimBefore: framesOrUndef(media.trimStart, fps),
      trimAfter: framesOrUndef(media.trimEnd, fps),
    };
    const kb = videoKenBurns(media.kenBurns, frame, sceneFrames);
    // blurFill: a blurred, over-scaled cover copy fills the whole frame (so a
    // landscape source never leaves bare bands in a vertical comp), with a sharp,
    // contained + graded copy seated on top. Both decode the same frames, so they
    // stay in perfect sync.
    if (media.blurFill) {
      return (
        <>
          <OffthreadVideo
            src={resolveSrc(media.src)}
            muted
            {...trim}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              scale: 1.15,
              filter: "blur(48px) saturate(1.1) brightness(1.04)",
            }}
          />
          <OffthreadVideo
            src={resolveSrc(media.src)}
            muted={media.muted}
            volume={media.muted ? undefined : media.volume}
            {...trim}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: media.objectPosition,
              scale: media.fillZoom * kb.scale,
              translate: kb.translate,
              opacity: media.opacity,
              filter: media.filter || undefined,
            }}
          />
          <Scrim amount={media.scrim} />
        </>
      );
    }
    return (
      <>
        <OffthreadVideo
          src={resolveSrc(media.src)}
          muted={media.muted}
          volume={media.muted ? undefined : media.volume}
          {...trim}
          style={{
            ...style,
            scale: kb.scale,
            translate: kb.translate,
            filter: media.filter || undefined,
          }}
        />
        <Scrim amount={media.scrim} />
      </>
    );
  }
  return (
    <>
      <Img
        src={resolveSrc(media.src)}
        style={{
          ...style,
          ...kenBurnsStyle(media.kenBurns, frame, sceneFrames),
          filter: media.filter || undefined,
        }}
      />
      <Scrim amount={media.scrim} />
    </>
  );
};

const positionStyle = (
  position: Overlay["position"],
  widthPct: number,
): React.CSSProperties => {
  const edge = "5%";
  const base: React.CSSProperties = { position: "absolute", width: `${widthPct}%` };
  switch (position) {
    case "top-left":
      return { ...base, top: edge, left: edge };
    case "top-right":
      return { ...base, top: edge, right: edge };
    case "bottom-left":
      return { ...base, bottom: edge, left: edge };
    case "center":
      return { ...base, top: "50%", left: "50%", translate: "-50% -50%" };
    case "bottom-right":
    default:
      return { ...base, bottom: edge, right: edge };
  }
};

const OverlayItem: React.FC<{ overlay: Overlay }> = ({ overlay }) => {
  const { fps } = useVideoConfig();
  if (!overlay.src) return null;
  const style: React.CSSProperties = {
    ...positionStyle(overlay.position, overlay.width),
    opacity: overlay.opacity,
    borderRadius: overlay.radius,
    overflow: "hidden",
    objectFit: "cover",
  };
  if (overlay.type === "video") {
    return (
      <OffthreadVideo
        src={resolveSrc(overlay.src)}
        muted={overlay.muted}
        volume={overlay.muted ? undefined : overlay.volume}
        playbackRate={overlay.speed}
        trimBefore={framesOrUndef(overlay.trimStart, fps)}
        trimAfter={framesOrUndef(overlay.trimEnd, fps)}
        style={style}
      />
    );
  }
  return <Img src={resolveSrc(overlay.src)} style={style} />;
};

const LOGO_POS: Record<SceneProps["logoPosition"], React.CSSProperties> = {
  "top-left": { top: "5%", left: "5%" },
  "top-right": { top: "5%", right: "5%" },
  "bottom-left": { bottom: "5%", left: "5%" },
  "bottom-right": { bottom: "5%", right: "5%" },
};

export const SceneForeground: React.FC<{ scene: SceneProps }> = ({ scene }) => {
  const theme = useTheme();
  return (
    <>
      {scene.overlays.map((o, i) => (
        <OverlayItem key={i} overlay={o} />
      ))}
      {scene.showLogo && theme.logo ? (
        <Img
          src={resolveSrc(theme.logo)}
          style={{
            position: "absolute",
            height: "8%",
            width: "auto",
            ...LOGO_POS[scene.logoPosition],
          }}
        />
      ) : null}
    </>
  );
};
