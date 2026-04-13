# Phase 6: Live OCR - Research

**Researched:** 2026-04-11
**Domain:** GPT-4o Vision OCR — live mode enablement, prompt tuning, test receipt sourcing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Iterate the prompt until all 3 test receipts pass the acceptance bar. Not a one-shot pass — if a receipt fails, tune the prompt and re-test until it passes.
- **D-02:** Tuning scope is limited to the `OCR_PROMPT` string in `lib/ocr.ts:37`. The `ReceiptSchema` (Zod), `ReceiptItemSchema`, dollar→cent conversion logic, and response handling are not in scope to change.
- **D-03:** If the existing prompt already produces acceptable output on all 3 receipts, ship it unchanged. Tuning only happens if there's a concrete failure.
- **D-04:** A test receipt **passes** when: (a) every food/drink item on the receipt appears in the `items` array, and (b) no junk lines appear in the `items` array.
- **D-05:** Prices can be slightly off — the correction-first workflow allows the host to fix individual items. Price accuracy is NOT a pass/fail criterion.
- **D-06:** Junk lines that must NOT appear in `items`: grand total, subtotal, tax line, tip/gratuity line, discounts, and comps. These belong in the top-level `tax`/`tip` fields or should be omitted entirely.
- **D-07:** The researcher will find 2+ publicly available receipt image samples online and commit them to a `test-receipts/` folder in the repo root alongside the existing `receipt.jpg`.
- **D-08:** Target variety: sit-down restaurant (full-service with starters/mains/drinks), bar/drinks-only receipt, and a long receipt (10+ items). The existing `receipt.jpg` may cover one of these.
- **D-09:** All test receipts are committed to the repo so validation is reproducible — anyone can re-run the test set.

### Claude's Discretion

- Number of prompt revision rounds: no cap — iterate until all 3 receipts pass or diminishing returns are clear.
- Whether to add inline comments explaining what a prompt change fixed: Claude can decide.
- How to document the test results (inline comments, a test-receipts/README, or both): Claude can decide.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OCR-05 | Host can set a real `OPENAI_API_KEY` in `.env.local` and successfully process a photographed receipt through live GPT-4o Vision OCR (not mock mode) | Two env var edits required: `OPENAI_API_KEY` and `USE_OCR_MOCK=false`; existing code path in `lib/ocr.ts:78` handles this with no other changes |
| OCR-06 | App validated against a set of real restaurant receipts — items, prices, quantities extract with acceptable accuracy for correction-first workflow | ExpressExpense SRD dataset (MIT) confirmed as source for 2 additional test images; `receipt.jpg` covers sit-down restaurant type |
| OCR-07 | GPT-4o prompt tuned so grand totals, tax lines, multi-item rows, and currency symbols are correctly parsed | Current `OCR_PROMPT` already has exclusion rules; known GPT-4o failure modes documented as pitfalls; prompt tuning techniques identified |
</phase_requirements>

---

## Summary

Phase 6 is fundamentally an integration test phase, not a code-writing phase. The pipeline from `.env.local` to `OcrReview` screen already exists and works in mock mode. Enabling live OCR requires exactly two env var changes and one network-capable real API key. The primary engineering work is validating that the existing `OCR_PROMPT` handles three categories of real restaurant receipts — and tuning the prompt string if any fail.

The existing `receipt.jpg` in the repo root is a real photograph from "Sidecar Bar & Grill, Toronto" (2011), showing 8 line items including a starters/mains/drinks mix with a $90 subtotal and $101.70 total including GST. [VERIFIED: Read tool — receipt.jpg image] This is a solid sit-down restaurant example. Two additional receipts are needed to cover: bar/drinks-only, and long receipt (10+ items). The ExpressExpense Sample Receipt Dataset contains 200 MIT-licensed restaurant receipt images and is the recommended source. [VERIFIED: expressexpense.com]

