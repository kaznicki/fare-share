# Phase 6: Live OCR - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire a real `OPENAI_API_KEY` in `.env.local`, disable mock mode (`USE_OCR_MOCK=false`), and validate that the existing GPT-4o Vision OCR pipeline produces acceptable output on real restaurant receipts. Tune the `OCR_PROMPT` string only if needed — no schema rewrites or post-processing logic.

This phase does NOT include UI changes, display improvements, or UX fixes — those are Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Prompt Tuning Strategy

- **D-01:** Iterate the prompt until all 3 test receipts pass the acceptance bar. Not a one-shot pass — if a receipt fails, tune the prompt and re-test until it passes.
- **D-02:** Tuning scope is limited to the `OCR_PROMPT` string in `lib/ocr.ts:37`. The `ReceiptSchema` (Zod), `ReceiptItemSchema`, dollar→cent conversion logic, and response handling are not in scope to change.
- **D-03:** If the existing prompt already produces acceptable output on all 3 receipts, ship it unchanged. Tuning only happens if there's a concrete failure.

### Accuracy Acceptance Bar

- **D-04:** A test receipt **passes** when: (a) every food/drink item on the receipt appears in the `items` array, and (b) no junk lines appear in the `items` array.
- **D-05:** Prices can be slightly off — the correction-first workflow allows the host to fix individual items. Price accuracy is NOT a pass/fail criterion.
- **D-06:** Junk lines that must NOT appear in `items`: grand total, subtotal, tax line, tip/gratuity line, discounts, and comps. These belong in the top-level `tax`/`tip` fields or should be omitted entirely.

### Test Receipt Sourcing

- **D-07:** The researcher will find 2+ publicly available receipt image samples online and commit them to a `test-receipts/` folder in the repo root alongside the existing `receipt.jpg`.
- **D-08:** Target variety: sit-down restaurant (full-service with starters/mains/drinks), bar/drinks-only receipt, and a long receipt (10+ items). The existing `receipt.jpg` may cover one of these.
- **D-09:** All test receipts are committed to the repo so validation is reproducible — anyone can re-run the test set.

### Claude's Discretion

- Number of prompt revision rounds: no cap — iterate until all 3 receipts pass or diminishing returns are clear.
- Whether to add inline comments explaining what a prompt change fixed: Claude can decide.
- How to document the test results (inline comments, a test-receipts/README, or both): Claude can decide.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core OCR Implementation
- `lib/ocr.ts` — OCR function, current prompt (`OCR_PROMPT`), mock mode toggle, Zod schema, dollar→cent conversion
- `app/api/ocr/route.ts` — Route handler, accepted MIME types, max file size (10MB)

### Requirements
- `.planning/REQUIREMENTS.md` §OCR-05, OCR-06, OCR-07 — the three requirements this phase must satisfy

### Test Assets
- `receipt.jpg` — existing receipt image in repo root (may serve as test receipt #1)

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/ocr.ts:73` `extractReceiptItems(imageBuffer, mimeType)` — the function to test; no changes expected to its signature
- `lib/ocr.ts:37` `OCR_PROMPT` — the string to tune if needed
- `lib/ocr.ts:78` Mock mode gate — flip `USE_OCR_MOCK` to `false` in `.env.local` to enable live OCR
- `app/api/ocr/route.ts` — handles multipart upload, validates MIME type and size, calls `extractReceiptItems`

### Established Patterns
- `OPENAI_API_KEY` is read lazily at first call via `getOpenAI()` in `lib/ocr.ts:14` — no module-level initialization issues
- `temperature: 0` and `response_format: { type: 'json_object' }` are already set — deterministic extraction
- `detail: 'high'` is set for the image — optimized for small receipt text

### Integration Points
- `.env.local` — two env vars need updating: `OPENAI_API_KEY` (replace placeholder) and `USE_OCR_MOCK=false`
- No other files need changes to enable live mode

</code_context>

<specifics>
## Specific Ideas

- The 3-receipt test set should cover: sit-down restaurant, bar/drinks-only, long receipt (10+ items)
- Researcher should source public/sample receipt images — not user-photographed
- All test images go in `test-receipts/` at the repo root and are committed

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-live-ocr*
*Context gathered: 2026-04-11*
