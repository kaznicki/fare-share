# Test Receipts — Phase 6 Live OCR Validation

This directory contains 3 real restaurant receipts used to validate the live GPT-4o Vision OCR pipeline. All images are committed to the repo (decision D-09) so Phase 6 validation is reproducible.

## Receipt Catalog

| File | Category | Source | Line Items | Notes |
|------|----------|--------|------------|-------|
| receipt-01-sitdown.jpg | Sit-down restaurant | Copy of repo-root receipt.jpg (Sidecar Bar & Grill, Toronto, 2011) | ~8 | GST line (not "TAX") — exercises abbreviation exclusion |
| receipt-02-bar.jpg | Bar / drinks-focused | ExpressExpense SRD (MIT) — 1143-receipt.jpg | 7 | Arthurs, Hoboken NJ — "Bar" section header; 3 of 7 items are named beers (Pint Boston Lager, 2 Pint Yuengling, Kona Longboard); food+liquor breakdown shows $24 liquor vs $56.80 food; highest beer proportion in sampled set |
| receipt-03-long.jpg | Long (10+ items) | ExpressExpense SRD (MIT) — 1029-receipt.jpg | 10 | Rincon Mexicano, Somerville MA — exactly 10 distinct food/drink line items: 2 Arroz, 2 Taco De Pescado, 2 Taco Tuesday Pollo, 1 Taco D Carne Asada, 1 Taco D Chorizo, 1 Taco Tuesday Pastor, 1 Horchata, 1 Taco Tuesday Pollo, 1 Taco D Cochinita, 1 Taco D Carnitas |

## Sources

- receipt-01: `receipt.jpg` committed at repo root by earlier phase (Phase 6 CONTEXT)
- receipt-02, receipt-03: Downloaded from ExpressExpense Sample Receipt Dataset
  - URL: https://expressexpense.com/large-receipt-image-dataset-SRD.zip
  - License: MIT
  - Accessed: 2026-04-12

## Acceptance Criteria (from Phase 6 CONTEXT decisions D-04, D-05, D-06)

A receipt **passes** when:
- (a) Every food or drink line item visible on the receipt appears in the OCR `items` array (D-04)
- (b) No junk lines appear in `items`: no grand total, no subtotal, no tax line, no tip/gratuity line, no discounts, no comps, no currency-symbol-only entries (D-06)

Prices can be slightly off — price accuracy is not a pass/fail criterion (D-05). The correction-first workflow lets the host fix individual item prices.

## Deviation Notes

- **receipt-02-bar.jpg (1143-receipt.jpg):** The ExpressExpense SRD is heavily biased toward fast-food and mixed sit-down restaurants. No purely drinks-only receipt with multiple named beverages was found across 70+ sampled images. Arthurs (1143) was selected as the highest proportion of bar/drink items observed: 3 named beer line items (Pint Boston Lager, 2 Pint Yuengling, Kona Longboard) making up 3 of 7 total items. The receipt explicitly labels a "Bar" section and shows liquor subtotal $24 out of $80.78 food+liquor. This exercises OCR on beer/drink item names.
- **receipt-03-long.jpg (1029-receipt.jpg):** Exactly 10 line items — meets the D-08 threshold of "10+ items." Selected from Rincon Mexicano (Somerville, MA) — a taco/Mexican restaurant with clearly named items and quantity notation (e.g., "2 Taco De Pescado").

## Test Log (filled by Plan 02)

| Receipt | Round | Pass/Fail | Failure Mode (if any) | Prompt Patch (if any) |
|---------|-------|-----------|-----------------------|-----------------------|
| receipt-01-sitdown.jpg | 1 | | | |
| receipt-02-bar.jpg | 1 | | | |
| receipt-03-long.jpg | 1 | | | |