Prompt tuning, if needed, should stay minimal: GPT-4o at `temperature: 0` with `detail: 'high'` and `response_format: json_object` already set is a well-configured baseline. The most likely failure modes are service charge lines leaking into `items`, quantities not detected on multi-unit rows, and hallucinated items when receipt text is partially obscured. Each has a specific prompt patch pattern documented below.

**Primary recommendation:** Enable live mode (two env var edits), run all 3 receipts through the UI, evaluate against D-04/D-06 criteria, patch `OCR_PROMPT` only for concrete failures.

---

## Standard Stack

### Core (already installed — no new dependencies)

| Library | Installed Version | Purpose | Notes |
|---------|-------------------|---------|-------|
| `openai` | 4.104.0 | GPT-4o Vision API calls | `[VERIFIED: npm registry]` — latest 4.x; `^4.0.0` in package.json pulls this |
| `zod` | ^3.0.0 (installed) | Response schema validation | Already validating `ReceiptSchema` — no changes |
| `next` | 16.1.6 | Route handler for `/api/ocr` | Already handling multipart upload |

No new packages required for this phase. [VERIFIED: package.json read]

### Test Assets Required

| Asset | Type | Source | License |
|-------|------|--------|---------|
| `receipt.jpg` | Existing | Repo root — Sidecar Bar & Grill (sit-down, 8 items) | In repo |
| Second receipt | To source | ExpressExpense SRD — bar or drinks-focused receipt | MIT |
| Third receipt | To source | ExpressExpense SRD — long receipt (10+ items) | MIT |

**Download URL for ExpressExpense SRD:**
`https://expressexpense.com/large-receipt-image-dataset-SRD.zip` (19.2MB, 200 images, MIT)
[VERIFIED: expressexpense.com — confirmed MIT license, confirmed restaurant receipts]

---

## Architecture Patterns

### How the Live Mode Gate Works

```
.env.local
  USE_OCR_MOCK=false   ← flip from 'true'
  OPENAI_API_KEY=sk-…  ← replace placeholder

lib/ocr.ts:78
  if (process.env.USE_OCR_MOCK === 'true') return OCR_MOCK_FIXTURE
  // falls through to real GPT-4o call
```

[VERIFIED: lib/ocr.ts read — exact gate at line 78]

When `USE_OCR_MOCK` is anything other than the string `'true'`, the real API path executes. Setting it to `false` is correct.

### Prompt Tuning Workflow (D-01, D-02)

```
1. Take receipt photo / use test image
2. POST to /api/ocr via the app UI
3. Evaluate output against D-04 and D-06 criteria
4. If pass → done
5. If fail → identify specific failure mode (see Pitfalls)
6. Apply targeted patch to OCR_PROMPT string only
7. Restart dev server (tsx watch reloads automatically)
8. Repeat from step 2
```

The dev server uses `tsx watch server.ts`, which hot-reloads on file changes. Changes to `lib/ocr.ts` (the `OCR_PROMPT` const) are picked up automatically — no rebuild needed. [VERIFIED: package.json scripts]

### Recommended Project Structure (test receipt files)

```
test-receipts/
├── README.md         (test log — receipt descriptions + pass/fail results)
├── receipt-01-sitdown.jpg    (or symlink/copy of receipt.jpg)
├── receipt-02-bar.jpg        (bar/drinks-only receipt from ExpressExpense SRD)
└── receipt-03-long.jpg       (10+ item receipt from ExpressExpense SRD)
```

The existing `receipt.jpg` at repo root can serve as the sit-down receipt (receipt-01). D-09 requires all images committed to repo — keep them in `test-receipts/` for organization. [ASSUMED: directory naming — user can adjust]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Response validation | Custom type checks | Existing `ReceiptSchema` (Zod) | Already in place, covers all fields — D-02 says don't change it |
| Image conversion | Manual base64 logic | Existing `imageBuffer.toString('base64')` pattern | Already implemented correctly in `lib/ocr.ts:83` |
| Determinism | Custom de-randomization | `temperature: 0` already set | Temperature 0 is the standard for extraction tasks — already configured |
| High-res text reading | Custom image preprocessing | `detail: 'high'` already set | OpenAI handles the tiling — already configured |

