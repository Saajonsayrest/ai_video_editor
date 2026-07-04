import { fitText } from "@remotion/layout-utils";

/**
 * One-line text that shrinks to fit `maxWidth` (never grows past `maxSize`).
 * Prevents big single-line content (stat numbers, CTA labels) from overflowing
 * the safe area — especially in narrow portrait/square formats. Uses
 * @remotion/layout-utils measureText under the hood.
 */
export const FitText: React.FC<{
  text: string;
  maxSize: number;
  maxWidth: number;
  fontFamily: string;
  fontWeight: number | string;
  style?: React.CSSProperties;
}> = ({ text, maxSize, maxWidth, fontFamily, fontWeight, style }) => {
  const { fontSize } = fitText({
    text,
    withinWidth: maxWidth,
    fontFamily,
    fontWeight,
  });
  return (
    <div
      style={{
        ...style,
        fontFamily,
        fontWeight,
        fontSize: Math.min(maxSize, fontSize),
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
