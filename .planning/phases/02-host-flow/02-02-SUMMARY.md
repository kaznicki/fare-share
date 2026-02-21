---
phase: 02-host-flow
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, tap-to-edit, useTransition, cents-conversion]

# Dependency graph
requires:
  - phase: 02-host-flow/02-01
    provides: OcrReview stub, ShareScreen stub, host page state machine, OcrResult type, Item type
  - phase: 01-foundation
    provides: POST /api/sessions, sessionStore, types/index.ts

provides:
  - components/host/OcrReview.tsx — full OCR correction screen with item list state, add/edit/delete, session creation POST
  - components/host/ItemRow.tsx — single editable item row with tap-to-edit name/price and qty stepper
  - components/host/TaxTipFields.tsx — sticky tax/tip footer with dollar inputs storing integer cents
  - app/api/sessions/route.ts — qty expansion (CORR-05): items with qty > 1 split into N separate claimable rows

affects:
  - 02-host-flow/02-03 (ShareScreen receives sessionId from OcrReview onComplete callback)
  - 03-participant-flow (session items are now pre-expanded for individual claiming)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Tap-to-edit with editingField state ('name' | 'price' | null) — avoids contenteditable, uses autoFocus input on <span> click
    - Math.round(parseFloat(value) * 100) cents conversion — $12.99 → 1299 correctly, never parseInt or Math.floor
    - key prop reset trick for defaultValue inputs after blur (TaxTipFields taxCents/tipCents as key)
    - useTransition for session creation POST — isPending disables Create Session button preventing double-submit
    - Immutable array mutations with map/filter (never mutate useState array in place)
    - qty expansion via flatMap in POST /api/sessions — single route transform, session store unchanged

key-files:
  created:
    - components/host/ItemRow.tsx
    - components/host/TaxTipFields.tsx
  modified:
    - components/host/OcrReview.tsx
    - app/api/sessions/route.ts

key-decisions:
  - "qty expansion (CORR-05) lives in POST /api/sessions route handler via flatMap — session store receives only qty:1 items, keeping store logic simple"
  - "editingField state handles tap-to-edit for both name and price; qty uses stepper buttons (faster for receipt correction per RESEARCH.md)"
  - "TaxTipFields uses key={taxCents}/key={tipCents} to reset displayed defaultValue after blur — avoids controlled input complexity"

patterns-established:
  - "Pattern: Tap-to-edit row — editingField: 'name' | 'price' | null state, autoFocus input on span click, onBlur commits"
  - "Pattern: Qty expansion in POST handler — flatMap before passing to store, no store changes needed"
  - "Pattern: useTransition for server mutation — disabled button during isPending prevents double-submit"

requirements-completed: [CORR-01, CORR-02, CORR-03, CORR-04, CORR-05, SESS-01]

# Metrics
duration: 2min
completed: 2026-02-21
---

# Phase 2 Plan 02: OCR Correction Screen Summary

**Tap-to-edit OCR review screen with inline name/price editing, qty stepper, tax/tip sticky footer, and server-side qty expansion for claimable sessions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-21T17:43:49Z
- **Completed:** 2026-02-21T17:45:22Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built ItemRow and TaxTipFields as pure controlled leaf components with tap-to-edit patterns and integer cents storage
- Built full OcrReview orchestrator replacing the stub: local item state, add/edit/delete, Create Session POST via useTransition, zero-item and error banners
- Added CORR-05 qty expansion to POST /api/sessions via flatMap — a Burger with qty:2 becomes two separate claimable Burger rows in the session store

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ItemRow and TaxTipFields components** - `432817d` (feat)
2. **Task 2: Build OcrReview orchestrator and qty expansion in sessions API** - `87c8dd0` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `components/host/ItemRow.tsx` - Tap-to-edit name/price, qty stepper, delete button; Math.round cents conversion
- `components/host/TaxTipFields.tsx` - Sticky footer with Tax/Tip dollar inputs, key prop reset, integer cents via onBlur
- `components/host/OcrReview.tsx` - Full implementation replacing stub: item list state, add/edit/delete, useTransition POST, banners
- `app/api/sessions/route.ts` - Added CORR-05 qty expansion: flatMap splits qty > 1 items into N separate rows before sessionStore.create()

## Decisions Made
- qty expansion (CORR-05) is implemented in the POST /api/sessions route handler with `flatMap`, not in the session store itself. The store receives only `qty: 1` items, keeping its validation and TTL logic simple and unchanged.
- Tap-to-edit uses `editingField: 'name' | 'price' | null` state in ItemRow instead of a boolean per field, making it easy to ensure only one field is open at a time without extra logic.
- `TaxTipFields` uses `key={taxCents}` and `key={tipCents}` as the React key on each input. This forces a remount after the parent state updates from an onBlur, which resets `defaultValue` to the committed cents value — no controlled input complexity needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added qty expansion to POST /api/sessions**
- **Found during:** Task 2 (OcrReview — reviewing task spec)
- **Issue:** Plan requires CORR-05 qty expansion server-side; the existing route passed raw items directly to sessionStore.create() without expanding
- **Fix:** Added flatMap in the POST handler to split items with qty > 1 into N separate items with qty: 1 and fresh UUIDs before calling sessionStore.create()
- **Files modified:** app/api/sessions/route.ts
- **Verification:** TypeScript clean; curl test in Task 2 verify step confirms 2 separate Burger rows for a qty:2 item
- **Committed in:** 87c8dd0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality — CORR-05 expansion required by plan spec)
**Impact on plan:** The fix is necessary for correctness — without it, a guest claiming "1 Burger" from a qty:2 row would claim the whole multi-quantity item. No scope creep.

## Issues Encountered
None.

## User Setup Required
None — USE_OCR_MOCK=true in .env.local enables full UI testing. No external services changed.

## Next Phase Readiness
- OcrReview and ItemRow and TaxTipFields are complete — Phase 2 Plan 03 (ShareScreen) can proceed
- Session creation POST is tested and working
- qty expansion verified at API boundary
- TypeScript compiles clean with zero errors
- No blockers

---
*Phase: 02-host-flow*
*Completed: 2026-02-21*

## Self-Check: PASSED

- FOUND: components/host/ItemRow.tsx
- FOUND: components/host/TaxTipFields.tsx
- FOUND: components/host/OcrReview.tsx
- FOUND: app/api/sessions/route.ts
- FOUND: .planning/phases/02-host-flow/02-02-SUMMARY.md
- FOUND commit 432817d (Task 1)
- FOUND commit 87c8dd0 (Task 2)
