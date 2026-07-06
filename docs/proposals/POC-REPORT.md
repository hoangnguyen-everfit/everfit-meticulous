# Meticulous — Proof of Concept Report

**Author:** hoangnguyenphuc
**Date:** 2026-07-02
**Repo:** `hoangnguyen-everfit/everfit-meticulous`
**Companion doc:** [meticulous-adoption-proposal.md](./meticulous-adoption-proposal.md)

---

## 1. Objective

Validate — hands-on, on our own stack — whether Meticulous can be adopted for frontend
regression testing on `everfit-react`, and answer concretely: **does the record → CI →
PR-diff pipeline actually work, what does it catch, and what are its real limitations?**

Success criteria:
- Recorder captures real sessions.
- CI builds and ships the app to Meticulous on every PR.
- A PR with a UI change produces a reviewable visual diff.
- Understand where the tool is strong vs. where it is blind.

---

## 2. Environment

| Item | Value |
|---|---|
| App | Standalone **Next.js 14** (App Router, TypeScript) — same stack family as `everfit-react` |
| Package manager | pnpm |
| Rendering | SSR → **Docker container** path (not static assets) |
| CI | GitHub Actions (`push:main`, `pull_request`, `workflow_dispatch`) |
| Meticulous project | `everfit-meticulous` |
| Unit tests | Vitest + React Testing Library (24 tests, all green) |

**Demo app surface:** `/` (home), `/login` (token-gate auth), `/dashboard` (protected; loads items from a mocked `GET /api/items`, add/remove items, `POST /api/items`), `/api/health` (container health check), and a `SharedBanner` component reused on `/login` + `/dashboard`.

---

## 3. Setup performed

1. **Recorder** — `snippet.meticulous.ai` script in `app/layout.tsx`, gated to non-production
   (`NODE_ENV=development` / preview), using `data-recording-token`,
   `data-is-production-environment="false"`, and `data-force-recording="true"` (demo only).
2. **Docker** — `output: "standalone"` + multi-stage `Dockerfile`; server honours `PORT`.
3. **CI workflow** — build image + `alwaysmeticulous/report-diffs-action/upload-container@v1`,
   health check `/api/health`, `METICULOUS_BUILD=true` at build.
4. **Integration module** — `lib/meticulous/` (replay detection, auth injection, perf capture),
   `lib/auth.ts` token gate, `MeticulousBootstrap` mounted in the layout.

---

## 4. Scenarios & results

| # | Scenario | PR | Result |
|---|----------|----|--------|
| 1 | Record real sessions | — | ✅ Sessions appear in Meticulous UI |
| 2 | CI build + upload container | — | ✅ After using a real **API token** (see §5) |
| 3 | UI change → visual diff | **#4** | ✅ **21 of 38 screens** differed (after fix) |
| 4 | Behavioral change (add-item flow) | **#6** | ⚠️ **Zero differences** — exposed a real limitation (see §6) |
| 5 | Shared component on 2 screens | **#7** | ✅ **25 of 58 screens** differed, across **both** `/login` and `/dashboard` |
| — | Flakiness | all | ✅ **0 flakes** across ~10 runs |

**Headline (Scenario 5):** we changed one shared component and Meticulous listed **every
screen that renders it** — both `/login` and `/dashboard` — with no manual "find usages".
This is the class of regression manual review and unit tests routinely miss.

---

## 5. Issues hit & resolved (setup friction)

| Problem | Symptom | Fix |
|---|---|---|
| Wrong CI token | `Error: Input required and not supplied: api-token` | Add `METICULOUS_API_TOKEN` secret |
| Recording token used as API token | `HTTP 404: Not Found` getting registry credentials | Create a real **API token** (≠ recording token) |
| First PR shows nothing | No diff on the PR that adds the workflow | Expected — needs a **baseline on `main`** first |
| Change not detected | "Zero differences" on a real change | Root-caused to the two lessons in §6 |

---

## 6. Key findings (the important lessons for `everfit-react`)

### A. Protected routes need "replay-safe" handling
The `/dashboard` guard redirected to `/login` during replay (no valid auth token in the
replay session). Meticulous therefore captured the **login page instead of the dashboard**,
so dashboard changes were never detected. **Fix:** make the auth guard replay-aware
(authenticate during replay before guarding). Impact: most of `everfit-react` is behind
auth, so this must be handled or those pages can't be tested.

### B. Replay-time client code must be defensive
An unguarded `performance` API call (`getEntriesByType` on the Meticulous native perf
object, which doesn't implement it) **threw on mount** → because it ran in a layout-level
component, the **whole app crashed** to Next's error page on every route. Meticulous then
compared error-page vs error-page → reported **"no differences"**, silently hiding all real
changes. **Fix:** feature-detect + `try/catch` so replay-time code can never crash the app.
This is the **most important integration task** for `everfit-react` (analytics, feature
flags, auth, monitoring, 3rd-party SDKs all run on load).

> ⚠️ Both A and B produce the same trap: a misleading **"zero differences"** that looks like
> a passing check but means the page was never actually tested. **Rollout must verify replay
> renders the real UI, not just trust a green check.**

### C. Other limitations observed
- **Only records real (trusted) user flows.** Automated/synthetic interactions were not
  captured; a flow nobody performed (e.g. the add-item action) is not covered → not tested.
- **Broken/"abandoned" sessions are filtered out** of the test pool.
- **Backend is mocked** → validates frontend behavior, not full-stack integration; it
  won't catch backend-side effects (e.g. an email not sent, a complex server redirect).
- **Not assertion-based** — it detects differences; a human approves/rejects each
  (intentional UI changes will surface as diffs to approve).

---

## 7. Cost signal

Meticulous publishes no official pricing (no free plan). An **indicative** third-party
figure ([ranger.net](https://www.ranger.net/post/ranger-vs-meticulous), a competitor)
cites **~$2,086/year, tiered by company headcount** (0–50 / 50–150 / 150–250 staff).
Treat as a rough signal only — an official quote from Meticulous is required before
committing. Beyond license: ~1–2 engineer-days integration, low ongoing maintenance.

---

## 8. Performance observed

- GitHub Actions Docker **build + upload: ~55–65s**.
- Meticulous replayed **38–58 screens**, results back within a few minutes of PR open.
- **0 flaky results** across the PoC runs.
- Replay runs on Meticulous' cloud (not our CI); recorder self-throttles in prod-like load.

---

## 9. Conclusion

The pipeline **works end-to-end on our stack** and delivers regression coverage we don't
have today — notably **shared-component** and **crash** regressions caught automatically from
real user behavior. The limitations are **known, understood, and already mitigated** in the
PoC (replay-safe guards + defensive replay-time code).

**Recommendation:** proceed with a **time-boxed pilot on one `everfit-react` workflow**
(non-blocking), after a vendor quote and a security sign-off. See the proposal for the
rollout plan and checklist.

---

### Evidence
- PR #4 — visual diff + crash bug caught: `hoangnguyen-everfit/everfit-meticulous#4`
- PR #6 — behavioral-change limitation demonstrated: `#6`
- PR #7 — shared component across `/login` + `/dashboard`: `#7`
- Design & plan: [docs/superpowers/specs](../superpowers/specs), [docs/superpowers/plans](../superpowers/plans)
