# Phase 7: UX & Display Fixes - Research

**Researched:** 2026-04-29
**Domain:** React/Next.js UI components, WebSocket session state, REST API extension
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bill Total Display (DISP-01)**
- D-01: Total appears inside `TaxTipFields` sticky footer, below the tip input
- D-02: Format is "Total: $X.XX" — no breakdown, clean and minimal
- D-03: `totalCents = subtotalCents + taxCents + tipCents` — derived internally; no new props needed

**Tip Selected State (UX-01)**
- Active preset: `bg-blue-600 text-white border-blue-600`
- Detection: `tipCents === Math.round(subtotalCents * pct / 100)`
- No preset highlighted when manual entry doesn't match any preset
- No new state — derived at render time from existing props

**Unfinalize Flow (UX-02)**
- D-04: "Go back to claiming" button at bottom of host-only "Everyone's totals" section in `SummaryScreen`
- D-05: Silent return to claiming screen for all participants via full-state broadcast with `finalized: false`
- D-06: Claims are never touched — only `finalized` and `finalizedBill` are reset

**Claude's Discretion**
- Tip visual style: `bg-blue-600 text-white border-blue-600` for active, unmodified for inactive
- Unfinalize trigger: `POST /api/sessions/[id]/unfinalize` REST endpoint
- `onUnfinalized` prop added to `SessionRoom` — fires when incoming snapshot has `finalized: false` and previous state was finalized
- `page.tsx` routes back to `'session'` screen on `onUnfinalized` callback
- Button label: "Go back to claiming"

### Deferred Ideas

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISP-01 | OcrReview screen shows bill total (items + tax + tip) before session creation | TaxTipFields already has all three values as props; total line is a pure additive render with no prop changes |
| UX-01 | Tip selector buttons visually indicate the currently selected tip option | TIP_PRESETS loop already exists; active class derived from `tipCents === Math.round(subtotalCents * pct / 100)` at render time |
| UX-02 | Host can unfinalize from summary screen; all claims preserved on return to claiming view | Requires: `unfinalize()` in session-store, new REST route, `onUnfinalized` prop in SessionRoom, screen routing in page.tsx, type union update |
</phase_requirements>

---

## Summary

Phase 7 is three surgical changes to existing screens — no new routes, screens, or state shapes beyond what is strictly required for unfinalize. All changes are additive: no existing behavior is removed or altered.

**DISP-01** (bill total) is entirely confined to `TaxTipFields.tsx`. The component already receives `subtotalCents`, `taxCents`, and `tipCents` as props. Adding a total display is a single `<div>` render below the existing inputs — no prop interface changes, no parent changes.

**UX-01** (tip selected state) is confined to the preset button render loop inside `TaxTipFields.tsx`. The active condition is a pure expression evaluated per-render from existing props. The change is a conditional className on the existing button elements — no new state, no hooks, no side effects.

**UX-02** (unfinalize) is the most complex change but follows exact established patterns. It touches 6 files in a predictable chain: types union → session-store method → REST route → server.ts WebSocket handler → SessionRoom prop → page.tsx routing. Every step has a direct parallel in the existing finalize flow.

**Primary recommendation:** Implement in dependency order — types and store first, then server/REST, then UI components. This allows each step to build on verified foundations.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Bill total computation | Frontend (client component) | — | All inputs (subtotalCents, taxCents, tipCents) already live in TaxTipFields as props; no server round-trip needed |
| Tip active state | Frontend (client component) | — | Purely derived from existing props at render time; no persistence required |
| Unfinalize trigger | API / Backend (REST) | Frontend (client component calls it) | Session state lives server-side; REST follows the existing session-creation pattern |
| Unfinalize propagation | WebSocket server | All connected clients | The full-state broadcast pattern already handles this — unfinalize broadcasts `finalized: false` snapshot |
| Screen routing on unfinalize | Frontend (page.tsx) | SessionRoom (callback) | SessionRoom detects the state change and fires `onUnfinalized`; page.tsx owns screen routing |

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI components | Project foundation |
| Next.js | 15.x | App Router, API routes | Project foundation |
| TypeScript | 5.x | Type safety | Project standard |
| Tailwind CSS | 4.x | Styling | Project standard — all existing classes use Tailwind |
| ws | 8.x | WebSocket server | Already used in server.ts |
| zod | 3.x | Request body validation | Already used in sessions/route.ts |

