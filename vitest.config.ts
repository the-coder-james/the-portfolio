/// <reference types="vitest/config" />
// Unit and static checks (QA plan: ST-*, UT-*). Browser tests are Playwright
// (playwright.config.ts). Standalone rather than Astro's getViteConfig(): the
// unit targets are plain TS modules, so only the `@/` alias is needed.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    projects: [
      // Source-level checks: palette contrast, source invariants. No build needed.
      { extends: true, test: { name: "static", environment: "node", include: ["tests/static/**/*.test.ts"] } },
      // Built-artefact checks: run after `astro build` (dist/) and `npm run build:e2e` (dist-e2e/).
      { extends: true, test: { name: "dist", environment: "node", include: ["tests/dist/**/*.test.ts"] } },
      // Store logic in a DOM.
      { extends: true, test: { name: "unit", environment: "jsdom", include: ["tests/unit/**/*.test.ts"] } },
    ],
  },
});
