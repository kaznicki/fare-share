# Phase 3: Real-Time Layer - Research

**Researched:** 2026-02-21
**Domain:** WebSocket server message handling (ws library) + Next.js 16 App Router participant page
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JOIN-01 | Participant can open the share URL, enter only their name (no account or password required), and immediately access the session | Dynamic route `app/session/[id]/page.tsx` + `'use client'` name-entry form + `use(params)` for session ID — all confirmed via Next.js 16 official docs |
| JOIN-02 | All participants in the session see when a new person joins in real time | `ws.on('message')` handler in server.ts parses `{ type: 'join', participantName }`, appends to `session.participants`, and calls `sessionStore.broadcast()` with updated snapshot — already wired in existing store |
| SYNC-02 | A participant who loses and regains their connection rejoins the session and sees the complete current state — no claims missing | Full-state snapshot already sent on every `wss.on('connection')` — no additional work needed; client reconnect via cleanup+new WebSocket in useEffect handles this automatically |
</phase_requirements>

---

## Summary

Phase 3 builds on a foundation that is already largely in place. The `ws` WebSocket server, session store, `broadcast()` helper, and full-state snapshot-on-connect are all implemented in `server.ts` and `lib/session-store.ts` from Phase 1. What is missing is: (1) a server-side `message` handler in `server.ts` that processes the `{ type: 'join' }` client message and updates `session.participants`, and (2) the participant-facing Next.js pages — a dynamic route for the session room and a name-entry form that connects to the WebSocket.

The architecture is deliberately simple: no external real-time service, no Socket.IO, no Zustand yet (Phase 4). The participant page uses `useState` for local name input and WebSocket state, connects via `useEffect`, and renders a read-only item list from the session snapshot received over the wire. The server already broadcasts full state to all sockets after every change, so the presence broadcast after join is a single `sessionStore.broadcast()` call.

SYNC-02 (reconnect) is handled for free: the server sends a full snapshot to every new `wss.on('connection')`, so a reconnecting client always receives the current complete state regardless of what happened while disconnected.

**Primary recommendation:** Add the `join` message handler to `server.ts`, create `app/session/[id]/page.tsx` as a `'use client'` page with a two-screen state machine (name entry → item list), and wire the WebSocket connection in `useEffect` with a proper cleanup that calls `ws.close()`.

---

## Standard Stack

### Core (all already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ws` | ^8.0.0 | Server-side WebSocket, message routing | Already installed; `wss.on('message')` is the standard API for receiving client messages |
| `next` | 16.1.6 | App Router, dynamic route `app/session/[id]/page.tsx` | Already installed; `use(params)` in Client Components is the official pattern for Next.js 15+ |
| `react` | 19.2.3 | `useEffect` for WebSocket lifecycle, `useState` for connection state | Already installed; built-in WebSocket API (no client library needed) |

### No New Packages Needed

All required capabilities are available in the already-installed stack:
- WebSocket server: `ws` (installed)
- Dynamic route segment: Next.js App Router (installed)
- Client-side WebSocket: browser-native `WebSocket` API (no npm package needed)
- State management for Phase 3: `useState` is sufficient (Zustand deferred to Phase 4)

**Installation:**
```bash
# No new packages — existing stack covers all Phase 3 requirements
```

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 3)

```
app/
└── session/
    └── [id]/
        └── page.tsx        # Participant page: name entry + item list

components/
└── session/
    ├── JoinForm.tsx         # Name entry form (screen 1)
    └── SessionRoom.tsx      # Item list scaffold (screen 2)

server.ts                    # ADD: ws.on('message') handler for join
types/index.ts               # ADD: participant-joined ServerMessage type
```

### Pattern 1: Server-Side `join` Message Handler

**What:** When a participant sends `{ type: 'join', participantName: string }` over the WebSocket, the server validates, appends to `session.participants`, and broadcasts the updated full-state snapshot to all sockets in the room.

