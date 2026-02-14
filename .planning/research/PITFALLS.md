# Pitfalls Research: Receipt-Scanning Bill Splitter

**Research Date:** 2026-02-14
**Project:** SplitCheck
**Milestone:** Greenfield - Common mistakes and gotchas

## Executive Summary

Bill-splitting apps with OCR face three categories of failure: math errors that destroy trust, OCR reliability that determines usability, and mobile UX friction that causes abandonment. The most critical pitfall is rounding — if person totals don't add up to the bill total, users will never trust the app again.

---

## Critical Pitfalls

### 1. Rounding Errors — The Trust Killer
**Severity:** CRITICAL
**Phase:** Calculation Engine (Phase 3)

**The problem:** When splitting $100 three ways, each person's share is $33.333... You round to $33.33 each, but 3 x $33.33 = $99.99 — you're a penny short. Multiply this across items, tax, and tip, and errors compound.

**Warning signs:**
- Sum of person totals != bill total
- Off-by-one-cent errors that users notice immediately
- Different rounding results on different devices/browsers

**Prevention strategy:**
- Use integer math (cents, not dollars) throughout all calculations
- Apply rounding at the END, not at each step
- Use "largest remainder" method: give extra pennies to people with the largest fractional remainders
- Never use `toFixed(2)` for intermediate calculations
- Always verify: `sum(personTotals) === billTotal`

**Test cases:**
- $100 split 3 ways → $33.34 + $33.33 + $33.33
- $10 split 7 ways
- Shared item: $15.99 split 4 ways
- Single penny item split 2 ways

---

### 2. OCR Accuracy on Real-World Receipts
**Severity:** HIGH
**Phase:** OCR + Receipt Parser (Phase 1-2)

**The problem:** Receipts in the real world are crumpled, blurry, partially obscured, printed on thermal paper that fades, have inconsistent formats, use abbreviations, and have varying fonts. Tesseract.js accuracy drops dramatically with poor input.

**Warning signs:**
- OCR confidence below 70% on typical restaurant receipts
- Users spending more time fixing OCR errors than manual entry would take
- Misread prices ($12.99 read as $1299 or $12.09)

**Prevention strategy:**
- Image preprocessing is critical: auto-crop, deskew, contrast enhancement, binarization
- Price validation: flag items with unusual prices (> $200 or < $0.50)
- Show confidence indicators per item so users know what to double-check
- Make the review/edit step fast and easy (not buried in a menu)
- Track common OCR mistakes and build correction heuristics
- Always offer manual entry as equal-quality alternative

**Real receipt patterns to handle:**
- "BURG" = Burger (abbreviations)
- "2 MARG 18.00" = 2 margaritas at $9 each
- Tax line labeled "TX", "TAX", "HST", "GST", "VAT"
- Gratuity labeled "GRAT", "SVC", "SERVICE", "TIP INCLUDED"
- Total line labeled "TOT", "TOTAL", "BAL DUE", "AMOUNT DUE"

---

### 3. Multi-Quantity Item Parsing
**Severity:** HIGH
**Phase:** Receipt Parser (Phase 2)

**The problem:** Receipts represent quantities in wildly different ways, and misinterpreting them corrupts the entire split.

**Warning signs:**
- "2 Burger $30" parsed as one item at $30 instead of two at $15
- "Burger x2" not recognized as multi-quantity
- Price per unit vs total price confusion

**Quantity formats in the wild:**
- `2 Burger 30.00` (quantity first)
- `Burger x2 30.00` (quantity after name)
- `Burger 15.00` appearing twice (separate lines)
- `Burger (2) 30.00` (parenthetical)
- `Burger @15.00 x2 30.00` (unit price + quantity + total)
- `2x Burger 30.00`
- `Burger QTY:2 30.00`

**Prevention strategy:**
- Parse for all known quantity patterns
- When quantity detected, calculate unit price: total / quantity
- Show expanded items in review: "Burger (1 of 2) - $15.00" for each
- Let user manually split/merge items if parser gets it wrong
- Default to quantity 1 if uncertain (safer to under-split than over-split)

---

### 4. Shared Item UX Confusion
**Severity:** MEDIUM
**Phase:** Item Assignment (Phase 2)

**The problem:** Users don't know how to indicate shared items, or the UI makes it cumbersome. If sharing items is hard, people fall back to "just split everything equally" — which defeats the purpose.

**Warning signs:**
- Users can't figure out how to assign one item to multiple people
- Too many taps to share an item
- Confusion about whether "shared" means split equally or some other way

