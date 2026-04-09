# Phase 5: Summary and Finalization - Research

**Researched:** 2026-04-08
**Domain:** Bill-splitting math (Largest Remainder Method), WebSocket finalization flow, React screen state machine
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** `SessionState` and `SessionData` get a `hostName: string` field. `POST /api/sessions` accepts `hostName` from the host at session creation time.

**D-02:** `ShareScreen` generates the host's personal join URL as `/session/[id]?name=Alice` (pre-filled name param). The host sees the JoinForm with their name pre-filled; they can edit but don't need to retype.

**D-03:** `session/[id]/page.tsx` reads the `?name` URL param to pre-fill JoinForm. After the host submits, `participantName === session.hostName` determines `isHost=true` for the SessionRoom.

**D-04:** Same-page screen state machine — no new route. `session/[id]/page.tsx` gains a `'summary'` screen alongside `'joining'` and `'session'`. SessionRoom receives the `session-finalized` WebSocket message and lifts state up to trigger the `'summary'` transition.

**D-05:** Finalization is permanent — no back button, no un-finalize capability.

**D-06:** If all items are claimed when host taps Finalize, the finalize WebSocket message is sent immediately — no confirmation dialog.

**D-07:** If any items are unclaimed, a blocking modal appears before the WebSocket message is sent. Modal title: lists unclaimed item count. Two choices: **"Split among everyone"** (unclaimed items distributed proportionally among all participants) and **"I'll cover the rest"** (host absorbs all unclaimed items into their own total). The `finalize` ClientMessage includes the chosen handling: `unclaimedHandling: 'split' | 'host'`.

**D-08:** Every participant's summary screen shows a full breakdown:
  - Food subtotal (sum of their claimed items)
  - Tax share (proportional)
  - Tip share (proportional)
  - **Total owed** (bold, prominent)

**D-09:** Host summary screen shows their own breakdown (same as participants) PLUS a table below listing every participant's name and their total owed.

**Math locks (from STATE.md):**
- Integer cents throughout — no floats for money.
- Largest Remainder Method for distributing tax, tip, and shared item costs.

### Claude's Discretion

