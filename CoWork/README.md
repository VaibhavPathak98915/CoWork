# CoWork

Coworking-space management app. React frontend, microservices backend, one repo.

## Run it

```bash
npm install          # once, from this directory — installs every workspace
cp .env.example .env # then set JWT_SECRET:  openssl rand -hex 32
npm run dev          # web :5173 · gateway :4000 · auth :4001
                     #            · spaces :4002 · bookings :4003
```

Open http://localhost:5173 and sign in with the seeded account:

| Email | Password |
|---|---|
| `admin@cowork.dev` | `cowork123` |

Individual pieces: `npm run dev:web`, `npm run dev:gateway`, `npm run dev:auth`.
`npm run smoke` checks the whole auth flow over real HTTP against a running stack.

## Layout

```
apps/web/           React 19 + Vite. Proxies /api → gateway, so the browser
                    always sees one origin and cookies just work.
services/gateway/   :4000  The only entry point. Owns the session cookie, composes
                    the dashboard, proxies the live event stream.
services/auth/      :4001  Accounts. Owns data/auth.db and nothing else reads it.
services/spaces/    :4002  Space catalog and capacity. Owns data/spaces.db.
services/bookings/  :4003  Reservations + the SSE feed. Owns data/bookings.db.
packages/shared/    env, JWT sign/verify, HTTP errors, zod schemas — the contract
                    every service and the web form share.
scripts/smoke.mjs   End-to-end API check.
```

## How auth works

```
browser ──/api/*──► gateway :4000 ──► auth :4001 ──► auth.db
          cookie      (session)        (stateless)
```

1. The browser posts credentials to the gateway.
2. The gateway asks the auth service, which verifies the scrypt hash and returns a JWT.
3. **The gateway keeps the JWT** and sets it as an httpOnly `cw_session` cookie. The token
   never reaches JavaScript, so an XSS bug cannot steal the session.
4. On later requests the gateway verifies the cookie and passes `x-user-id` / `x-user-role`
   to services. Services hold no session state and contain no auth code.

Services bind to `127.0.0.1`, so only the gateway is reachable from outside.

## The live dashboard

`GET /api/dashboard` is one screen assembled from three services. The gateway fans out with
`Promise.allSettled`, divides booked seats by capacity for occupancy, and returns a single
payload. Only the gateway knows the dashboard exists — the services never call each other.

Liveness is Server-Sent Events. The bookings service emits `booking.created`; the gateway
proxies that stream at `/api/events` behind the session check; every open dashboard refetches.
Book a space in one tab and a second tab updates without a reload.

If a service is down, its card degrades to "—" and a banner names it — deliberately not 0%,
which would read as "nothing booked" rather than "we don't know".

## Adding a service

This is the layout's whole purpose — a new team should not touch existing services.

1. `mkdir services/bookings`, add a `package.json` named `@cowork/bookings` with a `dev`
   script (copy `services/auth`'s). `npm install` picks it up via workspaces.
2. Read identity from the `x-user-id` / `x-user-role` headers. Write no auth code.
3. Give it its own database file. Never read another service's.
4. Register it in `services/gateway/src/index.js` — the commented example at the bottom is
   the complete recipe.
5. Add it to the root `dev` script.

## Known gaps

- **Anyone can register as Admin.** The account-type picker is client-chosen and the server
  trusts it (`packages/shared/src/schemas.js`). Fine for a demo; replace with an invite or
  promotion flow before real use.
- Dashboard, Plans, Spaces, Services and Payment still render hardcoded sample data. Auth is
  the only feature wired to a backend.
- "Forgot password?" is not implemented.
- The rate limiter is per-process and in memory; with more than one gateway it needs Redis.
