import { env, serviceFetch } from "@cowork/shared";

/**
 * API composition. The dashboard is one screen made of three services' data, and
 * this is the only place that knows that. Services stay unaware of each other.
 *
 * allSettled, not all: one service being down should cost you one card, not the
 * whole page.
 */
export async function composeDashboard(userId) {
  const [members, types, recent, stats] = await Promise.allSettled([
    serviceFetch(`${env.authServiceUrl}/stats`, {}, "auth"),
    serviceFetch(`${env.spacesServiceUrl}/types`, {}, "spaces"),
    serviceFetch(`${env.bookingsServiceUrl}/bookings/recent?limit=5`, {}, "bookings"),
    serviceFetch(`${env.bookingsServiceUrl}/bookings/stats`, { headers: { "x-user-id": userId } }, "bookings"),
  ]);

  const value = (settled, fallback) => (settled.status === "fulfilled" ? settled.value : fallback);
  const degraded = [];
  if (members.status === "rejected") degraded.push("auth");
  if (types.status === "rejected") degraded.push("spaces");
  if (recent.status === "rejected" || stats.status === "rejected") degraded.push("bookings");

  const memberStats = value(members, { stats: null }).stats;
  const bookingStats = value(stats, { stats: null }).stats;
  const seatsByType = bookingStats?.seatsByType ?? {};

  // With bookings down we know the rooms but not how full they are. Report that
  // as unknown (null), never as 0% — an empty bar would read as "nothing booked".
  const occupancyKnown = bookingStats != null;
  const occupancy = value(types, { types: [] }).types.map((t) => ({
    label: t.label,
    color: t.color,
    // Clamp: overbooking a room shouldn't render a bar past the end of its track.
    value: occupancyKnown
      ? t.capacity
        ? Math.min(100, Math.round(((seatsByType[t.label] ?? 0) / t.capacity) * 100))
        : 0
      : null,
    seats: occupancyKnown ? seatsByType[t.label] ?? 0 : null,
    capacity: t.capacity,
  }));

  const mine = bookingStats?.mine ?? null;
  const points = mine == null ? null : mine * 10;
  const tier =
    points == null ? "Member"
    : points >= 200 ? "Platinum Member"
    : points >= 100 ? "Gold Member"
    : points >= 40 ? "Silver Member"
    : "Bronze Member";

  return {
    stats: [
      {
        icon: "🏢",
        label: "Active Members",
        value: memberStats?.total ?? null,
        change: memberStats ? `↑ ${memberStats.createdThisMonth} this month` : "unavailable",
        up: true,
        color: "var(--accent)",
      },
      {
        icon: "📅",
        label: "Bookings Today",
        value: bookingStats?.today ?? null,
        change: bookingStats ? describeDelta(bookingStats.today, bookingStats.yesterday) : "unavailable",
        up: (bookingStats?.today ?? 0) >= (bookingStats?.yesterday ?? 0),
        color: "var(--blue)",
      },
    ],
    recentBookings: value(recent, { bookings: [] }).bookings,
    occupancy,
    membership: { tier, points, bookings: mine },
    degraded,
    generatedAt: new Date().toISOString(),
  };
}

const describeDelta = (today, yesterday) => {
  const diff = today - yesterday;
  if (diff === 0) return "Same as yesterday";
  return diff > 0 ? `↑ ${diff} from yesterday` : `↓ ${Math.abs(diff)} from yesterday`;
};

/**
 * The space catalogue with today's availability folded in.
 *
 * Composed here rather than in either service: spaces owns what exists, bookings
 * owns what is taken, and neither should have to know about the other. If
 * bookings is unreachable the catalogue still returns, with seatsFree null —
 * unknown availability, never a fabricated "all free".
 */
export async function composeSpaces(userId) {
  const [catalog, stats] = await Promise.allSettled([
    serviceFetch(`${env.spacesServiceUrl}/spaces`, {}, "spaces"),
    serviceFetch(`${env.bookingsServiceUrl}/bookings/stats`, { headers: { "x-user-id": userId } }, "bookings"),
  ]);

  // A missing catalogue is fatal for this endpoint — there is nothing to show.
  if (catalog.status === "rejected") throw catalog.reason;

  const seatsBySpace = stats.status === "fulfilled" ? stats.value.stats.seatsBySpace ?? {} : null;

  const spaces = catalog.value.spaces.map((space) => {
    if (seatsBySpace === null) {
      return { ...space, seatsTaken: null, seatsFree: null, availability: "unknown" };
    }
    const seatsTaken = seatsBySpace[space.id] ?? 0;
    const seatsFree = Math.max(0, space.capacity - seatsTaken);
    return {
      ...space,
      seatsTaken,
      seatsFree,
      availability:
        space.status !== "active" ? "unavailable"
        : seatsFree === 0 ? "full"
        : seatsFree <= space.capacity * 0.25 ? "filling"
        : "available",
    };
  });

  return { spaces, degraded: seatsBySpace === null ? ["bookings"] : [] };
}