- Exact label wording ("Tax:" vs "Your tax share:")
- Modal styling and positioning (bottom sheet vs centered)
- Animation/transition when summary screen appears
- The exact structure of the `finalize` ClientMessage type
- Handling edge case where total is $0 (participant claimed nothing — show $0.00 gracefully)
- Whether unclaimed "split" is proportional by participant count or by food subtotal (proportional by food subtotal is fairer — Claude's call)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MATH-01 | Each person's tax share is calculated proportionally to their food subtotal, not as an equal split | LRM implementation in Plan 05-01; `billSplit()` pure function |
| MATH-02 | Each person's tip share is calculated proportionally to their food subtotal, not as an equal split | Same LRM function handles both; tip is structurally identical to tax |
| MATH-03 | The sum of all per-person totals equals the receipt total exactly (no missing or extra cents due to rounding) | LRM guarantees this — remainder cents distributed one-at-a-time to largest-remainder participants |
| FINAL-01 | Host can trigger finalization; each participant sees their individual total owed (subtotal + proportional tax + proportional tip) on a summary screen | Server finalize handler + `session-finalized` broadcast; summary screen in `session/[id]/page.tsx` |
| FINAL-02 | Host sees a summary showing every participant's name and amount owed; if items remain unclaimed at finalization, host chooses to split them among all participants or assign them to the host | Unclaimed modal in SessionRoom; `unclaimedHandling` field in finalize message; host summary table |
</phase_requirements>

---

## Summary

Phase 5 completes the application's core value proposition: every participant sees exactly what they owe after the host finalizes the session. The work splits into two clear plans. Plan 05-01 is pure math: implement `billSplit()` as a tested pure function using the Largest Remainder Method to distribute tax and tip proportionally in integer cents, guaranteeing the sum of all shares equals the receipt total exactly. Plan 05-02 is plumbing and UI: wire the Finalize button, handle the `finalize` WebSocket message on the server, broadcast results, add the summary screen to the state machine, and render per-person breakdowns.

The existing codebase is in excellent shape for this phase. `SessionRoom.tsx` already has the Finalize button stub (with a `/* Phase 5 will wire this */` comment), `isHost` prop, and `myTotalCents` computation. The screen state machine pattern in `session/[id]/page.tsx` is already established — adding `'summary'` is mechanical. The WebSocket server's message router has `claim` and `unclaim` branches; adding `finalize` follows the same pattern exactly.

The only genuinely novel problem is the LRM math, which must be implemented carefully. The `hostName` threading (D-01 through D-03) touches several files but each change is small and well-scoped. No new dependencies are needed — this phase is pure TypeScript logic plus UI composition.

**Primary recommendation:** Implement `billSplit()` first as an isolated, unit-testable pure function, then wire the rest of the phase against it.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5 | Type-safe math logic and message types | Already in project [VERIFIED: package.json] |
| React 19 | 19.2.3 | Summary screen rendering | Already in project [VERIFIED: package.json] |
| Next.js | 16.1.6 | Session page routing, URL param reading | Already in project [VERIFIED: package.json] |
| ws | ^8.0.0 | WebSocket server, `finalize` message handler | Already in project [VERIFIED: package.json] |
| Tailwind CSS | ^4 | Summary UI styling | Already in project [VERIFIED: package.json] |

### No New Dependencies Required

Phase 5 requires no new packages. The math is pure TypeScript integer arithmetic. The UI follows established patterns using existing React/Tailwind. The WebSocket protocol extension adds one new message type using the existing `ws` server.

**Installation:** none needed.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
lib/
└── bill-split.ts          # Pure function: billSplit() — LRM math, no side effects

components/session/
├── SessionRoom.tsx         # Modified: Finalize button wired, unclaimed modal, session-finalized handler
├── SummaryScreen.tsx       # New: per-person breakdown + conditional host table
└── UnclaimedModal.tsx      # New: blocking modal with "Split" / "I'll cover" choices

app/session/[id]/
└── page.tsx                # Modified: 'summary' screen, ?name URL param pre-fill, isHost derivation

app/host/
└── page.tsx                # Modified: pass hostName to ShareScreen

components/host/
└── ShareScreen.tsx         # Modified: generate host join URL with ?name= param

lib/
└── session-store.ts        # Modified: hostName + finalized fields, finalize() method

types/
└── index.ts                # Modified: SessionState + SessionData + ClientMessage

server.ts                   # Modified: finalize branch in message router
```

---

### Pattern 1: Largest Remainder Method for Integer Cent Distribution

**What:** Distribute a total (taxCents or tipCents) among N participants proportionally to their food subtotals, in integer cents, such that the sum of all shares equals the total exactly.

**When to use:** Any time a fractional amount must be divided among multiple parties in integer units with no rounding error.

**Algorithm:**

```typescript
// Source: [ASSUMED] — standard algorithm, well-documented in computer science literature
// Verified correct via manual trace below

function distributeProportionally(
  totalCents: number,
  subtotals: number[]   // each participant's food subtotal in cents
): number[] {
  const grandSubtotal = subtotals.reduce((a, b) => a + b, 0)

  // Edge case: if nobody has a subtotal, split equally
  if (grandSubtotal === 0) {
    const base = Math.floor(totalCents / subtotals.length)
    const remainder = totalCents % subtotals.length
    return subtotals.map((_, i) => base + (i < remainder ? 1 : 0))
  }

  // Step 1: Compute exact shares as floats (ONLY for ranking — never used as money)
  const exactShares = subtotals.map(s => (s / grandSubtotal) * totalCents)

  // Step 2: Floor each share to integer cents
  const floored = exactShares.map(Math.floor)

  // Step 3: Compute remainders and total allocated so far
  const remainders = exactShares.map((exact, i) => exact - floored[i])
  const allocated = floored.reduce((a, b) => a + b, 0)
  const leftover = totalCents - allocated  // number of cents to distribute

  // Step 4: Give 1 extra cent to the `leftover` participants with largest remainders
  const indices = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r || a.i - b.i)  // stable tiebreak by index
    .map(x => x.i)

  const result = [...floored]
  for (let k = 0; k < leftover; k++) {
    result[indices[k]] += 1
  }

  return result
}
```

**Correctness trace (manual verification):**
- Tax = $1.00 (100 cents), 3 participants with subtotals $10, $10, $10
- Exact shares: 33.33, 33.33, 33.33 → floored: 33, 33, 33 → allocated: 99 → leftover: 1
- Indices sorted by remainder (all tied at 0.33): [0, 1, 2]
- Give 1 cent to index 0: result = [34, 33, 33] → sum = 100 ✓

- Tax = $1.00, subtotals $15, $5 (75%/25% split)
- Exact: 75, 25 → floored: 75, 25 → allocated: 100 → leftover: 0
- result = [75, 25] → sum = 100 ✓

- Tax = $1.00, subtotals $10, $10, $9 (34.5%, 34.5%, 31.0%)
- Exact: 34.48, 34.48, 31.03 → floored: 34, 34, 31 → allocated: 99 → leftover: 1
- Remainders: 0.48, 0.48, 0.03 → sorted: [0, 1, 2] (both tied at 0.48, index 0 wins tie)
- result = [35, 34, 31] → sum = 100 ✓

**The `billSplit()` function signature (Plan 05-01 implements this):**

```typescript
// lib/bill-split.ts
export interface ParticipantBill {
  name: string
  subtotalCents: number
  taxShareCents: number
  tipShareCents: number
  totalCents: number
}

