# Phase 4: Item Claiming - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Participants (including the host) tap item rows to claim them. Claims broadcast to all connected screens in real time. Shared items split cost proportionally among claimants. A pinned footer shows each participant's running total. The host finalizes claiming when everyone is done, which advances the session to Phase 5 (Summary).

</domain>

<decisions>
## Implementation Decisions

### Live cost feedback
- Each row shows both the full price AND the split: e.g., "$30.00 ÷ 3 = $10.00"
- Running total pinned in a footer — always visible while scrolling
- Footer shows "Your total: $0.00" before any items are claimed (not a hint/prompt)
- Cost split updates: Claude's discretion — instant live updates on every WebSocket message is the logical choice for a real-time app

### Sync & update feel
- Remote claim arrival animation: Claude's discretion — pick whatever feels right (subtle fade/flash)
- Disconnection: show a "Reconnecting..." banner while WebSocket is down; dismiss on reconnect
- Claims broadcast full state on every change (already established in Phase 3 architecture)

### Host participation
- Host can claim items just like any participant — no separate read-only host view during claiming
- Host also controls finalization: a "Finalize" button (host-only) closes the claiming phase and triggers the summary

### Finalization
- Only the host sees and can tap the "Finalize" button
- No auto-finalize — human decision required
- What happens after Finalize is Phase 5's domain

### Claude's Discretion
- Animation style for remote claim arrival (fade, flash, or instant — whatever reads best on mobile)
- Exact split label format ("÷ 3" vs "/ 3 people" vs "3-way split")
- Reconnecting banner position and styling
- Whether unclaimed items get a visual treatment (e.g., dimmed) to prompt claiming

</decisions>

<specifics>
## Specific Ideas

- Split display should feel informative but not cluttered — show it on the row itself, not in a tooltip or separate section

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-item-claiming*
*Context gathered: 2026-02-22*
