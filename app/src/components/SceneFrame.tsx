import { AbsoluteFill, useVideoConfig } from "remotion";
import type { SceneProps } from "../schema";
import { useTheme } from "../theme";
import { safeAreaInsets } from "../typography";
import { SceneBackground, SceneForeground } from "./Layers";
import { CozyFx } from "./CozyFx";
import { Accents } from "./Accents";

type Align = "center" | "flex-start" | "flex-end";

/**
 * Shared chrome for every scene kind: brand background (CSS or media), a
 * safe-area content slot laid out with flex (never hand-positioned), and
 * foreground overlays/logo. Content goes in `children`.
 */
export const SceneFrame: React.FC<{
  scene: SceneProps;
  sceneFrames: number;
  align?: Align;
  justify?: Align;
  children: React.ReactNode;
}> = ({ scene, sceneFrames, align = "center", justify = "center", children }) => {
  const { width, height } = useVideoConfig();
  const theme = useTheme();
  const insets = safeAreaInsets(width, height);
  const background =
    scene.background ||
    `linear-gradient(160deg, ${theme.palette.background}, ${theme.palette.surface})`;
  return (
    <AbsoluteFill
      style={{
        background,
        color: theme.palette.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <SceneBackground media={scene.backgroundMedia} sceneFrames={sceneFrames} />
      <CozyFx fx={scene.fx} />
      <AbsoluteFill
        style={{
          padding: `${insets.y}px ${insets.x}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: align,
          justifyContent: justify,
          textAlign: align === "center" ? "center" : "left",
          gap: Math.round(height * 0.02),
        }}
      >
        {children}
      </AbsoluteFill>
      <Accents accents={scene.accents} />
      <SceneForeground scene={scene} />
    </AbsoluteFill>
  );
};
