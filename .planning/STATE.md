# Project State: SplitCheck

**Last updated:** 2026-02-14
**Phase:** Not started
**Status:** Roadmap created, awaiting Phase 1 planning

---

## Project Reference

**Core Value:** Accurately split a restaurant bill among any number of people so everyone pays exactly their fair share, with minimal manual effort.

**Current Focus:** Initialize foundation phase with mobile-responsive web app scaffolding and persistent state management.

**Key Constraints:**
- Mobile-first responsive web app (works in phone browsers)
- OCR-based receipt scanning (Tesseract.js + cloud fallback)
- Collaborative claiming — host scans, everyone claims their own items via shared link
- Real-time sync so all participants see claims live
- Rounding must sum to the penny (integer math throughout)

---

## Current Position

**Phase:** 1 - Foundation & Project Setup
**Plan:** Not yet created
**Status:** Pending

**Progress:** [..................] 0/7 phases (0%)

**Current work:**
- None (roadmap just created)

**Next action:**
- Run `/gsd:plan-phase 1` to create execution plan for Foundation phase

---

## Performance Metrics

### Velocity
- **Phases completed:** 0
- **Plans completed:** 0
- **Average plans per phase:** N/A (no data)
- **Project started:** 2026-02-14

### Efficiency
- **Blocked plans:** 0
- **Revised plans:** 0
- **Research phases:** 0

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Date | Outcome |
|----------|-----------|------|---------|
| 7-phase roadmap structure | Follow natural data flow with collaborative claiming as core | 2026-02-14 | Approved |
| Collaborative claiming over host-assigns-all | Distributes the work, better UX for large parties | 2026-02-14 | Approved |
| Real-time sync via WebSocket/polling | Everyone sees claims live, feels collaborative | 2026-02-14 | Approved |
| No formal user accounts | People enter their name on the shared link, no sign-up | 2026-02-14 | Approved |
| Standard depth (7 phases) | Balances granularity with manageability | 2026-02-14 | Approved |

### Known Blockers

(None currently)

### Technical Notes

**Critical pitfalls identified in research:**
1. **Rounding errors** - Must use integer arithmetic (cents) throughout, apply rounding only at final step with largest-remainder method
2. **OCR accuracy** - Real receipts are messy; preprocessing (crop, enhance, deskew) is essential
3. **Multi-quantity parsing** - Receipts use wildly different notations ("2 Burger", "Burger x2", "Burger @15 x2 30")
4. **Mobile camera issues** - Dim lighting, glare, blurry photos require robust preprocessing pipeline
5. **Tax line detection** - May be misidentified as menu item; use keyword detection and position heuristics

---

## Session Continuity

### Last Session Summary
- **Date:** 2026-02-14
- **Completed:** Created 7-phase roadmap covering all 25 v1 requirements with collaborative claiming flow
- **Output:** ROADMAP.md, STATE.md, updated REQUIREMENTS.md traceability

### Handoff Notes
Project is initialized with complete roadmap. All v1 requirements mapped to phases with 100% coverage. Ready for Phase 1 planning.

**Next agent:** Plan-Phase (for Phase 1: Foundation & Project Setup)

**Context needed:**
- PROJECT.md (core value, constraints)
- REQUIREMENTS.md (FOUN-01, FOUN-02, FOUN-03)
- ROADMAP.md (Phase 1 goals and success criteria)
- Research SUMMARY.md (stack recommendations: Next.js, Zustand, Tailwind)

---

*State initialized: 2026-02-14*
