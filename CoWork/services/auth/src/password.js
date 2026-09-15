import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

// Stored as scrypt$N$r$p$salt$hash — the parameters travel with the hash, so they
// can be raised later without invalidating rows written under the old cost.
const N = 16384, r = 8, p = 1, KEY_LEN = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(16);
  const key = await scryptAsync(plain, salt, KEY_LEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  const parts = String(stored).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, saltHex, keyHex] = parts;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scryptAsync(plain, Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(n), r: Number(rr), p: Number(pp),
  });
  // Constant-time: a plain === comparison leaks how much of the hash matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
