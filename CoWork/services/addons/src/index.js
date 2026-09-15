import express from "express";
import { ApiError, asyncHandler, errorHandler, notFound, env } from "@cowork/shared";
import {
  db, seed, listAddons, findAddon, countAddons,
  listSubscriptions, subscribe, unsubscribe,
} from "./db.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

/** Identity is established by the gateway; this service only trusts the header. */
const callerId = (req) => {
  const userId = req.get("x-user-id");
  if (!userId) throw ApiError.unauthorized("Missing caller identity");
  return userId;
};

app.get("/health", (_req, res) =>
  res.json({
    service: "addons",
    status: "ok",
    addons: countAddons(),
    subscriptions: db.prepare("SELECT COUNT(*) AS n FROM subscriptions").get().n,
  })
);

app.get("/addons", (_req, res) => res.json({ addons: listAddons() }));

app.get(
  "/subscriptions",
  asyncHandler(async (req, res) => {
    res.json({ subscriptions: listSubscriptions(callerId(req)) });
  })
);

app.post(
  "/subscriptions",
  asyncHandler(async (req, res) => {
    const userId = callerId(req);
    const addonId = String(req.body?.addonId ?? "");
    if (!findAddon(addonId)) throw new ApiError(404, "Add-on not found", "NO_SUCH_ADDON");
    res.status(201).json({ subscription: subscribe(userId, addonId) });
  })
);

app.delete(
  "/subscriptions/:addonId",
  asyncHandler(async (req, res) => {
    const userId = callerId(req);
    if (!findAddon(req.params.addonId)) throw new ApiError(404, "Add-on not found", "NO_SUCH_ADDON");
    if (!unsubscribe(userId, req.params.addonId)) {
      throw new ApiError(404, "You are not subscribed to that add-on", "NOT_SUBSCRIBED");
    }
    res.json({ ok: true });
  })
);

app.use(notFound);
app.use(errorHandler("addons"));

if (seed()) console.log("[addons] seeded catalogue");

app.listen(env.addonsPort, "127.0.0.1", () =>
  console.log(`[addons] listening on http://127.0.0.1:${env.addonsPort}`)
);

const shutdown = () => { db.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
