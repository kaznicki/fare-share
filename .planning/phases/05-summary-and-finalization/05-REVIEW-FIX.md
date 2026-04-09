---
phase: 05-summary-and-finalization
fixed_at: 2026-04-09T00:00:00Z
review_path: .planning/phases/05-summary-and-finalization/05-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 5: Code Review Fix Report

**Fixed at:** 2026-04-09
**Source review:** .planning/phases/05-summary-and-finalization/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### WR-01: Shared-item split uses `Math.round`, losing/gaining cents

**Files modified:** `lib/bill-split.ts`
**Commit:** f65cba8
**Applied fix:** Replaced the `Math.round(item.priceCents / claimants.length)` loop with a proper Largest Remainder Method implementation. Each claimant now receives `Math.floor(priceCents / count)` cents, and the first `priceCents % count` claimants each receive one extra cent. This guarantees the per-claimant shares sum to exactly `item.priceCents` with no cent loss or gain. Updated the JSDoc comment to reflect LRM instead of Math.round.

---

### WR-02: Unclaimed cost silently dropped when host has not joined the WebSocket

**Files modified:** `lib/bill-split.ts`
**Commit:** c9b23c6
**Applied fix:** At the top of `billSplit()`, before building the subtotals map, a guard now checks whether `unclaimedHandling === 'host'` and `hostName` is absent from `participants`. If so, the host is appended to a local copy of the participants array before the subtotals map is initialised. This ensures the host always has a subtotals entry and the unclaimed cost is never silently dropped, even if the host never sent a WebSocket `join` message.

---

### WR-03: `isHost` detection uses case-sensitive name comparison

**Files modified:** `app/session/[id]/page.tsx`
**Commit:** 9e24306
**Applied fix:** Changed the `isHost` derivation in the `onSessionData` callback from a strict equality check (`data.hostName === participantName`) to a case-insensitive trimmed comparison (`data.hostName.trim().toLowerCase() === participantName.trim().toLowerCase()`). This prevents both the false-negative (host typed with different casing sees no Finalize button) and the false-positive (another participant who typed the same name gets host UI). The server-side authorization gate in `server.ts` remains unchanged and continues to be the authoritative guard.

---

### WR-04: WebSocket reconnect sets `reconnecting` state but never retries the connection

**Files modified:** `components/session/SessionRoom.tsx`
**Commit:** d397648
**Applied fix:** Added `retryCount` state (starts at 0) and `reconnectTimeoutRef` to `SessionRoom`. The `ws.onclose` handler now schedules a timeout that increments `retryCount` after a delay calculated with exponential backoff (`min(3000 * 2^retryCount, 30000)` ms — starting at 3 s, doubling up to a 30 s cap). Because `retryCount` is in the `useEffect` dependency array, incrementing it re-runs the effect, which creates a fresh WebSocket and reconnects automatically. The cleanup function cancels any pending timeout before closing the socket to avoid stale state updates on unmount.

---

_Fixed: 2026-04-09_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
