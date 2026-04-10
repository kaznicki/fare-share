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
