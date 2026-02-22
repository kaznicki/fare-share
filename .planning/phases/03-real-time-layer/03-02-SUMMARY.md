---
phase: 03-real-time-layer
plan: 02
subsystem: ui
tags: [react, nextjs, websocket, participant, join-flow, real-time]

# Dependency graph
requires:
  - phase: 03-real-time-layer/03-01
    provides: ws.on('message') join handler — processes join messages, updates participants, broadcasts snapshot
  - phase: 01-foundation
    provides: Next.js app structure, types/index.ts (SessionData, ServerMessage)
  - phase: 02-host-flow
    provides: POST /api/sessions session creation, shareUrl for QR-based entry
provides:
  - app/session/[id]/page.tsx — dynamic route participant page with two-screen state machine (joining -> session) using use(params)
  - components/session/JoinForm.tsx — name entry form with empty guard and Tailwind styling
  - components/session/SessionRoom.tsx — WebSocket connection, join message on open, session-snapshot rendering, participant roster, read-only item list
affects:
  - 03-03 (host page): participant presence broadcasts from server now received by all sockets — host page will show participant list without any additional server changes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - use(params) from React for Next.js Client Component dynamic route params (not async/await)
    - useRef<WebSocket | null>(null) for WebSocket — avoids re-renders from state updates
    - useEffect cleanup ws.close() — Strict Mode safe, prevents double-mount duplicate sockets
    - Two-screen state machine in page component: screen useState controls JoinForm vs SessionRoom conditional render

key-files:
  created:
    - app/session/[id]/page.tsx
    - components/session/JoinForm.tsx
    - components/session/SessionRoom.tsx
  modified: []

key-decisions:
  - "use(params) not async/await for dynamic params: Next.js App Router requires async function for server components awaiting params; client components must use React.use(params) to unwrap the Promise — this is the Next.js 16 client component pattern"
  - "WebSocket in useRef not useState: storing WebSocket in ref prevents re-renders when the socket sends messages; only session data (setSession) lives in state"
  - "Two-screen state machine in page: screen + participantName state owned by page.tsx, JoinForm and SessionRoom are pure components — same pattern as host/page.tsx three-screen machine"

patterns-established:
  - "Two-screen state machine: page owns screen/participantName state; JoinForm renders on 'joining', SessionRoom renders on 'session' — clean separation of concerns"
  - "WebSocket useRef pattern: const wsRef = useRef<WebSocket | null>(null) initialized before useEffect; ws stored in wsRef.current but never read from it (cleanup only); prevents stale closures"
  - "Protocol detection: window.location.protocol === 'https:' ? 'wss:' : 'ws:' — works in HTTPS deployment without hardcoding"

requirements-completed:
  - JOIN-01
  - JOIN-02
  - SYNC-02

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 3 Plan 02: Participant Join Flow Summary

**Two-screen participant page (JoinForm + SessionRoom) with WebSocket presence sync — scan QR, enter name, see items and all joined participants in real time**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T00:29:52Z
- **Completed:** 2026-02-22T00:33:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `components/session/JoinForm.tsx`: name entry form with empty-guard, autoFocus input, disabled submit button when blank, Tailwind styling matching host flow aesthetic
- Created `app/session/[id]/page.tsx`: dynamic route page using `use(params)` for Client Component param access, two-screen state machine (joining -> session), conditionally renders JoinForm then SessionRoom
- Created `components/session/SessionRoom.tsx`: WebSocket lifecycle with useRef, sends `{ type: 'join', participantName }` on open, processes session-snapshot messages to update item list and participant roster, handles 1008 close (invalid session) and onerror states, useEffect cleanup closes socket

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JoinForm component and dynamic session route page** - `0a29dd0` (feat)
2. **Task 2: Create SessionRoom component with WebSocket connection and item list** - `00fda72` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `components/session/JoinForm.tsx` - Name entry form with onSubmit(name) callback, empty guard, Tailwind card layout
- `app/session/[id]/page.tsx` - Participant entry page: use(params) for id extraction, two-screen state machine
- `components/session/SessionRoom.tsx` - WebSocket connection, join message, session-snapshot handling, read-only item list, participant roster

## Decisions Made
- **use(params) for Client Component:** Next.js App Router dynamic params are passed as a Promise in Next.js 15+/16. In a Client Component, `await params` is not valid (would require async, which is Server Component only). `use(params)` from React unwraps the Promise synchronously in the render function — this is the correct pattern.
- **WebSocket in useRef:** Using `useState<WebSocket>` would cause a re-render every time WebSocket state changes (open, message, close). The WebSocket instance only needs to be closed on cleanup — `useRef` provides the reference without triggering renders.

## Deviations from Plan

None - plan executed exactly as written. SessionRoom.tsx was written in the same session as JoinForm.tsx and page.tsx to allow TypeScript to compile cleanly across all three imports. The file was staged and committed as Task 2.

## Issues Encountered
- Existing dev server on port 3000 (from prior session) required process termination before fresh server start. Cleared Next.js `.next/dev/lock` file and killed PID 20996. Server started cleanly on port 3000 after cleanup.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full participant join flow is live and verified end-to-end
- Two participants joining in separate tabs both see each other's names in the participants list without refresh (JOIN-02 verified)
- Reconnecting and rejoining shows full current state with all participants and items (SYNC-02 verified)
- Invalid session ID shows "Session not found or expired." error gracefully (no crash)
- Plan 03-03 (host page real-time) can subscribe to session broadcasts — server already broadcasts to all sockets on join, host page only needs a WebSocket connection to receive participant list updates

## Self-Check: PASSED

- app/session/[id]/page.tsx: FOUND
- components/session/JoinForm.tsx: FOUND
- components/session/SessionRoom.tsx: FOUND
- Commit 0a29dd0: FOUND
- Commit 00fda72: FOUND
- use(params) in page.tsx: FOUND
- WebSocket useRef in SessionRoom.tsx: FOUND
- session-snapshot handler in SessionRoom.tsx: FOUND
- participants.join() in SessionRoom.tsx: FOUND

---
*Phase: 03-real-time-layer*
*Completed: 2026-02-22*
