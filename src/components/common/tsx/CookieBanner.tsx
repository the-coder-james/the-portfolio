"use client";
import { useEffect, useRef, useState } from "react";
import {
  analyticsConfigured,
  deny,
  getConsent,
  grant,
  initConsent,
  onConsentSettings,
  type Consent,
} from "@/components/common/tsx/ConsentStore";

/**
 * Cookie consent banner.
 *
 * Shown only when a decision has not been made and a container is actually
 * configured -- a banner asking about analytics that do not exist is worse than
 * no banner. Accept and Decline are given equal visual weight: a prominent
 * Accept beside a buried Decline is a dark pattern and, under GDPR, not valid
 * consent.
 *
 * Rendered last in the body and dismissible by keyboard. It is a complementary
 * region rather than a dialog: it does not trap focus or block the page, since
 * declining is a single click and the site works either way.
 *
 * The footer's "Cookie settings" reopens it, so a choice can be changed or
 * withdrawn as easily as it was made. Reopened, it says what the current
 * choice is and takes focus, since the visitor just asked for it.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Consent>("unset");
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Re-injects GTM for a visitor who already accepted on a previous visit.
    initConsent();
    if (analyticsConfigured && getConsent() === "unset") setVisible(true);
    return onConsentSettings(() => {
      if (!analyticsConfigured) return;
      setCurrent(getConsent());
      setVisible(true);
    });
  }, []);

  // Reopened on request: move focus into the banner.
  useEffect(() => {
    if (visible && current !== "unset") firstButton.current?.focus();
  }, [visible, current]);

  if (!visible) return null;

  const choose = (fn: () => boolean | void) => () => {
    const mustReload = fn() === true;
    setVisible(false);
    setCurrent("unset");
    // Withdrawing after GTM ran: reload so nothing of it stays in the page.
    if (mustReload) window.location.reload();
  };

  return (
    <aside className="cookie-banner" role="complementary" aria-label="Cookie consent">
      <p className="cookie-banner-text">
        This site uses analytics cookies to count visits. Nothing is loaded until you
        choose, and declining keeps everything working.
        {current === "granted" && " You accepted earlier; declining now removes them."}
        {current === "denied" && " You declined earlier."}
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-btn" onClick={choose(deny)} ref={firstButton}>
          Decline
        </button>
        <button type="button" className="cookie-btn cookie-btn-accept" onClick={choose(grant)}>
          Accept
        </button>
      </div>
    </aside>
  );
}
