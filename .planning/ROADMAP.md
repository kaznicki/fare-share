# Roadmap: Tab Splitter (rebranding to Fare Share in v1.2.1)

## Milestones

- ✅ **v1.0 MVP** — Phases 1–5 (shipped 2026-04-10)
- ✅ **v1.1 Real Receipts & Polish** — Phases 6–8 (shipped 2026-04-30)
- 🟡 **v1.2.1 Fare Share Rebrand & Guest Onboarding** — Phase 9 (started 2026-05-02)

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

<details>
<summary>✅ v1.1 Real Receipts & Polish (Phases 6–8) — SHIPPED 2026-04-30</summary>

- [x] Phase 6: Live OCR (2/2 plans) — completed 2026-04-29
- [x] Phase 7: UX & Display Fixes (3/3 plans) — completed 2026-04-30
- [x] Phase 8: Visual Polish (1/1 plan) — completed 2026-04-30

See `.planning/milestones/v1.1-ROADMAP.md` for full phase details.

</details>

## v1.2.1 Fare Share Rebrand & Guest Onboarding

### Phase 9: Fare Share Rebrand & Guest Onboarding

**Goal:** Adopt the complete Fare Share brand system delivered by Claude Design (logo + design tokens + typography + repaint), rename all user-visible "Tab Splitter" strings, and onboard guests on the join page with hero, description, and usage instructions.

**Canonical refs:** `design_handoff_logo/README.md`, `design_handoff_logo/assets/`

**Requirements:** BRAND-01, BRAND-02, BRAND-03, BRAND-04, BRAND-05, BRAND-06, ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04, ONBOARD-05

**Success criteria:**
1. Loading the app shows "Fare Share" in tab title, header bar, and all visible headings — no remaining user-facing "Tab Splitter" strings; `app/layout.tsx` "Create Next App" defaults are also fixed
2. Every screen (host capture, OCR review, share, join, session, summary) shows a persistent header bar with the Fare Share lockup
3. Host start page (`/host`) and guest join page show a hero lockup at the top; "Photograph Receipt" h1 is demoted to a smaller subhead under the host hero
4. Guest join page shows the locked app description plus the four-step instruction list above the name input
5. App is repainted to the warm ink / paper / copper palette (CTAs are copper, no remaining `bg-blue-600`); typography is Plus Jakarta Sans (with Instrument Serif and JetBrains Mono available); design tokens defined as CSS custom properties + Tailwind v4 `@theme`
6. `apple-touch-icon-180.png`, `favicon-32.png`, `favicon-16.png` exist and are referenced from `app/layout.tsx`; PWA installability remains deferred
7. Logo geometry, stroke weights, color values, and typography reproduce `design_handoff_logo/README.md` exactly — no creative variations

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
| --- | --- | --- | --- | --- |
| 1. Foundation | v1.0 | 3/3 | Complete | 2026-02-21 |
| 2. Host Flow | v1.0 | 5/5 | Complete | 2026-02-21 |
| 3. Real-Time Layer | v1.0 | 2/2 | Complete | 2026-02-22 |
| 4. Item Claiming | v1.0 | 3/3 | Complete | 2026-04-08 |
| 5. Summary and Finalization | v1.0 | 3/3 | Complete | 2026-04-10 |
| 6. Live OCR | v1.1 | 2/2 | Complete | 2026-04-29 |
| 7. UX & Display Fixes | v1.1 | 3/3 | Complete | 2026-04-30 |
| 8. Visual Polish | v1.1 | 1/1 | Complete | 2026-04-30 |
| 9. Fare Share Rebrand & Guest Onboarding | v1.2.1 | 0/0 | Not started | — |
