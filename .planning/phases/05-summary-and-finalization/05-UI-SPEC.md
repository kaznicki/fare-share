---
phase: 05
name: Summary and Finalization
status: draft
created: 2026-04-08
---

# UI-SPEC: Phase 5 — Summary and Finalization

## Design System

**Tool:** none (no shadcn — Tailwind CSS v4 with Geist Sans font)
**Styling approach:** Tailwind utility classes, inline composition, no component library
**Registry:** not applicable
**Font:** Geist Sans (already loaded via `next/font/google` in `layout.tsx`)

> Source: `app/layout.tsx`, `app/globals.css`, absence of `components.json`

---

## Spacing Scale

8-point grid. All spacing uses multiples of 4px only.

| Token | Value | Use |
|-------|-------|-----|
| 1 | 4px | Icon gaps, tight label spacing |
| 2 | 8px | Inline element separation, row internal padding (vertical) |
| 4 | 16px | Card/section internal padding, standard `p-4` |
| 6 | 24px | Between sections within a screen |
| 8 | 32px | Screen-level top/bottom margin |
| 16 | 64px | Bottom scroll clearance (fixed footer height + buffer) |

**Touch targets:** All interactive elements minimum 44px tall (`min-h-[44px]`). Modal buttons use `py-2` with `min-h-[44px]` enforced.

> Source: established project pattern — `p-4`, `py-2` observed across SessionRoom, OcrReview, ClaimableItem.
> Fix applied: removed 12px (token 3) — not a valid 8-point scale value. Replaced 96px bottom clearance with 64px (`pb-16`).

---

## Typography

Four sizes. Two weights only.

| Role | Size | Weight | Line-height | Class |
|------|------|--------|-------------|-------|
| Heading / Total owed | 24px | 700 (bold) | 1.2 | `text-2xl font-bold` |
| Body | 16px | 400 (normal) | 1.5 | `text-base` |
| Label / secondary | 14px | 400 (normal) | 1.4 | `text-sm` |
| Caption / metadata | 12px | 400 (normal) | 1.4 | `text-xs` |

**Two weights only: 400 (normal) and 700 (bold).** No 500 (medium) or 600 (semibold) anywhere in this phase.

**Total owed amount:** 24px, weight 700 (`text-2xl font-bold`) — matches heading tier to draw the eye.

**Money amounts in summary rows:** 16px, weight 700 (`text-base font-bold`) — distinguishable from item name without a new size tier.

> Source: `text-2xl font-bold` (SessionRoom h1), `text-xs text-gray-400` (ClaimableItem claimant names).
> Fix applied: removed 500 (medium) weight row. All `font-semibold` (600) instances replaced with `font-bold` (700). Label row now uses weight 400 to stay within the two-weight contract.

---

## Color Contract

**60% dominant surface:** `bg-white` / `bg-gray-50` — screen backgrounds, list rows
**30% secondary:** `bg-gray-100`, `border-gray-200` — dividers, card borders, section separation
**10% accent:** `bg-indigo-600` — reserved exclusively for the primary action button (Finalize) and the "Total owed" amount label. No other use.

**Semantic colors (in use across project — match exactly):**

| Purpose | Background | Border | Text |
|---------|-----------|--------|------|
| Claimed by me | `bg-green-50` | `border-green-200` | `text-gray-900` |
| Shared claim | `bg-blue-50` | `border-blue-200` | `text-gray-900` |
| Claimed by others | `bg-gray-50` | `border-gray-200` | `text-gray-900` |
| Error / destructive | `bg-red-50` | `border-red-200` | `text-red-800` |
| Warning / caution | `bg-yellow-50` | `border-yellow-200` | `text-yellow-800` |
| Info / notice | `bg-amber-50` | `border-amber-200` | `text-amber-800` |

