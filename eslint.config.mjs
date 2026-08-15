import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This app's dialogs and drawers all use the standard "reset state,
      // fetch, set loading false" shape when they open (no Suspense/`use()`
      // data layer here) — the exact pattern the React docs show for
      // fetching in an effect. This rule flags every instance of it as a
      // style problem, which would mean either restructuring ~10 working,
      // race-condition-free components for no behavior change, or
      // sprinkling a near-identical disable comment across all of them.
      // Off project-wide instead, with the reasoning here in one place.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Auto-generated Prisma client — vendored, not source we own.
    "src/generated/**",
  ]),
]);

export default eslintConfig;
