import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "addons.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS addons (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL,
    plan_label  TEXT NOT NULL,
    price       INTEGER NOT NULL,
    unit        TEXT NOT NULL,
    color       TEXT NOT NULL,
    sort        INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    addon_id   TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    -- One subscription per user per add-on: subscribing twice is the same as
    -- subscribing once, so a double-click can't create two billable rows.
    UNIQUE(user_id, addon_id)
  );
  CREATE INDEX IF NOT EXISTS idx_subs_user ON subscriptions(user_id);
`);

const SEED = [
  { id: "food",       name: "Food & Beverages", description: "Catering, snacks, meals on demand", icon: "🍽️", plan_label: "Daily Lunch", price: 250, unit: "day",     color: "var(--accent)",  sort: 1 },
  { id: "conveyance", name: "Conveyance",       description: "Cab booking, airport transfers",    icon: "🚗",  plan_label: "On-demand",   price: 350, unit: "trip",    color: "var(--blue)",    sort: 2 },
  { id: "it-support", name: "IT Support",       description: "Tech setup, printer, projector",    icon: "💻",  plan_label: "On-demand",   price: 400, unit: "request", color: "var(--green)",   sort: 3 },
  { id: "locker",     name: "Secure Locker",    description: "Daily or monthly locker rental",    icon: "🔒",  plan_label: "Monthly",     price: 500, unit: "mo",      color: "var(--purple)",  sort: 4 },
];

const toAddon = (row) => ({
  id: row.id, name: row.name, description: row.description, icon: row.icon,
  planLabel: row.plan_label, price: row.price, unit: row.unit,
  color: row.color,
});

export const listAddons = () =>
  db.prepare("SELECT * FROM addons ORDER BY sort").all().map(toAddon);

export const findAddon = (id) => {
  const row = db.prepare("SELECT * FROM addons WHERE id = ?").get(id);
  return row ? toAddon(row) : null;
};

export const countAddons = () => db.prepare("SELECT COUNT(*) AS n FROM addons").get().n;

/** Only ever the caller's own rows — the user id comes from the gateway. */
export const listSubscriptions = (userId) =>
  db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at")
    .all(userId)
    .map((r) => ({ id: r.id, addonId: r.addon_id, status: r.status, createdAt: r.created_at }));

export function subscribe(userId, addonId) {
  const existing = db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND addon_id = ?")
    .get(userId, addonId);

  if (existing) {
    // Idempotent: re-subscribing reactivates rather than erroring or duplicating.
    if (existing.status !== "active") {
      db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(existing.id);
    }
    return { id: existing.id, addonId, status: "active", createdAt: existing.created_at };
  }

  const row = { id: randomUUID(), createdAt: new Date().toISOString() };
  db.prepare(
    `INSERT INTO subscriptions (id, user_id, addon_id, status, created_at)
     VALUES (?, ?, ?, 'active', ?)`
  ).run(row.id, userId, addonId, row.createdAt);
  return { id: row.id, addonId, status: "active", createdAt: row.createdAt };
}

/** Returns whether anything was removed, so the caller can answer 404 honestly. */
export const unsubscribe = (userId, addonId) =>
  db.prepare("DELETE FROM subscriptions WHERE user_id = ? AND addon_id = ?").run(userId, addonId)
    .changes > 0;

export function seed() {
  if (countAddons() > 0) return false;
  const insert = db.prepare(
    `INSERT INTO addons (id, name, description, icon, plan_label, price, unit, color, sort)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const a of SEED) {
    insert.run(a.id, a.name, a.description, a.icon, a.plan_label, a.price, a.unit, a.color, a.sort);
  }
  return true;
}
