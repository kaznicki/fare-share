# Roadmap: Tab Splitter

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-04-10)
- [ ] **v1.1 Real Receipts & Polish** — Phases 6–8 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–5) — SHIPPED 2026-04-10</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-02-21
- [x] Phase 2: Host Flow (5/5 plans) — completed 2026-02-21
- [x] Phase 3: Real-Time Layer (2/2 plans) — completed 2026-02-22
- [x] Phase 4: Item Claiming (3/3 plans) — completed 2026-04-08
- [x] Phase 5: Summary and Finalization (3/3 plans) — completed 2026-04-10

See `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

</details>

### v1.1 Real Receipts & Polish (Phases 6–8)

- [x] **Phase 6: Live OCR** — Real API key wired, prompt tuned, validated on actual restaurant receipts — completed 2026-04-29
- [ ] **Phase 7: UX & Display Fixes** — Bill total on OcrReview, tip selector selected state, unfinalize flow
- [ ] **Phase 8: Visual Polish** — Consistent spacing, color, and typography across all screens

## Phase Details

### Phase 6: Live OCR
**Goal**: The app processes real restaurant receipts through live GPT-4o Vision OCR with acceptable accuracy
**Depends on**: Phase 5 (v1.0 complete)
**Requirements**: OCR-05, OCR-06, OCR-07
**Success Criteria** (what must be TRUE):
  1. Host sets a real `OPENAI_API_KEY` in `.env.local`, disables mock mode, photographs a receipt, and items appear on the OcrReview screen — no mock data
  2. At least 3 distinct real restaurant receipts are tested and produce item lists accurate enough for the correction-first workflow (items, prices, and quantities roughly correct)
  3. Grand total lines, tax lines, and currency symbols are excluded from the item list; actual ordered items are included
**Plans**: 2 plans
- [x] 06-01-PLAN.md — Wire live OCR: source 3 test receipts + flip .env.local to live mode (OCR-05)
- [ ] 06-02-PLAN.md — Validate 3 receipts through live GPT-4o + targeted OCR_PROMPT tuning (OCR-06, OCR-07)

### Phase 7: UX & Display Fixes
**Goal**: Hosts can verify the bill total before creating a session, see which tip is selected, and recover from an accidental finalize without losing claims
**Depends on**: Phase 5
**Requirements**: DISP-01, UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. The OcrReview screen shows a running bill total (items + tax + tip) that updates as the host adjusts items, tax, and tip — before the session is created
  2. The tip selector visually shows which percentage is currently active (highlighted or contrasting style) so there is no ambiguity
  3. After finalizing, the host can press an Unfinalize button, return to the claiming screen, and all prior claims are still present — no one needs to re-claim
**Plans**: 3 plans

**Wave 1** *(parallel — no file overlap)*
- [x] 07-01-PLAN.md — Add bill total row and active tip preset state to TaxTipFields (DISP-01, UX-01)
- [x] 07-02-PLAN.md — Unfinalize backend: types union, session-store method, server.ts WS handler, REST route (UX-02)

**Wave 2** *(blocked on Wave 1 — 07-02 completion)*
- [x] 07-03-PLAN.md — Unfinalize frontend: SessionRoom callback, SummaryScreen button, page.tsx always-mounted wiring (UX-02)

**Cross-cutting constraints:**
- Integer cents throughout — `totalCents = subtotalCents + taxCents + tipCents` (no floats)
- Host identity normalized via `.trim().toLowerCase()` on all sides (REST + WS)
- Full-state broadcast after every session mutation

### Phase 8: Visual Polish
**Goal**: All screens have consistent, intentional spacing, color, and typography — the app looks considered, not cobbled
**Depends on**: Phase 7
**Requirements**: VIS-01
**Success Criteria** (what must be TRUE):
  1. Spacing, padding, and font sizing are consistent across the capture, review, share, join, claiming, and summary screens — no screen looks noticeably rougher than the others
  2. Color usage (backgrounds, text, buttons, accents) follows a coherent palette throughout the app
  3. A first-time user testing the app on a phone would describe the visual design as polished rather than unfinished
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
| --- | --- | --- | --- | --- |
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-21 |
| 2. Host Flow | v1.0 | 5/5 | Complete | 2026-02-21 |
| 3. Real-Time Layer | v1.0 | 2/2 | Complete | 2026-02-22 |
| 4. Item Claiming | v1.0 | 3/3 | Complete | 2026-04-08 |
| 5. Summary and Finalization | v1.0 | 3/3 | Complete | 2026-04-10 |
| 6. Live OCR | v1.1 | 0/2 | Not started | - |
| 7. UX & Display Fixes | v1.1 | 3/3 | Verifying | - |
| 8. Visual Polish | v1.1 | 0/? | Not started | - |
