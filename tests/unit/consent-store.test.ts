// UT-01..UT-06: the analytics consent gate (src/components/common/tsx/ConsentStore.ts).
// GTM_ID is read once at module scope from import.meta.env, so every test
// stubs the env, resets the module registry and imports a fresh copy.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Store = typeof import("@/components/common/tsx/ConsentStore");

async function load(gtmId: string): Promise<Store> {
  vi.stubEnv("PUBLIC_GTM_ID", gtmId);
  vi.resetModules();
  return import("@/components/common/tsx/ConsentStore");
}

const loaders = () => document.querySelectorAll("script#gtm-loader");
const dataLayer = () => (window as unknown as { dataLayer?: Record<string, unknown>[] }).dataLayer;
const events = () => {
  const seen: unknown[] = [];
  window.addEventListener("consentchange", (e) => seen.push((e as CustomEvent).detail));
  return seen;
};

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = "";
  Reflect.deleteProperty(window, "dataLayer");
});
afterEach(() => vi.restoreAllMocks());

describe("UT-01 getConsent", () => {
  it("is unset with nothing stored", async () => {
    expect((await load("GTM-T")).getConsent()).toBe("unset");
  });

  it("passes granted and denied through", async () => {
    const s = await load("GTM-T");
    localStorage.setItem("analytics-consent", "granted");
    expect(s.getConsent()).toBe("granted");
    localStorage.setItem("analytics-consent", "denied");
    expect(s.getConsent()).toBe("denied");
  });

  it("treats an unknown stored value as unset", async () => {
    localStorage.setItem("analytics-consent", "yes");
    expect((await load("GTM-T")).getConsent()).toBe("unset");
  });

  it("treats blocked storage as unset (the banner asks again)", async () => {
    const s = await load("GTM-T");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(s.getConsent()).toBe("unset");
  });
});

describe("UT-02 grant() with a container ID", () => {
  it("stores the choice, announces it, and injects the loader exactly once", async () => {
    const s = await load("GTM-T&1");
    const seen = events();
    s.grant();
    s.grant();
    expect(localStorage.getItem("analytics-consent")).toBe("granted");
    expect(seen).toEqual(["granted", "granted"]);
    expect(loaders()).toHaveLength(1);
    const script = loaders()[0] as HTMLScriptElement;
    expect(script.async).toBe(true);
    // The ID is URL-encoded into the loader URL.
    expect(script.src).toBe("https://www.googletagmanager.com/gtm.js?id=GTM-T%261");
    expect(dataLayer()).toHaveLength(1);
    expect(dataLayer()![0]).toMatchObject({ event: "gtm.js" });
    expect(typeof dataLayer()![0]["gtm.start"]).toBe("number");
  });
});

describe("UT-03 without PUBLIC_GTM_ID", () => {
  it("reports analytics as unconfigured and grant() injects nothing", async () => {
    const s = await load("");
    expect(s.analyticsConfigured).toBe(false);
    s.grant();
    expect(localStorage.getItem("analytics-consent")).toBe("granted");
    expect(loaders()).toHaveLength(0);
    expect(dataLayer()).toBeUndefined();
  });

  it("reports analytics as configured when an ID is set", async () => {
    expect((await load("GTM-T")).analyticsConfigured).toBe(true);
  });
});

describe("UT-04 deny()", () => {
  it("stores denied, announces it, and loads nothing", async () => {
    const s = await load("GTM-T");
    const seen = events();
    s.deny();
    expect(localStorage.getItem("analytics-consent")).toBe("denied");
    expect(seen).toEqual(["denied"]);
    expect(loaders()).toHaveLength(0);
    expect(dataLayer()).toBeUndefined();
  });

  it("still holds the choice for the visit when storage is blocked", async () => {
    const s = await load("GTM-T");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const seen = events();
    expect(() => s.deny()).not.toThrow();
    expect(seen).toEqual(["denied"]);
  });
});

describe("UT-05 initConsent() on a later visit", () => {
  it("re-injects for a visitor who accepted before", async () => {
    localStorage.setItem("analytics-consent", "granted");
    (await load("GTM-T")).initConsent();
    expect(loaders()).toHaveLength(1);
  });

  it.each(["denied", null])("injects nothing when consent is %s", async (stored) => {
    if (stored) localStorage.setItem("analytics-consent", stored);
    (await load("GTM-T")).initConsent();
    expect(loaders()).toHaveLength(0);
    expect(dataLayer()).toBeUndefined();
  });

  it("never duplicates a loader that is already in the page", async () => {
    localStorage.setItem("analytics-consent", "granted");
    const existing = document.createElement("script");
    existing.id = "gtm-loader";
    document.head.appendChild(existing);
    (await load("GTM-T")).initConsent();
    expect(loaders()).toHaveLength(1);
    expect(dataLayer()).toBeUndefined();
  });
});

describe("UT-06 trackEvent()", () => {
  it.each(["unset", "denied"])("drops events while consent is %s", async (state) => {
    if (state !== "unset") localStorage.setItem("analytics-consent", state);
    (await load("GTM-T")).trackEvent("contact_submit", { has_email: true });
    expect(dataLayer()).toBeUndefined();
  });

  it("pushes the event with its params once granted", async () => {
    localStorage.setItem("analytics-consent", "granted");
    (await load("GTM-T")).trackEvent("contact_submit", { has_email: true });
    expect(dataLayer()).toEqual([{ event: "contact_submit", has_email: true }]);
  });

  it("does nothing without a container, even with consent", async () => {
    localStorage.setItem("analytics-consent", "granted");
    (await load("")).trackEvent("contact_submit", { has_email: true });
    expect(dataLayer()).toBeUndefined();
  });

  it("never queues: events sent while declined do not appear after a later grant", async () => {
    const s = await load("GTM-T");
    s.deny();
    s.trackEvent("contact_submit", { has_email: false });
    s.grant();
    expect(dataLayer()!.map((e) => e.event)).toEqual(["gtm.js"]);
  });
});
