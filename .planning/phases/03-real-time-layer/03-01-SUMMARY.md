---
phase: 03-real-time-layer
plan: 01
subsystem: api
tags: [websocket, ws, session-store, globalThis, real-time, participants]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: wss.on('connection') handler, sessionStore.broadcast(), sessionStore.getData(), participants[] in SessionState
  - phase: 02-host-flow
    provides: session creation via POST /api/sessions with items/taxCents/tipCents
provides:
  - ws.on('message') handler in server.ts — processes join messages, updates participants, broadcasts snapshot
  - globalThis session store singleton — survives Next.js App Router module re-evaluation
affects:
  - 03-02 (participant page): client sends { type: 'join', participantName } on ws.onopen — server handler is now live

# Tech tracking
tech-stack:
  added: []
  patterns:
    - globalThis singleton for Node.js modules that must survive Next.js App Router module isolation
    - ws.on('message') join handler with parse/validate/update/broadcast pattern

key-files:
  created: []
  modified:
    - server.ts
    - lib/session-store.ts

key-decisions:
  - "globalThis singleton for session store: Next.js App Router compiles route handlers in a separate module context from server.ts; anchoring the store Map to globalThis.__tabSplitterSessionStore ensures a single shared Map across all contexts in the same Node.js process"
  - "No ClientMessage type cast in join handler: plain (msg as any) checks are sufficient and avoid coupling to type import ordering"

patterns-established:
  - "globalThis singleton pattern: declare global { var __tabSplitterSessionStore }, initialize if absent, bind const to globalThis property — prevents dual Map instances in Next.js custom server setups"
  - "ws.on('message') handler structure: parse raw.toString() → validate shape → trim/guard name → get session → idempotent push → getData + broadcast"

requirements-completed:
  - JOIN-02
  - SYNC-02

# Metrics
duration: 8min
completed: 2026-02-22
---

# Phase 3 Plan 01: WebSocket Join Handler Summary

**ws.on('message') join handler wired in server.ts — participants array updated idempotently and broadcast to all sockets after every join, with globalThis singleton fix ensuring session store is shared across Next.js module contexts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-22T00:18:25Z
- **Completed:** 2026-02-22T00:26:37Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Added `ws.on('message')` handler inside `wss.on('connection')` in server.ts — parses join messages, appends participant name (idempotent), broadcasts full state snapshot via sessionStore.getData() + sessionStore.broadcast()
- Fixed pre-existing session store module isolation bug: anchored the session Map to globalThis so REST route handlers and the WebSocket server share the same Map instance across Next.js App Router module contexts
- All four verification criteria confirmed: TypeScript clean, join flow works, idempotent join works, invalid messages silently ignored

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ws.on('message') join handler + fix session store globalThis singleton** - `a57e256` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `server.ts` - Added ws.on('message') handler inside wss.on('connection'); added ClientMessage to import
- `lib/session-store.ts` - Changed store initialization from plain `new Map()` to globalThis singleton pattern

## Decisions Made
- **globalThis singleton for session store:** Next.js App Router in dev mode loads route handler modules in a separate context from server.ts. A plain `const store = new Map()` creates two isolated Map instances — the REST API writes to one, the WS server reads from another, so `sessionStore.has(sessionId)` always returns false for WS connections. Fix: `globalThis.__tabSplitterSessionStore = new Map()` initialized once, then `const store = globalThis.__tabSplitterSessionStore`. This is the standard pattern for Next.js custom servers.
- **No ClientMessage cast in join handler:** The plan gave the option to use `ClientMessage` type cast. The implementation uses `(msg as any)` guards instead — more concise and avoids needing to import the type into a narrowed path. TypeScript compiles cleanly either way.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed session store module isolation in Next.js App Router**
- **Found during:** Task 1 (Add ws.on('message') handler) — verification step showed ws.close(1008) "Session not found" despite session being created successfully
- **Issue:** Next.js App Router compiled route handlers in a separate module context from server.ts. The `const store = new Map()` in lib/session-store.ts created two isolated Map instances — REST routes wrote to one, WebSocket server read from another. sessionStore.has(sessionId) returned false for all WS connections.
- **Fix:** Changed store initialization to use `globalThis.__tabSplitterSessionStore` with a TypeScript global declaration. Map is initialized once, subsequent module loads bind to the same instance.
- **Files modified:** `lib/session-store.ts`
- **Verification:** End-to-end WebSocket test confirmed: session created via POST /api/sessions, WebSocket connects and receives initial snapshot, join message processed, snapshot with `participants: ["Alice"]` broadcast. Idempotent join confirmed (Alice appears exactly once after two join messages).
- **Committed in:** `a57e256` (Task 1 commit — included in same commit as the ws.on('message') handler)

---

**Total deviations:** 1 auto-fixed (Rule 1 - pre-existing bug)
**Impact on plan:** The globalThis fix is essential for correctness — without it, no WebSocket functionality works. The fix is minimal (5 lines added, 1 line changed) and follows the standard Next.js custom server pattern. No scope creep.

## Issues Encountered
- Existing dev server on port 3000 (from Phase 2 work) was still running, requiring testing on port 3002 to avoid conflicts. Server started cleanly on 3002 after clearing the Next.js dev lock file.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WebSocket join handler is live and verified end-to-end
- The session store globalThis fix resolves the module isolation issue that would have blocked all WebSocket functionality
- Plan 03-02 (participant page) can now implement the client-side join flow: client connects to ws://host/ws?session=ID, sends { type: 'join', participantName }, receives session-snapshot with updated participants array
- The broadcast reaches ALL connected sockets after each join — host page (Plan 03-03) will receive participant list updates without any additional server changes

## Self-Check: PASSED

- server.ts: FOUND
- lib/session-store.ts: FOUND
- .planning/phases/03-real-time-layer/03-01-SUMMARY.md: FOUND
- Commit a57e256: FOUND
- ws.on('message') in server.ts: FOUND
- globalThis pattern in session-store.ts: FOUND
- participants.push in server.ts: FOUND
- sessionStore.broadcast in server.ts: FOUND

---
*Phase: 03-real-time-layer*
*Completed: 2026-02-22*
