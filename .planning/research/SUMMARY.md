# Project Research Summary

**Project:** Tab Splitter
**Domain:** Mobile web restaurant bill splitter (ephemeral sessions, OCR, real-time multi-user)
**Researched:** 2026-02-20
**Confidence:** MEDIUM-HIGH (architecture and pitfalls HIGH; OCR approach MEDIUM due to unresolved conflict)

---

## Executive Summary

Tab Splitter is an item-level bill splitting app with a well-understood product pattern and a clear technical path — with one architectural decision that must be made before writing a line of code. The core flow is: host photographs receipt, OCR extracts line items, host corrects errors, participants join via QR link and claim their items in real-time on their own phones, and each person sees their proportional total including tax and tip. Two research agents independently reached the same architecture for the real-time layer (WebSocket, in-memory session state, custom Node.js server or PartyKit), the same UI requirements (48px touch targets, quantity expansion, largest-remainder math in integer cents), and the same anti-features to avoid (accounts, payment processing, session history). The research is in strong agreement on everything except OCR.

The single unresolved conflict between the four research files is the OCR engine. STACK.md recommends Tesseract.js (client-side, free, no server, privacy-preserving) while ARCHITECTURE.md and FEATURES.md recommend server-side Vision API (GPT-4o or Google Vision) for significantly better accuracy and structured JSON output. PITFALLS.md surfaced both sides fairly and leaned toward Tesseract.js with the reasoning that the mandatory manual correction step covers accuracy gaps and a server-side swap later is non-disruptive to the UI contract. **The resolution recommended here is: start with server-side GPT-4o Vision API.** The user explicitly listed manual OCR correction as a v1 requirement, which implies OCR must be good enough that corrections are occasional fixes, not constant re-entry. Tesseract on thermal receipt fonts without extensive preprocessing produces garbled output that would make the correction step the primary workflow, not a safety net. The API cost (~$0.01-0.03/image) is acceptable for a product at this stage, and the server is already required for the WebSocket layer — there is no additional infrastructure cost.

The primary technical risks are: (1) the OCR approach must be locked in before implementation begins; (2) all monetary math must use integer cents from day one — floating-point errors in bill-splitting apps immediately destroy user trust; (3) WebSocket session state must send a full snapshot on every reconnect, or mobile network switches silently corrupt claim state; and (4) iOS Safari requires HTTPS for camera access, which must be set up in local development from day one or it causes a late-stage delay. All of these are well-documented and have clear mitigations.

---

## Key Findings

### Recommended Stack

Research produced two stack options depending on the OCR decision. The STACK.md researcher assumed Tesseract.js (client-side) and recommended a Vite SPA + PartyKit architecture with no custom server. ARCHITECTURE.md assumed server-side OCR and recommended Next.js + custom Node.js server + ws library. These architectures are coherent internally but diverge on the server requirement.

**Recommended stack (server-side OCR, adopted here):**

| Technology | Purpose | Why |
|------------|---------|-----|
| Next.js 15 (App Router) | Pages + REST API | Route handlers for `/api/ocr` and `/api/sessions`; custom server escape hatch for WebSockets |
| TypeScript 5.7+ | Type safety | Session state shape bugs caught at compile time; critical when OCR output is unstructured JSON |
| Tailwind CSS 4.x | Styling | v4 Vite plugin; mobile-first utilities; safe-area support out of the box |
| ws (WebSocket library) | Real-time sync | Attached to custom Next.js HTTP server; handles session rooms, claim broadcasts, presence |
| Zustand 5 | Client state | Uses `useSyncExternalStore` — prevents React 19 concurrent mode state tearing with WebSocket updates |
| OpenAI GPT-4o Vision | OCR | Returns structured JSON directly from a prompt; handles thermal receipt fonts better than Tesseract |
| qrcode.react 4.x | QR code | SVG output; scales on all screen densities; more actively maintained |
| Railway / Fly.io / Render | Deployment | Long-lived Node.js process required for WebSockets; Vercel serverless does NOT work |

**If OCR decision is reversed to client-side (Tesseract.js):**
Switch to Vite SPA + PartyKit. No custom server needed. Add nanoid for client-side session ID generation. Add canvas preprocessing (grayscale + contrast filter) before OCR. Tesseract.js v7 runs in a Web Worker. Deployment becomes Cloudflare Pages (free, global CDN).

