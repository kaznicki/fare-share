---
phase: 7
slug: ux-display-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 0 | DISP-01 / UX-01 | — | N/A | unit | `npx vitest run lib/tax-tip-total.test.ts` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 0 | UX-02 | T-unfinalize | unfinalize() resets finalized/finalizedBill; claims preserved | unit | `npx vitest run lib/session-store.test.ts` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 1 | DISP-01 | — | N/A | visual | `npx vitest run` | ✅ existing | ⬜ pending |
| 7-01-04 | 01 | 1 | UX-01 | — | N/A | visual | `npx vitest run` | ✅ existing | ⬜ pending |
| 7-01-05 | 01 | 1 | UX-02 | T-unfinalize | 403 returned for non-host; 200 for host; session reset | integration | manual | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/tax-tip-total.test.ts` — unit tests for DISP-01 total computation (`subtotalCents + taxCents + tipCents`) and UX-01 active preset detection (`tipCents === Math.round(subtotalCents * pct / 100)`)
- [ ] `lib/session-store.test.ts` — unit tests for UX-02 `unfinalize()`: verifies `finalized` resets to false, `finalizedBill` resets to null, claims array unchanged

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| REST route returns 403 for non-host caller | UX-02 | No HTTP test harness in project | `curl -X POST /api/sessions/[id]/unfinalize -d '{"hostName":"wrong"}'` — expect 403 |
| REST route returns 200 for host caller and resets session state | UX-02 | No HTTP test harness in project | `curl -X POST /api/sessions/[id]/unfinalize -d '{"hostName":"[real host]"}'` — expect 200; verify session.finalized === false |
| All participants return to claiming screen after host unfinalizes | UX-02 | Requires live WebSocket + multiple clients | Open host tab + 1 participant tab; finalize; click "Go back to claiming"; both tabs should show claiming screen; participant claims should be intact |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
