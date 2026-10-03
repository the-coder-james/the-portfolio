// Shared fixtures: storage seeding, in-page helpers, and a network guard.
//
// Determinism rules (QA plan section 3.3):
//  - every test gets a fresh context;
//  - `theme` and `analytics-consent` are seeded before any page script runs
//    (consent defaults to "denied" so the banner stays out of unrelated specs);
//  - nothing leaves the machine: GTM's loader is stubbed with an empty script,
//    every other non-localhost request is aborted, and the test fails if any
//    such request happened unless it opted in with `allowGtm`.
import { test as base, expect } from "@playwright/test";
import { QA_HELPERS } from "./inpage";

export type Theme = "light" | "dark";
export interface Seed {
  theme: Theme | null;
  consent: "granted" | "denied" | null;
}

export const test = base.extend<{ seed: Seed; allowGtm: boolean; external: string[] }>({
  seed: [{ theme: "light", consent: "denied" }, { option: true }],
  allowGtm: [false, { option: true }],

  context: async ({ context, seed }, use) => {
    await context.addInitScript(({ theme, consent }) => {
      try {
        if (theme) localStorage.setItem("theme", theme);
        if (consent) localStorage.setItem("analytics-consent", consent);
      } catch {
        // A test that blocks storage seeds nothing.
      }
    }, seed);
    await context.addInitScript({ content: QA_HELPERS });
    await use(context);
  },

  external: [
    async ({ context, allowGtm }, use) => {
      const seen: string[] = [];
      await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => {
        const url = route.request().url();
        seen.push(url);
        if (url.startsWith("https://www.googletagmanager.com/gtm.js")) {
          return route.fulfill({ status: 200, contentType: "application/javascript", body: "/* GTM stub */" });
        }
        return route.abort();
      });
      await use(seen);
      if (!allowGtm) expect(seen, "no request may leave the site").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