**Phase 5 additions:**
- Modal overlay: `bg-black/50` (semi-transparent backdrop)
- Modal surface: `bg-white rounded-2xl shadow-lg` — matches ShareScreen QR card pattern
- Summary total row: indigo text `text-indigo-600 font-bold` for "Total owed" label and amount

> Source: `ClaimableItem.tsx` for claim state colors; `OcrReview.tsx` for error/warning surfaces; `ShareScreen.tsx` for card pattern. Indigo established as primary accent in `SessionRoom.tsx` Finalize button.

---

## Component Inventory

### New Components (Phase 5)

**`components/session/SummaryScreen.tsx`**
- Participant view: vertical breakdown card — food subtotal, tax share, tip share, total owed
- Host view: same breakdown card at top + participant table below
- No interactive elements beyond the host's "Done" close affordance (out of scope — session is finalized)
- Full-width, max-w-sm, centered — matches all existing session screens

**`components/session/UnclaimedModal.tsx`**
- Blocking modal overlay — cannot be dismissed without choosing an option
- Centered card on mobile viewport (not bottom sheet — simpler to implement and renders correctly on all viewport heights)
- Two action buttons, stacked vertically: "Split among everyone" (primary, indigo) and "I'll cover the rest" (secondary, outlined)
- No close / X button — forced choice per D-07

### Modified Components (Phase 5)

**`components/session/SessionRoom.tsx`**
- Wire Finalize button `onClick` — count unclaimed items, show modal or send immediately
- Handle `session-finalized` ServerMessage — lift finalized state to parent via callback prop
- New prop: `onFinalized: (result: BillSplitResult) => void`

**`app/session/[id]/page.tsx`**
- Add `'summary'` to Screen type: `'joining' | 'session' | 'summary'`
- Read `?name` URL search param to pre-fill JoinForm
- Derive `isHost` after join: `participantName === session.hostName`
- Pass `isHost` to SessionRoom
- On `onFinalized` callback: store result in state, transition to `'summary'`

**`components/host/ShareScreen.tsx`**
- Generate host join URL: `/session/[id]?name=${encodeURIComponent(hostName)}`

---

## Screen Inventory

### Screen A: Session Room (existing — minor additions)

Established in Phase 4. Phase 5 adds:
- Finalize button becomes functional (was stub)
- Finalize button visible only when `isHost === true`
- No layout changes

### Screen B: Unclaimed Items Modal (new — host only)

**When shown:** Host taps Finalize and `unclaimedCount > 0`

**Layout:**
```
┌─────────────────────────────────┐
│  backdrop: bg-black/50           │
│  ┌───────────────────────────┐   │
│  │ [Title]                   │   │
│  │ {N} item(s) unclaimed      │   │
│  │                           │   │
│  │ [Split among everyone]    │   │
│  │ [I'll cover the rest]     │   │
│  └───────────────────────────┘   │
└─────────────────────────────────┘
```

**Dimensions:** `max-w-sm mx-auto` card, `p-6` internal padding, `rounded-2xl shadow-lg`

**Title:** `text-2xl font-bold text-gray-900`

**Body text:** `text-sm text-gray-600` — explains the choice briefly (see Copywriting section)

**Buttons:** stacked, `w-full`, `py-2 min-h-[44px]`, `rounded-xl`
- "Split among everyone": `bg-indigo-600 text-white font-bold` (primary)
- "I'll cover the rest": `border border-gray-300 text-gray-700 bg-white` (secondary)

**No cancel / X button** — matches D-07 requirement for a forced choice.

> Fix applied: Title changed from `text-lg font-semibold` to `text-2xl font-bold` — keeps within declared 4 sizes and 2 weights. Button padding changed from `py-3` to `py-2 min-h-[44px]`. Removed `font-semibold` and `font-medium` from button classes.

### Screen C: Participant Summary Screen (new)

**When shown:** `session-finalized` WebSocket message received → screen transitions to `'summary'`