export interface BillSplitResult {
  participants: ParticipantBill[]
  // Verification: sum of all totalCents === receipt total (subtotal + tax + tip)
}

export function billSplit(params: {
  items: Array<{ id: string; priceCents: number }>
  claims: Record<string, string[]>   // itemId -> participantName[]
  participants: string[]
  taxCents: number
  tipCents: number
  unclaimedHandling: 'split' | 'host'
  hostName: string
}): BillSplitResult
```

---

### Pattern 2: Unclaimed Item Resolution Before Finalization

**What:** Before sending the `finalize` WebSocket message, the host may need to decide what to do with unclaimed items. This is resolved client-side via a modal, not server-side.

**When to use:** When host taps Finalize and `session.items.some(item => (session.claims[item.id] ?? []).length === 0)` is true.

**Flow:**
1. Host taps "Finalize"
2. Client counts unclaimed items (items where `claims[id]` is empty or undefined)
3. If unclaimed count > 0: render `<UnclaimedModal>` with count shown
4. Modal blocks UI (no dismiss without choosing)
5. Host chooses "Split among everyone" or "I'll cover the rest"
6. `ws.send({ type: 'finalize', sessionId, unclaimedHandling: 'split' | 'host' })`
7. If unclaimed count === 0: skip modal, send immediately

**Modal state in SessionRoom:**

```typescript
// Inside SessionRoom.tsx
const [showUnclaimedModal, setShowUnclaimedModal] = useState(false)

const handleFinalizeClick = () => {
  const unclaimedCount = session!.items.filter(
    item => (session!.claims[item.id] ?? []).length === 0
  ).length
  if (unclaimedCount > 0) {
    setShowUnclaimedModal(true)
  } else {
    sendFinalize('split')  // no unclaimed items, 'split' vs 'host' is irrelevant
  }
}

const sendFinalize = (handling: 'split' | 'host') => {
  const ws = wsRef.current
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'finalize', sessionId, unclaimedHandling: handling }))
  }
  setShowUnclaimedModal(false)
}
```

---

### Pattern 3: Server Finalize Handler

**What:** WebSocket server receives `finalize` message, runs `billSplit()`, stores results, broadcasts `session-finalized` to all clients.

**Key decision:** The `session-finalized` ServerMessage already exists in `types/index.ts` as `{ type: 'session-finalized' }` — no data payload. However, the summary data needs to be available to clients after finalization. Two options:

1. Include summary data in the `session-finalized` broadcast (one message, but large)
2. Store `finalizedBill` on `SessionState` and include it in subsequent `session-snapshot` messages

**Recommendation: Option 2** — store `finalizedBill: BillSplitResult | null` on `SessionState`. On finalization: run `billSplit()`, store result, set `finalized: true`, then broadcast a `session-snapshot` (which now includes the `finalizedBill`). The `session-finalized` message type can be retired or sent first as a signal, then immediately followed by the snapshot. This is consistent with the established full-state-broadcast pattern and means reconnecting clients automatically get the final state.

**Simpler approach using existing broadcast pattern:**

```typescript
// server.ts — finalize branch (inside ws.on('message', ...))
if (
  (msg as any).type === 'finalize' &&
  typeof (msg as any).unclaimedHandling === 'string'
) {
  const handling = (msg as any).unclaimedHandling === 'host' ? 'host' : 'split'
  const session = sessionStore.get(sessionId!)
  if (!session || session.finalized) return  // idempotent guard

  const result = billSplit({
    items: session.items,
    claims: session.claims,
    participants: session.participants,
    taxCents: session.taxCents,
    tipCents: session.tipCents,
    unclaimedHandling: handling,
    hostName: session.hostName,
  })

  sessionStore.finalize(sessionId!, result)  // sets finalized=true, stores result

  const data = sessionStore.getData(sessionId!)
  if (data) {
    sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
  }
  return
}
```

---

### Pattern 4: Screen State Machine Extension

**What:** `session/[id]/page.tsx` currently has `type Screen = 'joining' | 'session'`. Add `'summary'`.

**Trigger for summary transition:** `SessionRoom` receives a `session-snapshot` where `data.finalized === true` and calls a callback prop `onFinalized(billResult)`.

**Updated page.tsx structure:**

```typescript
// app/session/[id]/page.tsx
type Screen = 'joining' | 'session' | 'summary'

