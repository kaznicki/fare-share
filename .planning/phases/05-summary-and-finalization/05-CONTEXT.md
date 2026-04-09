# Phase 5: Summary and Finalization - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Host triggers finalization from the claiming screen. If unclaimed items exist, host resolves them via a blocking modal before the session locks. Once finalized, every participant's screen transitions to a summary view showing their individual breakdown (food subtotal + proportional tax share + proportional tip share + total owed). The host additionally sees a table of every participant's name and amount owed.

</domain>

<decisions>
## Implementation Decisions

### Host Identity
- **D-01:** `SessionState` and `SessionData` get a `hostName: string` field. `POST /api/sessions` accepts `hostName` from the host at session creation time.
- **D-02:** `ShareScreen` generates the host's personal join URL as `/session/[id]?name=Alice` (pre-filled name param). The host sees the JoinForm with their name pre-filled; they can edit but don't need to retype.
- **D-03:** `session/[id]/page.tsx` reads the `?name` URL param to pre-fill JoinForm. After the host submits, `participantName === session.hostName` determines `isHost=true` for the SessionRoom.

### Summary Navigation
- **D-04:** Same-page screen state machine — no new route. `session/[id]/page.tsx` gains a `'summary'` screen alongside `'joining'` and `'session'`. SessionRoom receives the `session-finalized` WebSocket message and lifts state up to trigger the `'summary'` transition.
- **D-05:** Finalization is permanent — no back button, no un-finalize capability.

### Unclaimed Items Dialog
- **D-06:** If all items are claimed when host taps Finalize, the finalize WebSocket message is sent immediately — no confirmation dialog.
- **D-07:** If any items are unclaimed, a blocking modal appears before the WebSocket message is sent. Modal title: lists unclaimed item count. Two choices: **"Split among everyone"** (unclaimed items distributed proportionally among all participants) and **"I'll cover the rest"** (host absorbs all unclaimed items into their own total). The `finalize` ClientMessage includes the chosen handling: `unclaimedHandling: 'split' | 'host'`.

### Participant Summary Content
- **D-08:** Every participant's summary screen shows a full breakdown:
  - Food subtotal (sum of their claimed items)
  - Tax share (proportional)
  - Tip share (proportional)
  - **Total owed** (bold, prominent)
- **D-09:** Host summary screen shows their own breakdown (same as participants) PLUS a table below listing every participant's name and their total owed.

### Math
- Integer cents throughout — no floats for money (established in STATE.md, locked).
- Largest Remainder Method for distributing tax, tip, and shared item costs (established in STATE.md, locked). The plan (05-01) implements and tests this.

### Claude's Discretion
- Exact label wording ("Tax:" vs "Your tax share:")
- Modal styling and positioning (bottom sheet vs centered)
- Animation/transition when summary screen appears
- The exact structure of the `finalize` ClientMessage type
- Handling edge case where total is $0 (e.g., participant claimed nothing — show $0.00 gracefully)
- Whether unclaimed "split" proportionally by participant count or by food subtotal (proportional is fairer — Claude's call)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §MATH-01, MATH-02, MATH-03 — Proportional tax/tip, exact sum constraint
- `.planning/REQUIREMENTS.md` §FINAL-01, FINAL-02 — Per-person summary, host summary, unclaimed handling

### Locked architectural decisions
- `.planning/STATE.md` §Decisions — Integer cents, Largest Remainder Method, full-state broadcast, getData() pattern, globalThis session store

### Types to extend
- `types/index.ts` — `SessionState`, `SessionData`, `ServerMessage` (`session-finalized` already typed), `ClientMessage` (needs `finalize` type added)

### Code to modify
- `lib/session-store.ts` — Add `hostName` field, add `finalized: boolean` flag, add `finalize()` method
- `components/session/SessionRoom.tsx` — Wire Finalize button onClick, handle `session-finalized` message, add unclaimed modal
- `app/session/[id]/page.tsx` — Add `'summary'` screen state, read `?name` URL param for pre-fill, pass `isHost`
- `app/host/page.tsx` / `components/host/ShareScreen.tsx` — Generate host's join URL with `?name=` param
- `server.ts` — Add WebSocket handler for `finalize` ClientMessage type

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SessionRoom.tsx` `myTotalCents` computed value — base for food subtotal in summary
- `SessionRoom.tsx` fixed bottom footer — same pattern for summary screen footer
- `session/[id]/page.tsx` screen state machine (`'joining'` | `'session'`) — extend with `'summary'`
- `lib/session-store.ts` `broadcast()` — used to send `session-finalized` to all clients

### Established Patterns
- State machine via conditional rendering (no router.push) — match the host/page.tsx and session/[id]/page.tsx pattern
- Full-state broadcast on every change — finalize should also broadcast full state + finalized flag
- Integer cents for all monetary math — never `toFixed()` for intermediate values, only for display
- `getData()` strips `sockets` before serialization — any new fields must be JSON-safe or excluded

### Integration Points
- `server.ts` WebSocket message router needs a `'finalize'` case alongside `'join'`, `'claim'`, `'unclaim'`
- `SessionState` and `SessionData` type extension affects: store, server.ts, REST route, and all consumers
- `ShareScreen.tsx` must generate the host URL — reads `sessionId`, needs to know `hostName` to append `?name=`

</code_context>

<specifics>
## Specific Ideas

- The host's summary table should feel like a quick read at the table — name on left, dollar amount on right, simple dividers
- The per-person breakdown should make the proportional math feel transparent ("here's why you owe this much") — labels matter

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-summary-and-finalization*
*Context gathered: 2026-04-08 via discuss-phase*
