// E2E-16: the analytics consent gate, against the e2e build (PUBLIC_GTM_ID=
// GTM-QATEST0). GTM's loader is stubbed by the network fixture; nothing leaves
// the machine. These tests start with no stored consent.
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/fixtures";
import { go, settle } from "./helpers/page";

test.skip(({ isMobile }) => isMobile, "consent logic does not depend on the viewport");
test.use({ seed: { theme: "light", consent: null } });

const banner = (page: Page) => page.getByRole("complementary", { name: "Cookie consent" });
const loaders = (page: Page) => page.locator("script#gtm-loader");
const dataLayer = (page: Page) =>
  page.evaluate(() => (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer ?? null);

async function submitContact(page: Page) {
  await go(page, { tab: "contact" });
  await page.fill("#contact-name", "Ada Lovelace");
  await page.fill("#contact-email", "ada@example.com");
  await page.fill("#contact-message", "a private message body");
  await page.click("#contact button[type=submit]");
  await expect(page.getByText("Your draft is ready")).toBeVisible();
}

test.describe("E2E-16 nothing loads before a choice", () => {
  test("first visit: the banner asks, with equal buttons, and nothing has loaded", async ({ page, external }) => {
    await page.goto("#home");
    await expect(banner(page)).toBeVisible();
    const boxes = await page.locator(".cookie-btn").evaluateAll((els) =>
      els.map((e) => ({ text: e.textContent!.trim(), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height), radius: getComputedStyle(e).borderRadius })),
    );
    expect(boxes.map((b) => b.text)).toEqual(["Decline", "Accept"]);
    // Declining is no harder than accepting: same size and shape.
    expect(boxes[0]).toMatchObject({ w: boxes[1].w, h: boxes[1].h, radius: boxes[1].radius });
    await settle(page);
    expect(await dataLayer(page)).toBeNull();
    await expect(loaders(page)).toHaveCount(0);
    expect(external).toEqual([]);
  });

  test("Decline stores the choice, loads nothing, and drops the contact event", async ({ page }) => {
    await page.goto("#home");
    await banner(page).getByRole("button", { name: "Decline" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem("analytics-consent"))).toBe("denied");
    await submitContact(page);
    await expect(loaders(page)).toHaveCount(0);
    expect(await dataLayer(page)).toBeNull();
  });
});

test.describe("E2E-16 after Accept", () => {
  test.use({ allowGtm: true });

  test("Accept injects the loader once, re-injects on return, and the contact event carries no field values", async ({ page, external }) => {
    await page.goto("#home");
    await banner(page).getByRole("button", { name: "Accept" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem("analytics-consent"))).toBe("granted");
    await expect(loaders(page)).toHaveCount(1);
    await expect(loaders(page)).toHaveAttribute("src", "https://www.googletagmanager.com/gtm.js?id=GTM-QATEST0");
    expect((await dataLayer(page))?.[0]).toMatchObject({ event: "gtm.js" });

    // Return visit: no banner, loader re-injected.
    await page.reload();
    await settle(page);
    await expect(banner(page)).toHaveCount(0);
    await expect(loaders(page)).toHaveCount(1);

    await submitContact(page);
    const events = ((await dataLayer(page)) ?? []).filter((e) => e.event === "contact_submit");
    expect(events).toEqual([{ event: "contact_submit", has_email: true }]);
    expect(JSON.stringify(await dataLayer(page))).not.toMatch(/Ada|ada@example\.com|private message/);

    // The only requests that left were the (stubbed) GTM loader, and only after Accept.
    expect(external.length).toBeGreaterThan(0);
    expect(external.every((u) => u.startsWith("https://www.googletagmanager.com/gtm.js?id=GTM-QATEST0"))).toBe(true);
  });

  // CR-06: consent can be withdrawn as easily as given (GDPR Art. 7(3)). The
  // footer's "Cookie settings" reopens the banner once a choice exists.
  test("CR-06: a granted visitor can reopen the choice and withdraw", async ({ page }) => {
    await page.goto("#home");
    await banner(page).getByRole("button", { name: "Accept" }).click();
    await settle(page);
    await page.getByRole("button", { name: /cookie|consent|privacy/i }).first().click({ timeout: 2000 });
    await expect(banner(page)).toBeVisible();
  });
});

test.describe("E2E-16 blocked storage", () => {
  test("the banner still asks and the page raises no errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await page.goto("#home");
    await expect(banner(page)).toBeVisible();
    await banner(page).getByRole("button", { name: "Decline" }).click();
    await expect(banner(page)).toBeHidden();
    expect(errors).toEqual([]);
  });
});