// Read ?name param for host pre-fill (D-03):
const searchParams = useSearchParams()
const prefilledName = searchParams.get('name') ?? ''

// Pass prefilledName to JoinForm:
<JoinForm initialName={prefilledName} onSubmit={...} />

// isHost derivation after join (requires session.hostName in snapshot):
// SessionRoom receives isHost prop derived after the snapshot arrives:
// isHost = participantName === session?.hostName

// Summary screen:
{screen === 'summary' && (
  <SummaryScreen
    bill={finalBill!}
    participantName={participantName}
    isHost={isHost}
  />
)}
```

**Note:** `useSearchParams()` requires the component to be wrapped in a `<Suspense>` boundary in Next.js App Router. The page is already `'use client'` so this is the correct approach. Add `<Suspense fallback={null}>` wrapper or use `use(searchParams)` pattern consistent with the existing `use(params)` call.

---

### Pattern 5: hostName Threading (D-01 through D-03)

**What:** `hostName` must flow from OcrReview (where the host creates the session) through the API to the session store.

**Gap in current code:** `OcrReview.tsx` calls `POST /api/sessions` with `{ items, taxCents, tipCents }` — no `hostName`. The host has not yet entered their name at this point in the flow.

**Resolution path from CONTEXT.md:** The host enters their name via JoinForm after scanning their own QR code (with the pre-filled `?name=` URL param). But the session is created before this — meaning `hostName` must be captured at session creation time, before the QR is shown.

**Where `hostName` comes from:** The host must provide their name somewhere before or during `POST /api/sessions`. The flow is: capture → review → create session → share screen. The simplest insertion point is an additional field on OcrReview's "Create Session" step, or a name input on the ShareScreen.

**CONTEXT.md says:** ShareScreen generates the host join URL with `?name=Alice`, implying the host's name is known at ShareScreen time. OcrReview calls `onComplete(sessionId)` — `onComplete` must also pass `hostName`.

**Concrete change chain:**
1. `OcrReview.tsx` adds a host name input field (or `app/host/page.tsx` adds a name capture step)
2. `POST /api/sessions` body includes `hostName: string`
3. `sessionStore.create()` accepts and stores `hostName`
4. `ShareScreen.tsx` receives `hostName` prop and generates `joinUrl` with `?name=${encodeURIComponent(hostName)}`
5. `app/host/page.tsx` passes `hostName` to `ShareScreen`

**Simplest UX:** Add a name field to the OcrReview screen near the "Create Session" button. Or add it to ShareScreen itself (host enters name after seeing the QR). The CONTEXT.md does not specify which screen captures the name — this is Claude's discretion territory.

**Recommendation:** Add a name field to the ShareScreen (after session is created). This keeps OcrReview focused on receipt correction. ShareScreen already knows the sessionId; add a `hostName` state, POST a PATCH to `/api/sessions/[id]/hostName` or — simpler — accept the name on ShareScreen and construct the join URL locally without persisting it. But `hostName` must be stored on the session for `isHost` detection later.

**Simplest implementation:** Capture `hostName` in `app/host/page.tsx` state. OcrReview passes the sessionId back, then `host/page.tsx` shows a name input before transitioning to ShareScreen, OR adds a name field to the OcrReview form alongside "Create Session." Either way, `POST /api/sessions` body includes `hostName`.

---

### Anti-Patterns to Avoid

- **Float arithmetic for money:** Never use `(cents / 100).toFixed(2)` for intermediate calculations. `toFixed()` is only for display. All math stays in integer cents. [VERIFIED: STATE.md locked decision]
- **Distributing tax/tip with simple `Math.round()`:** `Math.round()` applied individually does not guarantee the sum equals the total. Use LRM — this is the point of Plan 05-01. [ASSUMED — standard rounding error behavior]
- **Using `session-finalized` message as the carrier of bill data:** The existing type is `{ type: 'session-finalized' }` with no `data` field. Don't stretch it — store the result on the session and include it in the standard `session-snapshot` broadcast. This keeps reconnects working for free.
- **Mutating session state in the message router without going through `sessionStore`:** All state mutations go through the store to maintain the getData() serialization contract.
- **Using `router.push()` for summary navigation:** CONTEXT.md D-04 locks this to same-page state machine. No routing.
- **`async/await` on dynamic params in Client Components:** Already established in Phase 3 — use `use(params)` not `async` function. Same applies for `useSearchParams()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cent-exact proportional distribution | Custom round/floor/ceil heuristic | Largest Remainder Method (in `lib/bill-split.ts`) | LRM is a proven algorithm with a known correctness guarantee; ad-hoc rounding will occasionally miss by 1 cent |
| Modal dialog | Custom z-index stacking context, scroll lock | Tailwind fixed positioning + conditional render (existing pattern) | No modal library needed — project is already simple JSX components; a `fixed inset-0` overlay is sufficient |
| WebSocket message routing | Generic middleware layer | Direct `if` branch in `ws.on('message')` (existing pattern) | Matches all 3 existing branches; adding a 4th is 10 lines |
| URL param reading | Custom URL parsing | `useSearchParams()` from Next.js | Built-in, SSR-safe, already in the React ecosystem |