**Layout (all participants including host's personal section):**
```
┌─────────────────────────────────┐
│  Summary                         │
│  ─────────────────────────────   │
│  Food subtotal         $XX.XX    │
│  Your tax share         $X.XX    │
│  Your tip share         $X.XX    │
│  ─────────────────────────────   │
│  Total owed            $XX.XX    │
└─────────────────────────────────┘
```

**Container:** `w-full max-w-sm mx-auto p-4`

**Card:** `bg-white border border-gray-200 rounded-2xl p-6`

**Row pattern:** `flex justify-between items-center py-2 min-h-[44px]` with a `border-t border-gray-100` before the Total owed row

**"Total owed" row:** `text-indigo-600 font-bold text-2xl` for both label and amount — the only indigo text on screen

**Edge case — $0.00 total:** Render the same layout with `$0.00` — do not hide the breakdown. Add a caption below the total: `text-xs text-gray-400` reading "You didn't claim any items."

> Fix applied: "Total owed" changed from `text-lg` (18px — undeclared) to `text-2xl font-bold` (24px — declared heading tier). Row padding changed from `py-3` to `py-2 min-h-[44px]`. Removed `font-semibold`.

### Screen D: Host Summary Table (new — host only, below Screen C card)

**When shown:** Same `'summary'` screen, rendered below the personal breakdown card when `isHost === true`

**Layout:**
```
┌─────────────────────────────────┐
│  Everyone's totals               │
│  ─────────────────────────────   │
│  Alice               $12.45      │
│  Bob                  $8.30      │
│  Carol               $14.20      │
│  ─────────────────────────────   │
│  Total               $34.95      │
└─────────────────────────────────┘
```

**Container:** `mt-6 w-full max-w-sm mx-auto px-4 pb-16`

**Section heading:** `text-base font-bold text-gray-700 mb-3`

**Rows:** `flex justify-between items-center py-2 min-h-[44px] border-b border-gray-100 last:border-0`
- Name: `text-gray-900` (font-normal, weight 400)
- Amount: `text-gray-900 font-bold tabular-nums` (right-aligned, monospace digits for alignment)

**Total row:** `flex justify-between items-center pt-2 min-h-[44px] border-t border-gray-300`
- Label: `text-gray-700 font-bold`
- Amount: `text-gray-900 font-bold tabular-nums`

> Fix applied: Container bottom padding changed from `pb-8` to match the screen bottom clearance of `pb-16` (64px). Row padding changed from `py-3` to `py-2 min-h-[44px]`. `font-semibold` replaced with `font-bold` throughout. Section heading changed from `font-semibold` to `font-bold`.

---

## Interaction Contracts

### Finalize Button

| State | Class |
|-------|-------|
| Default | `bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold` |
| Loading (after tap) | `bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed` |
| Not visible (non-host) | not rendered |

Tap → count unclaimed items:
- If 0 unclaimed: send `{ type: 'finalize', sessionId, unclaimedHandling: 'split' }` immediately (no dialog needed)
- If > 0 unclaimed: render UnclaimedModal — do not send WebSocket message until host chooses

### Screen Transition to Summary

On receiving `session-finalized` ServerMessage:
1. Call `onFinalized(result)` callback
2. Parent page sets `screen = 'summary'`
3. Render SummaryScreen — no animation required (instant swap is acceptable; transition is Claude's discretion — no animation is safer than a jarring one)

If a non-host participant is mid-scroll on the item list when `session-finalized` arrives, the transition is immediate. There is no "heads up" countdown before finalization — this is intentional per D-05 (finalization is permanent; no pre-flight warning required for participants).

### Zero-Subtotal Guard

If a participant's `subtotalCents === 0` (claimed nothing):
- Display `$0.00` for food subtotal, tax share, tip share, and total owed
- Add caption: "You didn't claim any items." (`text-xs text-gray-400 mt-2`)
- Do NOT hide the breakdown card — the card must always be visible on the summary screen

---

## Copywriting Contract

### Labels (summary breakdown rows)

| Row | Label |
|-----|-------|
| Food subtotal | "Food subtotal" |
| Tax share | "Your tax share" |
| Tip share | "Your tip share" |
| Total owed | "Total owed" |

Rationale: "Your tax share" and "Your tip share" (not bare "Tax:" / "Tip:") make the proportional math feel transparent — per CONTEXT.md specifics: "labels matter." "Food subtotal" (not "Subtotal") distinguishes claimed food from the full receipt total.

### Unclaimed Modal

**Title:** "{N} item{s} not claimed" (e.g., "3 items not claimed" / "1 item not claimed" — pluralize correctly)

**Body:** "Choose how to handle the remaining cost before locking in totals."

**Primary button:** "Split among everyone"

**Secondary button:** "I'll cover the rest"

> Source: D-07 — exact button labels specified and locked. Title and body are Claude's discretion.

### Finalize Button (in footer)

**Label:** "Finalize"

> Source: Existing SessionRoom.tsx stub — label already established.

### Host Summary Table

**Section heading:** "Everyone's totals"

**Footer row label:** "Total"

### Empty / Zero States

| State | Copy |
|-------|------|
| Participant claimed nothing | "You didn't claim any items." (caption below $0.00 total) |
| No participants in host table | Not possible — host is always a participant; table always has at least one row |

### Error States

Phase 5 does not introduce new network-failure paths beyond what SessionRoom already handles. If the `finalize` WebSocket message fails to send (socket not OPEN):

- Show inline error below Finalize button: "Could not finalize. Check your connection and try again."
- Style: `text-sm text-red-600 mt-2 text-center`
- Finalize button returns to enabled state

---

## Registry

**shadcn:** Not initialized — not applicable.
**Third-party registries:** None.
**Safety Gate:** Not applicable.

---

## Accessibility

- Modal must trap focus: first focusable element is "Split among everyone" button; Tab cycles between the two buttons only while modal is open
- Summary amounts use `tabular-nums` Tailwind class to ensure column alignment with monospace digits
- "Total owed" is not hidden behind an expand — always visible without interaction
- All interactive elements meet 44px minimum touch target (`min-h-[44px]` enforced)
- Color is never the sole differentiator — amounts are always accompanied by labels

---

## What This Phase Does NOT Touch

Per CONTEXT.md deferred section (none deferred) and requirements out-of-scope list:

- No back button from summary screen (D-05: finalization is permanent)
- No "share my total" button (v2 deferred — `navigator.share()`)
- No session expiry countdown
- No editing items or claims after finalization
- No per-person custom tip percentage

---

## Pre-Population Sources

| Field | Source |
|-------|--------|
| Design system: none | Detected: no `components.json` |
| Font: Geist Sans | `app/layout.tsx` |
| Colors: white/gray/indigo | `SessionRoom.tsx`, `ClaimableItem.tsx`, `OcrReview.tsx` |
| Spacing scale | Existing component classes |
| Typography scale | Existing component classes |
| Button labels: "Finalize", "Split among everyone", "I'll cover the rest" | D-07 (CONTEXT.md — locked) |
| Modal forced-choice, no dismiss | D-07 (CONTEXT.md — locked) |
| Summary breakdown fields | D-08, D-09 (CONTEXT.md — locked) |
| Screen state machine pattern | `app/session/[id]/page.tsx` established pattern |
| Fixed bottom footer pattern | `SessionRoom.tsx` established pattern |
| Card pattern (rounded-2xl shadow) | `ShareScreen.tsx` established pattern |
| Summary label wording | Claude's discretion (CONTEXT.md) |
| Modal positioning: centered (not bottom sheet) | Claude's discretion (CONTEXT.md) |
| $0.00 edge case handling | Claude's discretion (CONTEXT.md) |
| Unclaimed split method: proportional by food subtotal | Claude's discretion (CONTEXT.md) |

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