**No new packages required for this phase.** [VERIFIED: codebase grep — package.json]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.4 | Unit tests | All pure-function tests (e.g., bill-split logic) |

---

## Architecture Patterns

### System Architecture Diagram

```
[Host presses "Go back to claiming"]
        |
        v
[page.tsx calls POST /api/sessions/[id]/unfinalize]
        |
        v
[app/api/sessions/[id]/unfinalize/route.ts]
  - Validates host identity from body
  - Calls sessionStore.unfinalize(id)
        |
        v
[lib/session-store.ts — unfinalize(id)]
  - Sets finalized = false
  - Sets finalizedBill = null
  - Leaves claims untouched
        |
        v
[server.ts — broadcasts full-state snapshot to all WS clients]
        |
  ┌─────┴──────────────────────────────────┐
  v                                         v
[Host's SessionRoom]              [Each participant's SessionRoom]
  - Receives finalized: false         - Receives finalized: false
  - Was finalized → fires             - Was finalized → fires
    onUnfinalized callback              onUnfinalized callback
  |                                    |
  v                                    v
[page.tsx: setScreen('session')]   [page.tsx: setScreen('session')]
```

**DISP-01 / UX-01 data flow (client-only):**
```
[OcrReview state: items, taxCents, tipCents]
        |
        v (props)
[TaxTipFields: subtotalCents, taxCents, tipCents]
  - totalCents = subtotalCents + taxCents + tipCents
  - Renders "Total: $X.XX" below tip input
  - For each preset pct: isActive = (tipCents === Math.round(subtotalCents * pct / 100))
  - Active button: bg-blue-600 text-white border-blue-600
```

### Recommended Project Structure

No new directories needed. New file additions:

```
app/
└── api/
    └── sessions/
        └── [id]/
            ├── route.ts              (existing GET)
            └── unfinalize/
                └── route.ts          (NEW — POST handler)
```

All other changes are edits to existing files.

### Pattern 1: Additive className with conditional active state

**What:** Compute a boolean from existing props at render time; use it to select between two className strings.
**When to use:** Any button/toggle where active state is derivable from existing data.

