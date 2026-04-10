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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Duration | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | 55 days | 5 | Initial build — established all core patterns |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Bugs Shipped |
|-----------|-------|-----------------------|
| v1.0 MVP | 13 Vitest (bill-split unit) + 4 human UAT | 0 critical (2 warnings deferred as todos) |

### Top Lessons (Verified Across Milestones)

1. Behavior-level success criteria prevent gap-closure plans
2. Human UAT at phase boundaries is cheaper than post-hoc gap closure
