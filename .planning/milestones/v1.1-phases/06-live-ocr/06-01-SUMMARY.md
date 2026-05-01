---
phase: 06-live-ocr
plan: 01
status: complete
completed: 2026-04-14
requirements_satisfied:
  - OCR-05
---

# Plan 06-01 Summary — Test Set + Live Mode Setup

## What Was Done

**Task 1 — Source and commit 3-receipt test set (commit a57da63)**

Assembled `test-receipts/` at repo root with 3 real restaurant receipt images covering the required categories:

| File | Category | Source | Notes |
|------|----------|--------|-------|
| receipt-01-sitdown.jpg | Sit-down restaurant | Copy of repo-root receipt.jpg | Sidecar Bar & Grill, Toronto; ~8 items; GST line |
| receipt-02-bar.jpg | Bar / drinks-focused | ExpressExpense SRD — 1143-receipt.jpg | Arthurs, Hoboken NJ; 3 named beers out of 7 items; explicit "Bar" section header |
| receipt-03-long.jpg | Long (10+ items) | ExpressExpense SRD — 1029-receipt.jpg | Rincon Mexicano, Somerville MA; exactly 10 food/drink items with quantity notation |

Also wrote `test-receipts/README.md` with catalog, sources, license attribution, acceptance criteria (D-04, D-06), and empty Test Log table for Plan 02.

Pre-flipped `.env.local`: set `USE_OCR_MOCK=false` (API key placeholder left for human substitution).

Worktree merged into master and cleaned up.

**Task 2 — User inserts real OPENAI_API_KEY (human-action gate)**

User replaced `OPENAI_API_KEY=sk-replace-with-real-key` with a real OpenAI key in `.env.local`.

First attempt returned `429 insufficient_quota` — the account had no billing credits. User added billing credits via platform.openai.com.

Second attempt succeeded. Live OCR returned real Sidecar Bar & Grill items on OcrReview (Oysters, Smelts, Duck Terrine, etc.) — not the mock fixture. A couple of minor extraction errors were corrected in-app via the correction-first flow, confirming the workflow handles imperfect OCR gracefully.

**OCR-05 satisfied.** Live GPT-4o Vision path is reachable and smoke-tested end-to-end.

## Deviations from D-08

- receipt-02-bar.jpg (Arthurs, Hoboken NJ): The ExpressExpense SRD is heavily biased toward fast food. No purely drinks-only receipt was found in 70+ sampled images. Arthurs was the best available match: 3/7 items are named beers with an explicit "Bar" section header. This deviation is documented in `test-receipts/README.md`.

## Ready State for Plan 02

- `.env.local`: real OPENAI_API_KEY ✓ | `USE_OCR_MOCK=false` ✓
- `test-receipts/`: 3 committed receipt images ✓
- `test-receipts/README.md`: catalog + empty Test Log table ✓
- Live smoke test on receipt-01 passed ✓
- All 3 receipts ready to be run through live OCR in Plan 02

## Requirements Satisfied

- **OCR-05**: Live GPT-4o Vision path is reachable from the app UI. Receipt-01 processed end-to-end with real items returned.
