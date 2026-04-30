---
phase: 07-ux-display-fixes
plan: 02
subsystem: api
tags: [vitest, websocket, nextjs, zod, session-store, tdd]

# Dependency graph
requires:
  - phase: 06-live-ocr
    provides: session-store singleton pattern and finalize() reference implementation
provides:
  - sessionStore.unfinalize() method that resets finalized/finalizedBill while preserving claims
  - ClientMessage union extended with unfinalize variant
  - WebSocket unfinalize handler in server.ts with host-only guard + idempotency + broadcast
  - POST /api/sessions/[id]/unfinalize REST route with zod validation and 403 for non-host
  - Unit test coverage for unfinalize() in lib/session-store.test.ts
affects: [07-03-frontend-unfinalize, any plan reading SessionRoom or session state shape]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Unfinalize mirrors finalize: same guard order (type → sender → session → host → idempotency → mutation → broadcast)"
    - "REST route shares globalThis sessionStore singleton — broadcast from REST route works without WS message send"
    - "TDD RED/GREEN: test commit before implementation commit"

key-files:
  created:
    - lib/session-store.test.ts
    - app/api/sessions/[id]/unfinalize/route.ts
  modified:
    - types/index.ts
    - lib/session-store.ts
    - server.ts

key-decisions:
  - "unfinalize() only resets finalized=false and finalizedBill=null — claims are intentionally untouched (D-06)"
  - "Idempotency guard in both REST route and WS handler — calling unfinalize on already-unfinalized session is a no-op"
  - "REST route calls sessionStore.broadcast() directly — possible because REST handler and server.ts share globalThis singleton"

patterns-established:
  - "Host-only mutation pattern: normalize both sides with .trim().toLowerCase() before comparison"
  - "MAX_NAME_LEN slice on WS participantName before any comparison — DoS mitigation"
  - "zod .string().min(1).max(64) for hostName in REST body"

requirements-completed:
  - UX-02

# Metrics
duration: 2min
completed: 2026-04-30
---

# Phase 07 Plan 02: Unfinalize Backend Summary

**Host-only unfinalize backend: session-store method, ClientMessage union, WebSocket handler, and REST route — all with host guard, idempotency, and broadcast; green under TDD**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-30T11:27:32Z
- **Completed:** 2026-04-30T11:29:45Z
- **Tasks:** 2 (Task 1 had 2 commits: RED + GREEN)
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Unit tests for `sessionStore.unfinalize()` written first (TDD RED), then passed green after implementation
- `types/index.ts` ClientMessage union now includes `{ type: 'unfinalize'; sessionId: string; participantName: string }`
- `lib/session-store.ts` `unfinalize()` method resets `finalized=false` and `finalizedBill=null` with claims untouched
- `server.ts` WebSocket handler for `unfinalize` with host-only guard (T-07-02-03), idempotency (T-07-02-04), MAX_NAME_LEN DoS mitigation (T-07-02-05), and full-state broadcast
- `app/api/sessions/[id]/unfinalize/route.ts` POST handler with zod validation (T-07-02-06), 403 for non-host (T-07-02-01), idempotency (T-07-02-02), and broadcast after mutation

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Test scaffold for sessionStore.unfinalize()** - `7783759` (test)
2. **Task 1 GREEN: types union + session-store unfinalize method** - `819d037` (feat)
3. **Task 2: server.ts WebSocket handler + REST unfinalize route** - `222ad53` (feat)

_Note: Task 1 follows TDD pattern with separate RED (test) and GREEN (implementation) commits._

## Files Created/Modified
- `lib/session-store.test.ts` — 4 unit tests for unfinalize(): finalized=false, finalizedBill=null, claims preserved, no-op for missing session
- `types/index.ts` — ClientMessage union extended with unfinalize variant
- `lib/session-store.ts` — unfinalize() method added after finalize(), mirrors structure exactly
- `server.ts` — unfinalize WebSocket handler added after finalize block with full security guards
- `app/api/sessions/[id]/unfinalize/route.ts` — NEW REST POST handler with zod validation, host identity check, idempotency, broadcast

## Decisions Made
- Followed plan as specified — all implementation choices were pre-decided in CONTEXT.md and PATTERNS.md
- unfinalize() resets only finalized/finalizedBill — claims intentionally preserved (D-06)
- REST route uses direct sessionStore.broadcast() call, no WS message send needed (shared globalThis singleton)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all patterns were direct mirrors of the existing finalize flow.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend fully wired: type union, session-store method, WS handler, REST route all in place
- Plan 03 (frontend) can now wire `onUnfinalized` prop in SessionRoom, REST call in page.tsx, and "Go back to claiming" button in SummaryScreen
- All 17 vitest tests pass with no regressions

## Self-Check: PASSED

- lib/session-store.test.ts: FOUND
- types/index.ts: FOUND
- lib/session-store.ts: FOUND
- server.ts: FOUND
- app/api/sessions/[id]/unfinalize/route.ts: FOUND
- .planning/phases/07-ux-display-fixes/07-02-SUMMARY.md: FOUND
- Commit 7783759 (RED tests): FOUND
- Commit 819d037 (GREEN implementation): FOUND
- Commit 222ad53 (WS handler + REST route): FOUND

---
*Phase: 07-ux-display-fixes*
*Completed: 2026-04-30*
