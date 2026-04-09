---
phase: 05-summary-and-finalization
plan: "03"
subsystem: gap-closure
tags: [bug-fix, websocket, security, react, stale-closure]
depends_on:
  requires: [05-01, 05-02]
  provides: [WR-05-fix, WR-06-fix]
  affects: [server.ts, SessionRoom.tsx]
tech_stack:
  added: []
  patterns: [callback-ref-pattern, case-insensitive-comparison]
key_files:
  created: []
  modified:
    - server.ts
    - components/session/SessionRoom.tsx
decisions:
  - "Case-insensitive host check: normalize both sides with .trim().toLowerCase() in server finalize gate — same as WR-03 client-side fix"
  - "Callback ref pattern for SessionRoom: onFinalizedRef/onSessionDataRef synced on every render; onmessage reads .current — avoids WebSocket reconnect that useCallback in deps would cause"
metrics:
  duration_seconds: 40
  completed_date: "2026-04-09"
  tasks_completed: 2
  files_modified: 2
---

# Phase 05 Plan 03: Gap Closure Summary

**One-liner:** Case-insensitive server finalize gate (WR-05) and callback-ref stabilization of onFinalized/onSessionData in SessionRoom (WR-06).

## What Was Built

Two targeted fixes closing the remaining UAT gap (Test 9 — "I'll cover the rest"):

### Task 1 — WR-05: Server-side host identity check normalization (commit `a062429`)

`server.ts` line 140 previously used strict byte equality (`senderName !== session.hostName`). When the host's `participantName` casing differed from `session.hostName` (e.g. "alice" vs "Alice"), the finalize message was silently dropped and the summary screen never appeared.

Changed to:
```typescript
if (senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()) return
```

Mirrors the normalization WR-03 applied to the client-side `isHost` check in `page.tsx`.

### Task 2 — WR-06: Stale-closure fix in SessionRoom useEffect (commit `60cdc54`)

`SessionRoom.tsx` useEffect dep array correctly omits `onFinalized` and `onSessionData` (adding them would reconnect the WebSocket on every parent re-render). But the `onmessage` handler held stale first-render versions of those callbacks.

Fixed using the standard "latest callback ref" pattern:
- Added `onFinalizedRef` and `onSessionDataRef` as `useRef` values
- Synced both refs on every render (before the useEffect)
- `onmessage` reads `onFinalizedRef.current` / `onSessionDataRef.current` instead of the captured closure values
- useEffect dep array stays `[sessionId, participantName, retryCount]` — no reconnect side-effect

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1    | `a062429` | fix(05): WR-05 normalize server-side host identity check to case-insensitive |
| 2    | `60cdc54` | fix(05): WR-06 stabilize onFinalized/onSessionData via callback refs in SessionRoom |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Both changes tighten existing security behavior (T-5-01 gate made more robust).

## Self-Check: PASSED

- `server.ts` modified: confirmed (line 140 normalized comparison)
- `components/session/SessionRoom.tsx` modified: confirmed (refs added, onmessage updated, dep array unchanged)
- Commit `a062429`: confirmed in git log
- Commit `60cdc54`: confirmed in git log