**Prevention strategy:**
- Two clear paths: tap one person (solo) or tap multiple (shared)
- "Everyone" button for items the whole table shared
- Visual feedback: item card shows faces/initials of everyone assigned
- Default assumption: shared items split equally (no custom percentages in v1)
- Unassigned items highlighted prominently before moving to calculation

---

### 5. Tax Line Misidentification
**Severity:** MEDIUM
**Phase:** Receipt Parser (Phase 1-2)

**The problem:** OCR might read the tax line as a regular item, adding "TAX" as a $4.50 menu item. Or it might miss the tax entirely, forcing manual entry.

**Warning signs:**
- "TAX" appearing in the item list
- Tax amount seems too high or too low for the subtotal
- Subtotal + tax != total on receipt

**Prevention strategy:**
- Known keywords list: TAX, SALES TAX, HST, GST, VAT, TX
- Position heuristic: tax usually appears after last item, before total
- Validation: tax should be 0-15% of subtotal (flag outliers)
- Auto-exclude tax/subtotal/total lines from item list
- Let user manually identify tax if parser misses it

---

### 6. Mobile Camera/Image Issues
**Severity:** MEDIUM
**Phase:** Camera Capture (Phase 1)

**The problem:** Phone cameras in dim restaurants produce blurry, poorly-lit photos. Users take photos at angles. Flash creates glare on glossy receipt paper.

**Warning signs:**
- OCR accuracy drops sharply in restaurant lighting conditions
- Users retaking photos multiple times
- Glare/shadow covering parts of the receipt

**Prevention strategy:**
- Preprocessing pipeline: auto-brightness, contrast enhancement, noise reduction
- Guide overlay in camera view: "align receipt within frame"
- Accept gallery photos (not just live camera) for retakes
- Show OCR results immediately so users can retake if quality is poor
- Consider flash guidance: "try without flash" if glare detected

---

### 7. State Loss / Accidental Navigation
**Severity:** MEDIUM
**Phase:** UX Polish (Phase 5)

**The problem:** User is halfway through assigning items, accidentally swipes back or closes the browser tab. All progress is lost. At a restaurant, this is infuriating.

**Warning signs:**
- Users losing work and having to start over
- Browser back button destroying state
- Accidental tab close with no recovery

**Prevention strategy:**
- Persist state to localStorage at every step
- Warn before navigation away ("You have unsaved work")
- Support resume: if user reopens app, offer to continue previous split
- Single-page flow (no route changes that could trigger back-button issues)

---

### 8. Tip Calculation Edge Cases
**Severity:** LOW
**Phase:** Calculation Engine (Phase 3)

**The problem:** Tip calculation seems simple but has subtle edge cases.

**Edge cases:**
- Tip on pre-tax vs post-tax amount (convention varies by region)
- "Gratuity already included" — is it included in each item price, or as a separate line?
- Flat tip: should it be split equally or proportional to what each person ordered?
- Zero-dollar person (someone who only had shared water) — what's their tip share?

**Prevention strategy:**
- Default: tip calculated on pre-tax subtotal (most common convention)
- "Already included" mode: simply skip tip calculation, total is the total
- Flat tip: split proportionally to subtotal (consistent with percentage mode)
- Minimum person total: if someone's subtotal is $0, their tip/tax share is $0 too
- Show tip calculation breakdown so users can verify

---

## Pitfall Priority Matrix

| Pitfall | Severity | Likelihood | Phase | Effort to Prevent |
|---------|----------|------------|-------|-------------------|
| Rounding errors | CRITICAL | HIGH | 3 | Medium — integer math + largest remainder |
| OCR accuracy | HIGH | HIGH | 1-2 | High — preprocessing + fallback |
| Multi-quantity parsing | HIGH | HIGH | 2 | Medium — pattern matching + manual override |
| Shared item UX | MEDIUM | MEDIUM | 2 | Low — good UI design |
| Tax misidentification | MEDIUM | MEDIUM | 1-2 | Medium — keyword detection + validation |
| Camera/image issues | MEDIUM | HIGH | 1 | Medium — preprocessing pipeline |
| State loss | MEDIUM | MEDIUM | 5 | Low — localStorage persistence |
| Tip edge cases | LOW | LOW | 3 | Low — clear defaults + transparency |

---

## Key Takeaway

The #1 rule for a bill-splitting app: **the math must be perfect**. Users will forgive bad OCR (they can fix it). They will forgive clunky UI (they'll figure it out). They will NEVER forgive wrong math. If person totals don't add up to the bill, the app is broken and trust is destroyed permanently.

Use integer arithmetic. Verify sums. Test edge cases exhaustively.

---

*Research based on common failure patterns in financial calculation apps and OCR-based tools. Domain-specific to restaurant receipt scanning and bill splitting.*
