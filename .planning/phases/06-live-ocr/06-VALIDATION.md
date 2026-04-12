---
phase: 6
slug: live-ocr
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run lib/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run lib/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | OCR-05 | — | N/A | Manual smoke | Load app, set real key, photograph receipt, verify items on OcrReview | — | ⬜ pending |
| 6-01-02 | 01 | 1 | OCR-06 | — | N/A | Manual validation | Run 3 distinct receipts through app UI, verify item lists accurate per D-04 | — | ⬜ pending |
| 6-01-03 | 01 | 1 | OCR-07 | — | N/A | Manual validation | Inspect items array for absence of total/tax/tip/gratuity entries per D-06 | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — OCR-05, OCR-06, OCR-07 are live API integration validations that cannot be automated in Vitest.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real API path enabled by env var changes | OCR-05 | Requires live OpenAI API key + physical receipt image | Set `OPENAI_API_KEY=<real key>` and `USE_OCR_MOCK=false` in `.env.local`, start dev server, photograph receipt, confirm items appear on OcrReview screen (no mock data) |
| 3 real receipts produce passing item lists | OCR-06 | Requires live API calls against real images; not CI-safe | Run receipt.jpg + 2 additional restaurant receipts through app; verify items/prices/quantities roughly correct per D-04 accuracy criteria |
| No junk lines (totals, tax, gratuity) in items | OCR-07 | Requires visual inspection of live API output | After each receipt test, confirm items array contains no grand total, tax, tip, or currency-symbol-only entries per D-06 exclusion rules |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
