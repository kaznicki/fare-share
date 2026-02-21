# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Everyone pays exactly what they ordered (plus proportional tax and tip) without doing any mental math
**Current focus:** Phase 2 (Host Flow) — Plans 01 and 03 complete, moving to remaining plans

## Current Position

Phase: 2 of 5 (in progress)
Plan: 3 of 3 in current phase (complete)
Status: Executing
Last activity: 2026-02-21 — Plan 02-03 complete (ShareScreen with QR code and clipboard copy)

Progress: [████░░░░░░] 38% (5 of 13 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~3.0 min
- Total execution time: ~13 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | ~11 min | ~3.7 min |
| 2. Host Flow | 2/3 | ~3 min | ~1.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (5 min), 01-02 (2 min), 01-03 (4 min), 02-01 (2 min), 02-03 (1 min)
- Trend: Fast and consistent

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
- **OCR: response_format json_object + Zod:** Used response_format: json_object + ReceiptSchema.parse() instead of zodResponseFormat for vision inputs — safer for probabilistic image understanding outputs.
- **OCR lazy client:** getOpenAI() singleton prevents "No API key" error when module imported before app.prepare() loads .env.local.
- **OCR math:** Math.round(dollars * 100) for cent conversion — $12.99 * 100 = 1298.9999... rounds to 1299 correctly; never Math.floor or parseInt.
- **OCR mock mode:** USE_OCR_MOCK=true env var bypasses GPT-4o API, returns deterministic 4-item fixture for cost-free UI development.
- **Three-screen host flow state machine:** app/host/page.tsx owns screen state ('capture' | 'reviewing' | 'share') via conditional rendering — no router navigation, keeps ephemeral OCR data in memory without URL serialization.
- **OCR-04 error path:** CameraCapture catch block calls onComplete with empty OcrResult { items: [], taxCents: 0, tipCents: 0 } — host advances to manual correction rather than being blocked on capture screen.
- **Stub components without 'use client':** OcrReview.tsx and ShareScreen.tsx stubs intentionally omit 'use client' — Plans 02 and 03 own that directive when implementing the real components.
- **ShareScreen QR card wrapper:** White card (`bg-white rounded-2xl shadow-md p-4`) wraps QRCodeSVG to ensure scan contrast against any page background. UI theme stays flexible.
- **Clipboard copy pattern:** navigator.clipboard.writeText() + document.execCommand fallback — covers Safari and non-HTTPS localhost preview environments.

### Pending Todos

None yet.

### Blockers/Concerns

- OCR accuracy on real restaurant receipts is unvalidated. Validate before building Phase 2 correction UI by photographing 5-10 real receipts. If accuracy is below 80%, the correction step becomes the primary workflow rather than a safety net — the product still functions but feels heavier.
- OpenAI API key must be set in .env.local before real OCR testing. Mock mode (USE_OCR_MOCK=true) covers all UI development without the key.

## Session Continuity

Last session: 2026-02-21T17:44:34Z
Stopped at: Completed 02-host-flow/02-03-PLAN.md — ShareScreen with QR code and clipboard copy
Resume file: None
