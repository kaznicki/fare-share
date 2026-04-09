---
phase: 04-item-claiming
reviewed: 2026-04-08T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - types/index.ts
  - server.ts
  - components/session/ClaimableItem.tsx
  - components/session/SessionRoom.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-08
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the four files implementing Phase 04 item-claiming: the shared type definitions, the WebSocket server message handler, the ClaimableItem display component, and the SessionRoom orchestrator. No critical security vulnerabilities found. Three warnings cover a DoS-relevant input length gap, an unchecked `send()` call that can throw when the socket is not open, and a silent JSON parse crash in the client message handler. Three info items cover type misleading comments, redundant non-null assertions, and a dual-state inconsistency during error+close events.

## Warnings

### WR-01: No length cap on participantName allows unbounded memory growth

**File:** `server.ts:59` and `server.ts:83`
**Issue:** `participantName` is trimmed but never length-capped before being stored in `session.participants` and `session.claims`, and before being broadcast to all connected clients. A client sending a 100 KB name string causes that string to be stored in-memory and serialized into every broadcast payload for the session lifetime.
**Fix:**
```typescript
const MAX_NAME_LEN = 64
const name = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
if (!name) return
```
Apply the same cap to `itemId` (reasonable cap: 64 chars) as a defence-in-depth measure, even though item IDs are generated server-side.

---

### WR-02: `ws.send()` called without checking `readyState` in SessionRoom

**File:** `components/session/SessionRoom.tsx:56` and `components/session/SessionRoom.tsx:60`
**Issue:** `sendClaim` and `sendUnclaim` use optional chaining (`wsRef.current?.send(...)`) to guard against a null ref, but they do not check `ws.readyState`. Calling `.send()` on a WebSocket in `CLOSING` (2) or `CLOSED` (3) state throws a `DOMException: WebSocket is already in CLOSING or CLOSED state`. This is reachable during the reconnecting window after an unexpected disconnect.
**Fix:**
```typescript
const sendClaim = (itemId: string) => {
  const ws = wsRef.current
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'claim', sessionId, participantName, itemId }))
  }
}

const sendUnclaim = (itemId: string) => {
  const ws = wsRef.current
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'unclaim', sessionId, participantName, itemId }))
  }
}
```

---

### WR-03: Unguarded `JSON.parse` in SessionRoom WebSocket message handler

**File:** `components/session/SessionRoom.tsx:29`
**Issue:** `JSON.parse(event.data)` is not wrapped in a try/catch. If the server sends a non-JSON frame (or a browser extension intercepts the WebSocket and injects malformed data), the thrown `SyntaxError` is unhandled — it propagates out of the `onmessage` callback and crashes silently without updating component state, leaving the UI frozen on whatever state it was in.
**Fix:**
```typescript
ws.onmessage = (event) => {
  let msg: ServerMessage
  try {
    msg = JSON.parse(event.data) as ServerMessage
  } catch {
    return  // ignore non-JSON frames
  }
  if (msg.type === 'session-snapshot') {
    setSession(msg.data)
    setConnectionError(null)
    setReconnecting(false)
  }
}
```

---

## Info

### IN-01: `claims` type comment says "append-only Set semantics" but unclaim mutates

**File:** `types/index.ts:17`
**Issue:** The comment on `claims: Record<string, string[]>` reads "append-only Set semantics" but the `unclaim` handler in `server.ts:117` filters the array (a destructive mutation). The comment is inaccurate and could mislead future contributors into assuming entries are never removed.
**Fix:** Update the comment:
```typescript
claims: Record<string, string[]>   // itemId -> participantName[] (unique names; claimable and unclaimable)
```

---

### IN-02: Redundant non-null assertions on `sessionId` inside message handlers

**File:** `server.ts:62`, `server.ts:69`, `server.ts:86`, `server.ts:98`, `server.ts:112`, `server.ts:121`
**Issue:** `sessionId!` is used throughout the message handler body, but `sessionId` is already validated as truthy at line 21 (the connection is closed and the handler returns early if it is falsy). Since `sessionId` is a `const` captured in the closure, TypeScript's type narrowing does not track it across the `ws.on('message', ...)` callback boundary, requiring the `!`. The usage is safe but the frequency is a code smell — extracting `sessionId` as a validated local constant before registering the message handler would clean this up.
**Fix:** No functional change needed. If desired, reassign to a narrowed type before registering the handler:
```typescript
const validatedSessionId: string = sessionId  // sessionId is confirmed string above
// then use validatedSessionId throughout without !
```

---

### IN-03: `onerror` and `onclose` both fire on connection failure, leaving `reconnecting: true` alongside `connectionError`

**File:** `components/session/SessionRoom.tsx:37–48`
**Issue:** When a WebSocket error occurs, `onerror` sets `connectionError` to the "Connection lost" message, then `onclose` fires immediately after and sets `reconnecting` to `true`. The render path checks `connectionError` first (line 71) so the error UI shows correctly, but `reconnecting` remains `true` in state. If `connectionError` is later cleared (e.g., on a successful reconnect in a future phase), the reconnecting banner would appear unexpectedly even though the error was the cause of the disconnect.
**Fix:** Reset `reconnecting` to `false` inside the `onerror` handler to keep the two states consistent:
```typescript
ws.onerror = () => {
  setReconnecting(false)
  setConnectionError('Connection lost. Please refresh to rejoin.')
}
```

---

_Reviewed: 2026-04-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