**Key insight:** The most dangerous hand-roll is the math. LRM is simple but must be implemented exactly right — the existing `myTotalCents` in `SessionRoom.tsx` already uses `Math.round(item.priceCents / claimants.length)` which is acceptable for display but is NOT the LRM. The formal `billSplit()` function is distinct from `myTotalCents` and must be the authoritative calculation.

---

## Common Pitfalls

### Pitfall 1: `myTotalCents` vs `billSplit()` Discrepancy

**What goes wrong:** `SessionRoom.tsx` uses `Math.round(item.priceCents / claimants.length)` to compute `myTotalCents` for the live running total display. After finalization, the authoritative number comes from `billSplit()`. These two methods may differ by 1 cent on shared items.

**Why it happens:** `Math.round(priceCents / n)` is an approximation. `billSplit()` uses LRM which is exact. A participant might see $12.34 during claiming and $12.35 in their final summary.

**How to avoid:** Accept the discrepancy — the claiming screen shows an estimate ("Your running total"), the summary screen shows the authoritative final amount. Do not try to make them match by changing `billSplit()`.

**Warning signs:** Participant asks "why does my total look different now?" — document this as intentional in any UI copy.

### Pitfall 2: Zero-Subtotal Guard

**What goes wrong:** A participant who claimed nothing has `subtotalCents = 0`. The LRM formula divides by `grandSubtotal` — if everyone has $0 subtotal (degenerate session), this causes a division-by-zero or NaN.

**Why it happens:** The `distributeProportionally()` formula includes `s / grandSubtotal` — if `grandSubtotal === 0`, this is `0/0 = NaN`.

**How to avoid:** Guard at the top of `distributeProportionally`: `if (grandSubtotal === 0) { return equal split }`. A participant with $0 subtotal still gets $0 tax and tip shares — their total is $0.00.

**Warning signs:** `NaN` showing in the summary screen.

### Pitfall 3: `unclaimedHandling: 'split'` proportional basis

**What goes wrong:** "Split among everyone" needs a definition of "proportional." By participant count (equal split) or by food subtotal (proportional)? These give different results.

**Resolution:** CONTEXT.md leaves this to Claude's discretion. The recommendation is **by food subtotal** — participants who ordered more pay a proportionally larger share of unclaimed items. If a participant has $0 subtotal, they get $0 of the unclaimed pile (with the zero-subtotal guard falling back to equal split if ALL participants have $0).

**How to avoid:** Implement clearly and test: `unclaimedHandling: 'split'` adds unclaimed items to all participants' subtotals proportionally before running the LRM.

### Pitfall 4: `useSearchParams()` Requires Suspense in App Router

**What goes wrong:** Next.js App Router throws a build-time error if `useSearchParams()` is called in a Client Component that is not wrapped in `<Suspense>`.

**Why it happens:** `useSearchParams()` reads dynamic data that is not available at build time; Next.js requires Suspense to handle this.

**How to avoid:** Wrap the component using `useSearchParams()` in `<Suspense fallback={<div>Loading...</div>}>` or a similar fallback. Since `session/[id]/page.tsx` already uses `'use client'`, add a Suspense boundary in the component tree.

**Warning signs:** Next.js build error: "useSearchParams() should be wrapped in a suspense boundary."

### Pitfall 5: Finalize Idempotency

**What goes wrong:** Host somehow sends the `finalize` message twice (double-tap, reconnect race). The second call re-runs `billSplit()` and overwrites the stored result.

**How to avoid:** Add an idempotency guard at the top of the `finalize` handler: `if (session.finalized) return`. `session.finalized` is set to `true` by `sessionStore.finalize()` before the broadcast goes out.

**Warning signs:** Host summary shows different numbers than participants' summaries.