See STACK.md for full installation commands and version compatibility matrix.

### Expected Features

All four research files agreed on the feature set. The following is the consolidated v1 scope.

**Must have (table stakes) — app feels broken without these:**
- Receipt photo capture via `<input type="file" capture="environment">` (simple, works everywhere, no HTTPS required at the input level)
- OCR line item extraction with structured output (name, price, qty per item)
- Manual item correction UI: inline edit every row, delete spurious rows (subtotal lines), add items manually, edit tax and tip — this is an explicit v1 requirement
- Quantity expansion: `qty: 2 Burger $9.00` becomes two separate claimable rows at session creation
- Session sharing via QR code and copyable link (no account or app install for participants)
- Participant name entry only (no account creation)
- Item claiming by tapping full-row touch targets (48px minimum height, 64px recommended)
- Shared item support: multiple people claim the same row; price splits proportionally
- Real-time claim updates across all participants' phones (WebSocket broadcast)
- Per-person total with proportional tax/tip distribution (Largest Remainder Method, integer cents)
- Final summary: host view (all totals) + individual view (my total)
- Unclaimed item handling at finalize: "split among all" or "host covers them"

**Should have (differentiators):**
- Image preview before OCR call (retake option before spending an API call)
- Image quality guidance overlay at capture time ("lay flat, good lighting")
- OCR confidence flagging: flag low-confidence rows visually for correction
- "Add item manually" button on correction screen (for unreadable receipts)
- Share individual total via native share sheet (`navigator.share()`)
- Session expiry indicator ("session expires in ~4 hours")

**Defer to v2:**
- Live camera viewfinder with crop guidance rectangle (getUserMedia + canvas)
- PWA offline support / installable app
- Camera viewfinder overlay for straightening
- Item dispute / host override after claiming begins
- Gamification / progress indicators during claiming
- In-app chat

**Explicitly out of scope (do not build):**
- User accounts, login, or session history
- Payment processing
- Even-split mode
- Custom tip per person
- Edit items after claiming has started (lock prices at session creation)
- Multi-currency

See FEATURES.md for full UX wireframes and interaction details.

### Architecture Approach

The recommended architecture is a single Node.js process running Next.js (via custom server) alongside a ws WebSocket server, with in-memory session state in a `Map`. REST handles mutation requests (create session, OCR). WebSocket handles real-time broadcast only. This is the correct separation: REST is testable, retryable, and idempotent; WebSocket is narrow and focused on broadcasting state changes to all sockets in a session room.

**Major components:**

1. **Custom HTTP server (`server.ts`)** — Creates the HTTP server, attaches ws WebSocket server, passes all other requests to Next.js. This is the foundational piece that must be built first, as changing from standard Route Handlers to a custom server is disruptive after the fact.
2. **In-memory session store (`Map<sessionId, SessionState>`)** — Holds items, participants, and claims for the session lifetime (4-hour TTL via setTimeout). No database required. Redis is the correct upgrade path if horizontal scaling is ever needed.
3. **POST /api/ocr** — Accepts image upload, calls GPT-4o Vision with a structured JSON prompt, returns `{ items: [{id, name, price, qty}], subtotal, tax, tip }`. Isolated and independently testable.
4. **POST /api/sessions** — Creates session in store, returns sessionId and share URL.
5. **WebSocket server (ws)** — Session rooms via Map of socket sets. On connect: send full state snapshot. On `claim-item`: append claimant to Set (deduplication), broadcast full claims object to all sockets in session.
6. **Host UI** — Camera capture → image preview → OCR → correction screen → QR/share screen.
7. **Participant UI** — Name entry → item list with claim indicators → real-time updates from WebSocket.
8. **Summary UI** — Per-person totals calculated client-side from session state (pure function, no API call).

**Deployment constraint (HIGH confidence, verified):** Vercel serverless does not support persistent WebSocket connections. Deploy on Railway, Fly.io, Render, or DigitalOcean App Platform.

See ARCHITECTURE.md for full data flow diagrams and code patterns for each component.

### Critical Pitfalls

All pitfalls from PITFALLS.md are worth reading. The top 7 with highest consequence if missed:

