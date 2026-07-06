# Meticulous Demo

A Next.js sandbox (App Router + TypeScript, pnpm) wired with the **Meticulous recorder**
and a **Docker + GitHub Actions** pipeline to try the Meticulous workflow end to end.

- **Phase A** — record sessions locally (recorder).
- **Phase B** — run tests on CI via a Docker image.

## Structure

| File | Role |
|------|------|
| `app/layout.tsx` | Mounts the recorder (gated to `NODE_ENV=development` + recording token) |
| `app/login`, `app/dashboard` | Demo flows: form input, API calls, add/remove items |
| `app/api/items` | Mock API (network request for Meticulous to record & mock) |
| `app/api/health` | Container health check (`/api/health`) |
| `components/SharedBanner.tsx` | Shared component rendered on both `/login` and `/dashboard` |
| `next.config.js` | Enables `output: "standalone"` for Docker |
| `Dockerfile` | Multi-stage pnpm build → standalone runtime |
| `.github/workflows/meticulous.yaml` | CI: build image + `upload-container` |

---

## What is already done

- [x] Full app scaffold + Meticulous config files (recorder, Dockerfile, workflow).
- [x] `pnpm install` → generates `pnpm-lock.yaml`.
- [x] `pnpm build` produces `.next/standalone/server.js`.
- [x] `node server.js` runs; all routes return `200`, `/api/health` OK.
- [x] Unit tests (Vitest + React Testing Library) passing.

---

## What you need to do

### Phase 0 — Create an account
1. Sign up at https://app.meticulous.ai/signup, create an organization + project.
2. Grab the **Recording Token** (client-side, for the recorder) and the **API Token**
   (CI secret). Keep them separate — they are different tokens.

### Phase A — Recorder (local)
1. Copy the env file: `cp .env.local.example .env.local`
2. Set `NEXT_PUBLIC_METICULOUS_RECORDING_TOKEN=<recording-token>` in `.env.local`.
3. Run `pnpm dev` → open http://localhost:3000 (or `pnpm dev --port 4000`).
4. Open DevTools → Network and confirm `meticulous.js` loads with no console errors.
5. Walk through the flows: Login (type email/password, submit), Dashboard (add/remove items).
6. Check the Meticulous UI — the session should appear.
7. Use the app for a few days to accumulate ~20–30 sessions.

### Phase B — CI (Docker)
1. Install the Meticulous GitHub App: https://github.com/apps/alwaysmeticulous → grant repo access.
2. Add the repo secret `METICULOUS_API_TOKEN` (Settings → Secrets and variables → Actions).
   ⚠️ This must be the **API Token**, not the recording token.
3. Ensure the repo has a `main` branch (the workflow needs a baseline on main).
4. Push code → the workflow runs on `main` and creates the baseline.
5. Open a **PR** with a small UI change to test.
   - ⚠️ The first PR (the one adding the workflow) shows **no** diff yet — expected, the
     baseline does not exist until main has run. Just merge it.
6. Review results: Meticulous UI → **Test runs** tab → visual diffs.

### Phase C — Hardening (after B is stable)
- Enable the **blocking** check to block merges while unapproved diffs remain.
- (Optional) Enable PR comments.
- Periodically review organization membership (sessions may contain sensitive tokens).

---

## Quick commands

```bash
pnpm install      # install deps
pnpm dev          # run locally (Phase A)
pnpm test         # run unit tests (Vitest + RTL)
pnpm build        # production build
docker build -t meticulous-demo .                          # build image (needs Docker)
docker run -p 3000:3000 -e PORT=3000 meticulous-demo       # run the image
```

---

## Meticulous integration (developer-side)

All Meticulous logic lives in `lib/meticulous/` (porting to another repo = copy one folder):

- `isReplay()` / `isMeticulousBuild()` — detect replay / test-build context.
- `injectAuthForReplay()` — injects a fixed token during replay so protected pages render
  even if the recorded session's auth differs/expired. Runs via `components/MeticulousBootstrap.tsx`.
- `capturePerformance()` — reads **real** perf metrics via
  `window.Meticulous.replay.native.performance`, only when
  `window.Meticulous.replay.isBenchmarkableReplay === true` (during a normal replay
  `window.performance` is deterministically stubbed). Results are pushed to
  `window.__perfMetrics` (inspect in the DevTools console). Feature-detected + wrapped in
  try/catch so it can never crash the app.
- `nextDeterministicId()` — used by the Dashboard so added-item ids are **stable** during
  replay instead of `Date.now()` (avoids flaky visual diffs).

### Replay-safe auth guard

`/dashboard` is protected — visiting it unauthenticated redirects to `/login`. The guard
calls `injectAuthForReplay()` **before** the auth check so the page renders during a
Meticulous replay (otherwise the dashboard would never be covered). This is a demo-grade
client guard; a real app should also gate on the server.

### Auth token gate

`lib/auth.ts` stores a token in `localStorage['demo_auth_token']`.

### Network mocking

`GET /api/items` and `POST /api/items` are **mocked automatically** by Meticulous during
replay — recorded responses are replayed, so there are no real side effects and no flakes.

### Testing pool — selecting which sessions run

Configure this in the Meticulous UI (project settings → session selection / testing pool).
Meticulous auto-selects sessions covering distinct user types, data variants, and
feature-flag combinations; refine the pool there.
Docs: https://app.meticulous.ai/docs/how-to/testing-pool

### Unit tests

`pnpm test` (Vitest + React Testing Library). Meticulous itself is the visual e2e layer.
