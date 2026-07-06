# Speaker Notes — Meticulous Pilot Decision Meeting

**Deck:** poc-decision-deck.html · **Total:** ~35 min + discussion
**One job:** leave the room with a yes/no on a pilot.

> Before the meeting: fill the **real internal numbers** on Slide 3 (hrs/week fixing tests, bugs to prod). Have the **live demo PR** ready in a browser tab (see Slide 6 runbook).

---

## Slide 1 — Opening (2 min)
- Set the frame in the first 20 seconds: *"Today I'm showing a tool I think makes us suffer less — not adds work. By the end I need one decision: do we pilot it or not."*
- Say explicitly this is a **decision meeting**, not an FYI, so people engage now.

## Slide 2 — Agenda (part of the 2 min)
- Walk the timings fast. Point out the demo is the core — everything before it is setup.

## Slide 3 — The pain (5 min) · don't name the tool yet
- Start with the problem so the room nods "yes, that's real" before any solution.
- Hit the four pains; pause on the one your team feels most.
- **Drop the real numbers** here — internal data persuades far more than any marketing claim. If you don't have exact figures, ask the room: *"Rough guess — how many hours a week do we lose to broken tests?"* Let them say it.
- Goal of this slide: everyone agrees the pain is real.

## Slide 4 — What it is, one sentence (5 min)
- Read the one sentence slowly: *record real sessions → on each PR replay on old & new → screenshot each step → flag changes for us to approve.*
- Land the three pills: no test code, no baseline upkeep, no flaky.
- Only now say the name. Stop at the mental model — resist going technical.

## Slide 5 — What it does NOT do (5 min) · credibility slide, don't skip
- This is where you earn trust. Volunteer the weaknesses before anyone asks.
- Frontend only · mocks backend (no real business logic/DB) · logic not in UI isn't caught · needs sessions.
- Say the line plainly: *"It does not replace Playwright for critical flows — they complement each other."*
- When you name the downsides first, the room believes the upsides more.

## Slide 6 — LIVE DEMO (10 min) · the most important part
**Do not present slides here. Switch to the browser.**

Runbook:
1. Show a real PR with a small change already open (or make one live).
2. Best beat: **deliberately cause an accidental regression** — change a shared component so it breaks *another* page.
3. Open the Meticulous test run → show the visual diff appear, flagged on the screen(s) you didn't touch directly.
4. The winning line: *"Notice — I didn't tell it where to look. It found the screen I'd have forgotten about."*
5. Optionally show the approve/reject flow so they see the human stays in control.

Fallback if live fails: have screenshots of PR #7 (shared component flagged on both /login and /dashboard) ready.

## Slide 7 — What's in it for you (5 min)
- Switch from company framing to **developer** framing. Use "you / we", never "the company saves".
- Less test writing/maintenance · see impact before merge · fewer post-merge breakages · no flaky CI · refactor with confidence.

## Slide 8 — Pilot proposal (part of last 5 min)
- Make it concrete and small to lower the risk of a "no": 1 repo / a few flows, 2–3 weeks, one owner.
- Set **success criteria now, together**: ≥ N real regressions caught, low false-positives, devs feel it saves time. Ask the room to agree the number N.

## Slide 9 — Security & exit
- Security: sessions can contain tokens → non-production only, trusted people only in the org. (Pre-empts the security objection.)
- Exit: *"If it's not a fit, we remove it in 10 minutes — it's just a script plus a CI check, no test code to rip out."* This removes the fear of committing.

## Slide 10 — The decision
- Ask directly: *"Do we run the pilot — yes or no?"*
- If yes: name the repo, the owner, and confirm the success criteria before everyone leaves.
- If no: fine — ask what would need to be true to make it a yes.

---

## Likely questions & short answers
- **"Is this instead of Playwright?"** No — complementary. Keep Playwright for critical, assertion-based and backend-touching flows.
- **"What about false positives?"** Every diff is human-approved; intentional changes are approved in one click. We'll measure the false-positive rate in the pilot.
- **"Cost?"** No public pricing; an indicative competitor figure is ~$2,086/yr. We'll get an official quote as part of Phase 0.
- **"Security?"** Non-prod recording only, trusted org members only.
- **"New features?"** Not covered until someone uses them — coverage grows from real usage. Keep unit/e2e for brand-new flows.
