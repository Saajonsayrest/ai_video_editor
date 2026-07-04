import { config } from "@remotion/eslint-config-flat";

/**
 * `@remotion/non-pure-animation` false-positives on the `transition` DATA key in
 * our schema/spec files (it assumes a CSS `transition` style, which Remotion
 * forbids). These files hold no animations, so silence it there only — the rule
 * stays ON for every component/scene file, where it actually matters.
 */
export default [
  ...config,
  {
    files: ["src/schema.ts", "src/default-video.ts"],
    rules: {
      "@remotion/non-pure-animation": "off",
    },
  },
];