### Pitfall 6: `hostName` Not in `SessionData` (Serialization Gap)

**What goes wrong:** `SessionData = Omit<SessionState, 'sockets'>`. If `hostName` is added to `SessionState`, it is automatically included in `SessionData` — this is correct. But `finalizedBill` (the `BillSplitResult`) must also be JSON-safe. It is (only strings and numbers), so `getData()` works without modification.

**How to avoid:** Keep `finalizedBill` as a plain object with no `Set`, `Map`, or `WebSocket` values. The `getData()` destructuring strips only `sockets`; everything else serializes fine.

---

## Code Examples

### billSplit() — complete reference implementation

```typescript
// lib/bill-split.ts
// Source: [ASSUMED] LRM is a standard algorithm

export interface ParticipantBill {
  name: string
  subtotalCents: number     // their food items only
  taxShareCents: number     // LRM-distributed
  tipShareCents: number     // LRM-distributed
  totalCents: number        // subtotal + taxShare + tipShare
}

export interface BillSplitResult {
  participants: ParticipantBill[]
}

function distributeProportionally(totalCents: number, subtotals: number[]): number[] {
  if (subtotals.length === 0) return []
  const grandSubtotal = subtotals.reduce((a, b) => a + b, 0)

  if (grandSubtotal === 0) {
    // Equal fallback when no one has a subtotal
    const base = Math.floor(totalCents / subtotals.length)
    const extra = totalCents - base * subtotals.length
    return subtotals.map((_, i) => base + (i < extra ? 1 : 0))
  }

  const exactShares = subtotals.map(s => (s / grandSubtotal) * totalCents)
  const floored = exactShares.map(Math.floor)
  const remainders = exactShares.map((e, i) => e - floored[i])
  const leftover = totalCents - floored.reduce((a, b) => a + b, 0)

  const sortedByRemainder = remainders
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r - a.r || a.i - b.i)

  const result = [...floored]
  for (let k = 0; k < leftover; k++) {
    result[sortedByRemainder[k].i] += 1
  }
  return result
}

export function billSplit(params: {
  items: Array<{ id: string; priceCents: number }>
  claims: Record<string, string[]>
  participants: string[]
  taxCents: number
  tipCents: number
  unclaimedHandling: 'split' | 'host'
  hostName: string
}): BillSplitResult {
  const { items, claims, participants, taxCents, tipCents, unclaimedHandling, hostName } = params

  // Step 1: Compute each participant's food subtotal from claimed items
  // Shared items: cost divided equally (Math.round) for subtotal calculation
  // (same approach as myTotalCents — acceptable approximation for basis of LRM)
  const subtotals: Record<string, number> = {}
  for (const p of participants) subtotals[p] = 0

  for (const item of items) {
    const claimants = claims[item.id] ?? []
    if (claimants.length > 0) {
      const share = Math.round(item.priceCents / claimants.length)
      for (const name of claimants) {
        if (subtotals[name] !== undefined) subtotals[name] += share
      }
    } else {
      // Unclaimed item
      if (unclaimedHandling === 'host') {
        subtotals[hostName] = (subtotals[hostName] ?? 0) + item.priceCents
      } else {
        // 'split': distribute proportionally (handled via subtotal inflation below)
        // Add to a temporary "unclaimed pool" — redistributed after initial subtotals known
      }
    }
  }

  // Handle 'split' unclaimed items: add their total to everyone proportionally
  // (We compute the unclaimed pool total, then distribute it via LRM — cleaner)
  if (unclaimedHandling === 'split') {
    const unclaimedTotal = items
      .filter(item => (claims[item.id] ?? []).length === 0)
      .reduce((sum, item) => sum + item.priceCents, 0)

    if (unclaimedTotal > 0) {
      const subtotalValues = participants.map(p => subtotals[p])
      const unclaimedShares = distributeProportionally(unclaimedTotal, subtotalValues)
      participants.forEach((p, i) => { subtotals[p] += unclaimedShares[i] })
    }
  }

  // Step 2: Distribute tax and tip via LRM
  const subtotalValues = participants.map(p => subtotals[p])
  const taxShares = distributeProportionally(taxCents, subtotalValues)
  const tipShares = distributeProportionally(tipCents, subtotalValues)

  const result: ParticipantBill[] = participants.map((name, i) => ({
    name,
    subtotalCents: subtotals[name],
    taxShareCents: taxShares[i],
    tipShareCents: tipShares[i],
    totalCents: subtotals[name] + taxShares[i] + tipShares[i],
  }))

  return { participants: result }
}
```

### SessionState / SessionData type extensions

