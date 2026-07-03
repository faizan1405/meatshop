import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The storefront and admin intentionally render remote images
      // (Unsplash / Cloudinary) sized with CSS + inline styles across cards,
      // carousels, hero chips and admin tables. Migrating these to next/image
      // would change layout (fixed width/height or fill wrappers) and require
      // allow-listing every remote host in next.config. This rule is a
      // performance hint, not a correctness issue, so it is disabled project
      // wide as a deliberate architectural choice.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
