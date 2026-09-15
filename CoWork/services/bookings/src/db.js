import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { localDate, localDateDaysAgo } from "@cowork/shared";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "bookings.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS bookings (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    user_name   TEXT NOT NULL,
    space_id    TEXT NOT NULL,
    space_name  TEXT NOT NULL,
    space_type  TEXT NOT NULL,
    plan        TEXT NOT NULL,
    duration    TEXT NOT NULL,
    starts_on   TEXT NOT NULL,
    seats       INTEGER NOT NULL DEFAULT 1,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_starts_on ON bookings(starts_on);
  CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
`);

export const today = () => localDate();
const daysAgo = (n) => localDateDaysAgo(n);

const toBooking = (row) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  spaceId: row.space_id,
  spaceName: row.space_name,
  spaceType: row.space_type,
  plan: row.plan,
  duration: row.duration,
  startsOn: row.starts_on,
  seats: row.seats,
  status: row.status,
  createdAt: row.created_at,
});

export function insertBooking(booking) {
  const row = {
    id: randomUUID(),
    seats: 1,
    status: "active",
    createdAt: new Date().toISOString(),
    ...booking,
  };
  db.prepare(
    `INSERT INTO bookings (id, user_id, user_name, space_id, space_name, space_type,
                           plan, duration, starts_on, seats, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(row.id, row.userId, row.userName, row.spaceId, row.spaceName, row.spaceType,
        row.plan, row.duration, row.startsOn, row.seats, row.status, row.createdAt);
  return toBooking(db.prepare("SELECT * FROM bookings WHERE id = ?").get(row.id));
}

/** Seats already committed for one space on one day. The denominator of "free". */
export const seatsBookedFor = (spaceId, date) =>
  db
    .prepare(
      `SELECT COALESCE(SUM(seats), 0) AS seats
       FROM bookings WHERE space_id = ? AND starts_on = ? AND status != 'expired'`
    )
    .get(spaceId, date).seats;

export const recentBookings = (limit = 5) =>
  db.prepare("SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?").all(limit).map(toBooking);

const countOn = (date) =>
  db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE starts_on = ?").get(date).n;

/** Everything the dashboard's numbers are derived from, in one round trip. */
export const stats = (userId) => ({
  today: countOn(today()),
  yesterday: countOn(daysAgo(1)),
  total: db.prepare("SELECT COUNT(*) AS n FROM bookings").get().n,
  mine: userId
    ? db.prepare("SELECT COUNT(*) AS n FROM bookings WHERE user_id = ?").get(userId).n
    : 0,
  // Seats in use today per individual space — what the Spaces page counts down.
  // Kept separate from seatsByType: one type may hold several spaces, and today
  // they line up only because each type happens to have exactly one.
  seatsBySpace: db
    .prepare(
      `SELECT space_id AS id, SUM(seats) AS seats
       FROM bookings WHERE starts_on = ? AND status != 'expired' GROUP BY space_id`
    )
    .all(today())
    .reduce((acc, r) => ({ ...acc, [r.id]: r.seats }), {}),
  // Seats in use today per space type — the numerator for occupancy.
  seatsByType: db
    .prepare(
      `SELECT space_type AS type, SUM(seats) AS seats
       FROM bookings WHERE starts_on = ? AND status != 'expired' GROUP BY space_type`
    )
    .all(today())
    .reduce((acc, r) => ({ ...acc, [r.type]: r.seats }), {}),
});

/** A populated dashboard on a fresh database, spread over today and yesterday. */
export function seed() {
  if (db.prepare("SELECT COUNT(*) AS n FROM bookings").get().n > 0) return false;
  const demo = [
    { userName: "Priya Mehta", spaceId: "open-desks",     spaceName: "Open Work Floor", spaceType: "Open Desks",     plan: "Day Pass",       duration: "Full Day", seats: 14, status: "active",  startsOn: today() },
    { userName: "Amit Verma",  spaceId: "private-cabins", spaceName: "Private Cabin A", spaceType: "Private Cabins", plan: "Annual Flex",   duration: "Monthly",  seats: 8,  status: "active",  startsOn: today() },
    { userName: "Sneha Rao",   spaceId: "meeting-rooms",  spaceName: "Meeting Room 1",  spaceType: "Meeting Rooms",  plan: "Monthly Flex",   duration: "1 Hour",   seats: 6,  status: "pending", startsOn: today() },
    { userName: "Karan Singh", spaceId: "event-space",    spaceName: "Conference Hall", spaceType: "Event Space",    plan: "Day Pass",       duration: "Half Day", seats: 8,  status: "expired", startsOn: daysAgo(1) },
    { userName: "Neha Gupta",  spaceId: "podcast-studio", spaceName: "Podcast Studio",  spaceType: "Podcast Studio", plan: "Day Pass",       duration: "1 Hour",   seats: 2,  status: "active",  startsOn: today() },
    { userName: "Rohit Nair",  spaceId: "open-desks",     spaceName: "Open Work Floor", spaceType: "Open Desks",     plan: "Monthly Flex",   duration: "Monthly",  seats: 5,  status: "active",  startsOn: daysAgo(1) },
  ];
  demo.forEach((b, i) =>
    insertBooking({
      ...b,
      userId: "seed",
      // Stagger creation times so "recent" has a stable, sensible order.
      createdAt: new Date(Date.now() - (demo.length - i) * 3600000).toISOString(),
    })
  );
  return true;
}
