---
phase: 05-summary-and-finalization
plan: 02
subsystem: summary-ui
tags: [finalization, summary, unclaimed-modal, session-room, host-identity, search-params, suspense]
dependency_graph:
  requires: [05-01]
  provides: [summary-screen, unclaimed-modal, finalize-flow, host-join-url, joinform-prefill]
  affects: [components/host/ShareScreen.tsx, components/session/JoinForm.tsx, components/session/SessionRoom.tsx, components/session/SummaryScreen.tsx, components/session/UnclaimedModal.tsx, app/session/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [useSearchParams with Suspense boundary, screen state machine extended to summary, onFinalized callback pattern, isHost derivation from session snapshot]
key_files:
  created:
    - components/session/UnclaimedModal.tsx
    - components/session/SummaryScreen.tsx
  modified:
    - components/host/ShareScreen.tsx
    - components/session/JoinForm.tsx
    - components/session/SessionRoom.tsx
    - app/session/[id]/page.tsx
decisions:
  - "useSearchParams requires Suspense boundary: SessionPageInner extracted as inner component, wrapped in Suspense in the outer SessionPage"
  - "isHost derivation via onSessionData callback: SessionRoom notifies parent on every snapshot; parent compares participantName === data.hostName to set isHost without SessionRoom knowing about host logic"
  - "finalizeError rendered inside root div (not inside fixed footer): avoids fixed positioning stacking context issues on mobile"
  - "HTML entity for apostrophe in JSX: used &apos; for 'I'll cover the rest' and 'You didn't claim any items.' to satisfy JSX parser"
metrics:
  duration: ~6 min
  completed: 2026-04-09
  tasks_completed: 2
  files_changed: 6
---

# Phase 05 Plan 02: Summary UI Summary

## One-liner

Full finalization UI: host join URL with ?name= pre-fill, blocking unclaimed-items modal, per-person summary breakdown card, and conditional host totals table — all wired through screen state machine with Suspense boundary for useSearchParams.

## What Was Built

### components/host/ShareScreen.tsx

- Added `hostJoinUrl` computed from `hostName` prop via `encodeURIComponent`
- Added "Join as host" button (`<a>` tag) below the copy-link section using `hostJoinUrl`
- Participants QR code and copy-link still use plain `joinUrl` (no name param)

### components/session/JoinForm.tsx

- Added `initialName?: string` prop with default `''`
- `useState(initialName)` pre-fills the name field when host follows their join URL

### components/session/UnclaimedModal.tsx (new)

Blocking overlay modal with:
- Dynamic title: `{N} item(s) not claimed` with correct pluralization
- Two stacked buttons: "Split among everyone" (indigo primary) and "I'll cover the rest" (outlined secondary)
- No close/dismiss button — forced choice per D-07
- `bg-black/50` backdrop, `rounded-2xl shadow-lg` card, `min-h-[44px]` touch targets

### components/session/SummaryScreen.tsx (new)

Per-person breakdown card implementing UI-SPEC Screens C and D:
- `Food subtotal`, `Your tax share`, `Your tip share`, `Total owed` rows
- `Total owed` in `text-2xl font-bold text-indigo-600` per UI-SPEC
- `tabular-nums` on all money amounts for column alignment
- Zero-subtotal path: renders `$0.00` across all rows + "You didn't claim any items." caption
- Host-only section: "Everyone's totals" table with each participant's name and total, plus grand total row

### components/session/SessionRoom.tsx

- New props: `onFinalized?: (bill: BillSplitResult) => void`, `onSessionData?: (data: SessionData) => void`
- New state: `showUnclaimedModal`, `finalizeError`
- `handleFinalizeClick`: counts unclaimed items, shows modal if > 0, sends finalize immediately if 0
- `sendFinalize(handling)`: sends `{ type: 'finalize', ... }` WebSocket message; sets error on closed socket
- `onmessage` handler: calls `onSessionData` on every snapshot; calls `onFinalized` when `finalized && finalizedBill`
- Finalize button `onClick` wired to `handleFinalizeClick`, class updated to `font-bold`
- `UnclaimedModal` rendered conditionally at root level

### app/session/[id]/page.tsx

Complete rewrite:
- `SessionPageInner` inner component uses `useSearchParams()` for `?name=` pre-fill
- Wrapped in `<Suspense>` in outer `SessionPage` (required by Next.js for `useSearchParams`)
- Screen type extended: `'joining' | 'session' | 'summary'`
- `isHost` state derived from `onSessionData` callback: `data.hostName === participantName`
- `handleFinalized` stores bill in state, transitions to `'summary'`
- `SummaryScreen` rendered with `bill`, `participantName`, `isHost`
- No `router.push` — pure screen state machine per D-04

## Deviations from Plan

None — plan executed exactly as written, with one minor implementation note:

**HTML entities for apostrophes:** Used `&apos;` in JSX for "I'll cover the rest" and "You didn't claim any items." — JSX requires escaped apostrophes inside string literals within attribute/text contexts to avoid React linting warnings. Functionally identical to the curly-apostrophe variants in the plan.

## Known Stubs

None. All data flows are fully wired:
- `ShareScreen` generates host join URL and renders "Join as host" button
- `JoinForm` pre-fills from `initialName` prop
- `SessionRoom` sends finalize WebSocket message and calls `onFinalized` on receipt of finalized snapshot
- `SummaryScreen` renders real `BillSplitResult` data from `finalizedBill`

## Threat Flags

No new security surface beyond what the plan anticipated:
- T-5-07 (accept): `?name=` param used only for display pre-fill, not authorization
- T-5-08 (accept): `isHost` controls UI visibility only; server-side auth in Plan 01's finalize handler
- T-5-09 (accept): Host sees all totals by design
- T-5-10 (accept): Modal is client-side only; server-side idempotency guard in Plan 01

## Self-Check: PASSED

- `components/session/UnclaimedModal.tsx`: FOUND
- `components/session/SummaryScreen.tsx`: FOUND
- Commit 18672d1 (Task 1): FOUND
- Commit 6c09e76 (Task 2): FOUND
- `npx vitest run`: 13/13 passed
- `grep "hostJoinUrl" components/host/ShareScreen.tsx`: FOUND
- `grep "initialName" components/session/JoinForm.tsx`: FOUND
- `grep "handleFinalizeClick" components/session/SessionRoom.tsx`: FOUND
- `grep "summary" app/session/[id]/page.tsx`: 3 matches FOUND
- `grep "Suspense" app/session/[id]/page.tsx`: FOUND
