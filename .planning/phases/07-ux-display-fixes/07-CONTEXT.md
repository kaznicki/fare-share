# Phase 7: UX & Display Fixes - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Three targeted UX and display fixes on existing screens:
1. Add a live bill total to the OcrReview screen so the host can verify the grand total before creating a session
2. Make the tip selector buttons visually show which preset is currently active
3. Add an Unfinalize button to the host's summary screen so the host can return to the claiming view without anyone losing their claims

No new screens, no new session flows, no visual design pass — that is Phase 8. These are surgical fixes to three specific interaction problems.

</domain>

<decisions>
## Implementation Decisions

### Bill Total Display (DISP-01)
- **D-01:** The bill total appears inside the `TaxTipFields` sticky footer — at the bottom of the Tax/Tip section, below the tip input. This keeps all money fields together and visible while the host scrolls the item list.
- **D-02:** Format is a single "Total: $X.XX" line. No breakdown (no subtotal + tax + tip = total). Clean and minimal.
- **D-03:** The total is `subtotalCents + taxCents + tipCents`, computed reactively. `TaxTipFields` already receives `subtotalCents`, `taxCents`, and `tipCents` as props — it can derive `totalCents` internally without new props.

### Tip Selected State (UX-01)
- **Claude's Discretion:** User did not discuss this area. Active preset button gets `bg-blue-600 text-white border-blue-600` (matches the app's existing blue accent — Create Session button, focus rings). Detection: a preset is "selected" when `tipCents === Math.round(subtotalCents * pct / 100)`. When the host types a custom tip amount that doesn't match any preset, no preset is highlighted. No new state needed — derived at render time from existing props.

### Unfinalize Flow (UX-02)
- **D-04:** "Go back to claiming" button appears at the bottom of the host-only "Everyone's totals" section in `SummaryScreen`. Host-only (hidden from participants). No confirmation dialog — the label is self-describing and claims are never lost.
- **D-05:** When pressed, silent return to the claiming screen for all participants. The existing full-state broadcast pattern propagates `finalized: false` to all connected WebSocket clients, automatically returning them to the claiming view.
- **D-06:** Claims are never touched during unfinalize — only `finalized` and `finalizedBill` are reset. Prior claims remain intact so no one needs to re-claim.

### Claude's Discretion
- **Tip visual style:** `bg-blue-600 text-white border-blue-600` for active preset, unmodified preset style for inactive. Derived at render from `tipCents === Math.round(subtotalCents * pct / 100)`.
- **Unfinalize trigger mechanism:** REST API endpoint `POST /api/sessions/[id]/unfinalize` (consistent with session creation pattern). The server resets session state and broadcasts to all open WebSocket connections. `SessionRoom` stays mounted (CSS hidden) on the summary screen so all participants' WebSocket connections remain open and receive the broadcast.
- **`onUnfinalized` prop:** Added to `SessionRoom` — fires when the incoming session-snapshot has `finalized: false` and the previous state was finalized. `page.tsx` routes back to `'session'` screen on this callback.
- **Button label:** "Go back to claiming" (descriptive, no jargon).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Screen components to modify
- `components/host/OcrReview.tsx` — review screen; passes subtotalCents to TaxTipFields; no total display yet
- `components/host/TaxTipFields.tsx` — sticky footer with Tax/Tip fields and tip preset buttons; receives subtotalCents, taxCents, tipCents; needs total line + tip active state
- `components/session/SummaryScreen.tsx` — host sees everyone's totals; needs "Go back to claiming" button
- `components/session/SessionRoom.tsx` — manages WebSocket; needs `onUnfinalized` prop and to stay mounted (CSS hidden) when on summary screen

### Session page routing
- `app/session/[id]/page.tsx` — manages `'joining' | 'session' | 'summary'` screen state; needs `onUnfinalized` callback wiring + REST call for unfinalize trigger

### Server-side unfinalize
- `lib/session-store.ts` — needs `unfinalize()` method: sets `finalized: false`, `finalizedBill: null`, leaves `claims` untouched
- `server.ts` — finalize handler at line ~129 (reference for unfinalize handler structure; host-only guard, idempotency check)
- `types/index.ts` — needs `'unfinalize'` added to `ClientMessage` union

### Requirements
- `.planning/REQUIREMENTS.md` §DISP-01, UX-01, UX-02 — the three requirements this phase must satisfy

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TaxTipFields.tsx` — already has `subtotalCents + taxCents + tipCents` in scope; total display is additive (no refactor needed, just render a new line)
- `TIP_PRESETS = [15, 18, 20]` in `TaxTipFields.tsx` — the active-state logic loops over this same array
- `SummaryScreen.tsx` host section — the "Everyone's totals" block at line 68 is the insertion point for the unfinalize button
- Finalize message pattern in `server.ts` (~line 129) — exact structure to replicate for unfinalize (host-only check, idempotency guard, broadcast after state change)

### Established Patterns
- Full-state broadcast on every WebSocket message — unfinalize must broadcast the full session snapshot (with `finalized: false`) to propagate the screen change to all participants
- Integer cents throughout — `totalCents = subtotalCents + taxCents + tipCents` (all integer, no floats)
- Host-only UI controlled by `isHost` prop — "Go back to claiming" follows this pattern
- REST API for session mutations — `POST /api/sessions` created sessions; unfinalize follows the same pattern with `POST /api/sessions/[id]/unfinalize`
- `onFinalized` / `onSessionData` callback pattern in `SessionRoom` → extended with `onUnfinalized`

### Integration Points
- `TaxTipFields` → add total display below tip input; no prop changes needed (all data already flows in)
- `SessionRoom` → keep mounted (CSS hidden) when `screen === 'summary'` in `page.tsx`; add `onUnfinalized` prop; add `onUnfinalize` call path
- `app/session/[id]/page.tsx` → add `onUnfinalized` handler that calls REST API and sets screen back to `'session'`
- `lib/session-store.ts` → add `unfinalize(id)` method
- `server.ts` → add `'unfinalize'` message handler (after existing `'finalize'` handler)
- `types/index.ts` → add `{ type: 'unfinalize'; sessionId: string; participantName: string }` to ClientMessage

</code_context>

<specifics>
## Specific Ideas

- Bill total label: "Total: $X.XX" — no extra words
- Unfinalize button label: "Go back to claiming"
- Tip active state: `bg-blue-600 text-white border-blue-600` (same blue as Create Session button and focus rings)
- No tip preset highlighted when manual entry doesn't match any preset

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-ux-display-fixes*
*Context gathered: 2026-04-29*
