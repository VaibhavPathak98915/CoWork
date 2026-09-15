# CoWork

Frontend for the CoWork coworking-space management app — React 19 + Vite, built from
`../coworkedit.jsx`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (production bundle into `dist/`), `npm run preview`
(serve that bundle).

## Demo login

The auth screen is still a mock — any email and password signs you in after a short
delay. An address containing `admin` gets the Admin role.

## Structure

```
src/
├── main.jsx            entry point, mounts <App/> and loads index.css
├── App.jsx             auth gate: AuthScreen until a user exists, then MainApp
├── index.css           color tokens (:root), reset, keyframes, animation classes
├── components/         Badge, Input, Select, Btn, Card, CardTitle · Toast · Modal
├── layout/MainApp.jsx  sidebar, header, page switching, toast + booking modal
└── pages/              AuthScreen, Dashboard, Plans, Spaces, Services, Payment
```

Styling is inline `style` objects reading CSS variables from `index.css`. Page
navigation is plain `useState` in `MainApp` — no router.

## Backend

Not wired up yet. Every page renders hardcoded sample data.

The Spring Boot + MongoDB service in `../Template/App` exposes `/user` on port 8080, and
`vite.config.js` already proxies `/user` there in dev — so a `fetch("/user")` from this app
will reach it once the API work starts, with no CORS setup needed.
