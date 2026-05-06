---
gsd_state_version: 1.0
milestone: v1.2.1
milestone_name: Fare Share Rebrand & Guest Onboarding
status: complete
stopped_at: ""
last_updated: "2026-05-05T00:00:00.000Z"
last_activity: 2026-05-05 -- v1.2.1 shipped; all 11 requirements validated; git tag v1.2.1
progress:
  phases_total: 1
  phases_complete: 1
  plans_total: 4
  plans_complete: 4
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Everyone pays exactly what they ordered (plus proportional tax and tip) without doing any mental math
**Current focus:** v1.2.1 complete — planning next milestone

## Current Position

Milestone: v1.2.1 — SHIPPED 2026-05-05
Phase: 9 of 1 — Complete
Plan: 4 of 4 complete
Status: Milestone closed, git tagged v1.2.1

## v1.2.1 Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 9. Fare Share Rebrand & Guest Onboarding | Rebrand to "Fare Share", adopt full brand system, onboard guests | BRAND-01–06, ONBOARD-01–05 | ✅ Complete — all 11 validated |

## Accumulated Context

### Architecture (carried forward)

- Integer cents throughout; Largest Remainder Method for all rounding
- globalThis singleton for session store (Next.js App Router module isolation)
- Callback ref pattern for stable WebSocket handlers (onFinalizedRef, onSessionDataRef, onUnfinalizedRef)
- Host identity always normalized via .trim().toLowerCase() on both sides
- Full-state broadcast on every WebSocket message (enables reconnect for free)
- CSS hidden pattern for always-mounted components (keeps WebSocket open across screen transitions)
- Deployment: Railway/Fly.io/Render (not Vercel — persistent WebSocket required)
- React.memo + useCallback on ClaimableItem to prevent flicker from broadcast-driven re-renders

### Brand system (v1.2.1)

- Tokens: --ink #1A1714, --paper #FAF7F2, --accent oklch(64% 0.17 35) / #C75B3D, --accent-deep oklch(52% 0.17 35)
- Typography: Plus Jakarta Sans (UI), Instrument Serif (editorial), JetBrains Mono (prices)
- Logo: components/brand/FareShareLogo.tsx (inline-SVG); public/logo-lockup.svg (for <img> heroes)
- HeaderBar: components/brand/HeaderBar.tsx, mounted globally in app/layout.tsx

### Session Continuity

Last session: 2026-05-05
Stopped at: v1.2.1 milestone complete
Resume with: `/gsd-new-milestone` to start next milestone
