# Phase 7: UX & Display Fixes - Pattern Map

**Mapped:** 2026-04-30
**Files analyzed:** 8 (7 edited + 1 created)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/host/TaxTipFields.tsx` | component | transform (props → render) | self (additive edit) | exact |
| `components/session/SummaryScreen.tsx` | component | request-response (callback prop) | `components/session/SessionRoom.tsx` isHost block | role-match |
| `components/session/SessionRoom.tsx` | component | event-driven (WebSocket onmessage) | self (additive edit) | exact |
| `app/session/[id]/page.tsx` | page / router | event-driven (screen state machine) | self (additive edit) | exact |
| `lib/session-store.ts` | service | CRUD | `lib/session-store.ts` finalize() method | exact |
| `types/index.ts` | type definition | — | self — extend ClientMessage union | exact |
| `server.ts` | server handler | event-driven (WebSocket message) | `server.ts` finalize branch lines 129–166 | exact |
| `app/api/sessions/[id]/unfinalize/route.ts` | API route (NEW) | request-response (REST POST) | `app/api/sessions/route.ts` POST handler | role-match |

---

## Pattern Assignments

### `components/host/TaxTipFields.tsx` — DISP-01 + UX-01

**What changes:** Two additive edits within the existing return JSX.
1. Tip buttons get conditional className for active-state (UX-01).
2. A "Total" line is appended below the tip column (DISP-01).

**Current Props interface** (lines 5–11) — no new props needed:
```tsx
interface Props {
  taxCents: number
  tipCents: number
  subtotalCents: number
  onChangeTax: (cents: number) => void
  onChangeTip: (cents: number) => void
}
```

**Current preset button loop** (lines 38–47) — replace `className` with conditional:
```tsx
// BEFORE (line 43):
className="flex-1 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"

// AFTER (UX-01):
{TIP_PRESETS.map(pct => {
  const isActive = tipCents === Math.round(subtotalCents * pct / 100)
  return (
    <button
      key={pct}
      type="button"
      onClick={() => onChangeTip(Math.round(subtotalCents * pct / 100))}
      className={
        isActive
          ? "flex-1 py-1 text-xs font-medium border rounded transition-colors bg-blue-600 text-white border-blue-600"
          : "flex-1 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
      }
    >
      {pct}%
    </button>
  )
})}
```
Active class tokens: `bg-blue-600 text-white border-blue-600` — same blue as existing Create Session button and focus rings.
Detection formula: `tipCents === Math.round(subtotalCents * pct / 100)` — identical to the click handler on line 42, guarantees exact match with no float precision drift.

**Total line insertion** (after closing `</div>` of tip column at line 63, still inside outer sticky `<div>`):
```tsx
// DISP-01 — derive totalCents at top of component (before return) or inline:
const totalCents = subtotalCents + taxCents + tipCents

// Add after closing </div> of the flex gap-4 row (line 64), before closing outer </div>:
<div className="mt-3 flex justify-between items-center text-sm font-semibold text-gray-900">
  <span>Total</span>
  <span>${(totalCents / 100).toFixed(2)}</span>
</div>
```
Integer arithmetic only — three integer props, no floats.

---

### `components/session/SummaryScreen.tsx` — UX-02 (button UI)

**What changes:** Add `onUnfinalize?: () => void` to Props; add button inside `{isHost && ...}` block after the grand total row (line 84).

**Props extension** (lines 4–8 — add one optional prop):
```tsx
interface Props {
  bill: BillSplitResult
  participantName: string
  isHost: boolean
  onUnfinalize?: () => void   // ADD — optional so existing call sites don't break
}
```

**Insertion point** — after the grand total row at line 81–84, still inside the `{isHost && (...)}` block (line 67):
```tsx
// Current grand total row (lines 81–84):
<div className="flex justify-between items-center pt-2 min-h-[44px] border-t border-gray-300">
  <span className="text-gray-700 font-bold">Total</span>
  <span className="text-gray-900 font-bold tabular-nums">{formatCents(grandTotal)}</span>
