import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "spaces.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS plans (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    tagline   TEXT NOT NULL,
    price     INTEGER NOT NULL,
    period    TEXT NOT NULL,
    features  TEXT NOT NULL,
    excluded  TEXT NOT NULL,
    featured  INTEGER NOT NULL DEFAULT 0,
    color     TEXT NOT NULL,
    sort      INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS spaces (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    type      TEXT NOT NULL,
    floor     TEXT NOT NULL,
    capacity  INTEGER NOT NULL,
    price     INTEGER NOT NULL,
    icon      TEXT NOT NULL,
    color     TEXT NOT NULL,
    status    TEXT NOT NULL DEFAULT 'active',
    sort      INTEGER NOT NULL DEFAULT 0
  );
`);

/**
 * Catalog seed. Values match what the UI used to hardcode, so the dashboard and
 * Spaces page look the same the first time this runs against an empty database.
 */
const SEED = [
  { id: "open-desks",    name: "Open Work Floor", type: "Open Desks",     floor: "Floor 2", capacity: 60, price: 499,   icon: "💼",  color: "var(--accent)",  sort: 1 },
  { id: "private-cabins",name: "Private Cabin A", type: "Private Cabins", floor: "Floor 3", capacity: 12, price: 3500,  icon: "🏛️", color: "var(--blue)",    sort: 2 },
  { id: "meeting-rooms", name: "Meeting Room 1",  type: "Meeting Rooms",  floor: "Floor 3", capacity: 24, price: 1200,  icon: "🗣️", color: "var(--green)",   sort: 3 },
  { id: "event-space",   name: "Conference Hall", type: "Event Space",    floor: "Floor 4", capacity: 20, price: 8000,  icon: "📽️", color: "var(--accent2)", sort: 4 },
  { id: "podcast-studio",name: "Podcast Studio",  type: "Podcast Studio", floor: "Floor 5", capacity: 6,  price: 2500,  icon: "🎙️", color: "var(--purple)",  sort: 5 },
];

/**
 * One membership at three commitment periods. Prices are whole rupees — the UI
 * formats them, because grouping is a presentation concern (and an Indian
 * grouping differs from the default).
 */
const PLAN_SEED = [
  {
    id: "day-pass", name: "Day Pass", tagline: "Drop in for a day",
    price: 499, period: "day", featured: 0, color: "var(--blue)", sort: 1,
    features: ["Open desk workspace", "High-speed WiFi", "Complimentary coffee", "Locker access"],
    excluded: ["Private cabin", "Meeting room credits"],
  },
  {
    id: "monthly-flex", name: "Monthly Flex", tagline: "Best for freelancers",
    price: 7999, period: "month", featured: 1, color: "var(--accent)", sort: 2,
    features: ["Dedicated hot desk", "High-speed WiFi", "Unlimited coffee & tea", "Locker access", "4 meeting room hrs/mo", "Community events"],
    excluded: [],
  },
  {
    id: "annual-flex", name: "Annual Flex", tagline: "Best value, billed yearly",
    price: 24999, period: "year", featured: 0, color: "var(--purple)", sort: 3,
    features: ["Everything in Monthly Flex", "8 meeting room hrs/mo", "Business address", "Priority booking", "GST invoice & reports", "Dedicated support staff"],
    excluded: [],
  },
];

const toPlan = (row) => ({
  id: row.id, name: row.name, tagline: row.tagline,
  price: row.price, period: row.period,
  features: JSON.parse(row.features),
  excluded: JSON.parse(row.excluded),
  featured: row.featured === 1,
  color: row.color,
});

export const listPlans = () =>
  db.prepare("SELECT * FROM plans ORDER BY sort").all().map(toPlan);

export const findPlan = (id) => {
  const row = db.prepare("SELECT * FROM plans WHERE id = ?").get(id);
  return row ? toPlan(row) : null;
};

export const countPlans = () => db.prepare("SELECT COUNT(*) AS n FROM plans").get().n;

export function seedPlans() {
  if (countPlans() > 0) return false;
  const insert = db.prepare(
    `INSERT INTO plans (id, name, tagline, price, period, features, excluded, featured, color, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const p of PLAN_SEED) {
    insert.run(p.id, p.name, p.tagline, p.price, p.period,
               JSON.stringify(p.features), JSON.stringify(p.excluded),
               p.featured, p.color, p.sort);
  }
  return true;
}

export function seed() {
  if (db.prepare("SELECT COUNT(*) AS n FROM spaces").get().n > 0) return false;
  const insert = db.prepare(
    `INSERT INTO spaces (id, name, type, floor, capacity, price, icon, color, status, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
  );
  for (const s of SEED) {
    insert.run(s.id, s.name, s.type, s.floor, s.capacity, s.price, s.icon, s.color, s.sort);
  }
  return true;
}

const toSpace = (row) => ({
  id: row.id, name: row.name, type: row.type, floor: row.floor,
  capacity: row.capacity, price: row.price, icon: row.icon,
  color: row.color, status: row.status,
});

export const listSpaces = () =>
  db.prepare("SELECT * FROM spaces ORDER BY sort").all().map(toSpace);

export const findSpace = (id) => {
  const row = db.prepare("SELECT * FROM spaces WHERE id = ?").get(id);
  return row ? toSpace(row) : null;
};

/** Capacity per type — the denominator the gateway divides bookings by. */
export const listTypes = () =>
  db
    .prepare(
      `SELECT type AS label, color, SUM(capacity) AS capacity
       FROM spaces GROUP BY type, color ORDER BY MIN(sort)`
    )
    .all()
    .map((r) => ({ label: r.label, color: r.color, capacity: r.capacity }));
