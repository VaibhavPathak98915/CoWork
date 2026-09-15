/** An error with an HTTP status whose message is written to be shown to the user. */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
    // Marks the message as deliberate. Anything without this is an unexpected
    // failure whose text could leak internals, so it gets a generic reply.
    this.expose = true;
  }
  static badRequest(message, code) { return new ApiError(400, message, code); }
  static unauthorized(message = "Not signed in") { return new ApiError(401, message); }
  static conflict(message, code) { return new ApiError(409, message, code); }
  static unavailable(message) { return new ApiError(503, message); }
}

/** Wraps an async route so a rejected promise reaches the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const notFound = (req, res) =>
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });

/**
 * Terminal error middleware.
 *
 * What decides whether the client sees the real message is INTENT, not status.
 * An ApiError was written to be read — including a 503 "the spaces service is
 * unavailable", which tells the user exactly what is wrong. Anything else is an
 * unexpected failure: logged in full here, reported as a bare generic line so no
 * stack trace or internal detail escapes.
 */
export const errorHandler = (serviceName) => (err, req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(`[${serviceName}] ${req.method} ${req.originalUrl}`, err);
  res.status(status).json({
    error: {
      message: err.expose ? err.message : "Something went wrong. Please try again.",
      ...(err.code ? { code: err.code } : {}),
    },
  });
};

/**
 * Calls another service. A refused connection becomes a clean 503 instead of an
 * unhandled fetch rejection, so one service being down degrades rather than crashes.
 */
export async function serviceFetch(url, options = {}, serviceName = "service") {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { "content-type": "application/json", ...(options.headers ?? {}) },
      signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
    });
  } catch (cause) {
    throw ApiError.unavailable(`The ${serviceName} service is unavailable. Is it running?`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, body?.error?.message ?? "Request failed", body?.error?.code);
  }
  return body;
}
