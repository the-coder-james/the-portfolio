"use client";
import { analyticsConfigured, openConsentSettings, useConsent } from "@/components/common/tsx/ConsentStore";

/**
 * "Cookie settings" in the footer: reopens the consent banner so a choice can
 * be changed or withdrawn (GDPR Art. 7(3) -- withdrawing must be as easy as
 * consenting). Shown only once a choice exists; before that the banner itself
 * is on screen. Without a configured container there is nothing to consent
 * to, so it renders nothing.
 */
export function ConsentSettingsButton() {
  const consent = useConsent();
  if (!analyticsConfigured || consent === "unset") return null;
  return (
    <button type="button" className="footer-link" onClick={openConsentSettings}>
      Cookie settings
    </button>
  );
}
