/**
 * Curated Google Fonts map. brand.json names a font by key; components resolve it
 * to a real fontFamily via loadBrandFont(). @remotion/google-fonts can't load an
 * arbitrary string, so adding a font = one import + one map entry here.
 *
 * loadFont() is cached by the package, so calling it per-render is cheap.
 */
import { loadFont as Inter } from "@remotion/google-fonts/Inter";
import { loadFont as Montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as Poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as Roboto } from "@remotion/google-fonts/Roboto";
import { loadFont as Oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as Lora } from "@remotion/google-fonts/Lora";
import { loadFont as PlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as BebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as Raleway } from "@remotion/google-fonts/Raleway";
import { loadFont as DMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as SpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as Anton } from "@remotion/google-fonts/Anton";

type FontLoader = () => { fontFamily: string };

const LOADERS: Record<string, FontLoader> = {
  Inter,
  Montserrat,
  Poppins,
  Roboto,
  Oswald,
  Lora,
  PlayfairDisplay,
  BebasNeue,
  Raleway,
  DMSans,
  SpaceGrotesk,
  Anton,
};

export const AVAILABLE_FONTS = Object.keys(LOADERS);

/** Load `name` (or Inter as a safe fallback) and return its CSS fontFamily. */
export function loadBrandFont(name: string): string {
  const loader = LOADERS[name] ?? Inter;
  return loader().fontFamily;
}
