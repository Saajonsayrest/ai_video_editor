import type { SceneKind } from "../schema";
import { HookScene } from "./HookScene";
import { MediaScene } from "./MediaScene";
import { ProductScene } from "./ProductScene";
import { QuoteScene } from "./QuoteScene";
import { StatScene } from "./StatScene";
import { ComparisonScene } from "./ComparisonScene";
import { AudiovizScene } from "./AudiovizScene";
import { CtaScene } from "./CtaScene";
import type { SceneComponentProps } from "./types";

const SCENE_MAP: Record<SceneKind, React.FC<SceneComponentProps>> = {
  hook: HookScene,
  media: MediaScene,
  product: ProductScene,
  quote: QuoteScene,
  stat: StatScene,
  comparison: ComparisonScene,
  audioviz: AudiovizScene,
  cta: CtaScene,
};

/** Picks the component for a scene's `kind` (falls back to Hook). */
export const SceneRouter: React.FC<SceneComponentProps> = (props) => {
  const Component = SCENE_MAP[props.scene.kind] ?? HookScene;
  return <Component {...props} />;
};
