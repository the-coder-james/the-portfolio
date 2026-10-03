// @vitest-environment node
// UT-01 / UT-09: both stores are imported during server rendering, where there
// is no document and no localStorage. They must answer with the defaults the
// server HTML is rendered with.
import { describe, expect, it } from "vitest";
import { getTheme } from "@/components/common/tsx/ThemeProvider";
import { getConsent } from "@/components/common/tsx/ConsentStore";

describe("SSR guards (no DOM, no storage)", () => {
  it("getTheme() is light without a document", () => {
    expect(typeof document).toBe("undefined");
    expect(getTheme()).toBe("light");
  });

  it("getConsent() is unset without localStorage", () => {
    expect(typeof localStorage).toBe("undefined");
    expect(getConsent()).toBe("unset");
  });
});
