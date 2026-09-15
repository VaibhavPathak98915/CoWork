import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "spaces.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
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
