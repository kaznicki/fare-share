# Roadmap: Tab Splitter

## Overview

Five phases build Tab Splitter from the server foundation up through the full user workflow: the server and OCR endpoint first, then the host flow (camera, correction, share), then the real-time WebSocket layer and participant join, then item claiming with live sync, and finally the summary math and finalization. Each phase delivers a coherent, testable capability that the next phase builds on top of. The project is complete when every person at a restaurant table can see exactly what they owe — including their proportional share of tax and tip — without doing any mental math.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Custom server, session store, and OCR endpoint running and testable without a UI (completed 2026-02-21)
- [x] **Phase 2: Host Flow** - Host can photograph a receipt, correct OCR output, and share a QR-code join link (completed 2026-02-21)
- [ ] **Phase 3: Real-Time Layer** - Participants can join via the share URL and the WebSocket room broadcasts presence in real time
- [ ] **Phase 4: Item Claiming** - Participants claim items on their phones; all screens update live; shared and duplicate items work correctly
- [ ] **Phase 5: Summary and Finalization** - Host finalizes; every person sees their exact amount owed with proportional tax and tip

## Phase Details

### Phase 1: Foundation
**Goal**: A working server that accepts an image, calls OCR, returns structured line items, and can create and retrieve sessions — all verifiable via curl with no browser required
**Depends on**: Nothing (first phase)
**Requirements**: (none — this phase builds the infrastructure that all requirements depend on)
**Success Criteria** (what must be TRUE):
  1. `POST /api/ocr` accepts a receipt image and returns a JSON array of line items with name, price in cents, and quantity
  2. `POST /api/sessions` accepts items plus tax and tip amounts and returns a session ID and share URL
  3. The session exists in the in-memory store and can be retrieved for 4 hours before auto-expiry
  4. The custom Next.js server starts successfully with the WebSocket server attached to the same HTTP process
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js, Tailwind v4, custom HTTP+WebSocket server, canonical types, module skeletons
- [x] 01-02-PLAN.md — In-memory session store with 4-hour TTL, POST /api/sessions, GET /api/sessions/[id]
- [x] 01-03-PLAN.md — POST /api/ocr calling GPT-4o Vision with Zod validation, dev mock mode

### Phase 2: Host Flow
**Goal**: Host can photograph a receipt, review and correct extracted items (including tax and tip), and share a QR code or link that others can use to join — the complete host-side experience before anyone claims anything
**Depends on**: Phase 1
**Requirements**: OCR-01, OCR-02, OCR-03, OCR-04, CORR-01, CORR-02, CORR-03, CORR-04, CORR-05, SESS-01, SESS-02, SESS-03
**Success Criteria** (what must be TRUE):
  1. Host can take a photo of a receipt using their phone's rear camera from within the app, see a preview, and submit it for OCR
  2. Host sees the extracted item list and can edit any item's name, price, or quantity inline; can delete spurious rows (subtotal lines); can add items manually; can edit tax and tip
  3. Items with quantity greater than 1 appear as separate individually-claimable rows after the host creates the session
  4. Host sees a large QR code and a copyable share link immediately after creating the session
  5. If OCR fails, host sees an error and can proceed by adding items manually
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Install qrcode.react, host page state machine, CameraCapture component (camera input, preview, canvas compression, OCR POST)
- [x] 02-02-PLAN.md — OcrReview screen: ItemRow (tap-to-edit name/price, qty stepper, delete), TaxTipFields (pinned footer), session creation POST
- [x] 02-03-PLAN.md — ShareScreen: QR code (qrcode.react QRCodeSVG) and clipboard copy with fallback
- [x] 02-04-PLAN.md — Human verification of complete Phase 2 host flow (all 12 requirements)
- [ ] 02-05-PLAN.md — Gap closure: fix OCR error banner (OCR-04) and Add Item auto-focus (CORR-03)

### Phase 3: Real-Time Layer
**Goal**: Participants can open the share URL, enter their name, and connect to the live session room; the host and all participants see who is present in real time; reconnecting participants receive complete current state
**Depends on**: Phase 2
**Requirements**: JOIN-01, JOIN-02, SYNC-02
**Success Criteria** (what must be TRUE):
  1. Participant opens the share URL, enters only a name (no account required), and lands on the session item list within a few seconds
  2. All other participants see a "joined" notification when a new person connects, without refreshing
  3. A participant who loses connection (phone screen locks, network switch) rejoins and sees the complete current session state — no claims are missing from their view
**Plans**: TBD

Plans:
- [ ] 03-01: WebSocket server session room management — join, presence broadcast, full-state snapshot on connect
- [ ] 03-02: Participant join UI — name entry screen, WebSocket connect on submit, item list scaffold

### Phase 4: Item Claiming
**Goal**: Participants can claim items on their phones, see shared costs update in real time, and all screens across the table converge to the same claim state within seconds
**Depends on**: Phase 3
**Requirements**: CLAIM-01, CLAIM-02, CLAIM-03, CLAIM-04, SYNC-01
**Success Criteria** (what must be TRUE):
  1. Participant taps an item row to claim it and sees it highlight immediately; tapping again removes the claim
  2. When multiple participants claim the same row, each person's share of that item's price updates in real time on everyone's screen
  3. Two separate rows created from a qty:2 item can be claimed independently by two different participants
  4. Every participant can see who has claimed each item (names shown on each row) so there are no silent disputes
  5. A claim made on one phone appears on all other phones within two seconds
**Plans**: TBD

Plans:
- [ ] 04-01: Claim WebSocket message handlers — append-only Set model, deduplication, full-state broadcast
- [ ] 04-02: Item list UI with tap-to-claim, visual states (unclaimed / mine / shared / theirs), real-time price split display
- [ ] 04-03: Zustand store wiring — WebSocket messages update store; components read from store (prevents React 19 state tearing)

### Phase 5: Summary and Finalization
**Goal**: Host can finalize the session and every participant immediately sees their exact total owed, calculated using proportional tax and tip with cent-accurate math that sums exactly to the receipt total
**Depends on**: Phase 4
**Requirements**: MATH-01, MATH-02, MATH-03, FINAL-01, FINAL-02
**Success Criteria** (what must be TRUE):
  1. Host sees an indicator when all items are claimed and can tap a "Finalize" button to trigger the summary
  2. Each participant sees their individual total — subtotal plus their proportional tax share plus their proportional tip share
  3. Host sees a table of every participant's name and amount owed
  4. The sum of all per-person totals equals the receipt total exactly — no missing or extra cents
  5. If items remain unclaimed at finalization, host chooses to split them among all participants or absorb them as the host
**Plans**: TBD

Plans:
- [ ] 05-01: Bill-splitting math — proportional tax/tip in integer cents, Largest Remainder Method, zero-subtotal guard
- [ ] 05-02: Summary UI — per-person view, host summary table, unclaimed item handler, finalize trigger

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 1. Foundation | 3/3 | Complete | 2026-02-21 |
| 2. Host Flow | 4/5 | Gap closure pending | 2026-02-21 |
| 3. Real-Time Layer | 0/2 | Not started | - |
| 4. Item Claiming | 0/3 | Not started | - |
| 5. Summary and Finalization | 0/2 | Not started | - |
