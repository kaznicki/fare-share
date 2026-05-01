# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-10
**Phases:** 5 | **Plans:** 16 | **Duration:** 55 days (2026-02-14 → 2026-04-10)

### What Was Built

- Custom Next.js + WebSocket server with `noServer` routing — full-stack TypeScript with real-time capability on a single port
- GPT-4o Vision OCR pipeline with mock mode, Zod validation, and integer-cent enforcement from the API boundary
- Complete host flow: camera capture → OCR review with inline editing → session creation → QR/link share
- Real-time participant layer: WebSocket join handler, full-state broadcast, globalThis singleton for module isolation
- Item claiming with tap-to-claim, shared-item cost splitting, live sync across all connected clients
- Bill-split engine using Largest Remainder Method — exact cent accuracy guaranteed across all edge cases
- Finalization UI: blocking unclaimed-items modal, per-person summary breakdown, host totals table

### What Worked

- **Phase-scoped plans**: Each plan had a tight, testable deliverable — execution stayed focused and summaries were easy to write
- **Integer cents from day one**: No floating-point bugs ever appeared; LRM handled all rounding edge cases cleanly
- **Mock OCR mode**: `USE_OCR_MOCK=true` allowed full UI development without burning API credits — zero cost for all Phase 2–5 UI work
- **Full-state broadcast model**: Sending the entire session snapshot on every WebSocket message eliminated sync bugs and made reconnect trivial
- **Human UAT at phase boundaries**: Catching real issues (host identity case mismatch, stale closure in WebSocket handler) before the next phase started saved significant rework
- **globalThis singleton pattern**: Documented early and applied consistently — module isolation never caused confusion after Phase 3

### What Was Inefficient

- **ROADMAP.md not updated in real time**: Progress table for Phases 4 and 5 still showed "Not started" and "TBD" plan counts; required manual cleanup at milestone close
- **STATE.md drift**: STATE.md was accurate through Phase 3 but not kept current for Phases 4–5 — context from memory/MEMORY.md had to bridge the gap
- **Gap closure phases**: Phases 02-05 (OCR error banner fix), code review fix plans, and Plan 05-03 (WR-05/WR-06) all required separate plans to close gaps found in earlier execution — root cause was under-specified success criteria in the original plans
- **WR-02 (finalizeError display)**: Identified in code review, not fixed before milestone close — carried as known tech debt in todos

### Patterns Established

- `globalThis.__tabSplitterSessionStore` singleton pattern for session store shared across Next.js App Router module contexts
- Callback ref pattern (`useRef` + sync on every render, read via `.current` in `useEffect`) for stable WebSocket handlers that need access to fresh state without triggering reconnects
- Host identity always normalized via `.trim().toLowerCase()` on both sides of comparison — applied at both client derivation and server authorization gate
- Two-screen state machine pattern in page components (host and participant pages both use same `screen` state + conditional render; no router navigation for ephemeral flows)
- `getData()` helper on session store to strip non-serializable fields before JSON broadcast

### Key Lessons

1. **Specify success criteria at the API/behavior level, not the implementation level** — "OCR error banner stays visible" is testable; "add error handling" is not. Plans with vague success criteria consistently produced gaps requiring follow-up plans.
2. **Human UAT at each phase boundary catches integration issues that automated checks miss** — the host identity case-sensitivity bug (WR-03/WR-05) passed all automated checks but failed UAT; fixing it before Phase 5 would have been cheaper than fixing it during gap closure.
3. **Keep living docs (ROADMAP, STATE) updated inline** — ROADMAP progress table drift required cleanup at milestone close; if updated after each plan it would add <1 minute per plan and eliminate the problem.
4. **Mock mode is a force multiplier** — `USE_OCR_MOCK=true` enabled the entire UI development cycle (Phases 2–5) without a real API key. Any external API dependency should have a mock mode from Phase 1.

### Cost Observations

- Model mix: predominantly sonnet (plans, execution) with opus for research/architecture phases
- Sessions: ~15 estimated across 55 days
- Notable: Mock OCR mode kept GPT-4o API costs at zero during all UI development

---

---

## Milestone: v1.1 — Real Receipts & Polish

**Shipped:** 2026-04-30
**Phases:** 3 (6–8) | **Plans:** 6 | **Duration:** 20 days (2026-04-10 → 2026-04-30)

### What Was Built

- Live GPT-4o Vision OCR wired and validated on 3 real restaurant receipts (sit-down, bar, long)
- OCR_PROMPT Pitfall 3 patch for quantity-prefixed line items
- Bill total row (items + tax + tip) in TaxTipFields sticky footer with inline integer arithmetic
- Active tip preset highlight (blue) via isActive detection matching click handler formula exactly
- Unfinalize backend: session-store method, WS handler, REST route — host guard, idempotency, broadcast
- Unfinalize frontend: always-mounted SessionRoom (CSS hidden), prevFinalizedRef transition detection
- Four surgical CSS fixes: Geist Sans active, OcrReview heading unified, card shadows added, two-accent color split verified

### What Worked

- **Short plans executed fast.** Plans 07-01, 07-02, 07-03, 08-01 each completed in 1–2 minutes. Fine-grained plan decomposition paid off.
- **TDD pattern carried forward cleanly.** RED/GREEN commits in 07-01 and 07-02 made requirements traceability obvious.
- **Wave decomposition for Phase 7.** Running 07-01 and 07-02 in parallel (no file overlap) kept the timeline tight.
- **OCR validation structure.** D-04/D-06 acceptance criteria gave clear pass/fail signal — no ambiguity about whether receipts passed.
- **Correction-first philosophy.** Accepting qty edge cases as correctable kept OCR scope bounded and shipping-focused.

### What Was Inefficient

- **Receipt sourcing took manual effort.** The ExpressExpense SRD is fast-food biased; finding a bar receipt required sampling 70+ images.
- **4 v1.0 todos sat in "pending" through all of v1.1.** They were all addressed as requirements but the todo files were never closed — required cleanup at milestone close.

### Patterns Established

- **CSS hidden for always-mounted WebSocket components** — wrap in `div className={isHidden ? 'hidden' : ''}` to keep connection alive across screen transitions
- **prevFinalizedRef transition detection** — compare ref to incoming snapshot value, fire callback on true→false, update ref AFTER check (initial false→false mount is a no-op)
- **Card elevation standard** — `bg-white rounded-2xl shadow-md` for all elevated surfaces
- **Two-accent split** — indigo-600 for financial/session-entry moments, blue-600 for action buttons

### Key Lessons

1. **OCR determinism at temperature=0** means prompt patches won't change results for already-tested images — test patches on new images to verify
2. **Always-mounted patterns (CSS hidden) should be default** when a component holds a WebSocket connection — conditional render disconnects the socket
3. **Close todos when their requirement is created**, not at milestone close — stale "pending" files are noise

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Duration | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 MVP | 55 days | 5 | 16 | Initial build — established all core patterns |
| v1.1 Polish | 20 days | 3 | 6 | Plans executing in 1–2 min as patterns solidified |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Bugs Shipped |
|-----------|-------|-----------------------|
| v1.0 MVP | 13 Vitest (bill-split unit) + 4 human UAT | 0 critical (2 warnings deferred as todos) |
| v1.1 Polish | 26 Vitest (bill-split + OCR validation + tax-tip formulas) + UAT | 0 critical |

### Top Lessons (Verified Across Milestones)

1. Behavior-level success criteria prevent gap-closure plans
2. Human UAT at phase boundaries is cheaper than post-hoc gap closure
3. Patterns documented in CONTEXT.md/PATTERNS.md pay off at execution time — v1.1 plans wrote themselves
