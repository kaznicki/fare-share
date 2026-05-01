# Phase 7: UX & Display Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 07-ux-display-fixes
**Areas discussed:** Bill total display, Unfinalize flow

---

## Bill Total Display (DISP-01)

| Option | Description | Selected |
|--------|-------------|----------|
| In the TaxTipFields footer | Adds a 'Total: $X.XX' line at the bottom of the sticky Tax/Tip section. Stays visible while scrolling the item list. Already the natural anchor for all money fields. | ✓ |
| Above the Create Session button | Shows total just before the host commits, like a checkout summary. | |

**User's choice:** In the TaxTipFields footer

---

| Option | Description | Selected |
|--------|-------------|----------|
| Single 'Total: $X.XX' line | Clean and simple — host already sees Tax and Tip fields just above. | ✓ |
| Breakdown: subtotal + tax + tip = total | Expandable receipt-style breakdown. More verbose but leaves no ambiguity. | |

**User's choice:** Single 'Total: $X.XX' line

---

## Unfinalize Flow (UX-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom of 'Everyone's totals' section | Sits naturally after the table, labeled 'Go back to claiming'. Only the host sees it. Low-risk position. | ✓ |
| Top of the screen, prominent | Host sees it immediately on the summary screen. More visible but higher chance of accidental tap. | |

**User's choice:** Bottom of 'Everyone's totals' section

---

| Option | Description | Selected |
|--------|-------------|----------|
| No confirmation — just go back | The button label is self-describing. Claims are preserved — nothing is lost. | ✓ |
| Yes — show a quick confirmation dialog | 'Are you sure?' before going back. Extra safety net. | |

**User's choice:** No confirmation

---

| Option | Description | Selected |
|--------|-------------|----------|
| Silent return to claiming screen | Full-state broadcast sends finalized: false to all participants, automatically bringing them back to claiming view. | ✓ |
| Banner message explaining what happened | Participants see a yellow banner: 'The host went back to review claims.' | |

**User's choice:** Silent return (full-state broadcast pattern)

---

## Claude's Discretion

- **Tip selected visual (UX-01):** User did not select this area for discussion. Claude chose: active preset = `bg-blue-600 text-white border-blue-600` (matches app's existing blue accent). Detection by comparing `tipCents === Math.round(subtotalCents * pct / 100)` at render time. No preset highlighted for manual custom entry.
- **Unfinalize trigger mechanism:** REST API `POST /api/sessions/[id]/unfinalize`. SessionRoom stays mounted (CSS hidden) on summary screen to keep WebSocket connections open for the broadcast.
- **Button label:** "Go back to claiming"

## Deferred Ideas

None — discussion stayed within phase scope.