1. **Floating-point money math** — Store all prices as integer cents from day one. `$12.99` → `1299`. Only convert to dollars at display. One floating-point bug in a bill-splitting app destroys user trust immediately. Write a test: sum of all per-person totals must equal receipt total exactly.

2. **Last-write-wins on simultaneous claims** — Model claims as `claims[itemId] = Set<participantName>` server-side. Adding a claimant is an append to a Set — idempotent and race-safe. Never model claims as single-owner. Full state broadcast (not delta) after each claim eliminates out-of-order message bugs.

3. **WebSocket reconnect without full state snapshot** — On every new WebSocket connection (both new joins and reconnects), immediately send the complete current session state. iOS Safari drops WebSocket connections on screen lock. Clients that miss events get permanently stale state unless the server always sends a full snapshot on connect.

4. **iOS Safari + HTTPS for getUserMedia** — Camera access requires HTTPS. iOS Safari does not treat local network IP addresses as secure contexts. Set up a Cloudflare Tunnel or ngrok from day one of development. If `getUserMedia` is not used (using `<input capture="environment">` instead), this risk is lower but still relevant if the viewfinder UI is ever added.

5. **iOS Safari keyboard + fixed-position buttons** — Virtual keyboard on iOS does not shrink the layout viewport. Fixed-position CTAs at the bottom of the screen disappear behind the keyboard. Use `100dvh` (dynamic viewport height) and flow-positioned buttons. Test on a real iPhone, not Chrome DevTools emulation.

6. **Duplicate claim by same person** — Optimistic UI + network lag = user taps twice. Server must deduplicate using a Set before storing. UI should disable claim button while a claim is in-flight, and use server-authoritative state (not optimistic local state) as the source of truth.

7. **AI-generated state logic accumulates structural debt** — Write `types.ts` by hand before generating any state logic. Keep types as the single source of truth. Use small, targeted prompts ("implement `splitItemCents`") not large prompts ("implement session state management"). Review generated code for store/component boundary violations before accepting.

---

## Implications for Roadmap

ARCHITECTURE.md's suggested build order is validated by FEATURES.md's feature dependency graph. Both converge on the same sequence. The phases below map directly to that order with pitfall mitigations layered in.

### Phase 1: Foundation — Custom Server + Session Store + OCR Endpoint

**Rationale:** The custom server shape is the most disruptive thing to change later. It must be locked in first. All other phases depend on it. The OCR decision must also be locked in during this phase — do not start Phase 2 without a confirmed OCR approach.

**Delivers:** Working server that accepts an image, calls OCR, returns structured items. No UI yet. Testable via curl.

**Addresses:** Receipt photo capture, OCR extraction, session creation API.

**Implements:** `server.ts` custom server, `POST /api/ocr`, `POST /api/sessions`, in-memory session store with 4-hour TTL, session ID generation (`crypto.randomUUID()`).

**Must avoid:** Starting with Next.js Route Handlers assuming WebSockets can be added later (they cannot without the custom server). Starting with floating-point prices (use cents from day one). Do not skip setting up HTTPS tunnel for local dev.

**Research flag:** LOW — architecture is well-documented. Custom Next.js server is the official documented escape hatch. OCR via GPT-4o Vision is a standard API call. No additional phase research needed.

**Critical pre-phase decision:** Confirm OCR approach (server-side Vision API recommended here). Document the choice. Do not start implementation until this is resolved.

---

### Phase 2: Host Flow — Camera, OCR Correction UI, QR Share

**Rationale:** The host flow is the entry point of the product. Without it, nothing else can be tested end-to-end. Build it early so OCR quality is validated against real receipts before the participant flow is built on top of it.

**Delivers:** Host can photograph a receipt, see extracted items, correct errors, and share a QR code/link. Session exists in memory. No participants yet.

**Addresses:** Receipt photo capture, OCR correction UI (explicit v1 requirement), quantity stepper, tax/tip edit, session sharing, QR code.

**Must avoid:** Treating OCR output as final — the correction screen must always be shown, never skipped. Not expanding quantities at session creation (qty:2 Burger must become two claimable rows). Skipping image preview before OCR call.