**When to use:** Every new participant connection sends this message immediately after the WebSocket opens (from the client's `ws.onopen` handler).

**Example:**
```typescript
// Source: ws README (github.com/websockets/ws) + existing server.ts pattern
wss.on('connection', (ws, req) => {
  // ... existing setup: sessionId validation, addSocket, send snapshot ...

  ws.on('message', (raw) => {
    let msg: unknown
    try { msg = JSON.parse(raw.toString()) } catch { return }

    if (
      typeof msg === 'object' && msg !== null &&
      (msg as any).type === 'join' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const name = ((msg as any).participantName as string).trim()
      if (!name) return

      const session = sessionStore.get(sessionId!)
      if (!session) return

      // Append-only — do not re-add if already present (reconnect case)
      if (!session.participants.includes(name)) {
        session.participants.push(name)
      }

      // Broadcast full state so all clients see updated participant list
      const data = sessionStore.getData(sessionId!)!
      sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
    }
  })
})
```

**Key detail:** The reconnect case (participant already in list) is handled by the `!session.participants.includes(name)` guard — idempotent join. This means SYNC-02 reconnect works without separate logic.

### Pattern 2: Client-Side WebSocket Connection in useEffect

**What:** A `'use client'` page establishes a WebSocket connection after the participant submits their name, receives the full-state snapshot, and renders the item list. Cleanup closes the socket on unmount.

**When to use:** Participant page, screen 2 (after name is submitted).

**Example:**
```typescript
// Source: fly.io/javascript-journal/websockets-with-nextjs/ + Next.js 16 official docs
'use client'
import { useEffect, useRef, useState } from 'react'
import type { SessionData, ServerMessage } from '@/types'

interface Props { sessionId: string; participantName: string }

export default function SessionRoom({ sessionId, participantName }: Props) {
  const [session, setSession] = useState<SessionData | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws?session=${sessionId}`
    )
    wsRef.current = ws

    ws.onopen = () => {
      // Send join message immediately after connection
      ws.send(JSON.stringify({ type: 'join', participantName }))
    }

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data)
      if (msg.type === 'session-snapshot') {
        setSession(msg.data)
      }
    }

    ws.onclose = () => {
      // Could set a "disconnected" UI state here
    }

    return () => {
      ws.close()
    }
  }, [sessionId, participantName])

  if (!session) return <div>Connecting...</div>

  return (
    <ul>
      {session.items.map(item => (
        <li key={item.id}>{item.name} — ${(item.priceCents / 100).toFixed(2)}</li>
      ))}
    </ul>
  )
}
```

**Key detail:** `useRef` stores the ws instance so cleanup always closes the same socket. The dependency array `[sessionId, participantName]` means the connection only opens once.

### Pattern 3: Dynamic Route for Participant Page (Next.js 16 Client Component)

**What:** The share URL is `/session/{sessionId}`, mapped to `app/session/[id]/page.tsx`. In a Client Component, dynamic params are accessed via React's `use()` API.

**Example:**
```typescript
// Source: nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes (2026-02-20)
'use client'
import { use } from 'react'

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  // id is the session ID from the URL
  // Render name entry form initially, switch to SessionRoom after join
}
```

**Alternative:** Use `useParams()` from `next/navigation` in a child client component — both approaches are valid per official docs.

### Pattern 4: Two-Screen State Machine (Participant Page)

**What:** Mirror the host page pattern — a single `useState<'joining' | 'session'>` drives conditional rendering. No router navigation; ephemeral state (name, ws) lives in memory.

```typescript
// Mirrors existing host/page.tsx pattern from STATE.md
type Screen = 'joining' | 'session'

const [screen, setScreen] = useState<Screen>('joining')
const [name, setName] = useState('')

if (screen === 'joining') {
  return <JoinForm onSubmit={(n) => { setName(n); setScreen('session') }} />
}
return <SessionRoom sessionId={id} participantName={name} />
```

### Pattern 5: ServerMessage Type Extension

**What:** Add a `participant-joined` ServerMessage type to `types/index.ts`. However, since we broadcast full-state snapshots (not delta events), the `session-snapshot` type already carries the full participant list. No separate `participant-joined` event type is required — the updated snapshot after join IS the join notification.

**Implication:** Clients receive the snapshot; they compare the participants array to detect new joiners (or simply re-render the whole list). This is the approach consistent with the locked decision: "Full-state broadcast after every change."

### Anti-Patterns to Avoid

- **Sending a delta `participant-joined` event instead of a full snapshot:** Contradicts the locked "full-state broadcast" decision and creates a merge problem on the client.
- **Storing WebSocket in `useState`:** React state triggers re-renders; use `useRef` instead for the WebSocket instance.
- **Opening the WebSocket in the `joining` screen:** Connect only after name is submitted — avoids anonymous sockets with no participant name.
- **Reconstructing the WebSocket URL with hardcoded `ws://localhost:3000`:** Use `window.location.protocol` and `window.location.host` so it works in all environments.
- **Not guarding against empty/whitespace names:** Server strips whitespace; client should also prevent form submission with empty name.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnect with exponential backoff | Custom reconnect timer | Browser-native `onclose` + `useEffect` re-run via state change | Phase 3 only needs "reconnect on reopen" — the full snapshot pattern makes backoff unnecessary; keep it simple |
| Client-side state sync | Custom diff/patch | `session-snapshot` full state replacement | Already decided; broadcast sends complete state, client just calls `setSession(msg.data)` |
| Participant deduplication | Complex Set/Map logic | `!session.participants.includes(name)` guard | Simple array check is correct for this scale |

