/**
 * Fixed-window limiter for credential endpoints, layered on two keys:
 *
 *   per account  — one email hammered with many passwords (targeted brute force)
 *   per IP       — many accounts tried from one host (credential stuffing)
 *
 * A single per-IP counter can't tell those apart: set it low enough to stop a
 * brute force and you lock out everyone behind one office NAT (or a test suite
 * exercising its error paths). So the account limit is tight and the IP limit is
 * loose, and each catches the attack the other misses.
 *
 * Only failures count. A successful sign-in is not evidence of an attack.
 *
 * In memory, so it resets on restart and is per-process. With several gateway
 * replicas this belongs in Redis — the call sites don't change.
 */
export function rateLimit({
  windowMs = 15 * 60 * 1000,
  maxPerAccount = 8,
  maxPerIp = 40,
} = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  const read = (key) => {
    const entry = hits.get(key);
    return entry && entry.resetAt > Date.now() ? entry : null;
  };

  const bump = (key) => {
    const existing = read(key);
    if (existing) existing.count++;
    else hits.set(key, { count: 1, resetAt: Date.now() + windowMs });
  };

  return (req, res, next) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const keys = [
      [`ip:${req.ip}`, maxPerIp],
      ...(email ? [[`acct:${email}`, maxPerAccount]] : []),
    ];

    for (const [key, max] of keys) {
      const entry = read(key);
      if (entry && entry.count >= max) {
        const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
        res.set("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: {
            message: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
          },
        });
      }
    }

    res.on("finish", () => {
      if (res.statusCode < 400) return;
      for (const [key] of keys) bump(key);
    });

    next();
  };
}
