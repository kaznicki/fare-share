---
phase: 05-summary-and-finalization
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - app/session/[id]/page.tsx
  - components/host/OcrReview.tsx
  - components/host/ShareScreen.tsx
  - components/session/JoinForm.tsx
  - components/session/SessionRoom.tsx
  - components/session/SummaryScreen.tsx
  - components/session/UnclaimedModal.tsx
  - lib/bill-split.ts
  - lib/session-store.ts
  - app/api/sessions/route.ts
  - server.ts
  - types/index.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

All twelve source files were reviewed at standard depth. The codebase is well-structured: input validation via Zod, integer-cents math throughout, server-side authorization on finalize, and the LRM for tax/tip distribution are all solid. The WebSocket broadcast-on-every-change pattern is clean and easy to reason about.

Four warnings and three info items were found. No critical (security/crash) issues exist. The most important finding is a math correctness bug in `bill-split.ts`: `Math.round` is used for shared-item cost splitting, which can silently lose or gain cents when an item is claimed by two or more people. A related silent-data-loss path exists when `unclaimedHandling === 'host'` but the host has not yet joined the session. Both issues affect the correctness of bills shown to users.

---

## Warnings

### WR-01: Shared-item split uses `Math.round`, losing/gaining cents

**File:** `lib/bill-split.ts:94`

**Issue:** When an item is claimed by N people, each claimant's share is computed as `Math.round(item.priceCents / claimants.length)`. For any item whose price does not divide evenly by the number of claimants, cents are silently lost or gained. Example: a $1.00 item (100 cents) split among 3 people gives each person `Math.round(33.33) = 33` cents, so only 99 cents are collected — 1 cent disappears from every participant's subtotal. Tax and tip use the correct Largest Remainder Method, but the subtotal stage does not, so the per-person totals in `SummaryScreen` will not sum to the actual bill total when shared items are present.

**Fix:** Apply LRM to the per-item share distribution, the same way tax and tip are handled:

```ts
// Replace lines 93-99 with:
const claimantCount = claimants.length
const base = Math.floor(item.priceCents / claimantCount)
const remainder = item.priceCents % claimantCount

// Give 1 extra cent to the first `remainder` claimants (stable order)
for (let k = 0; k < claimantCount; k++) {
  const name = claimants[k]
  if (subtotals[name] !== undefined) {
    subtotals[name] += base + (k < remainder ? 1 : 0)
  }
}
```

---

### WR-02: Unclaimed cost silently dropped when host has not joined the WebSocket

**File:** `lib/bill-split.ts:107-110`

**Issue:** When `unclaimedHandling === 'host'`, the unclaimed total is added to `subtotals[hostName]` only if `subtotals[hostName] !== undefined`. `subtotals` is built by iterating `participants`, which is the list of names that sent a `join` WebSocket message. If the host created the session but navigated away before joining as a participant (e.g., closed the tab after seeing the QR code), `hostName` is not in `participants`, so `subtotals[hostName]` is `undefined` and the entire unclaimed cost is silently dropped from the bill. Nobody pays for those items.

**Fix:** Ensure `hostName` is always included in participants when `unclaimedHandling === 'host'`, or pre-seed the subtotals map with the host:

```ts
// In billSplit(), before Step 1, ensure hostName is seeded if host-absorb is selected:
if (unclaimedHandling === 'host' && !participants.includes(hostName)) {
  // Treat host as a participant for accounting purposes
  participants = [...participants, hostName]
}
// Then continue building subtotals as normal.
```

Alternatively, guarantee the host is added to `session.participants` server-side when the session is created (in `session-store.ts`), so the host is always present in the participants list before any client connects.

---

### WR-03: `isHost` detection uses case-sensitive name comparison; any name collision grants host UI

**File:** `app/session/[id]/page.tsx:42`

**Issue:** Host status is determined client-side by comparing `data.hostName === participantName`. This comparison is case-sensitive and string-exact. Two distinct problems arise:
1. If the host's name was typed with different casing in the QR link versus what the server stored, the host will not see the Finalize button at all.
2. Any other participant who happens to enter the exact same name as the host (including capitalisation) will receive `isHost = true` and see the Finalize button.

