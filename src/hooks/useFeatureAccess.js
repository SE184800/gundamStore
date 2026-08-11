import { useEffect, useState } from "react";
import { getFeatureAccessRules } from "../services/FeatureAccessApiService";
import { hasAccountToken } from "../services/AccountApiService";

let rulesPromise = null;

function loadRules() {
  if (!rulesPromise) {
    rulesPromise = getFeatureAccessRules().catch(() => []);
  }
  return rulesPromise;
}

// Reads GET /api/feature-access once per page load (shared across every
// caller via the module-level promise above) and tells storefront UI
// whether a "soft" feature — product_review_submit, event_registration,
// restock_alert — currently requires login. Defaults to false (public)
// while loading or if the request fails, matching the backend's own seed
// default and today's ungated behavior — never block a guest action
// because of a flaky network call. Wishlist is intentionally not covered
// here: its real route (/api/account/wishlist) is hard-locked behind
// requireAuth and has no rule in this table (see API_REFERENCE.md 1.15).
export default function useFeatureAccess(featureCode) {
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    loadRules().then((rules) => {
      if (!alive) return;
      const rule = rules.find((r) => r.featureCode === featureCode);
      setRequiresAuth(Boolean(rule?.requiresAuth));
      setLoaded(true);
    });

    return () => {
      alive = false;
    };
  }, [featureCode]);

  return { requiresAuth, loaded, blocked: requiresAuth && !hasAccountToken() };
}
