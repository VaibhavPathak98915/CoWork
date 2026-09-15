import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// This service owns this file outright — no other service reads it. That is the
// point of database-per-service: schema changes here affect nobody else.
const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, "auth.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'User',
    created_at    TEXT NOT NULL
  );
`);

/** Strips password_hash. Every route returns users through this. */
export const toPublicUser = (row) =>
  row && { id: row.id, name: row.name, email: row.email, role: row.role, createdAt: row.created_at };

export const findByEmail = (email) =>
  db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(email);

export const findById = (id) => db.prepare("SELECT * FROM users WHERE id = ?").get(id);

export const insertUser = (user) =>
  db
    .prepare(
      `INSERT INTO users (id, name, email, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt);

export const countUsers = () => db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
