/** Turn a hex color into an rgba() string. Non-hex input is returned unchanged. */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  const six = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (six) {
    const n = parseInt(six[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const three = /^#([0-9a-fA-F]{3})$/.exec(hex);
  if (three) {
    const r = parseInt(three[1][0] + three[1][0], 16);
    const g = parseInt(three[1][1] + three[1][1], 16);
    const b = parseInt(three[1][2] + three[1][2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
