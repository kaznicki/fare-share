# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-20)

**Core value:** Everyone pays exactly what they ordered (plus proportional tax and tip) without doing any mental math
**Current focus:** Phase 3 (Real-Time Layer) — Plan 01 complete (join handler + session store fix), Plan 02 pending

## Current Position

Phase: 3 of 5 (in progress)
Plan: 1 of 2 in current phase (complete)
Status: Phase 3 in progress — Plan 02 (participant page) is next
Last activity: 2026-02-22 — Plan 03-01 complete (ws.on('message') join handler + globalThis session store fix)

Progress: [████░░░░░░] 54% (7 of 13 total plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~3.5 min
- Total execution time: ~21 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 3/3 | ~11 min | ~3.7 min |
| 2. Host Flow | 4/4 | ~8 min | ~2.0 min |
| 3. Real-Time Layer | 1/2 | ~8 min | ~8 min |

**Recent Trend:**
- Last 5 plans: 02-01 (2 min), 02-03 (1 min), 02-04 (5 min), 02-05 (5 min), 03-01 (8 min)
- Trend: Slightly longer — Phase 3 required diagnosing module isolation bug

*Updated after each plan completion*
| Phase 02-host-flow P02 | 2 | 2 tasks | 4 files |
| Phase 02-host-flow P04 | 5 | 1 task | 0 files |
| Phase 02-host-flow P05 (gap closure) | 5 | 2 tasks | 3 files |
| Phase 03-real-time-layer P01 | 8 | 1 tasks | 2 files |

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
- **OCR math:** Math.round(dollars * 100) for cent conversion — ### Decisions

2.99 * 100 = 1298.9999... rounds to 1299 correctly; never Math.floor or parseInt.
- **OCR mock mode:** USE_OCR_MOCK=true env var bypasses GPT-4o API, returns deterministic 4-item fixture for cost-free UI development.
- **Three-screen host flow state machine:** app/host/page.tsx owns screen state ('capture' | 'reviewing' | 'share') via conditional rendering — no router navigation, keeps ephemeral OCR data in memory without URL serialization.
- **OCR-04 error path (corrected in 02-05):** CameraCapture catch block calls only setError() — onComplete() is exclusively in the "Continue anyway" button onClick. This keeps the error banner visible until the host consciously chooses to proceed.
- **Stub components without 'use client':** OcrReview.tsx and ShareScreen.tsx stubs intentionally omit 'use client' — Plans 02 and 03 own that directive when implementing the real components.
- **ShareScreen QR card wrapper:** White card (`bg-white rounded-2xl shadow-md p-4`) wraps QRCodeSVG to ensure scan contrast against any page background. UI theme stays flexible.
- **Clipboard copy pattern:** navigator.clipboard.writeText() + document.execCommand fallback — covers Safari and non-HTTPS localhost preview environments.
- [Phase 02-host-flow]: qty expansion (CORR-05) in POST /api/sessions via flatMap — session store receives only qty:1 items
- [Phase 02-host-flow]: Tap-to-edit pattern: editingField state in ItemRow, autoFocus input, onBlur commits; never contenteditable
- [Phase 02-host-flow]: TaxTipFields uses key prop trick (key={taxCents/tipCents}) to reset defaultValue after blur — no controlled input needed
- [Phase 02-host-flow gap closure]: autoFocusName prop + newItemId state pattern — parent tracks last-added item id, passes autoFocusName only to that row, clears on first onChange; avoids re-focus on blur/re-render
- [Phase 03-real-time-layer]: globalThis singleton for session store: Next.js App Router module isolation requires globalThis.__tabSplitterSessionStore to share Map across route handlers and WebSocket server

### Pending Todos

None yet.

### Blockers/Concerns

- OCR accuracy on real restaurant receipts is unvalidated. Validate before building Phase 2 correction UI by photographing 5-10 real receipts. If accuracy is below 80%, the correction step becomes the primary workflow rather than a safety net — the product still functions but feels heavier.
- OpenAI API key must be set in .env.local before real OCR testing. Mock mode (USE_OCR_MOCK=true) covers all UI development without the key.

## Session Continuity

Last session: 2026-02-22T00:26:37Z
Stopped at: Completed 03-real-time-layer/03-01-PLAN.md — WebSocket join handler + session store globalThis fix. Phase 3 Plan 1 of 2 complete. Ready for Plan 03-02 (participant page).
Resume file: None
