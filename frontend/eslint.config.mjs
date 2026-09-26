import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { noCommentsPlugin } from "./eslint-plugins/no-comments.mjs";
import { fsdBoundaryConfigs } from "./eslint-rules/fsd-boundaries.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
  {
    plugins: {
      custom: noCommentsPlugin,
    },
    rules: {
      "custom/no-comments": "error",
      "max-lines": ["error", { max: 60, skipBlankLines: true, skipComments: false }],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: "Inline styles are forbidden by project rules. Use CSS Modules.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [{
            group: ["@/entities/*/*/**", "@/features/*/*/**", "@/widgets/*/*/**"],
            message: "Deep imports into internal slice files are forbidden. Import from slice root index.ts.",
          }],
        },
      ],
    },
  },
  ...fsdBoundaryConfigs,
]);

export default eslintConfig;
