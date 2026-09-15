import express from "express";
import cookieParser from "cookie-parser";
import {
  ApiError, asyncHandler, errorHandler, notFound,
  env, serviceFetch, SESSION_COOKIE,
} from "@cowork/shared";
import { setSessionCookie, clearSessionCookie, requireAuth } from "./session.js";
import { rateLimit } from "./rateLimit.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const auth = (path, options) => serviceFetch(`${env.authServiceUrl}${path}`, options, "auth");

/**
 * The browser never receives the JWT itself — the gateway swaps it for an
 * httpOnly cookie and returns only the user. That is the whole reason a token
 * stolen by injected JavaScript is not a threat here.
 */
const startSession = (res, { user, token }, status = 200) => {
  setSessionCookie(res, token);
  res.status(status).json({ user });
};

const credentials = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 });

app.post(
  "/api/auth/register",
  credentials,
  asyncHandler(async (req, res) => {
    const result = await auth("/register", { method: "POST", body: JSON.stringify(req.body) });
    startSession(res, result, 201);
  })
);

app.post(
  "/api/auth/login",
  credentials,
  asyncHandler(async (req, res) => {
    const result = await auth("/login", { method: "POST", body: JSON.stringify(req.body) });
    startSession(res, result);
  })
);

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get(
  "/api/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Read through to the service rather than trusting the cookie's claims, so a
    // deleted or renamed user is reflected immediately.
    const { user } = await auth(`/users/${req.session.userId}`);
    res.json({ user });
  })
);

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    const downstream = await auth("/health").catch((err) => ({ service: "auth", status: "down", error: err.message }));
    res.json({ service: "gateway", status: "ok", services: [downstream] });
  })
);

/*
 * Adding a service — the whole point of this layout. A bookings team writes
 * services/bookings, then adds two lines here and nothing else:
 *
 *   import { createProxyMiddleware } from "http-proxy-middleware";
 *   app.use("/api/bookings", requireAuth, createProxyMiddleware({
 *     target: env.bookingsServiceUrl,
 *     changeOrigin: true,
 *     pathRewrite: { "^/api/bookings": "" },
 *     on: { proxyReq: (proxyReq, req) => {
 *       for (const [k, v] of Object.entries(req.serviceHeaders)) proxyReq.setHeader(k, v);
 *     }},
 *   }));
 *
 * Their service reads x-user-id / x-user-role and writes no auth code at all.
 */

app.use(notFound);
app.use(errorHandler("gateway"));

app.listen(env.gatewayPort, "127.0.0.1", () =>
  console.log(`[gateway] listening on http://127.0.0.1:${env.gatewayPort} (cookie: ${SESSION_COOKIE})`)
);
