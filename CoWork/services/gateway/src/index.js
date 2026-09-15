import express from "express";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import {
  ApiError, asyncHandler, errorHandler, notFound,
  env, serviceFetch, SESSION_COOKIE,
} from "@cowork/shared";
import { setSessionCookie, clearSessionCookie, requireAuth } from "./session.js";
import { rateLimit } from "./rateLimit.js";
import { composeDashboard, composeSpaces, composeAddons } from "./dashboard.js";

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
    const targets = [
      ["auth", env.authServiceUrl],
      ["spaces", env.spacesServiceUrl],
      ["bookings", env.bookingsServiceUrl],
      ["addons", env.addonsServiceUrl],
    ];
    const services = await Promise.all(
      targets.map(([name, url]) =>
        serviceFetch(`${url}/health`, {}, name).catch((err) => ({
          service: name, status: "down", error: err.message,
        }))
      )
    );
    res.json({ service: "gateway", status: "ok", services });
  })
);

/* ── dashboard ────────────────────────────────────────────────────────── */

app.get(
  "/api/dashboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await composeDashboard(req.session.userId));
  })
);

app.get(
  "/api/spaces",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await composeSpaces(req.session.userId));
  })
);

app.get(
  "/api/plans",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await serviceFetch(`${env.spacesServiceUrl}/plans`, {}, "spaces"));
  })
);

app.get(
  "/api/addons",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await composeAddons(req.session.userId));
  })
);

app.post(
  "/api/addons/:id/subscription",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await serviceFetch(
        `${env.addonsServiceUrl}/subscriptions`,
        { method: "POST", body: JSON.stringify({ addonId: req.params.id }), headers: req.serviceHeaders },
        "add-ons"
      )
    );
  })
);

app.delete(
  "/api/addons/:id/subscription",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(
      await serviceFetch(
        `${env.addonsServiceUrl}/subscriptions/${encodeURIComponent(req.params.id)}`,
        { method: "DELETE", headers: req.serviceHeaders },
        "add-ons"
      )
    );
  })
);

app.post(
  "/api/bookings",
  requireAuth,
  asyncHandler(async (req, res) => {
    // The booking row snapshots who made it, so resolve the display name once
    // here rather than making the bookings service depend on auth.
    const { user } = await auth(`/users/${req.session.userId}`);
    const result = await serviceFetch(
      `${env.bookingsServiceUrl}/bookings`,
      {
        method: "POST",
        body: JSON.stringify(req.body),
        headers: { ...req.serviceHeaders, "x-user-name": user.name },
      },
      "bookings"
    );
    res.status(201).json(result);
  })
);

/**
 * Live updates. The browser opens one EventSource here; the gateway streams the
 * bookings service's event feed straight through, having checked the session
 * cookie first. Services never face the internet, even for SSE.
 */
app.use(
  "/api/events",
  requireAuth,
  createProxyMiddleware({
    target: env.bookingsServiceUrl,
    changeOrigin: true,
    // app.use() strips the mount path before the proxy sees the request, so
    // req.url is already "/" here — a "^/api/events" regex would never match.
    pathRewrite: () => "/events",
    on: {
      proxyReq: (proxyReq, req) => {
        for (const [key, val] of Object.entries(req.serviceHeaders ?? {})) {
          proxyReq.setHeader(key, val);
        }
      },
    },
  })
);

/*
 * Adding a service: see /api/events and /api/bookings above for the two shapes —
 * proxy the whole surface through, or compose it here. Either way the service
 * reads x-user-id / x-user-role and writes no auth code. README has the steps.
 */

app.use(notFound);
app.use(errorHandler("gateway"));

app.listen(env.gatewayPort, "127.0.0.1", () =>
  console.log(`[gateway] listening on http://127.0.0.1:${env.gatewayPort} (cookie: ${SESSION_COOKIE})`)
);