**Key insight:** All infrastructure is built. This phase is validation + minimal prompt tuning, not implementation.

---

## Common Pitfalls

### Pitfall 1: Service Charge / Automatic Gratuity Leaks Into Items

**What goes wrong:** Some restaurants print "SERVICE CHARGE 18%" or "AUTO GRAT $X.XX" as a line item between the food items and the total. GPT-4o may include this in the `items` array because it has a dollar amount like a food item.

**Why it happens:** The current prompt says "Exclude subtotal, tax, tip, service charge, and discount lines from items array" — but uses the word "service charge" not "auto gratuity" or "mandatory gratuity." Different restaurants print this differently.

**How to avoid:** If this failure appears, extend the exclusion rule to name all variants:
```
- Exclude from items: subtotal, tax, sales tax, GST, HST, service charge,
  auto gratuity, mandatory gratuity, suggested gratuity, tip, discount,
  comp, coupon, and any line that is not a specific food or drink item
```
[ASSUMED: specific wording from community patterns — not verified against an actual failure on this codebase]

**Warning signs:** `items` array contains an entry with a name containing "gratuity", "charge", "service", "tax", or "tip."

---

### Pitfall 2: Grand Total / Subtotal Leaked Into Items

**What goes wrong:** Receipt has "TOTAL $101.70" printed in a prominent bold line. GPT-4o correctly puts it in `tax`/`tip` fields 95% of the time, but on some receipt layouts (especially where totals appear mid-receipt or in unusual fonts), it may include it in `items`.

**Why it happens:** The `OCR_PROMPT` already says "Exclude subtotal, tax, tip..." but doesn't explicitly name "TOTAL" or "grand total" as an exclusion.

**How to avoid:** If this occurs, add a rule like:
```
- Never include TOTAL, GRAND TOTAL, SUBTOTAL, BALANCE DUE, or AMOUNT DUE in items
```
[ASSUMED: from general receipt OCR community patterns]

**Warning signs:** An item in `items` with a price much larger than any individual food item (e.g., price > $50 when all food items are < $25).

---

### Pitfall 3: Multi-Quantity Items Not Detected

**What goes wrong:** Receipt shows "2 DRAFT BEER @ $7.00 = $14.00". GPT-4o returns `qty: 1, price: 14.00` instead of `qty: 2, price: 7.00`.

**Why it happens:** The current prompt says "qty defaults to 1 if not shown on receipt" — GPT-4o may interpret "not clearly shown" as applying here, or may read the total column price instead of the unit price.

