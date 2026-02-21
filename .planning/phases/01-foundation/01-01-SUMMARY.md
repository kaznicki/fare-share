---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [next.js, typescript, websocket, tailwind, ws, openai, zod, tsx]

# Dependency graph
requires: []
provides:
  - Custom Next.js HTTP+WebSocket server running on localhost:3000
  - WebSocket server on /ws path with noServer mode routing (HMR conflict-free)
  - Canonical domain types: Item, SessionState, SessionData, OcrResult, ServerMessage, ClientMessage
  - Session store singleton with 4-hour TTL, socket management, and broadcast
  - OCR module skeleton stub for Plan 01-03
  - Tailwind v4 configured via CSS @import directive
affects: [01-02, 01-03, 02-host-flow, 03-realtime, 04-claiming, 05-summary]

# Tech tracking
tech-stack:
  added: [next@16, ws@8, openai, zod, tsx, @types/ws, tailwindcss@4]
  patterns:
    - Custom HTTP server wrapping Next.js (noServer WebSocket mode)
    - Integer cents for all monetary values
    - Singleton session store (module-level Map)
    - Full snapshot broadcast on every WebSocket connect

key-files:
  created:
    - server.ts
    - types/index.ts
    - lib/session-store.ts
    - lib/ocr.ts
    - .env.local.example
    - .gitignore
  modified:
    - package.json
    - tsconfig.json

key-decisions:
  - "noServer: true for WebSocket — routes upgrade events manually to avoid HMR conflict on /_next/webpack-hmr"
  - "tsx watch server.ts as dev script — bypasses next dev to ensure custom server runs"
  - "Integer cents for all monetary values — priceCents, taxCents, tipCents, never floats"
  - "Full state snapshot sent on every WebSocket connect — handles both initial join and reconnects uniformly"
  - "Append-only Set semantics for claims — claims[itemId] = participantName[] with no removal"

patterns-established:
  - "Money pattern: all monetary values stored as integer cents (priceCents, taxCents, tipCents)"
  - "WebSocket pattern: noServer mode with manual upgrade routing; /ws handled by wss, /_next/webpack-hmr delegated to Next.js"
  - "Session snapshot pattern: full state sent on connect, not incremental deltas"

requirements-completed: [infrastructure]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 16 custom HTTP+WebSocket server with noServer routing, Tailwind v4, canonical TypeScript types, and session store/OCR module skeletons ready for Plans 01-02 and 01-03**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-21T16:54:37Z
- **Completed:** 2026-02-21T16:59:37Z
- **Tasks:** 2
- **Files modified:** 9 (created or modified)

## Accomplishments
- Next.js 16 scaffolded with TypeScript, Tailwind v4 (@import "tailwindcss"), App Router
- Custom HTTP+WebSocket server running at localhost:3000 with zero startup errors
- WebSocket upgrade routing: /ws handled by `ws` library (noServer mode), /_next/webpack-hmr delegated to Next.js HMR
- Canonical domain types hand-written in types/index.ts (Item, SessionState, SessionData, OcrResult, message union types)
- Session store singleton with 4-hour TTL, socket Set management, and broadcast helper
- TypeScript compiles with zero errors; wscat test confirms /ws?session=nonexistent closes with code 1008

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with Tailwind v4 and install dependencies** - `f2b4a17` (chore)
2. **Task 2: Create custom server, canonical types, and module skeletons** - `7ceb62d` (feat)

## Files Created/Modified
- `package.json` - Updated name, scripts (tsx watch server.ts), added ws/openai/zod/tsx/@types/ws
- `tsconfig.json` - Scaffolded with @/* -> ./* path alias
- `app/globals.css` - Tailwind v4 via @import "tailwindcss"
- `server.ts` - Custom HTTP+WebSocket server with noServer mode upgrade routing
- `types/index.ts` - Canonical hand-written domain types (Item, SessionState, SessionData, OcrResult, message types)
- `lib/session-store.ts` - Singleton session store (create/get/has/addSocket/removeSocket/broadcast) with 4-hour TTL
- `lib/ocr.ts` - Module skeleton stub; extractReceiptItems throws until Plan 01-03
- `.env.local.example` - Template with OPENAI_API_KEY and USE_OCR_MOCK
- `.gitignore` - Excludes .env.local, node_modules, .next, build artifacts

## Decisions Made
- Scaffolded into temp directory then copied files — create-next-app@latest does not accept non-empty directories without a --yes flag workaround. Temp scaffold approach preserved all .planning/ and .claude/ files without conflict.
- Used `.gitignore` with explicit `.env.local` entry (not `.env*`) to allow `.env.local.example` to be tracked in git.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `create-next-app@latest` in the current version does not accept non-empty directories even with `echo y |` piped in. Resolution: scaffolded into sibling temp directory `tab-splitter-temp`, then copied scaffold files to project root. Temp directory cleaned up after copy. This is a known behavior change in newer versions of create-next-app.

## User Setup Required

**External services require manual configuration before Plan 01-03 executes.**

Before running `POST /api/ocr`, set the OpenAI API key:

1. Get your key from: https://platform.openai.com -> API keys -> Create new secret key
2. Copy `.env.local.example` to `.env.local`
3. Replace `sk-replace-with-real-key` with your real key
4. Verify: `node -e "require('fs').readFileSync('.env.local','utf8').includes('sk-') && console.log('Key set')"`

Alternatively, set `USE_OCR_MOCK=true` in `.env.local` to skip real API calls during UI development (mock implemented in Plan 01-03).

## Next Phase Readiness
- Server foundation complete — Plan 01-02 (session API endpoints) can proceed immediately
- Plan 01-03 (OCR endpoint) can proceed after OpenAI API key is configured
- All canonical types locked in types/index.ts — Plans 01-02 and 01-03 import from here
- Session store skeleton ready for Plan 01-02 to add create/get/list operations via Route Handlers

---
*Phase: 01-foundation*
*Completed: 2026-02-21*

## Self-Check: PASSED

All claimed files verified:
- server.ts: FOUND
- types/index.ts: FOUND
- lib/session-store.ts: FOUND
- lib/ocr.ts: FOUND
- .env.local.example: FOUND
- .gitignore: FOUND
- .planning/phases/01-foundation/01-01-SUMMARY.md: FOUND

All claimed commits verified:
- f2b4a17 (Task 1: scaffold): FOUND
- 7ceb62d (Task 2: server + types): FOUND
