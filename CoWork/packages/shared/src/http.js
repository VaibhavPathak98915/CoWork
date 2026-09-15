/** An error with an HTTP status that is safe to show the user. */
export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
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
 * Terminal error middleware. Anything without an explicit status is treated as a
 * bug: logged in full on the server, reported to the client as a bare 500 so no
 * stack trace or internal detail escapes.
 */
export const errorHandler = (serviceName) => (err, req, res, _next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(`[${serviceName}] ${req.method} ${req.originalUrl}`, err);
  res.status(status).json({
    error: {
      message: status >= 500 ? "Something went wrong. Please try again." : err.message,
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