```tsx
// Source: [VERIFIED: codebase read — TaxTipFields.tsx, inferred from existing pattern]
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

### Pattern 2: Callback ref for stable WebSocket event handlers

**What:** Store latest callback in a ref so the WebSocket `onmessage` closure always calls the current version without re-creating the WebSocket connection.
**When to use:** Any new callback prop added to `SessionRoom`.

```tsx
// Source: [VERIFIED: codebase read — SessionRoom.tsx lines 25-29]
const onFinalizedRef = useRef(onFinalized)
const onSessionDataRef = useRef(onSessionData)
// Add for new callback:
const onUnfinalizedRef = useRef(onUnfinalized)
onUnfinalizedRef.current = onUnfinalized
// Inside onmessage: call onUnfinalizedRef.current?.()
```

### Pattern 3: Host-only guard + idempotency check in WebSocket handler

**What:** Before processing a state-mutating message, verify the sender is the host and the operation isn't already applied.
**When to use:** Every host-only WebSocket action.

```ts
// Source: [VERIFIED: codebase read — server.ts lines 129-143]
// Reference structure for unfinalize handler:
const senderName = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
const session = sessionStore.get(sessionId!)
if (!session) return
if (senderName.toLowerCase() !== session.hostName.trim().toLowerCase()) return
if (!session.finalized) return  // idempotency: already unfinalized, no-op
```

### Pattern 4: Full-state broadcast after every mutation

**What:** After any state change, call `sessionStore.broadcast` with the full session snapshot.
**When to use:** Every WebSocket handler that mutates session state.

```ts
// Source: [VERIFIED: codebase read — server.ts lines 160-164]
sessionStore.unfinalize(sessionId!)
const data = sessionStore.getData(sessionId!)
if (data) {
  sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
}
```

### Pattern 5: REST route for session mutations

**What:** Next.js App Router API route with async params, JSON body validation via zod, host identity check.
**When to use:** Any REST-triggered session mutation.

```ts
// Source: [VERIFIED: codebase read — app/api/sessions/[id]/route.ts and sessions/route.ts]
// New file: app/api/sessions/[id]/unfinalize/route.ts
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // validate body, check host, call sessionStore.unfinalize(id), return 200
}
```

### Anti-Patterns to Avoid

- **Adding new props to TaxTipFields for DISP-01:** `totalCents` is already computable from the three props already present. No prop interface change needed.
- **Using useState for tip active state:** Active state is derived from props — no need for a separate state variable that would require synchronization.
- **Sending WebSocket 'unfinalize' message directly from the button:** The CONTEXT.md decision is a REST call triggers unfinalize; the WebSocket path is for propagation only. The unfinalize button triggers `POST /api/sessions/[id]/unfinalize`, not a WebSocket message.
- **Unmounting SessionRoom when screen switches to 'summary':** If SessionRoom unmounts, all WebSocket connections drop. The fix is CSS hidden (`display: none` or `hidden` className) so connections stay open and the `onUnfinalized` callback can fire. [VERIFIED: CONTEXT.md D-05 and code_context section]
- **Touching claims in the unfinalize() method:** D-06 is explicit — only reset `finalized` and `finalizedBill`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Integer cents rounding for total | Custom float math | `subtotalCents + taxCents + tipCents` (all already integers) | Three integer additions cannot overflow or lose precision at bill-size magnitudes |
| Host identity verification | Custom auth layer | Normalize both sides: `.trim().toLowerCase()` (existing pattern) | Matches v1.0 decision in STATE.md |
| Request body validation | Manual type checks | zod (already in project, used in sessions/route.ts) | Consistent with existing route handlers |
| Active button state | useState + sync logic | Derived expression from existing props | Simpler, no stale-state bugs |

---

## Key File Inventory

All files to be modified or created — read-verified from codebase.

### Files to EDIT

| File | Current State | Change Required |
|------|--------------|-----------------|
| `components/host/TaxTipFields.tsx` (67 lines) | Has `subtotalCents`, `taxCents`, `tipCents` as props; tip buttons have no active state; no total line | Add active state to preset buttons (lines 38-47); add "Total: $X.XX" line below tip input div |
| `components/session/SummaryScreen.tsx` (89 lines) | Host section ends at grand total row (line 84); `SummaryScreen` has no `onUnfinalize` prop | Add `onUnfinalize?: () => void` to Props; add "Go back to claiming" button after grand total row, inside `{isHost && ...}` block |
| `components/session/SessionRoom.tsx` (206 lines) | Has `onFinalized` and `onSessionData` callbacks; no `onUnfinalized`; `onmessage` only calls `onFinalizedRef` | Add `onUnfinalized?: () => void` to Props and ref pattern; detect `finalized: false` transition in `onmessage`; keep mounted when screen is 'summary' (handled in page.tsx) |
| `app/session/[id]/page.tsx` (70 lines) | Renders `SessionRoom` only when `screen === 'session'`; no `onUnfinalized` handler | Change `{screen === 'session' && <SessionRoom ...>}` to always render SessionRoom (CSS hidden when not 'session'); add `onUnfinalized` prop that calls REST endpoint and sets screen back to 'session' |
| `lib/session-store.ts` (119 lines) | Has `finalize(id, bill)` method (lines 99-104); no `unfinalize` | Add `unfinalize(id: string): void` method — sets `finalized = false`, `finalizedBill = null`, leaves claims |
| `types/index.ts` (48 lines) | `ClientMessage` union has `join`, `claim`, `unclaim`, `finalize` (lines 44-48) | Add `{ type: 'unfinalize'; sessionId: string; participantName: string }` to union |
| `server.ts` (204 lines) | Has finalize handler at lines 129-166; no unfinalize handler | Add unfinalize handler after finalize block: host-only guard, idempotency (`if (!session.finalized) return`), call `sessionStore.unfinalize()`, broadcast snapshot |

### Files to CREATE

| File | Purpose |
|------|---------|
| `app/api/sessions/[id]/unfinalize/route.ts` | `POST /api/sessions/[id]/unfinalize` — validates body (hostName), checks host identity, calls `sessionStore.unfinalize(id)`, returns 200 |

---

## Critical Implementation Detail: SessionRoom Mount Strategy

**The problem:** `page.tsx` currently renders `SessionRoom` only when `screen === 'session'`. When the screen transitions to `'summary'`, SessionRoom unmounts and its WebSocket connection closes. If `onUnfinalized` fires from a snapshot, the component won't exist to receive it.

**The solution (from CONTEXT.md):** Keep `SessionRoom` always mounted after joining. Use CSS visibility to hide it when not active. The pattern:

```tsx
// Source: [VERIFIED: CONTEXT.md code_context section + page.tsx lines 32-46]
// Change conditional render to always-mounted with hidden class:
<div className={screen === 'session' ? '' : 'hidden'}>
  <SessionRoom
    sessionId={sessionId}
    participantName={participantName}
    isHost={isHost}
    onFinalized={(bill) => { setFinalBill(bill); setScreen('summary') }}
    onSessionData={(data) => { /* existing isHost detection */ }}
    onUnfinalized={() => { setScreen('session') }}
  />
