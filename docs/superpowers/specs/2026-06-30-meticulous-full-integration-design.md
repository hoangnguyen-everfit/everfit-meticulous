# Meticulous Full Integration — Demo App Design

**Date:** 2026-06-30
**Status:** Approved
**Scope:** Demo app (`hoangnguyen-everfit/everfit-meticulous`) as a complete reference
implementation. A separate spec/plan will cover porting to `everfit-react`.

## Goal

Wire up every developer-side Meticulous integration point in the demo Next.js app so
all Meticulous capabilities are exercised. Server-side/automatic features (test
generation, visual diffing, flaky elimination, parallelization) follow automatically
once recording + CI are in place.

## Feature ownership

| Feature | Owner | This spec |
|---------|-------|-----------|
| #1 Test generation, #2 Visual diff, #4 Flaky elimination, #5 Parallelization | Meticulous (automatic) | Enabled via recording + CI |
| #3 Network mocking | Automatic | Demonstrated + documented |
| #6 CI/PR integration | We implement | Docker path |
| #7 Full auth (replay authenticated pages) | We implement | Lightweight token gate |
| #8 Performance API → monitoring | We implement | console + `window.__perfMetrics` |
| #9 `window.Meticulous` gating | We implement | Deterministic replay behavior |
| #10 Testing pool / session selection | Meticulous UI | Documented only |

## Decisions

- **Target:** Demo first, then `everfit-react` (separate plan).
- **Repo:** `github.com/hoangnguyen-everfit/everfit-meticulous` (personal), real CI/PR.
- **CI path:** Docker (`upload-container`), already scaffolded.
- **Auth:** lightweight token gate in `localStorage`, inject deterministic token on replay.
- **Perf sink:** `console.log` + `window.__perfMetrics` (no external service).
- **Approach:** A — centralized `lib/meticulous/` module (clean boundary, easy to port).

## Architecture (Approach A)

```
lib/
  meticulous/
    index.ts          # re-export public surface
    replay.ts         # isReplay(), isMeticulousBuild()
    auth-replay.ts    # injectAuthForReplay()
    performance.ts    # capturePerformance()
  auth.ts             # login / logout / getToken / isAuthenticated (token gate)
components/
  MeticulousBootstrap.tsx  # client component mounted in layout;
                           # runs injectAuthForReplay() + capturePerformance() on mount
```

All Meticulous logic lives under `lib/meticulous/` so porting to `everfit-react` is a
directory copy plus a few call sites.

## Units & responsibilities

### `lib/meticulous/replay.ts`
- `isReplay(): boolean` — true when running inside a Meticulous replay (client). Reads
  `window.Meticulous?.isRunningAsTest`.
- `isMeticulousBuild(): boolean` — build/server-time, reads
  `process.env.METICULOUS_BUILD === "true"`.
- Exact `window.Meticulous` shape MUST be verified against the official
  window.Meticulous API Reference doc during implementation — do not code from memory.

### `lib/meticulous/auth-replay.ts`
- `injectAuthForReplay(): void` — if `isReplay()` and not authenticated, store a fixed
  deterministic token so replays can reach protected pages even though the recorded
  session's auth differs. This is the "full auth" pattern (#7).

### `lib/meticulous/performance.ts`
- `capturePerformance(): void` — reads real metrics (render time, JS execution, memory)
  via `window.Meticulous.replay.native`, logs to console, pushes to
  `window.__perfMetrics`. API shape verified against docs during implementation.

### `lib/auth.ts`
- `AUTH_TOKEN_KEY = "demo_auth_token"`.
- `login(email: string)`, `logout()`, `getToken()`, `isAuthenticated()`.
- Backed by `localStorage`.

### `components/MeticulousBootstrap.tsx`
- Client component mounted in `app/layout.tsx`. On mount: `injectAuthForReplay()` then
  `capturePerformance()`.

## Behavior changes

- **`/dashboard` becomes protected:** on mount, redirect to `/login` if not authenticated.
- **`/login` success:** store token, navigate to `/dashboard`.
- **Add-item id (#9):** replace `Date.now()` with `isReplay() ? nextDeterministicId() : Date.now()`
  to keep replays deterministic.
- **`POST /api/items` (#3):** add a mock write endpoint to demonstrate Meticulous mocking
  side-effecting requests (no real write on replay). Documented in README.

## CI/PR (Docker, #6)

1. `git init`, push demo to `hoangnguyen-everfit/everfit-meticulous`.
2. Install Meticulous GitHub App on the repo; add `METICULOUS_API_TOKEN` secret.
3. Existing `Dockerfile` + `.github/workflows/meticulous.yaml` + `METICULOUS_BUILD`
   gating are reused.
4. Create baseline on `main`, then open a PR to see the first real test run.

## Testing pool (#10)

Documented in README — how to select which recorded sessions run in CI. No code.

## Testing strategy (TDD)

- Add **Vitest + React Testing Library** (no test infra yet).
- Unit tests (RED → GREEN) for `lib/meticulous/*` and `lib/auth.ts`:
  - `isReplay()` / `isMeticulousBuild()` under mocked `window.Meticulous` / env.
  - `injectAuthForReplay()` sets token only when replaying and unauthenticated.
  - `nextDeterministicId()` stable sequence.
  - `auth` login/logout/isAuthenticated round-trips.
- Browser smoke via Claude Preview (login flow, dashboard load, add/remove).
- Meticulous itself is the visual e2e layer.

## Out of scope (YAGNI)

- Real auth provider (Auth0 / NextAuth).
- Real monitoring service (Datadog / Grafana).
- Complex multi-page flows.
- everfit-react integration (separate spec/plan).

## Risks

- `window.Meticulous` API shape may differ from assumptions → verify against docs before coding.
- Client-side route guard is demo-grade; real apps gate server-side.
- First PR shows no diff until a `main` baseline exists (expected, not a bug).
