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

## Milestone: v1.2.1 — Fare Share Rebrand & Guest Onboarding

**Shipped:** 2026-05-05
**Phases:** 1 (Phase 9) | **Plans:** 4 | **Duration:** 3 days (2026-05-02 → 2026-05-05)

### What Was Built

- Six brand SVGs color-fixed and placed in `public/`; three PNG raster fallbacks generated via sharp
- Eight CSS design tokens at `:root` + Tailwind v4 `@theme inline` bridge; `FareShareLogo` inline-SVG component
- Persistent `HeaderBar` in `app/layout.tsx`, hero lockups on host + guest join, full palette repaint of 8 components
- All "Tab Splitter" strings gone; guest join page onboarding copy (description + 4-step instructions)
- Post-UAT fix: `ClaimableItem` `React.memo` + `useCallback` to eliminate WebSocket-driven flicker

### What Worked

- **Wave execution** — splitting 4 plans into 2 parallel waves (Wave 1: assets+tokens, Wave 2: layout+copy) eliminated merge conflicts and kept execution time to ~3 days
- **Design handoff as source of truth** — having `design_handoff_logo/README.md` as a locked spec meant zero creative decisions during execution; every pixel question had a documented answer
- **Pre-processing SVGs at the filesystem boundary** — baking in hex values at copy time was the right call; the alternative (CSS vars in static `<img>`) would have silently broken theming
- **Human UAT covering typography + color fidelity** — automation can grep for class names but can't verify that `oklch()` renders correctly in a real browser; the 6-item UAT list covered exactly the things that needed eyes

### What Was Inefficient

- **Verification report written before UAT** — the VERIFICATION.md was authored with status `human_needed` and 6 open items, then UAT happened a session later. Writing the UAT checklist into the verification report up-front is good; leaving the session open for days before closing it adds unnecessary context-reload cost.
- **Flickering bug found in UAT and fixed post-close** — the `transition-colors duration-300` + full-state broadcast interaction should have been caught during execution. The WebSocket broadcast pattern is documented in CONTEXT.md; the CSS transition conflict wasn't anticipated. Worth noting for future phases that touch ClaimableItem or add CSS transitions to components that receive broadcast-driven props.

### Patterns Established

- **SVG color-fix at copy time** — when a static SVG will be referenced via `<img>`, bake hex values in at the filesystem boundary; `var(--token)` won't resolve through the `<img>` tag
- **Raster icon recipe** — `sharp(svg).resize(N).png().toFile(...)` using sharp's transitive presence in Next.js; no new top-level dependency
- **Inline-SVG React component for brand marks** — `FareShareLogo.tsx` uses `var(--accent, #C75B3D)` internally so it responds to CSS token overrides at runtime
- **`React.memo` with content-equality comparator** — when a parent broadcasts full state on every WS message, children that receive derived arrays (e.g., `claims[id] ?? []`) need content-equality, not reference-equality, to avoid spurious re-renders

### Key Lessons

1. **Lock the design spec before execution, not during** — having the full brand system in `design_handoff_logo/` before any plan was written meant zero decisions during execution. This is the right model for visual rebrand work.
2. **UAT timing matters** — opening the UAT window and closing it in the same session avoids context reload. Plan for UAT to happen immediately after the final commit, not a day later.
3. **Animated transitions on WebSocket-driven components should be opt-in, not default** — `transition-colors` feels harmless until the component is re-rendered 10x/sec by broadcast updates. The safe default for real-time components is no transition; add it only if the UX explicitly requires it.

### Cost Observations

- Model mix: predominantly sonnet-4-6 (all 4 plans + verification)
- Sessions: ~3 over 3 days
- Notable: Wave execution reduced total session time significantly — 2 parallel worktrees doing real work vs. sequential execution

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Duration | Phases | Plans | Key Change |
|-----------|----------|--------|-------|------------|
| v1.0 MVP | 55 days | 5 | 16 | Initial build — established all core patterns |
| v1.1 Polish | 20 days | 3 | 6 | Plans executing in 1–2 min as patterns solidified |
| v1.2.1 Rebrand | 3 days | 1 | 4 | Wave execution; design-spec-first eliminates in-execution decisions |

### Cumulative Quality

| Milestone | Tests | Zero-Dep Bugs Shipped |
|-----------|-------|-----------------------|
| v1.0 MVP | 13 Vitest (bill-split unit) + 4 human UAT | 0 critical (2 warnings deferred as todos) |
| v1.1 Polish | 26 Vitest (bill-split + OCR validation + tax-tip formulas) + UAT | 0 critical |
| v1.2.1 Rebrand | 26 Vitest (unchanged) + 6-item visual UAT | 1 post-UAT fix (ClaimableItem flicker) |

### Top Lessons (Verified Across Milestones)

1. Behavior-level success criteria prevent gap-closure plans
2. Human UAT at phase boundaries is cheaper than post-hoc gap closure
3. Patterns documented in CONTEXT.md/PATTERNS.md pay off at execution time — v1.1 plans wrote themselves
4. Lock the design/spec artifact before planning — v1.2.1 design handoff eliminated all in-execution creative decisions
5. CSS transitions on WebSocket-driven components need explicit justification; default to none