</div>

// Add immediately after:
{onUnfinalize && (
  <button
    type="button"
    onClick={onUnfinalize}
    className="mt-4 w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
  >
    Go back to claiming
  </button>
)}
```
Style is neutral (border-gray-300, text-gray-700, hover:bg-gray-50) — consistent with secondary/destructive-lite pattern. Phase 8 owns the visual polish pass.

---

### `components/session/SessionRoom.tsx` — UX-02 (callback prop + transition detection)

**What changes:** Add `onUnfinalized?: () => void` prop, ref, and transition detection in `onmessage`.

**Current callback refs** (lines 25–29) — extend with new ref:
```tsx
// Existing:
const onFinalizedRef = useRef(onFinalized)
const onSessionDataRef = useRef(onSessionData)
onFinalizedRef.current = onFinalized
onSessionDataRef.current = onSessionData

// Add:
const onUnfinalizedRef = useRef(onUnfinalized)
onUnfinalizedRef.current = onUnfinalized

// Also add a ref to track previous finalized state:
const prevFinalizedRef = useRef(false)
```

**Current Props interface** (lines 8–14) — add one optional prop:
```tsx
interface Props {
  sessionId: string
  participantName: string
  isHost?: boolean
  onFinalized?: (bill: BillSplitResult) => void
  onSessionData?: (data: SessionData) => void
  onUnfinalized?: () => void   // ADD
}
```

**Current onmessage handler** (lines 41–57) — extend the session-snapshot branch:
```tsx
// Existing finalized check (lines 53–55):
if (msg.data.finalized && msg.data.finalizedBill && onFinalizedRef.current) {
  onFinalizedRef.current(msg.data.finalizedBill)
}