**Key insight:** The full-state snapshot model eliminates most real-time sync complexity. The client never needs to merge partial updates — it just replaces its state with the latest snapshot.

---

## Common Pitfalls

### Pitfall 1: React Strict Mode Double-Mount Opens Two WebSockets

**What goes wrong:** In development, React Strict Mode mounts → unmounts → remounts every component. If cleanup is not implemented, two WebSocket connections open for the same session, the server registers two sockets for the same participant, and the participant appears in the room twice.

**Why it happens:** React intentionally double-invokes `useEffect` setup+cleanup in dev to surface missing cleanup functions. The second mount opens a new socket before the first is closed if cleanup is absent.

**How to avoid:** Always return a cleanup function from `useEffect` that calls `ws.close()`. With proper cleanup, Strict Mode opens socket → closes it → opens it once more (the "real" connection). Net result: one active socket.

**Warning signs:** Participant name appears twice in the participants list immediately on join.

### Pitfall 2: WebSocket URL Protocol Mismatch

**What goes wrong:** Hardcoding `ws://` on an HTTPS deployment throws a browser security error; the connection is refused.

**Why it happens:** Mixed content rules — secure pages cannot open unencrypted WebSocket connections.

**How to avoid:** Always derive protocol from `window.location.protocol`:
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
```

**Warning signs:** Console error "Mixed Content: The page was loaded over HTTPS but attempted to connect to ws://..."

### Pitfall 3: Opening WebSocket Before Name Is Submitted

**What goes wrong:** The socket connects but no `join` message is ever sent with a name. The server registers a nameless socket. When the server tries to include participants in the broadcast, the participant is invisible. Then when the user actually types a name and hits submit, a second WebSocket may open.

**Why it happens:** WebSocket connection is wired to component mount rather than to the "join" action.

**How to avoid:** Render `SessionRoom` (which opens the WebSocket) only after name is captured — the two-screen state machine prevents this.

### Pitfall 4: `use(params)` vs `await params` in Client Components

**What goes wrong:** In a Client Component, using `const { id } = await params` fails at runtime because `await` cannot be used outside an async function in a Client Component context.

**Why it happens:** Next.js 15+ made `params` a Promise for Server Components (async/await) and Client Components (React `use()` hook). These are different resolution mechanisms.

**How to avoid:** In Client Components, use `const { id } = use(params)` — this is the official pattern per Next.js 16.1.6 docs. Server Components use `async/await`.

**Warning signs:** TypeScript error or runtime "Objects are not valid as a React child" when trying to render.

### Pitfall 5: Missing `?session=` Query Parameter on WebSocket URL

**What goes wrong:** Server-side `url.searchParams.get('session')` returns `null`, causing `ws.close(1008, 'Session not found')` immediately.

**Why it happens:** The WebSocket URL is constructed without appending the session ID as a query parameter.

**How to avoid:** The client must construct: `ws://host/ws?session=${sessionId}`. This matches the existing server.ts pattern that reads `url.searchParams.get('session')`.

---

## Code Examples

Verified patterns from official sources:

### ws Server Message Reception (Official API)
```typescript
// Source: github.com/websockets/ws README (verified 2026-02-21)
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // data is a Buffer or string; toString() normalizes
    const msg = JSON.parse(data.toString())
  })
})
```

### Next.js 16 Client Component with Dynamic Params
```typescript
// Source: nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes (version 16.1.6, updated 2026-02-20)
'use client'
import { use } from 'react'

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <div>Session: {id}</div>
}
```

