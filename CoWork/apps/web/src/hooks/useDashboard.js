import { useCallback, useEffect, useRef, useState } from "react";
import { api, EVENTS_URL } from "../api/client.js";

/**
 * Dashboard data, kept live.
 *
 * Fetches once, then listens on the gateway's SSE stream and refetches whenever a
 * booking is created anywhere. If the stream can't be established (proxy in the
 * way, service down) it falls back to a slow poll, so the page still updates —
 * just less promptly — rather than silently going stale.
 */
export function useDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;          // a burst of events shouldn't stampede
    inFlight.current = true;
    try {
      setData(await api.dashboard());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    let source;
    let pollId;

    const startPolling = () => {
      if (!pollId) pollId = setInterval(refresh, 30000);
    };

    try {
      source = new EventSource(EVENTS_URL);
      source.addEventListener("ready", () => setLive(true));
      source.addEventListener("booking.created", refresh);
      source.onerror = () => {
        // EventSource retries on its own; the poll is the safety net if it can't.
        setLive(false);
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      source?.close();
      if (pollId) clearInterval(pollId);
    };
  }, [refresh]);

  return { data, error, live, refresh };
}
