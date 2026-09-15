import { useEffect } from "react";
import { EVENTS_URL } from "../api/client.js";

/**
 * Subscribes to the gateway's event stream and runs `onEvent` whenever one of
 * `events` arrives.
 *
 * Shared by every screen that shows live data, so there is one EventSource
 * implementation rather than a copy per page. If the stream can't be
 * established it falls back to a slow poll — a page that quietly goes stale is
 * worse than one that refreshes late.
 *
 * `onEvent` is read through a ref so a caller passing an inline function does
 * not tear down and rebuild the connection on every render.
 */
export function useLiveUpdates(events, onEvent, { pollMs = 30000, onLiveChange } = {}) {
  useEffect(() => {
    let source;
    let pollId;
    const startPolling = () => { if (!pollId) pollId = setInterval(onEvent, pollMs); };

    try {
      source = new EventSource(EVENTS_URL);
      source.addEventListener("ready", () => onLiveChange?.(true));
      for (const name of events) source.addEventListener(name, onEvent);
      source.onerror = () => {
        onLiveChange?.(false);   // EventSource retries itself; poll is the safety net
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      source?.close();
      if (pollId) clearInterval(pollId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join(","), onEvent, pollMs]);
}
