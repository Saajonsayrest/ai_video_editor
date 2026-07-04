import { createContext, useContext, useMemo } from "react";
import type { BrandProps } from "./schema";
import { loadBrandFont } from "./fonts";

/**
 * Resolved brand theme provided to every scene via context, so components stay
 * pure (no prop-drilling of colors/fonts). Font names are resolved to real
 * fontFamily strings here (the one place @remotion/google-fonts is touched).
 */
export type Theme = {
  name: string;
  logo: string;
  voice: string;
  palette: BrandProps["palette"];
  fonts: { heading: string; body: string };
};

const FALLBACK: Theme = {
  name: "",
  logo: "",
  voice: "af_heart",
  palette: {
    primary: "#6ea8fe",
    secondary: "#d68efe",
    background: "#0b1020",
    surface: "#161c34",
    text: "#ffffff",
    muted: "#9fb0d0",
    accent: "#6efeb0",
  },
  fonts: { heading: "sans-serif", body: "sans-serif" },
};

const ThemeContext = createContext<Theme>(FALLBACK);

export const useTheme = (): Theme => useContext(ThemeContext);

export const BrandProvider: React.FC<{
  brand: BrandProps;
  children: React.ReactNode;
}> = ({ brand, children }) => {
  const theme = useMemo<Theme>(
    () => ({
      name: brand.name,
      logo: brand.logo,
      voice: brand.voice,
      palette: brand.palette,
      fonts: {
        heading: loadBrandFont(brand.fonts.heading),
        body: loadBrandFont(brand.fonts.body),
      },
    }),
    [brand],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
