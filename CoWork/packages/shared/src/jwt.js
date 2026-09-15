import { SignJWT, jwtVerify } from "jose";
import { requireEnv } from "./env.js";

export const SESSION_COOKIE = "cw_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const ISSUER = "cowork.auth";
const AUDIENCE = "cowork.web";

const secret = () => new TextEncoder().encode(requireEnv("JWT_SECRET"));

/** Signs the session claims. Keep the payload small — it travels in a cookie. */
export async function signSession({ userId, role }) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("7d")
    .sign(secret());
}

/** Returns { userId, role } or null — never throws, so callers just answer 401. */
export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