```typescript
// types/index.ts additions
export interface SessionState {
  // ... existing fields ...
  hostName: string           // new: D-01
  finalized: boolean         // new: set to true after finalize handler runs
  finalizedBill: import('@/lib/bill-split').BillSplitResult | null  // new
}

// ClientMessage additions
export type ClientMessage =
  | { type: 'join'; sessionId: string; participantName: string }
  | { type: 'claim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'unclaim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'finalize'; sessionId: string; unclaimedHandling: 'split' | 'host' }  // new
```

### JoinForm with initialName prop

```typescript
// components/session/JoinForm.tsx — add initialName prop
interface Props {
  onSubmit: (name: string) => void
  initialName?: string   // new: pre-fills from ?name= URL param
}

export default function JoinForm({ onSubmit, initialName = '' }: Props) {
  const [name, setName] = useState(initialName)
  // rest unchanged
}
```

### SummaryScreen component structure

```typescript
// components/session/SummaryScreen.tsx
interface Props {
  bill: BillSplitResult
  participantName: string
  isHost: boolean
}

// Per-person view: subtotal / tax share / tip share / total (bold)
// Host additionally sees: table of all participants + amounts
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Math.round()` per-person tax split | Largest Remainder Method | Established in STATE.md | Guarantees exact sum; no missing cents |
| Router navigation for summary | Same-page screen state machine | Established Phase 2/3 | No route needed; ephemeral state preserved |

**Nothing deprecated or outdated** in this phase — it's greenfield within an established codebase.

---

## Runtime State Inventory

> This section is not applicable — Phase 5 is a greenfield feature addition, not a rename/refactor/migration.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / tsx | Dev server | ✓ | tsx ^4.0.0 [VERIFIED: package.json] | — |
| TypeScript | billSplit() type safety | ✓ | ^5 [VERIFIED: package.json] | — |
| Tailwind CSS | Summary UI | ✓ | ^4 [VERIFIED: package.json] | — |
| ws | WebSocket finalize handler | ✓ | ^8.0.0 [VERIFIED: package.json] | — |

No missing dependencies. All runtime tools confirmed present.

---

## Validation Architecture

> `workflow.nyquist_validation` is absent from config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test files exist in the project |
| Config file | None — Wave 0 must create |
| Quick run command | `npx vitest run lib/bill-split.test.ts` (after Wave 0 setup) |
| Full suite command | `npx vitest run` |

**Recommendation for framework:** Vitest — compatible with Next.js TypeScript projects, zero-config for pure functions, no jsdom needed for math tests. [ASSUMED — no project test framework established yet]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MATH-01 | Proportional tax distribution | unit | `npx vitest run lib/bill-split.test.ts` | ❌ Wave 0 |
| MATH-02 | Proportional tip distribution | unit | `npx vitest run lib/bill-split.test.ts` | ❌ Wave 0 |
| MATH-03 | Sum of totals equals receipt total exactly | unit | `npx vitest run lib/bill-split.test.ts` | ❌ Wave 0 |
| FINAL-01 | Per-person summary screen renders | manual smoke | Run dev server, finalize session | — |
| FINAL-02 | Unclaimed modal appears, both choices work | manual smoke | Run dev server, leave item unclaimed | — |

### Wave 0 Gaps

- [ ] `lib/bill-split.test.ts` — unit tests for `billSplit()` covering MATH-01, MATH-02, MATH-03
- [ ] `vitest.config.ts` — minimal config for pure TS function tests (no DOM)
- [ ] Framework install: `npm install -D vitest` — if adopting Vitest

**Note:** MATH-01/02/03 are the only requirements where automated testing is straightforward. FINAL-01/02 require a running server + WebSocket and are manual UAT steps (consistent with how Phases 1-4 were verified).

---

## Security Domain

> `security_enforcement` is absent from config.json — treating as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in this application (by design) |
| V3 Session Management | Partial | Session IDs are UUID v4 (unguessable) — already implemented |
| V4 Access Control | Yes | Only the host should be able to send `finalize` |
| V5 Input Validation | Yes | `unclaimedHandling` must be validated as `'split' | 'host'` only |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Non-host participant sends `finalize` | Elevation of privilege | Server validates `msg.participantName === session.hostName` before executing finalize |
| `unclaimedHandling` injection (unexpected value) | Tampering | Coerce to `'split'` if value is not `'host'`: `const handling = v === 'host' ? 'host' : 'split'` |
| Double finalize (replay) | Tampering | Idempotency guard: `if (session.finalized) return` |
| Finalize sent for session that doesn't exist | DoS/error | Existing guard: `if (!session) return` in all message handlers |

