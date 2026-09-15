/**
 * Small fixed-window limiter for credential endpoints, so a stolen email can't be
 * brute-forced from one host. In-memory on purpose: with several gateway replicas
 * this moves to Redis, which is the point at which it stops being a toy.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (entry && entry.resetAt > now && entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: { message: `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minute(s).` },
      });
    }

    // Only failures count. A successful sign-in is not evidence of an attack, and
    // charging for it would lock out a legitimate user on a shared IP.
    res.on("finish", () => {
      if (res.statusCode < 400) return;
      const current = hits.get(key);
      if (!current || current.resetAt <= Date.now()) {
        hits.set(key, { count: 1, resetAt: Date.now() + windowMs });
      } else {
        current.count++;
      }
    });

    next();
  };
}
