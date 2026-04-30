---
phase: 08-visual-polish
reviewed: 2026-04-30T19:30:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - app/globals.css
  - components/host/OcrReview.tsx
  - components/session/SummaryScreen.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-04-30T19:30:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed for the Visual Polish phase (Phase 8), which applied four surgical CSS/class-string fixes: removing an Arial font override, unifying the OcrReview heading, adding card shadows to SummaryScreen and OcrReview footer.

The four primary fixes are correctly implemented. However, the outer-wrapper approach used for Fix 4 (OcrReview footer) introduces a layout interaction problem with the `sticky bottom-0` class inside `TaxTipFields`. Additionally, the inner footer div's `bg-white` background does not respect the outer wrapper's rounded corners, creating a visual seam. Two spec documents (UI-SPEC.md vs the PLAN) give contradictory instructions for Fix 4; the correct one was followed, but the contradiction is worth flagging for future maintainers.

---

## Warnings

### WR-01: TaxTipFields `sticky bottom-0` has no scrollable ancestor — sticky is silently inert

**File:** `components/host/OcrReview.tsx:94` (also `components/host/TaxTipFields.tsx:16`)

**Issue:** `TaxTipFields` renders with `className="sticky bottom-0 bg-white border-t p-4"` on its root div. CSS `sticky` requires a scrollable ancestor to take effect. In OcrReview's DOM structure the scroll container is `<div className="flex-1 overflow-y-auto">` (line 70), which is a **sibling** of the new outer footer wrapper — not an ancestor. The outer footer wrapper `<div className="bg-white rounded-2xl shadow-md">` (line 94) is a static flex child and is not scrollable. Therefore `sticky bottom-0` has no ancestor to stick within and is effectively dead CSS. The footer does not scroll away (because the outer wrapper is a flex child outside the scroll region), so the symptom is invisible in normal use — but the `sticky` intent is not being honoured and any future restructuring that puts the wrapper inside the scroll container would cause the footer to vanish at the bottom during scroll rather than stick.

**Fix:** Remove `sticky bottom-0` from `TaxTipFields`'s root div class (it is already visually outside the scroll area due to the flex-column layout, so `sticky` serves no purpose in either the old or new structure):

```tsx
// components/host/TaxTipFields.tsx line 16 — before
<div className="sticky bottom-0 bg-white border-t p-4">

// after
<div className="bg-white border-t p-4">
```

### WR-02: Inner footer div `bg-white` punches through the outer wrapper's rounded corners

**File:** `components/host/OcrReview.tsx:104`

**Issue:** The outer wrapper `<div className="bg-white rounded-2xl shadow-md">` (line 94) establishes rounded corners with `rounded-2xl` (12px radius). The immediate child `<div className="px-4 pb-4 pt-2 bg-white">` (line 104) has a white background that extends to the full width/height of the outer wrapper. Because the outer div does not have `overflow-hidden`, the inner div's background rectangle extends into the corner regions, creating a visual seam where the rounded corners are. The card's bottom-left and bottom-right corners will render as square white, not rounded.

**Fix:** Add `overflow-hidden` to the outer wrapper so the inner div's background is clipped to the rounded boundary:

```tsx
// line 94 — before
<div className="bg-white rounded-2xl shadow-md">

// after
<div className="bg-white rounded-2xl shadow-md overflow-hidden">
```

### WR-03: `grandTotal` computed unconditionally but used only in the host branch

**File:** `components/session/SummaryScreen.tsx:17`

**Issue:** Line 17 runs `bill.participants.reduce(...)` on every render for every user, but `grandTotal` is only referenced inside `{isHost && ...}` (line 69). For non-host participants this computation is always wasted. This is a minor quality concern in itself, but the real risk is that if `bill.participants` is ever undefined or null (e.g., due to a malformed WebSocket snapshot), this line throws before the component can render a graceful fallback, crashing the entire screen. There is no guard.

**Fix:** Move the computation inside the host branch, or add a guard:

```tsx
// Option A: guard (minimal change, defensive)
const grandTotal = isHost
  ? bill.participants.reduce((s, p) => s + p.totalCents, 0)
  : 0

// Option B: inline at point of use inside the isHost block
{isHost && (() => {
  const grandTotal = bill.participants.reduce((s, p) => s + p.totalCents, 0)
  return ( ... )
})()}
```

Option A is simpler and preferred.

---

## Info

### IN-01: UI-SPEC.md and PLAN give contradictory Fix 4 instructions

**File:** `.planning/phases/08-visual-polish/08-UI-SPEC.md:162-173` vs `.planning/phases/08-visual-polish/08-01-PLAN.md:162-213`

**Issue:** The UI-SPEC.md describes Fix 4 as modifying the existing inner div (adding `rounded-2xl shadow-md` to `px-4 pb-4 pt-2 bg-white`). The PLAN describes Fix 4 as adding a new outer wrapper div enclosing both `TaxTipFields` and the inner div. The two approaches produce different DOM structures. The PLAN's approach (outer wrapper) is architecturally correct — it wraps TaxTipFields into the card region, which the inner-div-only approach does not. The implementation follows the PLAN. The 08-01-SUMMARY.md acknowledges the discrepancy. No corrective action is needed in source code, but the spec document is misleading for future maintainers.

**Fix:** Update `08-UI-SPEC.md` Fix 4 section to match the implemented approach (outer wrapper) so the spec documents are consistent.

### IN-02: `SummaryScreen` zero-total display is incorrect when `unclaimedHandling='split'` all-zeros fallback distributes tax/tip equally

**File:** `components/session/SummaryScreen.tsx:25`

**Issue:** The condition `myBill && myBill.subtotalCents > 0` (line 25) routes to the zero-display branch when a participant has no food subtotal. However, when `unclaimedHandling='split'` and all participants have a zero subtotal (no items claimed by anyone), `distributeProportionally` uses the equal-split fallback, which assigns each participant a non-zero `totalCents` (their tax and tip share). In this edge case `myBill.subtotalCents === 0` but `myBill.totalCents > 0`, so the component displays "$0.00 / $0.00 / $0.00 — Total owed $0.00" while the participant actually owes a non-zero amount. This is a pre-existing bug not introduced in Phase 8, but the Phase 8 changes are in this file and a reviewer should flag it.

**Fix:** Change the condition to also check `myBill.totalCents`:

```tsx
// line 25 — before
{myBill && myBill.subtotalCents > 0 ? (

// after
{myBill && myBill.totalCents > 0 ? (
```

This routes to the itemized display whenever the participant owes anything, regardless of whether the owed amount came from food, tax, or tip.

---

_Reviewed: 2026-04-30T19:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