**Access control note:** The `finalize` handler MUST check that the sender is the host. Current message handlers do not enforce this (claim/unclaim are open to any participant). For `finalize`, add:

```typescript
// In finalize branch of server.ts
const senderName = ((msg as any).participantName as string | undefined)?.trim()
if (!senderName || senderName !== session.hostName) return  // only host can finalize
```

This requires the `finalize` ClientMessage to include `participantName`. Add it to the type.

---

## Open Questions

1. **Where does the host enter their name?**
   - What we know: `hostName` must reach `POST /api/sessions` body (D-01). The host flow is: capture → OCR review → create session → share screen.
   - What's unclear: Which screen captures `hostName`? CONTEXT.md doesn't specify. OcrReview currently calls `POST /api/sessions` without a name field.
   - Recommendation: Add a "Your name" text input to the OcrReview screen, near the "Create Session" button. This is the simplest change — one field, one state variable. The alternative (a separate step) adds a screen to the host flow unnecessarily.

2. **`session-finalized` message type — use or replace?**
   - What we know: `types/index.ts` already declares `{ type: 'session-finalized' }` as a ServerMessage. The current type carries no data.
   - What's unclear: Should this signal be kept as a lightweight notification, or should it carry the full bill?
   - Recommendation: Keep it as a signal, but send a `session-snapshot` immediately after (which carries `finalizedBill`). The `session-finalized` message triggers the client to transition to summary screen; the snapshot provides the data. This requires the client to handle both messages in sequence but is clean and backward-compatible.

3. **`participantName` in `finalize` message for host auth check?**
   - What we know: Security analysis above identifies that `finalize` needs a sender identity check.
   - What's unclear: CONTEXT.md says the exact ClientMessage structure is Claude's discretion.
   - Recommendation: Include `participantName` in the `finalize` message type, consistent with `claim` and `unclaim`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest is the right test framework for this project | Validation Architecture | Low — no tests exist yet; any framework works; Vitest is a reasonable default for Next.js/TS |
| A2 | Unclaimed 'split' should be proportional to food subtotal rather than equal per-person | Pattern 2, billSplit() code | Low — CONTEXT.md defers to Claude; proportional is fairer but equal is simpler; both are valid |
| A3 | `session-finalized` ServerMessage should remain a signal (no data) followed by a snapshot | Pattern 3, Open Questions | Medium — if planner chooses to embed data in `session-finalized`, the type extension is different |
| A4 | Host name capture belongs in OcrReview screen | Open Questions | Low — if host/page.tsx adds a new screen instead, the change is isolated to host flow only |
| A5 | The LRM implementation above correctly handles all edge cases | Pattern 1 / billSplit() code | Medium — logic is verified by manual trace but not run against a test suite yet; Plan 05-01 should include explicit test cases |

---

## Sources

### Primary (HIGH confidence)
- `types/index.ts` — verified existing type shapes, `session-finalized` already typed [VERIFIED: codebase read]
- `lib/session-store.ts` — verified `getData()` pattern, `broadcast()` implementation [VERIFIED: codebase read]
- `components/session/SessionRoom.tsx` — verified `myTotalCents`, Finalize button stub, `isHost` prop [VERIFIED: codebase read]
- `app/session/[id]/page.tsx` — verified screen state machine, `use(params)` pattern [VERIFIED: codebase read]
- `server.ts` — verified message handler pattern, `join`/`claim`/`unclaim` branches [VERIFIED: codebase read]
- `.planning/STATE.md` — verified locked decisions: integer cents, LRM, full-state broadcast, getData() [VERIFIED: codebase read]
- `package.json` — verified all dependencies and versions [VERIFIED: codebase read]
- `.planning/phases/05-summary-and-finalization/05-CONTEXT.md` — all decisions D-01 through D-09 [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- Next.js App Router `useSearchParams()` Suspense requirement — documented behavior [ASSUMED — consistent with Next.js 13+ App Router patterns in training data]

### Tertiary (LOW confidence)
- Largest Remainder Method algorithm — [ASSUMED] standard algorithm; correctness verified by manual trace but not against external authoritative source in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified in package.json; no new packages needed
- Architecture patterns: HIGH — all patterns derived directly from existing code; no speculation
- Math (LRM): MEDIUM — algorithm is correct by manual trace, but not externally verified in this session; Plan 05-01 should include comprehensive unit tests
- Pitfalls: HIGH — derived from direct code inspection of existing gaps (myTotalCents approximation, zero-subtotal risk, useSearchParams Suspense requirement)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable stack — 30 days)