### WebSocket URL Construction (Protocol-Safe)
```typescript
// Source: fly.io/javascript-journal/websockets-with-nextjs/ (verified 2026-02-21)
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const ws = new WebSocket(`${protocol}//${window.location.host}/ws?session=${sessionId}`)
```

### useEffect WebSocket with Cleanup (React 19 + Strict Mode Safe)
```typescript
// Source: React docs (react.dev) + fly.io WebSockets with Next.js (verified 2026-02-21)
useEffect(() => {
  const ws = new WebSocket(url)

  ws.onopen = () => { ws.send(JSON.stringify({ type: 'join', participantName })) }
  ws.onmessage = (event) => { /* update state */ }

  return () => { ws.close() }  // cleanup — Strict Mode safe
}, [url, participantName])
```

### sessionStore broadcast after join
```typescript
// Source: existing lib/session-store.ts broadcast() method
// After appending participant, broadcast full snapshot to all sockets in room:
const data = sessionStore.getData(sessionId)!
sessionStore.broadcast(sessionId, { type: 'session-snapshot', data })
// No need to exclude sender — they receive the snapshot too, which is correct
```

---

## What Already Exists (Don't Rebuild)

This is critical context for the planner — Phase 1 built most of Phase 3's server infrastructure:

| Feature | Status | Location |
|---------|--------|----------|
| WebSocket server (noServer mode) | COMPLETE | `server.ts` lines 15-47 |
| Session validation on connect | COMPLETE | `server.ts` lines 21-24 |
| Full-state snapshot on connect | COMPLETE | `server.ts` lines 30-37 |
| Socket registration/deregistration | COMPLETE | `sessionStore.addSocket()`, `sessionStore.removeSocket()` |
| `broadcast()` helper | COMPLETE | `lib/session-store.ts` lines 88-97 |
| `getData()` serialization helper | COMPLETE | `lib/session-store.ts` lines 70-75 |
| `participants: string[]` in SessionState | COMPLETE | `types/index.ts` line 17 |
| `ClientMessage` type `{ type: 'join' ... }` | COMPLETE | `types/index.ts` lines 39-41 |

**What is NOT yet implemented (Plan 03-01 builds this):**
- `ws.on('message')` handler in `server.ts` — parse `join` message, update `session.participants`, broadcast

**What is NOT yet implemented (Plan 03-02 builds this):**
- `app/session/[id]/page.tsx` — participant page (dynamic route)
- `components/session/JoinForm.tsx` — name entry screen
- `components/session/SessionRoom.tsx` — item list scaffold + WebSocket connection

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Socket.IO for real-time in Node | Raw `ws` library | Ongoing preference | No adapter needed; smaller dependency; works fine with noServer routing |
| `params` as sync object in Next.js 14 | `params` as `Promise` (use `use()` in Client Components) | Next.js 15 | Client Component pages must use React `use(params)` not destructuring |
| `useSocket` custom hooks or Socket.IO client | Native browser `WebSocket` API | Evergreen | No library needed for basic connect/message/close |

**Still current:**
- `ws` noServer mode for multi-protocol upgrade routing — documented pattern, unchanged in ws 8.x
- Full-state snapshot on reconnect — simpler than event replay, scales well for this session size

---

## Open Questions

1. **Participant name collision (same name submitted twice)**
   - What we know: Server guard `!session.participants.includes(name)` prevents duplicate entries
   - What's unclear: Should the server reject duplicate names with an error message, or silently allow the second connection (same name, different socket)?
   - Recommendation: Allow silent deduplication for Phase 3. Both connections share the same name and receive broadcasts. Phase 4 (claims) may need to revisit if claims are keyed by name.

2. **Session not found on join page load**
   - What we know: Session IDs expire after 4 hours; an expired or invalid ID causes `ws.close(1008, 'Session not found')`
   - What's unclear: What should the participant page render while loading / before WebSocket connects?
   - Recommendation: Show "Connecting..." while `session === null`; show an error state if WebSocket closes with code 1008. Keep it simple for Phase 3.

3. **Share URL format: `/session/{id}` vs `/join/{id}` vs `/s/{id}`**
   - What we know: The share URL is generated in `ShareScreen.tsx` from Phase 2 using `window.location.origin` — the exact path prefix is not yet defined
   - What's unclear: The ShareScreen currently generates the URL; need to confirm the path prefix matches the new dynamic route
   - Recommendation: Use `/session/[id]` and update ShareScreen URL to `${origin}/session/${sessionId}` — or verify what ShareScreen currently generates.

---

## Sources

### Primary (HIGH confidence)
- `github.com/websockets/ws` README — server message handling, noServer mode (verified 2026-02-21)
- `nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes` (version 16.1.6, last updated 2026-02-20) — dynamic segments, `use(params)` in Client Components
- `nextjs.org/docs/app/api-reference/functions/use-params` (version 16.1.6, last updated 2026-02-20) — `useParams` hook as alternative
- Existing codebase: `server.ts`, `lib/session-store.ts`, `types/index.ts` — verified by direct file read

### Secondary (MEDIUM confidence)
- `fly.io/javascript-journal/websockets-with-nextjs/` — WebSocket URL construction with protocol detection, useEffect cleanup pattern (fetched 2026-02-21)
- `react.dev/reference/react/StrictMode` — Strict Mode double-mount behavior and cleanup requirements (WebSearch verified 2026-02-21)

### Tertiary (LOW confidence)
- oneuptime.com WebSocket room management blog (2026-01) — room architecture patterns; general pattern, not ws-specific

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new packages; all verified via existing codebase and official Next.js 16 docs
- Architecture (server message handler): HIGH — ws.on('message') is core library API; existing server.ts establishes the exact pattern to follow
- Architecture (participant page): HIGH — Next.js 16.1.6 official docs confirm `use(params)` for Client Components
- Pitfalls: HIGH for protocol/Strict Mode/params (official sources); MEDIUM for name collision (reasoning from existing code)

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable stack — ws 8.x and Next.js 16.1.6 APIs are stable)