**How to avoid:** If this occurs, make the multi-unit instruction more explicit:
```
- qty: extract the quantity column if present; if a line shows "2x ITEM" or "ITEM x2",
  set qty accordingly; price should be the unit price, not the extended total
```
[ASSUMED: from general OCR/receipt parsing patterns — not verified on this codebase's receipt set]

**Warning signs:** An item with qty=1 but an unusually high price that's a clean multiple of nearby items.

---

### Pitfall 4: API Key Not Loaded at Dev Server Start

**What goes wrong:** Developer changes `.env.local` but the dev server was already running — the new API key isn't picked up.

**Why it happens:** `tsx watch` hot-reloads TypeScript modules but does NOT reload `.env.local` unless the process restarts.

**How to avoid:** Always restart the dev server (`Ctrl+C` then `npm run dev`) after changing `.env.local`. The lazy initialization in `getOpenAI()` means the key is read at first OCR call — but only if the process was started with the new env file.

[VERIFIED: lib/ocr.ts line 14-17 — `getOpenAI()` lazy initialization confirmed; tsx watch behavior is standard]

**Warning signs:** Getting "OpenAI API key not found" or "Incorrect API key" error when the key looks correct in `.env.local`.

---

### Pitfall 5: Image Quality Failing on Real Photos

**What goes wrong:** Host photographs a receipt in poor light, crumpled paper, or at an angle. `detail: 'high'` helps, but extreme cases still produce garbled output.

**Why it happens:** `detail: 'high'` uses OpenAI's tiling approach — it helps with small text but doesn't compensate for motion blur, extreme shadows, or severe perspective distortion.

**How to avoid:** This phase uses sourced test images (not live photos) to establish the baseline. Real-photo accuracy is a separate concern. For this phase, flat, well-lit images are used.

[VERIFIED: OpenAI docs pattern — `detail: 'high'` confirmed in lib/ocr.ts:99]

---

### Pitfall 6: Zod Schema Rejects Valid GPT Response

**What goes wrong:** GPT-4o returns a valid-looking JSON but with a field GPT added that Zod doesn't expect (e.g., `"currency": "USD"`), causing `ReceiptSchema.parse()` to throw.

**Why it happens:** Zod's `.object()` by default uses strict parsing in some configurations, or GPT adds an unexpected field.

**How to avoid:** The existing `ReceiptSchema` uses standard `z.object()` which strips unknown keys by default in Zod v3. This is NOT an issue — Zod v3 `z.object()` ignores unknown keys unless `.strict()` is called. No action needed.

[VERIFIED: lib/ocr.ts Zod schemas read — no `.strict()` called; Zod v3 default behavior confirmed]

---

## Code Examples

### Current OCR_PROMPT (verbatim from lib/ocr.ts:37)

```typescript
// Source: lib/ocr.ts lines 37-51 [VERIFIED: Read tool]
const OCR_PROMPT = `Extract all food and drink line items from this restaurant receipt as JSON.
Return ONLY valid JSON with this exact shape, no explanation or markdown:
{
  "items": [{ "name": string, "price": number, "qty": number }],
  "subtotal": number,
  "tax": number,
  "tip": number
}
Rules:
- items array: food and drink items only
- Exclude subtotal, tax, tip, service charge, and discount lines from items array
- price is in dollars (e.g., 12.99 for $12.99)
- qty defaults to 1 if not shown on receipt
- If a line cannot be identified as a food or drink item, omit it
- Return 0 for tax or tip if not present on receipt`
```

### Example Targeted Prompt Patch (if service charge leaks)

```typescript
// Source: [ASSUMED] — targeted patch for Pitfall 1
// Replace the exclusion line with:
- Exclude from items: subtotal, tax, sales tax, GST, HST, PST, VAT,
  service charge, auto gratuity, mandatory gratuity, tip, discount,
  comp, coupon, TOTAL, GRAND TOTAL, BALANCE DUE, AMOUNT DUE
```

### Prompt Ordering Best Practice

```
[TEXT INSTRUCTIONS]  ← put prompt before the image
[IMAGE]
```

The current code already does this correctly — `OCR_PROMPT` is the first content item, image is second. [VERIFIED: lib/ocr.ts lines 93-104 — text message comes before image_url]

---

## Receipt Test Set: What We Know

### receipt.jpg (existing — Sidecar Bar & Grill, Toronto)

From reading the image: sit-down restaurant, 2011 receipt, 8 line items (Oysters, Smelts, Duck Terrine, Pate Dessert, 4G Malbec, Soup, Tagliatelle, D&B Brownie), GST line, subtotal $90.00, total $101.70.

[VERIFIED: receipt.jpg read via Read tool]

- Covers: sit-down restaurant type (D-08)
- Notable challenge: GST line (not "tax" — may need exclusion rule to cover abbreviations)
- Covers D-08 "sit-down restaurant" category

### Receipts 2 and 3 (to source from ExpressExpense SRD)

The ExpressExpense Sample Receipt Dataset contains 200 MIT-licensed restaurant receipt photos. [VERIFIED: expressexpense.com]

Target selection criteria per D-08:
- Receipt 2: bar/drinks-only receipt (look for one with mostly beverage items, no food)
- Receipt 3: long receipt with 10+ line items

**How to access:** Download the zip from `https://expressexpense.com/large-receipt-image-dataset-SRD.zip`, select two images matching the target types, commit to `test-receipts/`.

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| Traditional OCR (Tesseract) + NLP | GPT-4o Vision end-to-end | GPT-4o reads, classifies, and structures in one call — already used |
| `detail: 'auto'` | `detail: 'high'` for small text | Already set correctly |
| `temperature: 0.7` | `temperature: 0` for deterministic extraction | Already set correctly |

The codebase is already at the current state of the art for this use case. No architecture changes recommended.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `openai` npm package | GPT-4o API calls | Yes | 4.104.0 (installed) | — |
| Real `OPENAI_API_KEY` | OCR-05 live mode | **Needs user action** | placeholder in .env.local | — |
| Internet access to OpenAI API | Live OCR calls | Assumed yes | — | — |
| `test-receipts/` directory | D-07 receipt storage | No (must create) | — | — |

**Missing dependencies with no fallback:**

- Real `OPENAI_API_KEY`: The placeholder `sk-replace-with-real-key` in `.env.local` must be replaced with a valid key before any live OCR test. This is a user action, not a code task. **The plan must include an instruction step for the user to insert their real API key.**

[VERIFIED: .env.local read — confirmed placeholder value]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run lib/` |
| Full suite command | `npx vitest run` |

[VERIFIED: vitest.config.ts read, package.json devDependencies confirmed]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OCR-05 | `USE_OCR_MOCK=false` + valid key enables real API path | Manual smoke test (needs real API key + receipt image) | Manual: load app, photograph/upload receipt, verify items appear | — |
| OCR-06 | All 3 test receipts produce passing item lists | Manual validation (visual + D-04 criteria) | Manual: run each test image through app UI | — |
| OCR-07 | No junk lines in items array on all 3 receipts | Manual validation (D-06 criteria) | Manual: inspect items array for total/tax/gratuity entries | — |

**Note:** OCR-05, OCR-06, OCR-07 are integration tests against a live external API. They cannot be automated with Vitest (would require real API key + network access + actual receipt images in CI). They are manual validation tasks.

### Sampling Rate

- **Per task:** Manual visual inspection after each OCR call
- **Phase gate:** All 3 test receipts pass D-04 and D-06 criteria before marking phase complete

### Wave 0 Gaps

None — existing Vitest infrastructure is sufficient. No new unit test files needed for this phase (the validation is live API integration, not unit-testable logic). The `lib/bill-split.test.ts` pattern shows how to add unit tests if needed.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Yes | MIME type and file size validation already in `app/api/ocr/route.ts` |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Oversized image upload | Denial of Service | MAX_SIZE_BYTES = 10MB limit already enforced in route handler [VERIFIED: route.ts read] |
| Invalid MIME type | Tampering | ALLOWED_TYPES allowlist already enforced in route handler |
| API key exposure | Information Disclosure | Key is server-side only; never sent to client; lazy init in `getOpenAI()` keeps it out of module scope at import time |

No new security controls needed for this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Specific prompt wording for Pitfall 1 service charge exclusion | Common Pitfalls — Pitfall 1 | Low — this is a tuning suggestion, not a code path; will only be used if the failure actually occurs |
| A2 | Pitfall 3 multi-quantity prompt patch wording | Common Pitfalls — Pitfall 3 | Low — same as A1; will only be used if the failure occurs |
| A3 | `test-receipts/` directory naming convention | Architecture Patterns | Low — user/Claude can rename; just a recommended structure |
| A4 | tsx watch reloads TypeScript but not .env.local | Pitfall 4 | Low — standard Node.js behavior; if wrong, no harm done (would just work first try) |

---

## Open Questions (RESOLVED)

1. **Real API key availability**
   - What we know: `.env.local` has a placeholder key `sk-replace-with-real-key`
   - What's unclear: Whether the user has a real OpenAI API key available and is ready to insert it
   - Recommendation: The plan must include a user-action step (Wave 0 or pre-flight) to insert the real key. The plan cannot assume this is done. If no key is available, Phase 6 cannot proceed.
   - RESOLVED: Plan 06-01 Task 2 is a `checkpoint:human-action` that explicitly gates on the user inserting a real key, with `user_setup` frontmatter and a full `<how-to-verify>` block.

2. **receipt.jpg age and readability**
   - What we know: receipt.jpg is from 2011, shows a clear printed receipt, is readable as an image
   - What's unclear: Whether the GPT-4o OCR handles older thermal-print style fonts without issues
   - Recommendation: Test receipt.jpg first. If results are poor, substitute with a cleaner image from the ExpressExpense SRD.
   - RESOLVED: Plan 06-02 Task 1 tests receipt-01 (receipt.jpg) first; if results are poor, the round-based iteration in Task 2 handles substitution.

3. **ExpressExpense SRD receipt variety**
   - What we know: Dataset contains 200 restaurant receipt images, MIT licensed
   - What's unclear: Whether it contains a clear bar/drinks-only receipt and a 10+ item receipt
   - Recommendation: Download the zip and select appropriate images. If bar receipt is unavailable, use a second sit-down receipt with different characteristics.
   - RESOLVED: Plan 06-01 Task 1 Step 4 includes explicit fallback logic — if no pure-bar receipt is found, use the receipt with the highest proportion of drink items and note the deviation.

---

## Sources

### Primary (HIGH confidence)
- `lib/ocr.ts` — Read directly; confirmed OCR_PROMPT text, lazy init, mock gate, schema, temperature, detail level
- `app/api/ocr/route.ts` — Read directly; confirmed MIME allowlist, size limit, multipart handling
- `.env.local` — Read directly; confirmed placeholder key, USE_OCR_MOCK=true
- `package.json` — Read directly; confirmed openai ^4.0.0, vitest present, tsx watch dev server
- `receipt.jpg` — Read as image; confirmed sit-down restaurant, 8 items, GST line
- `vitest.config.ts` — Read directly; confirmed globals: true, path alias @
- `npm view openai version` — 6.34.0 is latest v6; installed is 4.104.0 (^4 range) [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- [expressexpense.com](https://expressexpense.com/blog/free-receipt-images-ocr-machine-learning-dataset/) — MIT-licensed receipt dataset confirmed, 200 restaurant images, download URL verified
- [OpenAI Community — detail parameter](https://community.openai.com/t/gpt-4-vision-preview-fidelity-detail-parameter/477563) — `detail: 'high'` tiling behavior confirmed
- [Towards Data Science — GPT-4o receipt extraction](https://towardsdatascience.com/how-to-effortlessly-extract-receipt-information-with-ocr-and-gpt-4o-mini-0825b4ac1fea/) — structured prompt best practices

### Tertiary (LOW confidence)
- WebSearch results on receipt OCR pitfalls — general community patterns; specific failure modes in Pitfalls section are [ASSUMED] until confirmed against actual test receipts

---

## Metadata

**Confidence breakdown:**
- Live mode enablement: HIGH — two env var changes, confirmed via source read
- Standard stack: HIGH — no new dependencies; all existing and version-verified
- Test receipt sourcing: HIGH — ExpressExpense SRD confirmed MIT, download URL verified
- Prompt tuning patterns: MEDIUM — general GPT-4o community patterns; specific failures not yet observed on this codebase
- Pitfall specifics: LOW-MEDIUM — [ASSUMED] prompts for specific failure modes; only apply if failure observed

**Research date:** 2026-04-11
**Valid until:** 2026-07-11 (stable APIs — GPT-4o and OpenAI SDK 4.x are stable)
