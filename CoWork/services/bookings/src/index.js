import express from "express";
import {
  ApiError, asyncHandler, errorHandler, notFound,
  env, serviceFetch, createBookingSchema,
} from "@cowork/shared";
import { db, seed, insertBooking, recentBookings, stats } from "./db.js";
import { publish, attachStream } from "./events.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) =>
  res.json({ service: "bookings", status: "ok", bookings: stats().total })
);

/** SSE. Registered before the JSON routes so nothing else can buffer it. */
app.get("/events", (req, res) => {
  const detach = attachStream(res);
  req.on("close", detach);
});

app.get("/bookings/recent", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 50);
  res.json({ bookings: recentBookings(limit) });
});

app.get("/bookings/stats", (req, res) => res.json({ stats: stats(req.get("x-user-id")) }));

app.post(
  "/bookings",
  asyncHandler(async (req, res) => {
    const parsed = createBookingSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message, "VALIDATION_FAILED");
    }
    const input = parsed.data;

    // Identity comes from the gateway, which verified the session cookie. This
    // service does no auth of its own — see the gateway's requireAuth.
    const userId = req.get("x-user-id");
    const userName = req.get("x-user-name") || "Member";
    if (!userId) throw ApiError.unauthorized("Missing caller identity");

    // The catalog belongs to the spaces service, so ask it rather than keeping a
    // second copy of the truth. The name and type are then snapshotted on the row.
    const { space } = await serviceFetch(
      `${env.spacesServiceUrl}/spaces/${encodeURIComponent(input.spaceId)}`,
      {},
      "spaces"
    );
    if (input.seats > space.capacity) {
      throw ApiError.badRequest(`${space.name} seats only ${space.capacity}`, "OVER_CAPACITY");
    }

    const booking = insertBooking({
      userId,
      userName,
      spaceId: space.id,
      spaceName: space.name,
      spaceType: space.type,
      plan: input.plan,
      duration: input.duration,
      startsOn: input.startsOn,
      seats: input.seats,
      status: "active",
    });

    publish("booking.created", { id: booking.id, spaceType: booking.spaceType });
    res.status(201).json({ booking });
  })
);

app.use(notFound);
app.use(errorHandler("bookings"));

if (seed()) console.log("[bookings] seeded demo bookings");

app.listen(env.bookingsPort, "127.0.0.1", () =>
  console.log(`[bookings] listening on http://127.0.0.1:${env.bookingsPort}`)
);

const shutdown = () => { db.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
