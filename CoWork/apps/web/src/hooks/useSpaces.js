import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { useLiveUpdates } from "./useLiveUpdates.js";

const LIVE_EVENTS = ["booking.created"];

/**
 * The space catalogue with today's availability, refreshed whenever anyone
 * books — so the seat counts on screen stay true while you look at them.
 */
export function useSpaces() {
  const [spaces, setSpaces] = useState(null);
  const [degraded, setDegraded] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const { spaces, degraded } = await api.spaces();
      setSpaces(spaces);
      setDegraded(degraded ?? []);
    } catch (e) {
      setError(e.message);
      setSpaces(null);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useLiveUpdates(LIVE_EVENTS, refresh, { onLiveChange: setLive });

  return { spaces, degraded, error, loading, live, refresh };
}
