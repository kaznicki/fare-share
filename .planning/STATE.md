---
gsd_state_version: 1.0
milestone: v1.2.1
milestone_name: Fare Share Rebrand & Guest Onboarding
status: executing
stopped_at: ""
last_updated: "2026-05-04T00:00:00.000Z"
last_activity: 2026-05-04 -- Wave 1 complete (09-01 + 09-02); post-merge build passes
progress:
  phases_total: 1
  phases_complete: 0
  plans_total: 4
  plans_complete: 2
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** Everyone pays exactly what they ordered (plus proportional tax and tip) without doing any mental math
**Current focus:** v1.2.1 — Rebrand to Fare Share, add logo + guest onboarding copy

## Current Position

Phase: 9 of 1 — Fare Share Rebrand & Guest Onboarding
Plan: 2 of 4 complete (09-01, 09-02 done; 09-03 next)
Status: Executing — Wave 2 ready
Last activity: 2026-05-04 — Wave 1 (09-01 + 09-02) merged to master, build passes

## v1.2.1 Phase Overview

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 9. Fare Share Rebrand & Guest Onboarding | Rebrand to "Fare Share", add logo, onboard guests with title + description + instructions | BRAND-01, BRAND-02, ONBOARD-01, ONBOARD-02, ONBOARD-03, ONBOARD-04 | 2/4 plans complete (Wave 1 done) |

## Accumulated Context

### Architecture (carried forward)

- Integer cents throughout; Largest Remainder Method for all rounding
- globalThis singleton for session store (Next.js App Router module isolation)
- Callback ref pattern for stable WebSocket handlers (onFinalizedRef, onSessionDataRef, onUnfinalizedRef)
- Host identity always normalized via .trim().toLowerCase() on both sides
- Full-state broadcast on every WebSocket message (enables reconnect for free)
- CSS hidden pattern for always-mounted components (keeps WebSocket open across screen transitions)
- Deployment: Railway/Fly.io/Render (not Vercel — persistent WebSocket required)

### Key files for v1.2.1

- `app/host/page.tsx` — host start page (camera capture entry point)
- `app/session/[id]/page.tsx` (or wherever the guest join page lives) — guest first screen
- `components/session/JoinForm.tsx` — guest join form (title + description + instructions go above this)
- `app/layout.tsx` — page metadata (`<title>`, description)
- `package.json`, `README.md` — project name strings

### Session Continuity

Last session: 2026-05-04
Stopped at: Wave 1 complete; Wave 2 (09-03) about to spawn
Resume with: `/gsd-execute-phase 9`