**Touch target note:** Every interactive element in the correction UI must be 44px minimum, 64px recommended for list rows.

**Research flag:** LOW for QR code and session sharing (standard patterns). MEDIUM for OCR correction UX — refer to FEATURES.md wireframes. No additional research phase needed.

---

### Phase 3: Real-Time Layer — WebSocket Server + Participant Join

**Rationale:** WebSocket is gated by the session store (Phase 1) and must be in place before the claiming UI can be built. Participant join is the first thing that exercises the real-time path.

**Delivers:** Participants can open the share URL, enter a name, and connect to the WebSocket session room. Presence broadcast works (other participants see who joined). Full state snapshot sent on connect.

**Addresses:** No-friction participant join, live presence, WebSocket reconnect safety.

**Must avoid:** Not sending full state snapshot on every connection (reconnect pitfall). Not deduplicating participants by name (same person rejoining creates duplicate entries).

**Research flag:** LOW — WebSocket + custom server is a documented pattern with working code in ARCHITECTURE.md.

---

### Phase 4: Item Claiming UI — With Real-Time Sync

**Rationale:** Claiming is the core user interaction. Build it after WebSocket is proven working (Phase 3) so real-time behavior can be verified from the start.

**Delivers:** Participants see the item list and can tap to claim. Claims broadcast to all participants instantly. Shared item logic works (multiple claimants, split price shown).

**Addresses:** Claim by tapping, shared item splitting, duplicate item support (quantity-expanded rows), live claim updates.

**Must avoid:** Allowing floating-point in claim calculations (enforce cents model). Last-write-wins claim bug (Set-based server model). Touch targets below 44px. Not disabling the claim button while in-flight (duplicate claim pitfall). Not showing real-time price split on shared items.

**Research flag:** LOW — claiming UX patterns and real-time broadcast are well-documented. FEATURES.md has detailed visual state definitions for item rows (unclaimed / claimed-by-me / shared / claimed-by-others).

---

### Phase 5: Summary + Finalization

**Rationale:** Final phase — all data is in place (session state with complete claims). Summary is a pure derivation step with no new infrastructure.

**Delivers:** Host can finalize. Each participant sees their individual total. Unclaimed items are handled. Totals sum exactly to receipt total.

**Addresses:** Per-person totals with proportional tax/tip, finalize flow, unclaimed item handling, share individual total.

