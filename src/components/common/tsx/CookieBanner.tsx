"use client";
import { useEffect, useState } from "react";
import { analyticsConfigured, deny, getConsent, grant, initConsent } from "@/components/common/tsx/ConsentStore";

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
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Re-injects GTM for a visitor who already accepted on a previous visit.
    initConsent();
    if (analyticsConfigured && getConsent() === "unset") setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (fn: () => void) => () => {
    fn();
    setVisible(false);
  };

  return (
    <aside className="cookie-banner" role="complementary" aria-label="Cookie consent">
      <p className="cookie-banner-text">
        This site uses analytics cookies to count visits. Nothing is loaded until you
        choose, and declining keeps everything working.
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="cookie-btn" onClick={choose(deny)}>
          Decline
        </button>
        <button type="button" className="cookie-btn cookie-btn-accept" onClick={choose(grant)}>
          Accept
        </button>
      </div>
    </aside>
  );
}