// Add transition detection immediately after (before closing brace of session-snapshot block):
if (prevFinalizedRef.current && !msg.data.finalized) {
  onUnfinalizedRef.current?.()
}
prevFinalizedRef.current = msg.data.finalized
```
Pattern: standard React ref transition detection — compare previous value (stored in ref) against new value from server message. No useState needed.

---

### `app/session/[id]/page.tsx` — UX-02 (always-mounted SessionRoom + onUnfinalized handler)

**What changes:** Change conditional `{screen === 'session' && <SessionRoom>}` to always-mounted wrapper with CSS hidden; add `onUnfinalized` prop.

**Current conditional render** (lines 32–47):
```tsx
{screen === 'session' && (
  <SessionRoom
    sessionId={sessionId}
    participantName={participantName}
    isHost={isHost}
    onFinalized={(bill: BillSplitResult) => {
      setFinalBill(bill)
      setScreen('summary')
    }}
    onSessionData={(data: SessionData) => {
      if (!isHost && data.hostName.trim().toLowerCase() === participantName.trim().toLowerCase()) {
        setIsHost(true)
      }
    }}
  />
)}
```

**Replacement — always mounted, CSS hidden when not active:**
```tsx
{screen !== 'joining' && (
  <div className={screen === 'session' ? '' : 'hidden'}>
    <SessionRoom
      sessionId={sessionId}
      participantName={participantName}
      isHost={isHost}
      onFinalized={(bill: BillSplitResult) => {
        setFinalBill(bill)
        setScreen('summary')
      }}
      onSessionData={(data: SessionData) => {
        if (!isHost && data.hostName.trim().toLowerCase() === participantName.trim().toLowerCase()) {
          setIsHost(true)
        }
      }}
      onUnfinalized={() => {
        setScreen('session')
      }}
    />
  </div>
)}
```
Key: `hidden` Tailwind class (display: none) keeps the component mounted so the WebSocket connection stays open. SessionRoom only renders after joining, so the outer `screen !== 'joining'` guard prevents mounting during the join form.

**SummaryScreen call site** (lines 48–54) — add `onUnfinalize` prop:
```tsx
{screen === 'summary' && finalBill && (
  <SummaryScreen
    bill={finalBill}
    participantName={participantName}
    isHost={isHost}
    onUnfinalize={async () => {
      await fetch(`/api/sessions/${sessionId}/unfinalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: participantName }),
      })
    }}
  />
)}
```
REST call fires and forgets — the server broadcasts the snapshot, SessionRoom receives it, `onUnfinalized` fires, and `setScreen('session')` transitions the view.

---

### `lib/session-store.ts` — UX-02 (unfinalize method)

**Analog: `finalize()` method** (lines 99–104):
```ts
finalize(id: string, bill: BillSplitResult): void {
  const session = store.get(id)
  if (!session) return
  session.finalized = true
  session.finalizedBill = bill
},
```

**New `unfinalize()` method — add after `finalize()`:**
```ts
unfinalize(id: string): void {
  const session = store.get(id)
  if (!session) return
  session.finalized = false
  session.finalizedBill = null
  // claims are intentionally untouched — D-06
},
```
Mirror the finalize method exactly: get session, guard on null, mutate two fields, done.

---

### `types/index.ts` — UX-02 (ClientMessage union)

**Current union** (lines 44–48):
```ts
export type ClientMessage =
  | { type: 'join'; sessionId: string; participantName: string }
  | { type: 'claim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'unclaim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'finalize'; sessionId: string; participantName: string; unclaimedHandling: 'split' | 'host' }
```

**Add one entry:**
```ts
  | { type: 'unfinalize'; sessionId: string; participantName: string }
```
Shape matches the finalize entry minus `unclaimedHandling` — same required fields, no extras.

---

### `server.ts` — UX-02 (unfinalize WebSocket handler)

**Analog: finalize branch** (lines 129–166). Replicate the entire guard structure, omit billSplit computation.

**Exact finalize guard pattern** (lines 129–143):
```ts
if (
  (msg as any).type === 'finalize' &&
  typeof (msg as any).unclaimedHandling === 'string' &&
  typeof (msg as any).participantName === 'string'
) {
  const senderName = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
  const session = sessionStore.get(sessionId!)
  if (!session) return

  // Only host can finalize (T-5-01)
  if (senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()) return

  // Idempotency guard (T-5-03)
  if (session.finalized) return
```

**Unfinalize handler — add after the finalize block (after line 166), before closing `})`):**
```ts
// unfinalize branch — only host can unfinalize
if (
  (msg as any).type === 'unfinalize' &&
  typeof (msg as any).participantName === 'string'
) {
  const senderName = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
  const session = sessionStore.get(sessionId!)
  if (!session) return

  // Only host can unfinalize
  if (senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()) return

  // Idempotency guard — already unfinalized, no-op
  if (!session.finalized) return

  sessionStore.unfinalize(sessionId!)

  const data = sessionStore.getData(sessionId!)
  if (data) {
    sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
  }
  return
}
```
Guard order: type check → sender extract → session lookup → host identity → idempotency → mutation → broadcast. Mirrors finalize exactly.

---

### `app/api/sessions/[id]/unfinalize/route.ts` (NEW FILE) — UX-02

**Analog: `app/api/sessions/route.ts` POST handler** (lines 1–61).
**Also: `app/api/sessions/[id]/route.ts`** (lines 1–17) for async params pattern.

**Imports pattern** — combine both analogs:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/session-store'
import { z } from 'zod'
```

**Async params pattern** (from `app/api/sessions/[id]/route.ts` lines 4–9):
```ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params   // Next.js 15: params is a Promise
```

**Zod validation pattern** (from `app/api/sessions/route.ts` lines 13–30):
```ts
// Minimal schema — only hostName needed for identity check
const UnfinalizeSchema = z.object({
  hostName: z.string().min(1).max(64),
})

const body = await req.json()
const parsed = UnfinalizeSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json(
    { error: 'Invalid request', details: parsed.error.flatten() },
    { status: 400 }
  )
}
```

**Host identity check + mutation:**
```ts
const { hostName } = parsed.data
const sessionData = sessionStore.getData(id)
if (!sessionData) {
  return NextResponse.json({ error: 'Session not found' }, { status: 404 })
}

// Host-only guard (T-5-01: elevation of privilege mitigation)
if (hostName.trim().toLowerCase() !== sessionData.hostName.trim().toLowerCase()) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Idempotency — already unfinalized
if (!sessionData.finalized) {
  return NextResponse.json({ ok: true })
}

sessionStore.unfinalize(id)

// Broadcast updated snapshot to all connected WebSocket clients
const data = sessionStore.getData(id)
if (data) {
  sessionStore.broadcast(id, { type: 'session-snapshot', data })
}

return NextResponse.json({ ok: true })
```

**Error wrapper** (from `app/api/sessions/route.ts` lines 57–60):
```ts
} catch (err) {
  console.error('POST /api/sessions/[id]/unfinalize error:', err)
  return NextResponse.json({ error: 'Failed to unfinalize session' }, { status: 500 })
}
```

---

## Shared Patterns

### Callback ref pattern for stable WebSocket closures
**Source:** `components/session/SessionRoom.tsx` lines 25–29
**Apply to:** All new callback props added to `SessionRoom`
```tsx
const onFinalizedRef = useRef(onFinalized)
const onSessionDataRef = useRef(onSessionData)
onFinalizedRef.current = onFinalized
onSessionDataRef.current = onSessionData
// Pattern: declare ref, then sync ref.current = prop on every render
// Inside useEffect/onmessage: call ref.current?.() — never the prop directly
```

### Full-state broadcast after every mutation
**Source:** `server.ts` lines 160–164 (finalize handler)
**Apply to:** `server.ts` unfinalize handler; REST unfinalize route
```ts
const data = sessionStore.getData(sessionId!)
if (data) {
  sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
}
```

### Host identity check (normalize both sides)
**Source:** `server.ts` line 140 (finalize handler)
**Apply to:** `server.ts` unfinalize handler; REST unfinalize route
```ts
senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()
```

### Zod request body validation
**Source:** `app/api/sessions/route.ts` lines 3–30
**Apply to:** New REST route `app/api/sessions/[id]/unfinalize/route.ts`
```ts
import { z } from 'zod'
const Schema = z.object({ hostName: z.string().min(1).max(64) })
const parsed = Schema.safeParse(body)
if (!parsed.success) return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
```

### Integer cents formatting
**Source:** `components/session/SummaryScreen.tsx` lines 10–12
**Apply to:** Total line in `TaxTipFields.tsx`
```tsx
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
// Or inline: ${(totalCents / 100).toFixed(2)}
```

### isHost-gated UI
**Source:** `components/session/SummaryScreen.tsx` line 67; `components/session/SessionRoom.tsx` line 182
**Apply to:** "Go back to claiming" button in `SummaryScreen`
```tsx
{isHost && (
  // host-only content
)}
// Button only renders when onUnfinalize prop is provided AND isHost is true
```

---

## No Analog Found

All files have direct analogs in the codebase. No gaps.

---

## Anti-Patterns (from RESEARCH.md — enforce during planning)

| Anti-Pattern | Correct Approach |
|---|---|
| Add new props to TaxTipFields for DISP-01 | `totalCents` is derived internally from three existing props — no prop interface change |
| `useState` for tip active state | Derived at render: `tipCents === Math.round(subtotalCents * pct / 100)` |
| Send WS `'unfinalize'` message from button click | REST POST triggers unfinalize; WS only propagates the broadcast |
| Unmount SessionRoom when screen → 'summary' | Wrap in always-mounted div with `className={screen === 'session' ? '' : 'hidden'}` |
| Reset `claims` in `unfinalize()` | Only reset `finalized = false` and `finalizedBill = null` — D-06 is explicit |

---

## Metadata

**Analog search scope:** `components/`, `app/api/`, `lib/`, `server.ts`, `types/`
**Files read from codebase:** 9
**Pattern extraction date:** 2026-04-30
