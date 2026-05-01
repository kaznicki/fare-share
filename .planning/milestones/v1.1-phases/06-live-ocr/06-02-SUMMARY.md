---
phase: 06-live-ocr
plan: 02
type: summary
status: complete
completed: 2026-04-29
requirements_satisfied:
  - OCR-06
  - OCR-07
---

# Plan 06-02 Summary: Live OCR Validation — All 3 Receipts

## What Was Done

Ran all 3 test receipts through the live GPT-4o Vision OCR pipeline via `POST /api/ocr`, evaluated each against D-04 (all items present) and D-06 (no junk lines), and recorded results in `test-receipts/README.md`.

## Tuning Rounds

**2 rounds. Pitfall 3 patch applied after round 1.**

Round 1 all passed D-04/D-06, but human review identified a qty under-extraction on receipt-03 ("2 Taco Tuesday Pollo" extracted as qty=1 price=$2.00 instead of qty=2 price=$1.00). Pitfall 3 patch applied to `OCR_PROMPT`. Round 2 result was identical — GPT-4o at temperature=0 is deterministic and did not change its extraction. Accepted per D-05 (qty inaccuracy correctable via the correction-first UI).

## Results per Receipt

| Receipt | Round | Result | Notes |
|---------|-------|--------|-------|
| receipt-01-sitdown.jpg | 1 | **PASS** | 8/8 items extracted (Oysters, Smelts, Duck Terrine, Pork Dessert≈Pate, AG Malbec≈4G Malbec, Soup, Tagliatelle, DBS Bronte≈D&B Brownie). No junk lines. |
| receipt-02-bar.jpg | 1 | **PASS** | 7/7 items extracted including all 3 named beers. "2 Pint Yuengling" correctly extracted as qty=2. No auto-grat leakage. |
| receipt-03-long.jpg | 1 | **PASS** | 10/10 items extracted. Arroz qty=2 and Taco De Pescado qty=2 correct. "2 Taco Tuesday Pollo" extracted as qty=1 (qty note, not a D-04/D-06 fail). |
| receipt-03-long.jpg | 2 | **PASS** | Pitfall 3 patch applied; deterministic model returned same result. Qty=1 for "Taco Tuesday Pollo" persists — accepted per D-05. |

## OCR_PROMPT Diff

Pitfall 3 patch applied. Changed one rule:

```diff
- - qty defaults to 1 if not shown on receipt
+ - qty: if the receipt shows a quantity column, "2x ITEM", "ITEM x2", or "2 @ $7.00", extract that quantity and set price to the unit price (not the extended line total); if no quantity is shown, default qty to 1
```

## Failure Modes Observed

- **receipt-03 qty under-extraction (accepted per D-05):** "2 Taco Tuesday Pollo $2.00" extracted as qty=1 price=$2.00 instead of qty=2 price=$1.00. GPT-4o appears to rationalize $2.00 as a plausible unit taco price, treating the line as a single item at the extended total. The Pitfall 3 prompt patch did not override this at temperature=0. The item is present (D-04 satisfied); the host would correct qty 1→2 in the correction-first UI.
- No junk-line failures observed on any receipt (D-06 satisfied for all 3).

## Notable Observations

- Receipt 01: Item names are approximate (e.g., "DBS Bronte" for "D&B Brownie"). Per D-05, not a fail — correction-first workflow handles it.
- Receipt 02: Multi-quantity beer ("2 Pint Yuengling") correctly extracted as qty=2 in both rounds — the model handled this quantity notation natively even before the Pitfall 3 patch.
- Receipt 03: The Pitfall 3 patch is retained in OCR_PROMPT as correct guidance for future receipts, even though it did not change the deterministic result for this specific image.

## Verification

- `lib/ocr.ts` OCR_PROMPT: Pitfall 3 patch applied (one rule line changed)
- `lib/ocr.ts` ReceiptSchema, dollar→cent conversion, function signatures: unchanged
- `npx vitest run lib/`: 26/26 tests pass
- `test-receipts/README.md`: Test Log updated with round 2 row and revised Final status
- Commits: eb026ed (round 1), pending (round 2 + patch)

## Requirements Satisfied

- **OCR-06:** 3 distinct real restaurant receipts (sit-down, bar, long) validated through live GPT-4o Vision OCR pipeline; all produce item lists accurate enough for the correction-first workflow.
- **OCR-07:** Grand totals, tax lines, tip/gratuity, and service charges are excluded from the `items` array across all 3 tested receipt types; actual ordered food/drink items are included.

Combined with OCR-05 from Plan 01, all Phase 6 requirements are satisfied.

## Readiness for Phase 7

Phase 6 is complete. Live OCR is validated on 3 real receipts. Ready to move to Phase 7: UX & Display Fixes (DISP-01, UX-01, UX-02).
