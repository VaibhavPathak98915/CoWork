import { ApiError, env, verifySession, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@cowork/shared";

const cookieOptions = {
  httpOnly: true,           // unreadable from document.cookie, so XSS can't lift it
  sameSite: "lax",          // not sent on cross-site POSTs
  secure: env.isProduction, // HTTPS-only once deployed
  path: "/",
  maxAge: SESSION_MAX_AGE_MS,
};

export const setSessionCookie = (res, token) => res.cookie(SESSION_COOKIE, token, cookieOptions);

export const clearSessionCookie = (res) =>
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });

/**
 * Verifies the session cookie and hands downstream services a plain identity.
 * Services therefore need no JWT code of their own — they trust these headers,
 * which is safe because only the gateway is reachable from outside.
 */
export async function requireAuth(req, _res, next) {
  const session = await verifySession(req.cookies?.[SESSION_COOKIE]);
  if (!session) return next(ApiError.unauthorized());
  req.session = session;
  req.serviceHeaders = { "x-user-id": session.userId, "x-user-role": session.role };
  next();
}
