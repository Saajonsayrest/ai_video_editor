import { useVideoConfig } from "remotion";

/**
 * Shared liquid-glass text card: a deep forest-green translucent panel with a
 * strong glassy sheen — saturated backdrop blur, a bright highlight rim, and a
 * diagonal light-streak reflection — so cream text reads on any footage. Used by
 * every scene that shows a title, keeping the look consistent.
 */
export const GlassCard: React.FC<{
  align?: "flex-start" | "center";
  /** "green" = deep forest-green glass w/ cream text · "cream" = soft warm
   * glass w/ green text. Pick one and use it everywhere for consistency. */
  tone?: "green" | "cream";
  children: React.ReactNode;
}> = ({ align = "flex-start", tone = "green", children }) => {
  const { width, height } = useVideoConfig();
  const bg =
    tone === "cream"
      ? "linear-gradient(150deg, rgba(251, 246, 236, 0.62), rgba(244, 236, 221, 0.48))"
      : "linear-gradient(150deg, rgba(46, 76, 45, 0.46), rgba(18, 38, 20, 0.36))";
  return (
    <div
      style={{
        position: "relative",
        background: bg,
        backdropFilter: "blur(26px) saturate(1.7)",
        WebkitBackdropFilter: "blur(26px) saturate(1.7)",
        padding: `${Math.round(height * 0.024)}px ${Math.round(width * 0.06)}px`,
        borderRadius: 34,
        border: "1px solid rgba(255, 255, 255, 0.24)",
        // Outer drop + bright glossy top rim + soft inner bottom shade.
        boxShadow:
          "0 16px 50px rgba(18, 32, 16, 0.34), inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.12)",
        maxWidth: width * 0.86,
        zIndex: 10,
      }}
    >
      {/* Diagonal reflective light-streak — the "liquid glass" sheen. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 34,
          pointerEvents: "none",
          background:
            "linear-gradient(128deg, rgba(255,255,255,0.24), rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 62%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: align,
          gap: Math.round(height * 0.008),
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};
