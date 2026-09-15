/**
 * End-to-end check against a running gateway. Exercises the real HTTP surface a
 * browser sees, including cookie handling.
 *
 *   npm run smoke            (expects `npm run dev`, or the two services, up)
 */
const GATEWAY = process.env.GATEWAY_URL ?? "http://127.0.0.1:4000";

let passed = 0, failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ""}`); }
};

/** Minimal cookie jar: keeps whatever the gateway sets, like a browser would. */
class Jar {
  #cookies = new Map();
  capture(response) {
    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      const [name, value] = [pair.slice(0, idx).trim(), pair.slice(idx + 1)];
      if (!value || value === "") this.#cookies.delete(name);
      else this.#cookies.set(name, value);
      this.lastSetCookie = raw;
    }
    return response;
  }
  get header() {
    return [...this.#cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  get(name) { return this.#cookies.get(name); }
  set(name, value) { this.#cookies.set(name, value); }
}

const call = async (jar, path, { method = "GET", body } = {}) => {
  const response = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(jar.header ? { cookie: jar.header } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  jar.capture(response);
  return { status: response.status, body: await response.json().catch(() => ({})), response };
};

const unique = `smoke_${Date.now()}@cowork.test`;

/* ── health ───────────────────────────────────────────────────────────── */
const jar = new Jar();
const health = await call(jar, "/api/health");
check("gateway health reports auth service up", health.body?.services?.[0]?.status === "ok",
  JSON.stringify(health.body));

/* ── register ─────────────────────────────────────────────────────────── */
const reg = await call(jar, "/api/auth/register", {
  method: "POST",
  body: { name: "Smoke Test", email: unique, password: "cowork123", role: "User" },
});
check("register returns 201", reg.status === 201, `got ${reg.status}`);
check("register returns the user", reg.body?.user?.email === unique);
check("register does NOT leak the JWT to the browser", !("token" in (reg.body ?? {})));
check("no password field in any response", !JSON.stringify(reg.body).match(/password/i));
check("session cookie is set", Boolean(jar.get("cw_session")));
check("cookie is HttpOnly", /HttpOnly/i.test(jar.lastSetCookie ?? ""), jar.lastSetCookie);
check("cookie is SameSite=Lax", /SameSite=Lax/i.test(jar.lastSetCookie ?? ""), jar.lastSetCookie);

/* ── session ──────────────────────────────────────────────────────────── */
const me = await call(jar, "/api/auth/me");
check("/me returns the signed-in user", me.body?.user?.email === unique, `got ${me.status}`);

const tampered = new Jar();
const goodCookie = jar.get("cw_session");
if (goodCookie) {
  tampered.set("cw_session", `${goodCookie.slice(0, -4)}AAAA`);
  check("tampered cookie is rejected", (await call(tampered, "/api/auth/me")).status === 401);
} else {
  check("tampered cookie is rejected", false, "no session cookie to tamper with");
}
check("no cookie at all is rejected", (await call(new Jar(), "/api/auth/me")).status === 401);

/* ── logout ───────────────────────────────────────────────────────────── */
await call(jar, "/api/auth/logout", { method: "POST" });
check("cookie cleared on logout", !jar.get("cw_session"));
check("/me after logout is 401", (await call(jar, "/api/auth/me")).status === 401);

/* ── login rules ──────────────────────────────────────────────────────── */
const fresh = new Jar();
const good = await call(fresh, "/api/auth/login", { method: "POST", body: { email: unique, password: "cowork123" } });
check("login with correct password succeeds", good.status === 200 && Boolean(fresh.get("cw_session")));

const bad = await call(new Jar(), "/api/auth/login", { method: "POST", body: { email: unique, password: "wrong-password" } });
check("wrong password is 401", bad.status === 401, `got ${bad.status}`);
check("wrong password gives a generic message", bad.body?.error?.message === "Invalid email or password");

const nobody = await call(new Jar(), "/api/auth/login", { method: "POST", body: { email: "nobody@cowork.test", password: "whatever1" } });
check("unknown email gives the SAME message (no account enumeration)",
  nobody.body?.error?.message === bad.body?.error?.message);

/* ── validation ───────────────────────────────────────────────────────── */
const dupe = await call(new Jar(), "/api/auth/register", {
  method: "POST", body: { name: "Copy Cat", email: unique.toUpperCase(), password: "cowork123" },
});
check("duplicate email is 409, case-insensitively", dupe.status === 409, `got ${dupe.status}`);

const malformed = await call(new Jar(), "/api/auth/register", {
  method: "POST", body: { name: "Bad Email", email: "not-an-email", password: "cowork123" },
});
check("malformed email is 400", malformed.status === 400, `got ${malformed.status}`);

const shortPw = await call(new Jar(), "/api/auth/register", {
  method: "POST", body: { name: "Short Pw", email: `s${Date.now()}@cowork.test`, password: "123" },
});
check("short password is 400", shortPw.status === 400);
check("short password explains the rule",
  /at least 8/i.test(shortPw.body?.error?.message ?? ""), shortPw.body?.error?.message);

/* ── stored hash ──────────────────────────────────────────────────────── */
const { DatabaseSync } = await import("node:sqlite");
const db = new DatabaseSync(new URL("../services/auth/data/auth.db", import.meta.url).pathname, { readOnly: true });
const row = db.prepare("SELECT password_hash FROM users WHERE email = ?").get(unique);
db.close();
check("password stored as a scrypt hash", row?.password_hash?.startsWith("scrypt$"), row?.password_hash?.slice(0, 20));
check("plaintext password never stored", !row?.password_hash?.includes("cowork123"));

/* ── dashboard composition ────────────────────────────────────────────── */
const session = new Jar();
await call(session, "/api/auth/login", { method: "POST", body: { email: "admin@cowork.dev", password: "cowork123" } });

check("/api/dashboard needs a session", (await call(new Jar(), "/api/dashboard")).status === 401);
check("/api/bookings needs a session",
  (await call(new Jar(), "/api/bookings", { method: "POST", body: {} })).status === 401);

const dash = (await call(session, "/api/dashboard")).body;
check("dashboard composes all three services", dash?.degraded?.length === 0, JSON.stringify(dash?.degraded));
check("member count is a real number", Number.isInteger(dash?.stats?.[0]?.value));
check("bookings-today is a real number", Number.isInteger(dash?.stats?.[1]?.value));
check("recent bookings are populated", Array.isArray(dash?.recentBookings) && dash.recentBookings.length > 0);
check("occupancy covers every space type", dash?.occupancy?.length === 5, `got ${dash?.occupancy?.length}`);

const occ = dash.occupancy.find((o) => o.capacity > 0);
check("occupancy % equals seats ÷ capacity",
  occ.value === Math.min(100, Math.round((occ.seats / occ.capacity) * 100)),
  `${occ.label}: ${occ.seats}/${occ.capacity} -> ${occ.value}%`);
check("occupancy never exceeds 100%", dash.occupancy.every((o) => o.value <= 100));

/* ── plans catalog ────────────────────────────────────────────────────── */
check("/api/plans needs a session", (await call(new Jar(), "/api/plans")).status === 401);

const plans = (await call(session, "/api/plans")).body.plans;
check("there are exactly 3 plans", plans?.length === 3, `got ${plans?.length}`);

const priced = Object.fromEntries(plans.map((p) => [p.period, p]));
check("daily plan is ₹499/day", priced.day?.price === 499, JSON.stringify(priced.day?.price));
check("monthly plan is ₹7,999/month", priced.month?.price === 7999, JSON.stringify(priced.month?.price));
check("yearly plan is ₹24,999/year", priced.year?.price === 24999, JSON.stringify(priced.year?.price));
check("each plan has a distinct period", new Set(plans.map((p) => p.period)).size === 3);
check("exactly one plan is featured", plans.filter((p) => p.featured).length === 1);
check("features come back as arrays", plans.every((p) => Array.isArray(p.features) && p.features.length > 0));
check("excluded comes back as an array", plans.every((p) => Array.isArray(p.excluded)));

// The annual plan must genuinely beat paying monthly, or the card's savings line lies.
const annualised = (p) => ({ day: p.price * 365, month: p.price * 12, year: p.price }[p.period]);
check("yearly is the cheapest over a year",
  annualised(priced.year) < annualised(priced.month),
  `${annualised(priced.year)} vs ${annualised(priced.month)}`);
check("yearly saves ₹70,989 against monthly",
  annualised(priced.month) - annualised(priced.year) === 70989);

/* ── SSE + booking creation ───────────────────────────────────────────── */
const spacesBody = (await call(session, "/api/spaces")).body;
const spaces = spacesBody.spaces;
check("space catalog is served", spaces?.length === 5);
check("catalog carries availability", spaces.every((s) =>
  Number.isInteger(s.seatsTaken) && Number.isInteger(s.seatsFree) && typeof s.availability === "string"));
check("seatsFree = capacity − seatsTaken for every space",
  spaces.every((s) => s.seatsFree === Math.max(0, s.capacity - s.seatsTaken)));
check("availability matches the seat counts", spaces.every((s) =>
  s.availability === (s.status !== "active" ? "unavailable"
    : s.seatsFree === 0 ? "full"
    : s.seatsFree <= s.capacity * 0.25 ? "filling" : "available")));

// Open the event stream BEFORE booking, the way a dashboard sitting open would.
const streamed = [];
const controller = new AbortController();
const stream = await fetch(`${GATEWAY}/api/events`, {
  headers: { cookie: session.header, accept: "text/event-stream" },
  signal: controller.signal,
});
check("event stream is text/event-stream",
  stream.headers.get("content-type")?.includes("text/event-stream"), stream.headers.get("content-type"));

(async () => {
  const decoder = new TextDecoder();
  for await (const chunk of stream.body) {
    const text = decoder.decode(chunk, { stream: true });
    for (const line of text.split("\n")) if (line.startsWith("event:")) streamed.push(line.slice(6).trim());
  }
})().catch(() => {});

const before = dash.stats[1].value;
const today = (() => { const d = new Date(), p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();

// Whichever space has the most room left — assuming spaces[0] is free made the
// suite fail on its own leftovers once a few runs had booked it out.
const roomiest = [...spaces].sort((a, b) => b.seatsFree - a.seatsFree)[0];
check("a space with room exists for today's booking", roomiest.seatsFree >= 2,
  `most free: ${roomiest.name} ${roomiest.seatsFree}`);

const created = await call(session, "/api/bookings", {
  method: "POST",
  body: { spaceId: roomiest.id, plan: "Day Pass – ₹499", duration: "Full Day", startsOn: today, seats: 2 },
});
check("booking is created", created.status === 201, `got ${created.status} ${JSON.stringify(created.body)}`);
check("booking snapshots the member name", created.body?.booking?.userName === "Vaibhav", created.body?.booking?.userName);
check("booking snapshots the space name", created.body?.booking?.spaceName === roomiest.name);

await new Promise((r) => setTimeout(r, 1500));
check("SSE delivered booking.created within 1.5s", streamed.includes("booking.created"), JSON.stringify(streamed));
controller.abort();

const after = (await call(session, "/api/dashboard")).body;
check("bookings-today incremented by exactly 1", after.stats[1].value === before + 1,
  `${before} -> ${after.stats[1].value}`);
check("new booking is first in recent bookings", after.recentBookings[0].id === created.body.booking.id);
check("occupancy rose for that space type",
  after.occupancy.find((o) => o.label === roomiest.type).seats ===
    dash.occupancy.find((o) => o.label === roomiest.type).seats + 2);
check("membership points track the user's bookings", after.membership.points === after.membership.bookings * 10);

/* ── seat availability is enforced, not just displayed ────────────────── */
// Regression: the service used to compare one booking against total capacity and
// never against what was already taken, so a space could be booked past full one
// booking at a time (observed: 80 seats sold in a 60-seat room).
//
// Run on a date unique to this run: no bookings exist there, so free == capacity
// and the suite neither depends on nor consumes today's availability.
const futureDate = (() => {
  const d = new Date(Date.now() + (2 + (Date.now() % 300)) * 86400000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

const target = spaces.find((s) => s.capacity <= 50) ?? spaces[0];
const book = (seats, date = futureDate) =>
  call(session, "/api/bookings", {
    method: "POST",
    body: { spaceId: target.id, plan: "Day Pass", duration: "Full Day", startsOn: date, seats },
  });

const overshoot = await book(target.capacity + 1);
check("booking more than a space holds is refused", overshoot.status === 409,
  `${target.name} holds ${target.capacity}, asked ${target.capacity + 1}, got ${overshoot.status}`);

check("booking exactly the capacity succeeds", (await book(target.capacity)).status === 201);
const oneMore = await book(1);
check("a full space refuses even one seat", oneMore.status === 409, `got ${oneMore.status}`);
check("the refusal says it is full or how many remain",
  /fully booked|\d+ seats? left/i.test(oneMore.body?.error?.message ?? ""), oneMore.body?.error?.message);

// A different day is a different allocation.
const dayAfter = (() => { const d = new Date(`${futureDate}T00:00:00`); d.setDate(d.getDate() + 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
check("a space full on one day is bookable the next", (await book(1, dayAfter)).status === 201);

/* ── add-ons: catalogue and per-user subscriptions ────────────────────── */
check("/api/addons needs a session", (await call(new Jar(), "/api/addons")).status === 401);

const catalogue = (await call(session, "/api/addons")).body.addons;
check("add-on catalogue is served", catalogue?.length === 4, `got ${catalogue?.length}`);
check("each add-on is priced", catalogue.every((a) =>
  Number.isInteger(a.price) && typeof a.unit === "string" && typeof a.planLabel === "string"));
check("each add-on says whether you're subscribed",
  catalogue.every((a) => typeof a.subscribed === "boolean"));

// Start from a known state regardless of what earlier runs or the browser left.
for (const a of catalogue.filter((a) => a.subscribed)) {
  await call(session, `/api/addons/${a.id}/subscription`, { method: "DELETE" });
}

const sub = await call(session, "/api/addons/it-support/subscription", { method: "POST" });
check("subscribing returns 201", sub.status === 201, `got ${sub.status}`);

const afterSub = (await call(session, "/api/addons")).body.addons;
check("the subscription is reflected back",
  afterSub.find((a) => a.id === "it-support").subscribed === true);
check("subscribing doesn't affect other add-ons",
  afterSub.filter((a) => a.subscribed).length === 1);

// Idempotence: a double-click must not create a second billable row.
await call(session, "/api/addons/it-support/subscription", { method: "POST" });
const afterTwice = (await call(session, "/api/addons")).body.addons;
check("subscribing twice does not duplicate",
  afterTwice.filter((a) => a.subscribed).length === 1);

const unknown = await call(session, "/api/addons/not-a-service/subscription", { method: "POST" });
check("unknown add-on is 404", unknown.status === 404, `got ${unknown.status}`);

/* Subscriptions must be private to their owner. */
const otherJar = new Jar();
const otherEmail = `addons_${Date.now()}@cowork.test`;
await call(otherJar, "/api/auth/register", {
  method: "POST", body: { name: "Other Member", email: otherEmail, password: "cowork123", role: "User" },
});
const otherView = (await call(otherJar, "/api/addons")).body.addons;
check("another user does not see your subscriptions",
  otherView.every((a) => a.subscribed === false),
  JSON.stringify(otherView.filter((a) => a.subscribed).map((a) => a.id)));

await call(otherJar, "/api/addons/food/subscription", { method: "POST" });
const mineStill = (await call(session, "/api/addons")).body.addons;
check("their subscription does not appear in yours",
  mineStill.find((a) => a.id === "food").subscribed === false);
check("your own subscription is untouched",
  mineStill.find((a) => a.id === "it-support").subscribed === true);

const gone = await call(session, "/api/addons/it-support/subscription", { method: "DELETE" });
check("unsubscribing succeeds", gone.status === 200, `got ${gone.status}`);
check("unsubscribing twice is 404",
  (await call(session, "/api/addons/it-support/subscription", { method: "DELETE" })).status === 404);
check("nothing is subscribed afterwards",
  (await call(session, "/api/addons")).body.addons.every((a) => !a.subscribed));

/* ── booking validation ───────────────────────────────────────────────── */
const past = await call(session, "/api/bookings", {
  method: "POST", body: { spaceId: spaces[0].id, plan: "Day Pass", duration: "Full Day", startsOn: "2020-01-01", seats: 1 },
});
check("a booking in the past is rejected", past.status === 400, `got ${past.status}`);

const overCapacity = await call(session, "/api/bookings", {
  method: "POST", body: { spaceId: spaces[0].id, plan: "Day Pass", duration: "Full Day", startsOn: today, seats: 999 },
});
check("over-capacity booking is rejected", overCapacity.status === 400, `got ${overCapacity.status}`);

const badSpace = await call(session, "/api/bookings", {
  method: "POST", body: { spaceId: "no-such-space", plan: "Day Pass", duration: "Full Day", startsOn: today, seats: 1 },
});
check("unknown space is rejected", badSpace.status === 404, `got ${badSpace.status}`);

console.log(`\n${passed}/${passed + failed} checks passed`);
process.exit(failed ? 1 : 0);
