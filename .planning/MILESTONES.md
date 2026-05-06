# Milestones

## v1.0 MVP (Shipped: 2026-04-10)

**Phases completed:** 5 phases, 16 plans, 19 tasks

**Key accomplishments:**

- Next.js 16 custom HTTP+WebSocket server with noServer routing, Tailwind v4, canonical TypeScript types, and session store/OCR module skeletons ready for Plans 01-02 and 01-03
- In-memory session store with 4-hour TTL plus POST /api/sessions and GET /api/sessions/[id] endpoints, all validated via curl with integer-cents enforcement and Zod schema validation
- GPT-4o Vision receipt OCR endpoint with Zod validation, integer-cent conversion, dev mock mode, and user-friendly error handling — POST /api/ocr fully operational
- `<input capture="environment">` camera capture with canvas compression, OCR POST via useTransition, and three-screen host page state machine
- Tap-to-edit OCR review screen with inline name/price editing, qty stepper, tax/tip sticky footer, and server-side qty expansion for claimable sessions
- QRCodeSVG share screen with clipboard copy fallback — completes the host flow (capture -> review -> share)
- All 12 Phase 2 host-flow requirements confirmed working end-to-end by human tester across 5 verification sequences
- OCR error banner kept visible by removing onComplete from catch block; Add Item auto-focuses name field via autoFocusName prop and newItemId tracking
- ws.on('message') join handler wired in server.ts — participants array updated idempotently and broadcast to all sockets after every join, with globalThis singleton fix ensuring session store is shared across Next.js module contexts
- Two-screen participant page (JoinForm + SessionRoom) with WebSocket presence sync — scan QR, enter name, see items and all joined participants in real time

---

## v1.1 Real Receipts & Polish (Shipped: 2026-04-30)

**Phases completed:** 3 phases (6–8), 6 plans, 59 commits
**Timeline:** 2026-04-10 → 2026-04-30 (20 days)
**Files changed:** 112 (+7,246 / −11,530 lines)

**Key accomplishments:**

- Live GPT-4o Vision OCR wired end-to-end — real API key path functional, smoke-tested on Sidecar Bar & Grill receipt with real items returned
- 3 restaurant receipts (sit-down, bar, long) validated through live OCR pipeline — all items extracted with accuracy suitable for the correction-first workflow
- OCR_PROMPT Pitfall 3 patch applied for quantity handling — junk lines excluded across all receipt types
- Bill total row (items + tax + tip) added to TaxTipFields sticky footer using inline integer arithmetic; active tip preset highlighted blue via isActive detection (DISP-01, UX-01)
- Unfinalize backend: session-store method, WebSocket handler, REST route — all with host-only guard, idempotency, broadcast (UX-02)
- Unfinalize frontend: always-mounted SessionRoom (CSS hidden) keeps WebSocket open; prevFinalizedRef transition detection fires host callback; all participants route back to claiming (UX-02)
- Four surgical CSS fixes: Arial override removed (Geist Sans active), OcrReview heading unified, card shadows on SummaryScreen and OcrReview footer, two-accent color split verified (VIS-01)

---

## v1.2.1 Fare Share Rebrand & Guest Onboarding (Shipped: 2026-05-05)

**Phases completed:** 1 phase (9), 4 plans, ~30 commits
**Timeline:** 2026-05-02 → 2026-05-05 (3 days)
**Files changed:** 96 (+5,782 / −6,578 lines)

**Key accomplishments:**

- Six brand SVGs color-fixed and copied into `public/` (copper `#C75B3D` baked in at filesystem boundary); three PNG raster fallbacks generated via sharp — zero new top-level dependencies
- Eight CSS design tokens at `:root` + Tailwind v4 `@theme inline` bridge; `FareShareLogo` inline-SVG React component with runtime CSS var resolution
- Persistent `HeaderBar` mounted in `app/layout.tsx` above `{children}` — Fare Share lockup visible on all six screens; confirmed by human UAT
- Eight components fully repainted to ink/paper/copper palette — zero legacy `bg-blue-*/bg-indigo-*/bg-amber-*` utilities remain
- All user-visible "Tab Splitter" strings replaced with "Fare Share" across package.json, server.ts, README, app/layout.tsx, and all components
- Guest join page ships locked app description + four-step usage instructions above the name input; host capture "Photograph Receipt" h1 demoted to h2 under hero lockup
- Typography: Plus Jakarta Sans (UI), Instrument Serif (editorial), JetBrains Mono (prices/codes) via `next/font/google`; human UAT confirmed font rendering

---
