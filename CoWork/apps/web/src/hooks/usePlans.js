import { useEffect, useState } from "react";
import { api } from "../api/client.js";

/** The plan catalog, fetched once per mount. Prices live in the spaces service. */
export function usePlans() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.plans()
      .then(({ plans }) => { if (!cancelled) setPlans(plans); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return { plans, error, loading: !plans && !error };
}
