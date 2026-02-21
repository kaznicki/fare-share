# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Everyone pays exactly what they ordered (plus proportional tax and tip) without doing any mental math
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (in progress)
Plan: 2 of 3 in current phase
Status: Executing
Last activity: 2026-02-21 — Plan 01-02 complete (session store + REST API endpoints)

Progress: [███░░░░░░░] 15% (2 of 13 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~3.5 min
- Total execution time: ~7 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/3 | ~7 min | ~3.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (5 min), 01-02 (2 min)
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

- **OCR engine:** Server-side GPT-4o Vision API (not Tesseract.js). Manual correction is an explicit v1 requirement, implying OCR must be good enough that corrections are occasional fixes — Tesseract on thermal receipt fonts produces too many errors. Server is already required for WebSockets so no extra infrastructure cost. If GPT-4o costs are unacceptable, the UI contract (`{ id, name, price, qty }`) is identical and the swap to Tesseract is isolated to `POST /api/ocr`.
- **Real-time layer:** Custom `ws` WebSocket server attached to Next.js custom HTTP server (not PartyKit). Server-side OCR requires a server anyway; custom ws adds no extra infrastructure and avoids PartyKit's free-tier 10-project limit.
- **Deployment target:** Railway, Fly.io, or Render — NOT Vercel. Vercel serverless does not support persistent WebSocket connections.
- **Money math:** All prices stored as integer cents from day one. Floating-point arithmetic is never used for monetary values. Largest Remainder Method for shared item and tax/tip distribution.
- **Claims model:** Append-only Set per item (`claims[itemId] = Set<participantName>`). No single-owner model. Full-state broadcast after every change. Full snapshot sent on every WebSocket connect (handles reconnects).
- **WebSocket routing:** noServer: true mode — routes upgrade events manually; /ws goes to wss, /_next/webpack-hmr delegated to Next.js HMR handler, all other paths destroyed.
- **Dev script:** tsx watch server.ts (not next dev) — bypasses Next.js built-in server to ensure custom server with WebSocket runs.
- **getData() helper pattern:** Store exposes getData() to strip non-serializable fields (sockets Set) before JSON serialization — route handlers never destructure manually.
- **Double validation (Zod + store boundary):** Zod rejects floats at API boundary; store's Number.isInteger check provides defense-in-depth for non-HTTP callers (WebSocket handlers, test scripts).
- **No edge runtime:** Session store uses Map and setTimeout — incompatible with edge runtime. No `export const runtime = 'edge'` in session API routes.

### Pending Todos

None yet.

### Blockers/Concerns

- OCR accuracy on real restaurant receipts is unvalidated. Validate in Phase 1 by photographing 5-10 real receipts before building the full correction UI. If accuracy is below 80%, the correction step becomes the primary workflow rather than a safety net — the product still functions but feels heavier.
- OpenAI API key required before Plan 01-03 can be fully tested. User must set OPENAI_API_KEY in .env.local.

## Session Continuity

Last session: 2026-02-21T17:04:40Z
Stopped at: Completed 01-foundation/01-02-PLAN.md — session store, POST /api/sessions, GET /api/sessions/[id]
Resume file: None
