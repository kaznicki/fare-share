---
phase: 04-item-claiming
plan: "02"
subsystem: claiming-ui
tags: [claiming, ui, websocket, real-time, tailwind]
dependency_graph:
  requires: [04-01]
  provides: [claimable-item-component, upgraded-session-room]
  affects: [components/session/ClaimableItem.tsx, components/session/SessionRoom.tsx]
tech_stack:
  added: []
  patterns: [four-state-visual-component, derived-state-totals, reconnect-banner, host-only-button]
key_files:
  created:
    - components/session/ClaimableItem.tsx
  modified:
    - components/session/SessionRoom.tsx
decisions:
  - "ClaimableItem uses four visual states (unclaimed/mine/shared/theirs) via Tailwind class switching — no JS animation needed, transition-colors duration-300 handles remote-claim arrival naturally"
  - "myTotalCents is derived in render from session state (not useState) — eliminates sync bugs with WebSocket snapshots"
  - "Finalize button stub (empty onClick) left intentionally — Phase 5 will wire session-finalized message"
  - "Reconnect banner shown on any ws.onclose code != 1008 — does not attempt auto-reconnect (Phase 5 polish), tells user to refresh"
metrics:
  duration: "~6 min"
  completed: "2026-04-08"
  tasks_completed: 2
  files_modified: 2
---

# Phase 4 Plan 2: Claiming UI (ClaimableItem + SessionRoom Upgrade) Summary

**One-liner:** Interactive claiming interface with four visual states, split-price display, pinned running-total footer, reconnect banner, and host-only Finalize button wired to WebSocket claim/unclaim handlers.

## What Was Built

### components/session/ClaimableItem.tsx (new)

Single claimable row component. Four visual states driven by `claimants` array and `participantName`:

| State | Condition | Style |
|-------|-----------|-------|
| unclaimed | claimants.length === 0 | white, gray text |
| mine | includes(participantName) && length === 1 | green-50 / green-200 border, bold name |
| shared | includes(participantName) && length > 1 | blue-50 / blue-200 border |
| theirs | length > 0 && !includes(participantName) | gray-50 / gray-200 border |

- Split price: `$X.XX ÷ N = $Y.YY` using integer cents math (`Math.round(priceCents / claimants.length)`)
- Claimant names shown in small gray text below item name when non-empty
- `transition-colors duration-300` for smooth visual transition on remote-claim arrival
- Entire row wrapped in `<button type="button">` for mobile accessibility
- Tap calls `onUnclaim` when already claimed, `onClaim` otherwise

### components/session/SessionRoom.tsx (upgraded)

- Added `isHost?: boolean` prop — controls Finalize button visibility
- Added `reconnecting` state — set on unexpected WebSocket close (code !== 1008)
- Added `sendClaim` / `sendUnclaim` helpers sending JSON via `wsRef.current?.send`
- Replaced read-only `<li>` list with `<ClaimableItem>` rows passing `session.claims[item.id] ?? []`
- `myTotalCents` computed in render: sums `Math.round(priceCents / claimants.length)` for items where `participantName` is in claimants
- Pinned footer (`fixed bottom-0`) shows "Your total: $X.XX" and host-only Finalize button
- Reconnect banner (`bg-yellow-50`) shown above item list when `reconnecting` is true
- Participant roster updated to `text-xs text-gray-400` for cleaner visual hierarchy
- All existing error/loading/connectionError states preserved

## Verification Results

- `npx tsc --noEmit` — zero errors (both tasks)
- ClaimableItem: all four visual state classes present in component
- SessionRoom: `session.claims[item.id] ?? []` prop pattern present (key_link verified)
- SessionRoom: `participantName` used in footer total computation (key_link verified)
- `ws.send` with `type: 'claim'` and `type: 'unclaim'` present in sendClaim/sendUnclaim helpers (key_link verified)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `SessionRoom.tsx` Finalize button `onClick` is an empty handler: `() => {/* Phase 5 will wire this */}`. This is intentional — the button is visible and interactive (host sees it), but the session-finalized WebSocket message is Phase 5's domain. The claiming flow (this plan's goal) is fully functional.

## Threat Flags

None — no new network endpoints introduced. ClaimableItem is a pure UI component. SessionRoom sends claim/unclaim messages over the existing authenticated WebSocket session (session existence was validated at connection time in server.ts).

## Self-Check: PASSED

- components/session/ClaimableItem.tsx: FOUND
- components/session/SessionRoom.tsx: FOUND (modified)
- Commit b18bcc9 (ClaimableItem): FOUND
- Commit 4777eea (SessionRoom upgrade): FOUND
