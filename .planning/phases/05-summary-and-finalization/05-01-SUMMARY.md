---
phase: 05-summary-and-finalization
plan: 01
subsystem: bill-splitting-math
tags: [math, tdd, vitest, lrm, session-store, websocket, finalization]
dependency_graph:
  requires: [04-item-claiming]
  provides: [bill-split-engine, finalize-handler, host-name-capture]
  affects: [server.ts, lib/session-store.ts, app/api/sessions/route.ts, components/host/OcrReview.tsx, app/host/page.tsx]
tech_stack:
  added: [vitest@4.1.4]
  patterns: [Largest Remainder Method, TDD red-green, host identity check, idempotency guard]
key_files:
  created:
    - lib/bill-split.ts
    - lib/bill-split.test.ts
    - vitest.config.ts
  modified:
    - types/index.ts
    - lib/session-store.ts
    - app/api/sessions/route.ts
    - components/host/OcrReview.tsx
    - app/host/page.tsx
    - server.ts
    - components/host/ShareScreen.tsx
decisions:
  - "LRM for tax/tip: distributeProportionally() uses floor + sort-by-remainder to guarantee sum exactly equals input totalCents"
  - "Zero grandSubtotal fallback: equal split with remainder to first N participants avoids NaN when no items claimed"
  - "Shared items use Math.round(priceCents / claimants.length) — consistent with existing STATE.md money math decision"
  - "ShareScreen.hostName added to interface now; Plan 02 wires the actual UI usage"
metrics:
  duration: ~8 min
  completed: 2026-04-09
  tasks_completed: 2
  files_changed: 10
---

# Phase 05 Plan 01: Bill-Split Math Engine Summary

## One-liner

Cent-exact proportional tax/tip distribution via Largest Remainder Method, with host-name capture, session finalization API, and server-side finalize WebSocket handler with elevation-of-privilege guard.

## What Was Built

### lib/bill-split.ts

Pure `billSplit()` function implementing:
- Per-participant subtotals from claimed items (shared items split via `Math.round`)
- Unclaimed item handling: `'host'` adds full cost to host's subtotal; `'split'` distributes proportionally
- `distributeProportionally()` internal helper using LRM: floors exact float shares, then gives 1 extra cent to participants with largest remainders (tiebreak by ascending index) until the target total is reached exactly
- Zero-grandSubtotal fallback (equal split) to prevent NaN when nobody claimed anything
- Exports: `billSplit`, `ParticipantBill`, `BillSplitResult`

### lib/bill-split.test.ts + vitest.config.ts

13 test cases covering MATH-01 (proportional tax), MATH-02 (proportional tip), MATH-03 (exact sum constraint), shared items, unclaimed handling ('host' and 'split'), and edge cases (zero subtotal, single participant, zero-claimant participant). All pass.

### types/index.ts

- `SessionState` extended with `hostName: string`, `finalized: boolean`, `finalizedBill: BillSplitResult | null`
- `ClientMessage` extended with `finalize` variant including `participantName` for host identity verification

### lib/session-store.ts

- `create()` now accepts `hostName: string`; initializes `finalized: false`, `finalizedBill: null`
- `finalize(id, bill)` method: sets `session.finalized = true` and `session.finalizedBill = bill`

### app/api/sessions/route.ts

Zod schema extended with `hostName: z.string().min(1).max(64)` (T-5-04 mitigation). `hostName` passed through to `sessionStore.create()`.

### components/host/OcrReview.tsx

- `hostName` state added
- "Your name" input field added above Create Session button
- Button disabled when `hostName.trim()` is empty
- `onComplete` signature updated to `(sessionId: string, hostName: string)`
- `hostName.trim()` included in POST body

### app/host/page.tsx

- `hostName` state added
- `OcrReview.onComplete` now captures `name` and calls `setHostName(name)`
- `hostName` passed to `ShareScreen`

### server.ts

Finalize branch added after the unclaim branch:
- T-5-01: `senderName !== session.hostName` guard — non-host messages silently ignored
- T-5-02: `unclaimedHandling` coerced to `'split'` if value is not `'host'`
- T-5-03: `if (session.finalized) return` idempotency guard
- Calls `billSplit()`, stores result via `sessionStore.finalize()`, broadcasts updated session-snapshot

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added hostName to ShareScreen Props interface**
- **Found during:** Task 2 — `app/host/page.tsx` now passes `hostName` prop to `ShareScreen`
- **Issue:** `ShareScreen` Props interface only had `sessionId: string`; TypeScript would reject the `hostName` prop
- **Fix:** Added `hostName: string` to ShareScreen's Props interface. The prop is accepted but not yet used — Plan 02 owns the UI wiring
- **Files modified:** `components/host/ShareScreen.tsx`
- **Commit:** f1553c9

## Known Stubs

None. All data flows are fully wired. `ShareScreen` accepts `hostName` as a prop but does not render it yet — this is intentional; Plan 02 is responsible for the summary UI that uses it.

## Threat Flags

All threats from the plan's threat model were mitigated as specified:
- T-5-01: host identity check in finalize branch
- T-5-02: `unclaimedHandling` coercion
- T-5-03: idempotency guard
- T-5-04: Zod `hostName` validation in API route

No new security surface introduced beyond what the plan anticipated.

## Self-Check: PASSED

- `lib/bill-split.ts` exists: FOUND
- `lib/bill-split.test.ts` exists: FOUND
- `vitest.config.ts` exists: FOUND
- Commit 4641fb3 (RED): FOUND
- Commit 5c98c6b (GREEN): FOUND
- Commit f1553c9 (Task 2): FOUND
- `npx vitest run lib/bill-split.test.ts`: 13/13 passed
