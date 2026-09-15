import { EventEmitter } from "node:events";

/**
 * In-process fan-out. Every SSE client attached to this service gets each event.
 * With more than one bookings replica this becomes Redis pub/sub — the emit and
 * subscribe calls stay where they are.
 */
export const bus = new EventEmitter();
bus.setMaxListeners(100);

export const publish = (type, data) => bus.emit("event", { type, data });

/**
 * Attaches an SSE stream to a response. Returns a cleanup function.
 * The retry hint and the heartbeat matter: without the heartbeat, proxies and
 * laptops-going-to-sleep silently drop an idle stream.
 */
export function attachStream(res, { heartbeatMs = 25000 } = {}) {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  res.write("retry: 3000\n\n");
  res.write(`event: ready\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

  const onEvent = ({ type, data }) =>
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  bus.on("event", onEvent);

  const heartbeat = setInterval(() => res.write(": ping\n\n"), heartbeatMs);

  return () => {
    clearInterval(heartbeat);
    bus.off("event", onEvent);
  };
}
