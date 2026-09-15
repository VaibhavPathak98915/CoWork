import express from "express";
import { randomUUID } from "node:crypto";
import {
  ApiError, asyncHandler, errorHandler, notFound,
  env, signSession, registerSchema, loginSchema,
} from "@cowork/shared";
import { db, findByEmail, findById, insertUser, toPublicUser, countUsers } from "./db.js";
import { hashPassword, verifyPassword } from "./password.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

/** Turns a zod failure into a 400 carrying the first human-readable message. */
const parse = (schema, body) => {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw ApiError.badRequest(result.error.issues[0].message, "VALIDATION_FAILED");
  }
  return result.data;
};

const createUser = async ({ name, email, password, role }) => {
  const user = {
    id: randomUUID(),
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };
  try {
    insertUser(user);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      throw ApiError.conflict("That email is already registered", "EMAIL_TAKEN");
    }
    throw err;
  }
  return findById(user.id);
};

app.get("/health", (_req, res) => res.json({ service: "auth", status: "ok", users: countUsers() }));

app.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = parse(registerSchema, req.body);
    const row = await createUser(input);
    const token = await signSession({ userId: row.id, role: row.role });
    res.status(201).json({ user: toPublicUser(row), token });
  })
);

app.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = parse(loginSchema, req.body);
    const row = findByEmail(email);

    // Same error and roughly the same work either way: a faster "no such user"
    // reply would let someone enumerate which emails have accounts.
    const ok = row ? await verifyPassword(password, row.password_hash) : await verifyPassword(password, "scrypt$16384$8$1$00$00");
    if (!row || !ok) throw new ApiError(401, "Invalid email or password", "BAD_CREDENTIALS");

    const token = await signSession({ userId: row.id, role: row.role });
    res.json({ user: toPublicUser(row), token });
  })
);

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const row = findById(req.params.id);
    if (!row) throw new ApiError(404, "User not found");
    res.json({ user: toPublicUser(row) });
  })
);

app.use(notFound);
app.use(errorHandler("auth"));

/** A known-good account so the login page works the moment the stack boots. */
async function seed() {
  if (findByEmail("admin@cowork.dev")) return;
  await createUser({ name: "Vaibhav", email: "admin@cowork.dev", password: "cowork123", role: "Admin" });
  console.log("[auth] seeded demo account admin@cowork.dev / cowork123");
}

await seed();

// Localhost only: the gateway is the single entry point from outside.
app.listen(env.authPort, "127.0.0.1", () =>
  console.log(`[auth] listening on http://127.0.0.1:${env.authPort}`)
);

const shutdown = () => { db.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
