/**
 * Env access shared by every service. Services are started with
 * `node --env-file=../../.env`, so process.env is already populated.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  gatewayPort: Number(process.env.GATEWAY_PORT ?? 4000),
  authPort: Number(process.env.AUTH_PORT ?? 4001),
  authServiceUrl: process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:4001",
  spacesPort: Number(process.env.SPACES_PORT ?? 4002),
  spacesServiceUrl: process.env.SPACES_SERVICE_URL ?? "http://127.0.0.1:4002",
  bookingsPort: Number(process.env.BOOKINGS_PORT ?? 4003),
  bookingsServiceUrl: process.env.BOOKINGS_SERVICE_URL ?? "http://127.0.0.1:4003",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  get isProduction() {
    return this.nodeEnv === "production";
  },
};

/**
 * Reads a required secret. In production a missing value is fatal: we refuse to
 * fall back to a default that would let anyone forge a session token.
 */
export function requireEnv(name) {
  const value = process.env[name];
  if (value) return value;
  if (env.isProduction) {
    throw new Error(`${name} is required in production. Set it in .env (see .env.example).`);
  }
  console.warn(
    `[shared] ${name} is not set — using an insecure development default. ` +
      `Run \`cp .env.example .env\` and set it.`
  );
  return `insecure-development-${name.toLowerCase()}`;
}
