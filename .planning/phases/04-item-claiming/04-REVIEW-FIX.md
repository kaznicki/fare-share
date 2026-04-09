---
phase: 04-item-claiming
fixed_at: 2026-04-08T00:00:00Z
review_path: .planning/phases/04-item-claiming/04-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-04-08
**Source review:** .planning/phases/04-item-claiming/04-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: No length cap on participantName allows unbounded memory growth

**Files modified:** `server.ts`
**Commit:** ee204d4
**Applied fix:** Added `MAX_NAME_LEN = 64` and `MAX_ID_LEN = 64` constants at the top of the `ws.on('message', ...)` handler. Applied `.slice(0, MAX_NAME_LEN)` after `.trim()` on `participantName` in all three branches (join, claim, unclaim). Applied `.slice(0, MAX_ID_LEN)` to `itemId` in the claim and unclaim branches as defence-in-depth.

---

### WR-02: `ws.send()` called without checking `readyState` in SessionRoom

**Files modified:** `components/session/SessionRoom.tsx`
**Commit:** 2de8124
**Applied fix:** Replaced optional-chaining `wsRef.current?.send(...)` in `sendClaim` and `sendUnclaim` with an explicit guard: `const ws = wsRef.current; if (ws && ws.readyState === WebSocket.OPEN) { ws.send(...) }`. This prevents `DOMException` when the socket is in CLOSING or CLOSED state.

---

### WR-03: Unguarded `JSON.parse` in SessionRoom WebSocket message handler

**Files modified:** `components/session/SessionRoom.tsx`
**Commit:** 2de8124
**Applied fix:** Wrapped `JSON.parse(event.data)` in the `onmessage` handler with a try/catch block. On `SyntaxError` the handler returns early, ignoring the malformed frame and leaving component state intact.

---

_Fixed: 2026-04-08_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
