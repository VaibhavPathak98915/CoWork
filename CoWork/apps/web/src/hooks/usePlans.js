import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";

/**
 * The plan catalog. Three distinct states — loading, failed, loaded — because a
 * screen that can't tell "still fetching" from "this failed" ends up claiming to
 * be loading forever.
 */
export function usePlans() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { plans } = await api.plans();
      setPlans(plans);
    } catch (e) {
      setError(e.message);
      setPlans(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { plans, error, loading, refresh };
}