The server correctly gates the `finalize` WebSocket message on `senderName !== session.hostName`, so this is a UI-only issue — a non-host who triggers finalize will be silently rejected by the server. However, the misleading UI state is confusing and the UI guard should match the server guard.

**Fix:** Pass `isHost` down from the server in the session snapshot rather than deriving it client-side:

```ts
// In server.ts join branch, send a per-socket isHost field:
const isHostForSender = name === session.hostName
ws.send(JSON.stringify({
  type: 'session-snapshot',
  data,
  isHost: isHostForSender,   // add to ServerMessage union in types/index.ts
}))
```

If changing the protocol is out of scope for Phase 5, the minimal fix is to trim and normalise case when comparing: `data.hostName.trim().toLowerCase() === participantName.trim().toLowerCase()` — but this must match the server's comparison logic in `server.ts:140`.

---

### WR-04: WebSocket reconnect sets `reconnecting` state but never retries the connection

**File:** `components/session/SessionRoom.tsx:52-58`

**Issue:** When the WebSocket closes with a non-1008 code (network drop, server restart), `setReconnecting(true)` is called and the yellow "Reconnecting..." banner appears. However, no retry logic is implemented — the component never creates a new WebSocket. The banner stays visible indefinitely until the user manually refreshes the page. For a real-time bill-splitting flow this means a participant who loses connectivity mid-session appears stuck and cannot claim or unclaim items.

**Fix:** Implement exponential backoff reconnect using a ref-based timeout:

```ts
const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

ws.onclose = (event) => {
  sessionStore.removeSocket(sessionId, ws)   // server-side cleanup already handled
  if (event.code === 1008) {
    setConnectionError('Session not found or expired.')
  } else {
    setReconnecting(true)
    reconnectTimeoutRef.current = setTimeout(() => {
      // Re-run the effect by bumping a retryCount state variable
      setRetryCount(c => c + 1)
    }, 3000)
  }
}

// Add retryCount to the useEffect dependency array so the effect re-runs on increment.
// Clean up the timeout in the effect's return function.
```

---

## Info

### IN-01: Unnecessary `sessionId!` non-null assertions inside the message handler

**File:** `server.ts:66, 73, 75, 91, 102, 111, 122, 125, 135, 158, 161, 163`

**Issue:** `sessionId` is declared as `string | null` from `url.searchParams.get('session')`, and the connection handler immediately returns if it is null or the session does not exist (lines 22-25). Every subsequent use of `sessionId` inside the same handler scope is therefore guaranteed non-null, but the code uses `sessionId!` throughout. These assertions are not incorrect, but they add visual noise and would mask a future refactor that removes the early return.

**Fix:** Narrow the type once at the top of the handler:

```ts
if (!sessionId || !sessionStore.has(sessionId)) {
  ws.close(1008, 'Session not found')
  return
}
// sessionId is narrowed to string here — no ! needed below.
const safeSessionId: string = sessionId
```

Then replace all `sessionId!` references with `safeSessionId`.

---

### IN-02: `grandTotal` in SummaryScreen sums `totalCents` rather than using a receipt-level total

**File:** `components/session/SummaryScreen.tsx:16`

**Issue:** `grandTotal` is computed as `bill.participants.reduce((s, p) => s + p.totalCents, 0)`. Because `bill-split.ts` uses `Math.round` for shared items (WR-01), this sum may not equal the actual receipt total (`itemsTotal + taxCents + tipCents`). The discrepancy will be visible to the host in the "Everyone's totals" table. This is a downstream symptom of WR-01; fixing WR-01 resolves this automatically. No standalone fix needed until WR-01 is addressed.

---

### IN-03: `window.location.origin` comment overstates SSR safety rationale

**File:** `components/host/ShareScreen.tsx:11-13`

**Issue:** The comment says `window.location.origin` is safe because it is "inside function body — NOT at module level". The actual protection is the `'use client'` directive on line 1, which prevents the component from executing during server-side rendering. Accessing `window` inside a function body at module level (e.g., `const x = () => window.location`) would still crash during SSR in a server component. The comment could mislead a future developer who copies the pattern into a server component.

**Fix:** Update the comment to clarify the actual reason:

```ts
// Safe to access window here because this is a 'use client' component —
// it only renders in the browser, never during SSR.
const joinUrl = `${window.location.origin}/session/${sessionId}`
```

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