</div>
```

The `onUnfinalized` callback in `SessionRoom` must detect the transition: was finalized, now receives `finalized: false`. Track previous finalized state with a ref.

```tsx
// Source: [ASSUMED — standard React pattern for detecting value transitions]
const prevFinalizedRef = useRef(false)
// In onmessage, after setSession(msg.data):
if (prevFinalizedRef.current && !msg.data.finalized && onUnfinalizedRef.current) {
  onUnfinalizedRef.current()
}
prevFinalizedRef.current = msg.data.finalized
```

---

## Common Pitfalls

### Pitfall 1: REST call vs WebSocket for unfinalize trigger

**What goes wrong:** Developer sends a WebSocket `'unfinalize'` message from the button click, bypassing the REST pattern.
**Why it happens:** Finalize uses WebSocket — might seem natural to mirror it.
**How to avoid:** CONTEXT.md decision is explicit: REST triggers unfinalize. The button in `SummaryScreen` calls `onUnfinalize` prop; `page.tsx` calls `POST /api/sessions/[id]/unfinalize`; the REST handler calls `sessionStore.unfinalize()` and the server.ts WebSocket handler only handles the broadcast side. Note: the WebSocket 'unfinalize' type in `ClientMessage` is added for completeness and guard handling, but the primary trigger path is REST.
**Warning signs:** If you find yourself adding `sendUnfinalize()` in SessionRoom analogous to `sendFinalize()`, stop — the trigger is REST, not WS.

### Pitfall 2: Forgetting to keep SessionRoom mounted during 'summary' screen

**What goes wrong:** SessionRoom unmounts when screen === 'summary'. The WebSocket closes. Host clicks "Go back to claiming" — the REST call succeeds and the broadcast goes out — but no client SessionRoom is listening to receive `finalized: false`, so participants stay on the summary screen.
**Why it happens:** Natural conditional render pattern `{screen === 'session' && <SessionRoom>}`.
**How to avoid:** Use `className={screen === 'session' ? '' : 'hidden'}` on a wrapper div — SessionRoom stays mounted, WebSocket connection stays open.
**Warning signs:** After implementing unfinalize, open two browser tabs as participant + host. Press "Go back to claiming" — if only the host transitions back but the participant stays on summary, the SessionRoom unmount bug is the cause.

### Pitfall 3: Tip active state doesn't account for float precision

**What goes wrong:** `tipCents === Math.round(subtotalCents * pct / 100)` fails when subtotalCents is set from a manual typed entry that was rounded differently.
**Why it happens:** The input `onBlur` does `Math.round(parseFloat(value) * 100)`. The preset button does `Math.round(subtotalCents * pct / 100)`. As long as both use `Math.round`, integer arithmetic, they match exactly. No float precision issue.
**How to avoid:** Keep both the button click handler and the active detection using the same formula: `Math.round(subtotalCents * pct / 100)`. [VERIFIED: TaxTipFields.tsx line 42 and the proposed detection expression are identical]

### Pitfall 4: Mutation of claims during unfinalize

**What goes wrong:** `unfinalize()` method resets `claims = {}` in addition to `finalized` and `finalizedBill`.
**Why it happens:** Reflex to "clean up" state on reset.
**How to avoid:** D-06 is explicit — claims are never touched. The store method only sets `session.finalized = false` and `session.finalizedBill = null`.

### Pitfall 5: Zod validation required for unfinalize route body

**What goes wrong:** Route accepts any body without checking `hostName`, allowing any participant to trigger unfinalize via REST.
**Why it happens:** The route might seem simple enough to skip validation.
**How to avoid:** Validate `hostName: z.string().min(1).max(64)` in the request body using zod (consistent with sessions/route.ts). Then check `hostName.trim().toLowerCase() === sessionData.hostName.trim().toLowerCase()` before calling `sessionStore.unfinalize()`. Return 403 if unauthorized.

---

## Code Examples

Verified patterns from actual codebase:

### Adding total line to TaxTipFields (DISP-01)

```tsx
// Source: [VERIFIED: codebase read — TaxTipFields.tsx]
// Add after the closing </div> of the tip flex column, still inside the outer sticky div:
const totalCents = subtotalCents + taxCents + tipCents
// ...
<div className="mt-3 flex justify-between items-center text-sm font-semibold text-gray-900">
  <span>Total</span>
  <span>${(totalCents / 100).toFixed(2)}</span>
