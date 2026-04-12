# Phase 6: Live OCR - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 06-live-ocr
**Areas discussed:** Prompt Tuning Strategy, Accuracy Acceptance Bar, Test Receipt Sourcing

---

## Prompt Tuning Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Iterate until 3 receipts pass | Run receipt → inspect → tune → repeat until all test receipts pass acceptance bar | ✓ |
| One tuning pass, then ship | Review first receipt, make one improvement, validate and accept result | |
| Only tune if needed | Run all 3 first; only tune if clear systematic failure | |

**User's choice:** Iterate until 3 receipts pass

---

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt text only | Edit OCR_PROMPT string only; schema, validation, and conversion untouched | ✓ |
| Prompt + JSON schema shape | Also adjust ReceiptSchema if real receipts surface schema gaps | |
| Anything in lib/ocr.ts | Open scope — prompt, schema, post-processing all eligible | |

**User's choice:** Prompt text only

---

## Accuracy Acceptance Bar

| Option | Description | Selected |
|--------|-------------|----------|
| All real items present, no junk lines | Every food/drink item appears; total/tax/tip/discount lines excluded; prices can be off | ✓ |
| Items present + prices within 5% | Every item AND each price within 5% of actual — higher bar | |
| Most items present (2/3+ correct) | Majority of items extracted; few misses acceptable | |

**User's choice:** All real items present, no junk lines

---

| Junk line type | Should be excluded | Selected |
|---------------|-------------------|----------|
| Grand total / subtotal | "Total: $45.00" not an item | ✓ |
| Tax line | "Tax: $3.60" not an item | ✓ |
| Tip / gratuity | "Tip: 18%" not an item | ✓ |
| Discounts / comps | "-$5.00 discount" not an item | ✓ |

**User's choice:** All four junk line types must be excluded

---

## Test Receipt Sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| User supplies during Phase 6 | Planner writes placeholder tasks; user photographs and uploads during execution | |
| Use only receipt.jpg | Reduce to 1 receipt if it passes — faster but weaker validation | |
| Find sample receipt images online | Researcher finds publicly available samples — no manual effort | ✓ |

**User's choice:** Find sample receipt images online

---

| Variety type | Description | Selected |
|-------------|-------------|----------|
| Sit-down restaurant | Full-service with starters, mains, drinks, tax, tip line | ✓ |
| Fast food / counter service | Shorter receipt, combos, different naming | |
| Bar / drinks only | Mostly drinks, possibly no tax line | ✓ |
| Long receipt (10+ items) | Validates extraction on longer receipts | ✓ |

**User's choice:** Sit-down restaurant, bar/drinks only, long receipt (10+ items)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, commit them | Save to test-receipts/ folder, commit — reproducible | ✓ |
| No, just document sources | Find URLs, download locally without committing | |

**User's choice:** Commit test receipt images to repo

---