**Must avoid:** Division by zero when someone claimed nothing (`totalSubtotal === 0` guard). Largest-remainder algorithm not implemented (pennies don't sum to receipt total). Not giving host a "finalize" button (auto-finalize on "all claimed" is an anti-pattern — someone may temporarily unclaim).

**Research flag:** LOW — math is fully specified in FEATURES.md with working TypeScript implementation. Largest Remainder Method is the documented algorithm (Betterment engineering blog source).

---

### Phase Ordering Rationale

- Phase 1 must come first because the custom server shape is the most disruptive change — it affects how all Route Handlers are written. Every subsequent phase runs on this foundation.
- Phase 2 (host flow) comes before participant flow because real receipts need to be tested against the OCR pipeline early. If OCR quality is unacceptable with the chosen engine, Phase 1 needs a revision before the full UI is built on top of it.
- Phase 3 (WebSocket) must precede Phase 4 (claiming) because claiming requires real-time broadcast.
- Phase 5 (summary) is last because it is a pure derivation from completed session state — no new infrastructure.
- Phases 2 and 3 could be partially parallelized if multiple developers are working: the static host UI (camera capture, correction screen) does not require WebSocket to be complete.

### Research Flags

Phases needing deeper research during planning:
- None identified. All five phases use well-documented patterns with verified sources.

Phases with standard patterns (skip research-phase):
- All phases — OCR via Vision API, custom Next.js server, ws WebSocket library, in-memory session state, and proportional bill-splitting math all have official documentation and working code examples in the research files.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core framework choices (Next.js, TypeScript, Tailwind, ws, Zustand) are HIGH confidence. OCR engine recommendation is MEDIUM — GPT-4o Vision accuracy on receipts is from training knowledge, not a controlled test against real receipts. |
| Features | HIGH | Table stakes, UX patterns, math algorithms all sourced from official documentation (MDN, WCAG, Betterment engineering blog). OCR correction UI is an explicit user requirement. |
| Architecture | HIGH | All architectural claims verified: custom server (official Next.js docs), WebSocket vs SSE (MDN), Vercel limitation (Vercel docs), in-memory Map pattern (standard practice). |
| Pitfalls | HIGH | Floating-point money math, iOS Safari behavior, WebSocket reconnect — all verified sources. OCR accuracy specifics (Tesseract vs Vision API accuracy gap) are MEDIUM confidence based on third-party comparisons. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address During Implementation

1. **OCR accuracy validation** — The single biggest unknown is how well GPT-4o Vision performs on actual restaurant receipts from the user's typical dining environments. Validate by photographing 5-10 real receipts in the first implementation sprint before building the full correction UI. If accuracy is consistently above 90% of items correct, the correction UI serves as a safety net. If it's below 80%, the correction UI becomes the main workflow — which is still functional but changes the product feel.

2. **PartyKit vs custom ws server** — STACK.md recommends PartyKit (free tier, managed, Cloudflare Durable Objects). ARCHITECTURE.md recommends raw ws on a custom server. If the decision is made to switch to a Vite SPA architecture (i.e., OCR is reversed to Tesseract.js client-side), PartyKit becomes the clearly correct choice — it eliminates the server entirely. If staying with server-side OCR (recommended), the custom ws server is already in the same process and adds no deployment complexity.

3. **Tesseract.js as fallback path** — If GPT-4o Vision API costs become a concern at scale, the UI contract (array of `{ id, name, price, qty }`) is identical regardless of OCR source. The swap from server-side Vision API to Tesseract.js (or vice versa) is isolated to `POST /api/ocr` and does not require UI changes.

4. **Session state persistence on server restart** — In-memory Map means a server restart drops all active sessions. For a restaurant-table use case (sessions last under 4 hours, low traffic), this is acceptable for v1. If the server is deployed on a platform that restarts frequently (e.g., free tier with cold starts), this could cause session loss. Use a platform that keeps the process alive (Railway, Fly.io) rather than one with cold-start serverless.

---

## Sources

### Primary (HIGH confidence — official docs)
- https://nextjs.org/docs/app/guides/custom-server — Custom server pattern, WebSocket support, static optimization trade-off
- https://nextjs.org/docs/app/building-your-application/deploying — Vercel serverless WebSocket limitation (confirmed)
- https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API — WebSocket bidirectional communication
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia — getUserMedia HTTPS requirement, facingMode
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file — `capture="environment"` attribute
- https://www.w3.org/WAI/WCAG21/Understanding/target-size.html — Touch target minimums
- https://web.dev/articles/accessible-tap-targets — 48px tap target guidance
- https://www.betterment.com/engineering/penny-precise-allocation-functions — Largest Remainder Method for cent distribution
- https://brightinventions.pl/blog/decimals-pos-bill-splitting-restaurants/ — Integer cents for bill-splitting

### Secondary (MEDIUM confidence — community/vendor sources)
- https://tailwindcss.com/blog/tailwindcss-v4 — Vite plugin, zero config setup
- https://blog.cloudflare.com/cloudflare-acquires-partykit/ — PartyKit acquisition, Durable Objects architecture
- https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier/ — PartyKit free tier
- https://github.com/naptha/tesseract.js — Tesseract.js v7 release (Dec 2025), WASM SIMD support
- https://medium.com/ixor/comparing-tesseract-ocr-with-google-vision-ocr-for-text-recognition-in-invoices-bddf98f3f3bd — Accuracy gap between Tesseract and Vision APIs
- https://startupnews.fyi/2026/01/23/billbob-launches-tackle-friendflation/ — Competing product patterns (no app install for participants)
- https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report — AI-assisted code structural drift
- https://frontstuff.io/how-to-handle-monetary-values-in-javascript — JavaScript floating-point money math

### Tertiary (LOW confidence — validate if decision changes)
- Tesseract.js WASM bundle size (~10-15MB) and mobile latency on thermal receipts — training knowledge, not benchmarked for v7
- GPT-4o Vision accuracy on restaurant receipts specifically — training knowledge, validate with real receipts in Phase 1

---
*Research completed: 2026-02-20*
*Ready for roadmap: yes*