</div>
```

### sessionStore.unfinalize() method (UX-02)

```ts
// Source: [VERIFIED: codebase read — lib/session-store.ts lines 99-104 (finalize reference)]
unfinalize(id: string): void {
  const session = store.get(id)
  if (!session) return
  session.finalized = false
  session.finalizedBill = null
  // claims untouched — D-06
},
```

### New ClientMessage union entry

```ts
// Source: [VERIFIED: codebase read — types/index.ts lines 44-48]
export type ClientMessage =
  | { type: 'join'; sessionId: string; participantName: string }
  | { type: 'claim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'unclaim'; sessionId: string; participantName: string; itemId: string }
  | { type: 'finalize'; sessionId: string; participantName: string; unclaimedHandling: 'split' | 'host' }
  | { type: 'unfinalize'; sessionId: string; participantName: string }  // ADD
```

### SummaryScreen: unfinalize button insertion point

```tsx
// Source: [VERIFIED: codebase read — SummaryScreen.tsx lines 67-86]
// After the grand total row at line 84, still inside {isHost && (...)}:
{isHost && (
  <div className="mt-6 ...">
    {/* existing participants list */}
    {/* existing grand total row */}
    {onUnfinalize && (
      <button
        type="button"
        onClick={onUnfinalize}
        className="mt-4 w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Go back to claiming
      </button>
    )}
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Conditional render for screen switching | CSS `hidden` class to keep WebSocket alive | Required for unfinalize to work — components that unmount lose their WS connections |
| `session.finalized === true` as terminal state | `finalized` as reversible boolean | Unfinalize adds the reverse transition; claims remain intact as the source of truth |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `prevFinalizedRef` pattern to detect finalized→unfinalized transition in SessionRoom | Architecture Patterns / Critical Implementation Detail | If wrong: `onUnfinalized` never fires or fires on wrong transitions. Mitigation: standard React pattern for detecting value transitions — low risk |
| A2 | Unfinalize button uses a neutral style (border-gray-300, text-gray-700) rather than destructive red | Code Examples | If wrong: visual inconsistency. Mitigation: Phase 8 is a visual polish pass — exact style is low-stakes and easily changed |

**Two assumptions, both low-risk.** All architectural and implementation claims are VERIFIED from codebase reads.

---

## Open Questions

1. **Does `onUnfinalize` on `SummaryScreen` need to be optional or required?**
   - What we know: SummaryScreen is currently called without any callback props. Adding a required prop would break the existing call site.
   - Recommendation: Make it `onUnfinalize?: () => void` (optional). Only render the button when `onUnfinalize && isHost`.

2. **Should the unfinalize REST route broadcast, or should the WebSocket server handle broadcast?**
   - What we know: The existing finalize flow uses WebSocket for the mutation AND broadcast. For unfinalize, CONTEXT.md specifies REST triggers the operation and WS broadcasts.
   - Recommendation: REST route calls `sessionStore.unfinalize(id)` then directly calls `sessionStore.broadcast(id, snapshot)`. This works because server.ts and the REST route share the same `sessionStore` singleton via `globalThis`. No WebSocket message send needed — the REST route has direct store access.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes to existing files. No new external dependencies, services, or CLI tools are required. All needed packages (React, Next.js, Tailwind, ws, zod, vitest) are already installed and verified.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.4 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run lib/bill-split.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | `totalCents = subtotalCents + taxCents + tipCents` computed correctly | unit | `npx vitest run lib/tax-tip-total.test.ts` | ❌ Wave 0 |
| UX-01 | Active preset detection: `tipCents === Math.round(subtotalCents * pct / 100)` | unit | `npx vitest run lib/tip-active.test.ts` | ❌ Wave 0 (or inline in DISP-01 test) |
| UX-02 | `sessionStore.unfinalize()` resets finalized/finalizedBill, preserves claims | unit | `npx vitest run lib/session-store.test.ts` | ❌ Wave 0 |
| UX-02 | REST route returns 403 for non-host; 200 for host; session state correct after call | integration / manual | Manual browser test or curl | manual-only (no HTTP test harness in project) |
| UX-02 | All participants see session screen after unfinalize broadcast | e2e / manual | Manual two-tab browser test | manual-only |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

The project has one test file (`lib/bill-split.test.ts`) covering pure business logic. Phase 7 adds new pure-logic surface:

- [ ] `lib/tax-tip-total.test.ts` — covers DISP-01 total computation and UX-01 active preset detection (these are simple enough to combine)
- [ ] `lib/session-store.test.ts` — covers UX-02 `unfinalize()` method: verifies finalized resets to false, finalizedBill resets to null, claims array unchanged

*(REST and WebSocket integration paths are manual-only — no HTTP/WS test harness exists in the project.)*

---

## Security Domain

This phase touches session mutation. Applicable threat mitigations:

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes — unfinalize is host-only | Host identity check: `hostName.trim().toLowerCase() === session.hostName.trim().toLowerCase()` on both REST and WebSocket paths |
| V5 Input Validation | Yes | zod schema for REST body; `MAX_NAME_LEN` slice guard on WebSocket path |
| V2 Authentication | No | No user accounts; sessions are anonymous |
| V6 Cryptography | No | No secrets handled |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Participant triggers unfinalize for host | Elevation of Privilege | REST: check `hostName` in body against `session.hostName`; return 403 if mismatch. WS: same guard (mirrors finalize handler lines 139-140) |
| Replay unfinalize on already-unfinalized session | Tampering | Idempotency guard: `if (!session.finalized) return` (mirrors finalize guard line 143) |
| Crafted large hostName string | Denial of Service | `MAX_NAME_LEN = 64` slice on WS; `z.string().max(64)` on REST (already established) |

---

## Sources

### Primary (HIGH confidence)
- `components/host/TaxTipFields.tsx` — read in full; confirmed props, TIP_PRESETS constant, existing button className
- `components/host/OcrReview.tsx` — read in full; confirmed subtotalCents computation, TaxTipFields call site
- `components/session/SummaryScreen.tsx` — read in full; confirmed isHost block at line 67, grand total at line 81, insertion point for button
- `components/session/SessionRoom.tsx` — read in full; confirmed callback ref pattern, onmessage handler, finalize/session-data callbacks
- `app/session/[id]/page.tsx` — read in full; confirmed screen state machine, SessionRoom conditional render
- `lib/session-store.ts` — read in full; confirmed finalize() method structure, broadcast(), getData()
- `server.ts` — read in full; confirmed finalize handler at line 129, host-only guard, idempotency check, broadcast pattern
- `types/index.ts` — read in full; confirmed ClientMessage union, SessionState shape
- `app/api/sessions/[id]/route.ts` — read in full; confirmed async params pattern, no unfinalize route exists yet
- `app/api/sessions/route.ts` — read in full; confirmed zod validation pattern, host identity not checked (session creation)
- `.planning/phases/07-ux-display-fixes/07-CONTEXT.md` — read in full; all decisions locked

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — DISP-01, UX-01, UX-02 requirement text confirmed
- `.planning/STATE.md` — architectural decisions (integer cents, full-state broadcast, callback ref pattern) confirmed

### Tertiary (LOW confidence)
- None. All claims verified from direct codebase reads.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed from package.json and existing imports
- Architecture: HIGH — all patterns verified from direct source file reads
- Pitfalls: HIGH — derived from actual code structure, not speculation
- Implementation details: HIGH — exact line numbers and class names verified from source

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable codebase — no external API dependencies in this phase)
