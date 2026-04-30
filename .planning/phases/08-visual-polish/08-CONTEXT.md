# Phase 8: Visual Polish - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

A targeted visual consistency pass across all 6 screens (capture, review, share, join, claiming, summary). Four specific inconsistencies are fixed: the two-accent-color split, the Arial body font override that prevents Geist Sans from rendering, the mismatched heading size on OcrReview, and missing card shadows on elevated surfaces.

No new features, no new flows, no spacing-token redesign. Fix the 4 inconsistencies and stop.

</domain>

<decisions>
## Implementation Decisions

### Color System
- **D-01:** Two accent colors are intentional. **Indigo-600** = financial moments (money-related text, session CTAs). **Blue-600** = action buttons (host-side actions, tip active state, JoinForm submit). This distinction is deliberate — don't unify to a single color.
- **D-02:** Application of the split rule:
  - Indigo: `SummaryScreen` "Total owed" text, ShareScreen "Join as host" link
  - Blue: CameraCapture buttons, OcrReview "Create Session" button, JoinForm "Join" button, TaxTipFields active tip preset (`bg-blue-600`)
- **D-03:** "Join as host" on ShareScreen stays indigo — it is a session-entry moment, not a utility action.
- **D-04:** Audit every component for stray colors that don't follow the split and correct them. Do not introduce any third accent color.

### Typography & Font
- **D-05:** Remove the `body { font-family: Arial, Helvetica, sans-serif }` override in `app/globals.css`. Geist Sans is already wired via `next/font` in `layout.tsx` and the `@theme` block — removing the body override activates it.
- **D-06:** Unify all page headings to `text-2xl font-bold`. `OcrReview` currently uses `text-xl font-semibold` — bump it to match every other screen.

### Card & Surface Treatment
- **D-07:** All white card containers get `shadow-md`. `SummaryScreen`'s personal breakdown card (`bg-white border border-gray-200 rounded-2xl p-6`) gets `shadow-md` added. Any other border-only white card containers get the same treatment.
- **D-08:** `OcrReview` sticky footer area (the `TaxTipFields` + "Your name" input + "Create Session" button block) gets a `bg-white rounded-2xl shadow-md` wrapper. The scrolling item list above it stays flat — only the fixed footer gets the card treatment.

### Polish Scope
- **D-09:** Fix only the 4 inconsistencies above (color split, Arial override, heading size, card shadows). All other spacing, padding, and gap values stay as-is. No new utility classes, no design tokens.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Files to modify
- `app/globals.css` — remove `body { font-family: Arial... }` override (D-05)
- `components/host/OcrReview.tsx` — heading size (D-06) + footer card wrapper (D-08)
- `components/session/SummaryScreen.tsx` — add `shadow-md` to personal breakdown card (D-07)

### Reference-only (color system audit — read to verify the split rule is already correct or needs a fix)
- `components/host/CameraCapture.tsx` — blue-600 buttons (correct per D-02)
- `components/host/TaxTipFields.tsx` — blue-600 active tip preset (correct per D-02)
- `components/host/ShareScreen.tsx` — indigo-600 "Join as host" link (correct per D-03)
- `components/session/JoinForm.tsx` — blue-600 submit button, shadow-md card (correct per D-02, D-07)
- `components/session/ClaimableItem.tsx` — green/blue/gray claim state colors; these are semantic, not accent — do not touch

### Requirements
- `.planning/REQUIREMENTS.md` §VIS-01 — the one requirement this phase must satisfy

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bg-white rounded-2xl shadow-md` — already used in JoinForm and ShareScreen QR card; use this exact combination as the card pattern for D-07 and D-08
- `text-2xl font-bold` — heading pattern from CameraCapture, ShareScreen, JoinForm, SummaryScreen — the standard to unify to

### Established Patterns
- `next/font` Geist Sans is already wired in `app/layout.tsx` with CSS variable `--font-geist-sans`; removing the Arial body override is the only change needed to activate it
- Integer cents and LRM rounding are not touched by this phase

### Integration Points
- `app/globals.css` → remove Arial body rule; `--font-sans` CSS variable already defined in `@theme` block handles the rest
- `OcrReview.tsx` → the sticky footer block (`<div className="px-4 pb-4 pt-2 bg-white">`) is the insertion point for the card wrapper; wrap the `<TaxTipFields>` call and the button+input block together inside a new `rounded-2xl shadow-md` div
- `SummaryScreen.tsx` → personal breakdown card at line 24 (`<div className="bg-white border border-gray-200 rounded-2xl p-6">`) needs `shadow-md` added to its className

</code_context>

<specifics>
## Specific Ideas

- Card wrapper pattern: `bg-white rounded-2xl shadow-md` (matches existing JoinForm card exactly)
- Heading pattern: `text-2xl font-bold` (matches CameraCapture, ShareScreen, JoinForm, SummaryScreen)
- Color split written as a rule: indigo = money/session-entry, blue = action buttons

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-visual-polish*
*Context gathered: 2026-04-30*
