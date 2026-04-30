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
| receipt-01-sitdown.jpg | 1 | PASS | — | — |
| receipt-02-bar.jpg | 1 | PASS | — | — |
| receipt-03-long.jpg | 1 | PASS | qty note: "2 Taco Tuesday Pollo" (line 3 on receipt) extracted as qty=1 price=$2.00 instead of qty=2 price=$1.00 — item present per D-04 | — |
| receipt-03-long.jpg | 2 | PASS | Pitfall 3 patch applied; GPT-4o at temperature=0 returned identical result — qty=1 persists. Accepted per D-05: item is present; host corrects qty in the correction-first UI before splitting. | Added multi-quantity extraction instruction to OCR_PROMPT (Pitfall 3) |

**Final status:** All 3 receipts PASS. Pitfall 3 patch applied to OCR_PROMPT after observing qty under-extraction on the "2 Taco Tuesday Pollo" line; the model returned the same result at temperature=0 (deterministic). Qty inaccuracy accepted per D-05 — the correction-first workflow handles it. OCR_PROMPT now includes the multi-quantity instruction for future receipts.

## Round 1 Raw Results

### receipt-01-sitdown.jpg (Sidecar Bar & Grill, Toronto)

```json
{
  "items": [
    { "name": "Oysters",      "priceCents": 600,  "qty": 1 },
    { "name": "Smelts",       "priceCents": 1200, "qty": 1 },
    { "name": "Duck Terrine", "priceCents": 1400, "qty": 1 },
    { "name": "Pork Dessert", "priceCents": 1200, "qty": 1 },
    { "name": "AG Malbec",    "priceCents": 2500, "qty": 1 },
    { "name": "Soup",         "priceCents": 800,  "qty": 1 },
    { "name": "Tagliatelle",  "priceCents": 2000, "qty": 1 },
    { "name": "DBS Bronte",   "priceCents": 300,  "qty": 1 }
  ],
  "taxCents": 1170,
  "tipCents": 0
}
```

D-04: 8/8 visible items extracted (names approximate but recognizable). D-06: no junk lines. **PASS**

### receipt-02-bar.jpg (Arthurs, Hoboken NJ)

```json
{
  "items": [
    { "name": "Arthur's Burger *ChsBleu", "priceCents": 1395, "qty": 1 },
    { "name": "Our Burger **Avocado",     "priceCents": 1595, "qty": 1 },
    { "name": "Loaded Nachos",            "priceCents": 1295, "qty": 1 },
    { "name": "Pint Boston Lager",        "priceCents": 600,  "qty": 1 },
    { "name": "Pint Yeungling",           "priceCents": 1200, "qty": 2 },
    { "name": "Kona Longboard",           "priceCents": 600,  "qty": 1 },
    { "name": "Quesadilla",               "priceCents": 1395, "qty": 1 }
  ],
  "taxCents": 398,
  "tipCents": 0
}
```

D-04: 7/7 items extracted including all 3 named beers; "2 Pint Yeungling" correctly extracted as qty=2. D-06: no auto-grat, no service charge, no tax/total leakage. **PASS**

### receipt-03-long.jpg (Rincon Mexicano, Somerville MA)

```json
{
  "items": [
    { "name": "Arroz",              "priceCents": 300, "qty": 2 },
    { "name": "Taco De Pescado",    "priceCents": 700, "qty": 2 },
    { "name": "Taco Tuesday Pollo", "priceCents": 200, "qty": 1 },
    { "name": "Taco D Carne Asada", "priceCents": 299, "qty": 1 },
    { "name": "Taco D Chorizo",     "priceCents": 299, "qty": 1 },
    { "name": "Taco Tuesday Pastor","priceCents": 100, "qty": 1 },
    { "name": "Horchata",           "priceCents": 299, "qty": 1 },
    { "name": "Taco Tuesday Pollo", "priceCents": 100, "qty": 1 },
    { "name": "Taco D Cochinita",   "priceCents": 299, "qty": 1 },
    { "name": "Taco D Carnitas",    "priceCents": 299, "qty": 1 }
  ],
  "taxCents": 203,
  "tipCents": 0
}
```

D-04: 10/10 items extracted including quantity notation (Arroz qty=2, Taco De Pescado qty=2). D-06: no junk lines. **PASS**
