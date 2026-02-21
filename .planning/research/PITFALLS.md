# Domain Pitfalls

**Project:** Tab Splitter
**Domain:** Mobile web receipt-splitting app (ephemeral sessions, OCR, real-time multi-user)
**Researched:** 2026-02-20

---

## Critical Pitfalls

Mistakes that cause rewrites, data corruption, or UX so bad the app is unusable.

---

### Pitfall 1: Floating Point Money Math

**What goes wrong:** Using JavaScript's native `number` type for price arithmetic causes rounding errors. `0.1 + 0.2 === 0.30000000000000004`. When splitting a $12.99 item three ways, you get `4.3300000000000005` per person. Multiply this across 10 items and the sum displayed differs from the receipt total by visible cents. Users immediately distrust the app.

**Why it happens:** JavaScript uses IEEE 754 binary floating-point for all numbers. Some decimal fractions cannot be represented exactly in binary, so arithmetic accumulates rounding error.

**Consequences:** Totals that visually don't add up. Loss of user trust. The sum of individual totals doesn't equal the receipt total.

**Prevention:** Store all monetary values as integers in cents (e.g., `$12.99` → `1299`). Perform all arithmetic on cents. Only convert to dollars for display at the final rendering step.

```typescript
// WRONG
const share = 12.99 / 3  // 4.3300000000000005

// RIGHT
const priceInCents = 1299
const shareInCents = Math.floor(priceInCents / 3)  // 433
const display = (shareInCents / 100).toFixed(2)    // "4.33"
```

Apply the "banker's rounding" (round-half-to-even) or simply floor the split and give the leftover cent(s) to the first claimant. The total must always equal the sum of parts exactly — verify this invariant in tests.

**Detection:** Write a test: sum of all per-person totals must equal receipt total. Any floating point error makes this test flaky.

---

### Pitfall 2: Simultaneous Item Claims — Last Write Wins

**What goes wrong:** Two participants tap the same item at nearly the same time. Both clients send a WebSocket `claim-item` message simultaneously. The server processes both, last one wins, first claimant sees their selection but it reverts a moment later when the broadcast arrives. This feels like a bug to the user whose claim was dropped.

**Why it happens:** WebSocket messages from different sockets arrive in arbitrary order on the server. In-memory mutation without locking means both writes succeed and the last one overwrites the first. The first claimant's UI briefly shows the item as claimed, then the broadcast resets it.

**Consequences:** Silent data loss. User claims an item, pays attention to another part of the UI, and never notices the claim was dropped. They're billed for items they didn't claim, or not billed for items they did claim.

**Prevention:** Design claims as **append-only** (multiple claimants allowed per item is the correct model for shared items). Never model claims as "one owner per item." The data structure should be `claims[itemId] = string[]` — a list of claimants. Adding a claimant is always safe to do twice (use a Set server-side, deduplicate by participant name).

For exclusive claims: use a server-side optimistic lock. The server checks whether the item is already fully claimed before accepting a new exclusive claim and sends back a rejection message if it was lost.

```typescript
// Server-side claim handler (safe append model)
const claimants = new Set(session.claims[itemId] ?? [])
claimants.add(participantName)
session.claims[itemId] = [...claimants]
// Broadcast the new full list — all clients converge to same state
```

**Detection:** Two browser tabs, same session, tap the same item within 50ms of each other. Both should appear as claimants.

---

### Pitfall 3: WebSocket Session State Lost on Reconnect

**What goes wrong:** A participant's phone switches from WiFi to cellular, or the screen locks for 30 seconds (iOS Safari drops WebSocket on screen lock — confirmed GitHub issue). When they reconnect, they rejoin the session but their prior claims are missing from their local UI view until a full state sync arrives — or never arrive if the server doesn't send a full-state snapshot on reconnect.

**Why it happens:** WebSocket connections are not persistent across network changes. Each reconnect is a new connection. If the server only broadcasts deltas (incremental changes), a reconnecting client misses all events that happened while disconnected.

**Consequences:** Participant sees a stale item list. They may re-claim items or miss items already claimed. The final totals are wrong for them, even though the server has correct state.

**Prevention:** On every new WebSocket connection (join event), the server must immediately send a **full state snapshot** — the complete current session state including all items and all current claims. Never assume a connecting client has prior state.

```typescript
wss.on('connection', (ws, req) => {
  const sessionId = getSessionId(req)
  registerParticipant(sessionId, ws)

  // Always send full state on join — handles both new joins and reconnects
  const session = sessionStore.get(sessionId)
  ws.send(JSON.stringify({ type: 'session-snapshot', session }))
})
```

Add exponential backoff reconnection logic on the client. PartySocket handles this automatically; raw WebSocket implementations must implement it manually.

**Detection:** Load session on mobile Chrome. Lock the phone for 45 seconds. Unlock. Verify the item list is accurate.

---

### Pitfall 4: Tesseract.js WASM Bundle Size on Mobile Networks

**What goes wrong:** Tesseract.js downloads approximately 10–15 MB of WASM and language model data on first use. On a mobile network at a restaurant (often congested WiFi or cellular), this download stalls the app for 15–45 seconds before OCR can begin. The user sees a spinner with no progress indication and abandons.

**Why it happens:** Tesseract.js ships a full WASM build of the Tesseract C++ engine plus language training data (~2MB for English minimum, more for other languages). This cannot be reduced below its architectural floor.

**Consequences:** First-run experience is poor. If the restaurant has weak signal, the OCR step never completes.

**Prevention options:**
1. **Show explicit progress**: Use Tesseract.js's `progress` callback to display a download/init progress bar. Never show a generic spinner.
2. **Preload the WASM**: Start the Tesseract worker initialization as soon as the app loads, in the background, before the user taps "Scan Receipt." By the time they tap, it may already be ready.
3. **Server-side OCR fallback**: If Tesseract init takes >10 seconds, offer a fallback to server-side OCR via a Vision API. This is the escalation path if client-side OCR proves unacceptable in practice.
4. **Cache the worker**: Tesseract.js caches the WASM in IndexedDB after first download. Show "Preparing OCR — this only happens once" on first use.

**Detection:** Load the app on a throttled 3G connection (Chrome DevTools → Slow 3G). Time how long from "Scan Receipt" tap to OCR being ready.

---

### Pitfall 5: OCR Misreads Thermal Receipt Fonts

**What goes wrong:** Restaurant receipts are printed on thermal printers using monospace fonts at low DPI. Tesseract's baseline accuracy (without preprocessing) on thermal receipt paper is significantly lower than on clean printed documents. Common misreads: `1` → `l`, `0` → `O`, `$8.99` → `$899`, `BURGER` → `8URGER`. Prices get mangled and item names are garbled.

**Why it happens:** Tesseract is trained on diverse document fonts. Thermal receipt fonts are narrow, low-contrast, and often faded or smudged. The low resolution of the printed output loses character distinction. Additionally, receipts have two-column layouts (item name left, price right) that Tesseract's default page segmentation mode handles poorly.

**Consequences:** Wrong prices shown to users. Users don't notice the error and overpay or underpay. The manual correction step catches this, but only if users are paying attention.

**Prevention:**
1. **Canvas preprocessing before OCR**: Apply grayscale + contrast boost (Canvas filter `grayscale(100%) contrast(150%)`) before passing to Tesseract. This significantly improves accuracy on thermal paper.
2. **Explicit page segmentation**: Set `tesseract_pageseg_mode = 6` (single block of text) or `4` (single column) rather than auto-detect, which tries to parse the receipt as a multi-column document incorrectly.
3. **Price validation regex**: After OCR, validate that each extracted price matches `/^\d+\.\d{2}$/`. Flag any item where the price fails validation as "needs correction."
4. **Mandatory review step**: Treat OCR as a first-draft, never as final. The host must always review the item list before sharing the session. Make this explicit in the UI: show a "Review Items" screen before generating the share link.
5. **Make editing easy**: Every item name and price must be individually editable inline. OCR errors are expected; make correction low-friction.

**Detection:** Photograph 5 real restaurant receipts with different lighting conditions. Count OCR error rate before and after preprocessing.

---

### Pitfall 6: iOS Safari getUserMedia Requires HTTPS — Including Local Development

**What goes wrong:** `navigator.mediaDevices.getUserMedia` is only available in secure contexts (HTTPS or localhost). iOS Safari enforces this strictly and additionally does not allow `localhost` as a secure context for real-device testing over local network (e.g., `192.168.x.x:5173`). The camera access silently fails or throws `NotAllowedError`. Developers test on desktop Chrome (where `localhost` works) and don't discover the iOS camera failure until near the end of development.

**Why it happens:** The secure context restriction is a deliberate browser security decision. iOS Safari's definition of "secure context" does not extend to IP addresses, even on local networks.

**Consequences:** The entire receipt scanning flow is broken on real iPhones during development. This can delay a milestone if discovered late.

**Prevention:**
1. **Use HTTPS from day one for real-device testing**: Use `cloudflare tunnel` (free) or `ngrok` to expose the Vite dev server over HTTPS. Add this to the project README immediately.
2. **Test on a real phone, not just desktop browser DevTools**: Desktop DevTools device emulation does not emulate iOS Safari's camera permission behavior.
3. **Handle the error gracefully**: If `getUserMedia` fails (permission denied, not available), fall back to `<input type="file" accept="image/*" capture="environment">`. This `<input>` opens the native camera app on iOS and Android without requiring `getUserMedia` and works in any context.

```typescript
// Fallback chain
async function captureReceipt(): Promise<File | null> {
  if (navigator.mediaDevices?.getUserMedia) {
    return await captureViaStream()  // custom camera UI
  }
  return await captureViaFileInput()  // native camera, no custom UI
}
```

**Detection:** Run `vite --host` and open `http://192.168.x.x:5173` in iOS Safari. Camera should fail. Then add tunnel and verify it works.

---

### Pitfall 7: iOS Safari Keyboard Pushes Fixed-Position Elements

**What goes wrong:** On iOS Safari, when a user taps a text input (e.g., entering their name to join a session, or editing an OCR-corrected item name), the virtual keyboard opens. iOS Safari does not shrink the viewport height — instead, it pushes the content up. Elements positioned with `position: fixed` behave unpredictably: fixed footers ("Done" buttons, "Continue" CTAs) either overlap the keyboard or disappear entirely off-screen.

**Why it happens:** iOS Safari's viewport model differs from other browsers. The visual viewport shrinks when the keyboard opens, but the layout viewport does not. `position: fixed` elements are anchored to the layout viewport, not the visual viewport. This is a long-standing Safari bug with partial mitigations but no clean fix.

**Consequences:** Users cannot see or tap the "Continue" button after entering their name because the button is behind the keyboard. They get stuck.

**Prevention:**
1. **Use `dvh` (dynamic viewport height) instead of `100vh`**: `100dvh` responds to the visual viewport size (including keyboard). Supported in iOS Safari 16+.
2. **Avoid `position: fixed` for action buttons near the bottom**: Place "Continue" buttons inside the document flow, not fixed to the bottom.
3. **Use `env(safe-area-inset-bottom)` for bottom padding** on modern iPhones to account for the home indicator.
4. **Listen to `window.visualViewport.resize`** for programmatic adjustments when the CSS approach is insufficient.
5. **Test on a real device** — viewport bugs do not reproduce in Chrome DevTools device emulation.

```css
/* Use dynamic viewport units */
.screen-container {
  min-height: 100dvh;  /* shrinks when keyboard opens */
}

/* Account for safe area */
.bottom-cta {
  padding-bottom: max(env(safe-area-inset-bottom), 1rem);
}
```

**Detection:** On a real iPhone, tap the name input field on the join screen. The "Join" button must remain visible and tappable above the keyboard.

---

## Moderate Pitfalls

Mistakes that cause significant bugs or user confusion but don't require rewrites.

---

### Pitfall 8: Rounding When Splitting Shared Items Doesn't Sum Exactly

**What goes wrong:** When an item priced at $10.00 is split among 3 people, each person's share is $3.33... If you floor to cents, each gets $3.33 and the total is $9.99 — one cent short. Do this for multiple shared items and the total is off by several cents. Users compare the app total to the receipt and see a discrepancy.

**Why it happens:** Integer division of prices doesn't distribute evenly when there are indivisible remainders.

**Prevention:** Use the "largest remainder" algorithm for distributing shared item costs. Give the remainder cents to the first claimant(s). Ensure the invariant: sum of all shares == item price, always, for every item.

```typescript
function splitItemCents(priceInCents: number, claimants: string[]): Record<string, number> {
  const base = Math.floor(priceInCents / claimants.length)
  const remainder = priceInCents % claimants.length
  return Object.fromEntries(
    claimants.map((name, i) => [name, i < remainder ? base + 1 : base])
  )
}
// sum of all values always === priceInCents
```

**Detection:** Test: split $10.00 three ways. Sum must equal $10.00.

---

### Pitfall 9: Person Who Ordered Nothing Gets Proportional Tax/Tip Share

**What goes wrong:** If someone joins a session but claims no items (they were a guest not eating, or they only had water), and tax/tip is distributed proportionally based on subtotal, dividing by a zero subtotal produces `NaN` or `Infinity`. The app crashes or shows broken totals.

**Why it happens:** `proportion = personSubtotal / totalSubtotal`. If `personSubtotal === 0` and the total is non-zero, proportion is `0` (fine). But if `totalSubtotal === 0` (no items claimed by anyone yet), division by zero occurs.

**Consequences:** `NaN` propagates through all totals, displaying `NaN` in the UI.

**Prevention:**
1. Guard against division by zero: if `totalSubtotal === 0`, each person's tax/tip share is also 0.
2. For participants with zero subtotal: their proportional share is 0 — they owe nothing in tax/tip. This is the correct behavior.
3. Run the totals calculation defensively:

```typescript
const proportion = totalSubtotal === 0 ? 0 : personSubtotal / totalSubtotal
```

**Detection:** Create a session, have one person join but claim no items. Verify totals show $0.00 for them, not NaN.

---

### Pitfall 10: PartyKit Session ID Expiry vs Active Restaurant Session

**What goes wrong:** PartyKit's free tier clears data every 24 hours. However, the more common scenario is that a restaurant session runs fine within 24 hours, but the Durable Object "hibernates" after all WebSocket connections close. If the host closes their browser tab and reopens it (to show the QR code again), they may find the session state is gone.

**Why it happens:** Cloudflare Durable Objects enter a hibernated state when idle. While data persists across hibernation within the 24-hour window, if the object is evicted from the edge, the in-memory state is lost. For PartyKit, the "room" state persists as long as the room is live; behavior after all connections close depends on the PartyKit server code.

**Prevention:**
1. Explicitly store session state in PartyKit's durable storage (`this.storage.put(...)`) not just in-memory variables in the Party class. Durable storage survives hibernation within the 24h window.
2. Implement a `onStart()` hook in the PartyKit server to re-hydrate state from durable storage when the room wakes up from hibernation.
3. Set a clear session expiry in the UI: "This session expires in 4 hours" — set user expectations.

**Detection:** Create a session, disconnect all clients (close all tabs), wait 5 minutes, reopen the session URL. State should still be present.

---

### Pitfall 11: Claiming the Same Item Twice (Duplicate Claim) by the Same Person

**What goes wrong:** A participant taps an item, the UI optimistically marks it as claimed, network lag delays the server confirmation broadcast, and they tap again. They are now listed as a claimant twice for the same item. Their split share is calculated once per appearance in the claimants array, so they get charged double.

**Why it happens:** Optimistic UI updates + delayed server broadcasts + impatient tapping.

**Prevention:**
1. Deduplicate claimants at the server using a `Set` before storing — `new Set([...existing, newClaimant])`. Duplicate names in the array never happen server-side.
2. Disable the claim button in the UI while a claim is in-flight (pending confirmation from server).
3. Use the server-authoritative broadcast as the source of truth for UI state — don't count a claim as complete until the `item-claimed` broadcast arrives.

---

### Pitfall 12: QR Code Not Scannable in Restaurant Lighting

**What goes wrong:** Restaurants are often dim. The host shows their phone screen with the QR code to other diners. The ambient light is low, other participants' phone cameras have trouble focusing, and the QR code is too small or too low-contrast to scan reliably.

**Why it happens:** QR codes need good contrast and sufficient size to scan. Small screens, low brightness, and reflective screen glass make scanning difficult in low light.

**Prevention:**
1. **Make the QR code large**: The QR code should be at minimum 200x200px rendered on-screen, ideally filling most of the viewport width.
2. **Maximize screen brightness**: Add a `screen.orientation.lock` call and encourage users to set max brightness, or auto-enable it via `window.screen.keepAwake` (if available).
3. **Always show the link alongside the QR code**: "Or share this link: [URL]". Tap-to-copy. This is the fallback when QR scanning fails.
4. **Use high error correction**: `qrcode.react` supports `level` prop — use `level="H"` (30% error correction) for robustness at the cost of density.

---

### Pitfall 13: React State Tearing with Concurrent Mode + Real-Time Updates

**What goes wrong:** React 19's concurrent mode can interleave renders. If Zustand state updates arrive from WebSocket messages mid-render, some components may read the old state and some read the new state within the same render pass — "tearing." A participant's item list shows some items as claimed and others as unclaimed, but the underlying state is consistent. This creates a visual flash of incorrect state.

**Why it happens:** External stores (Zustand) updated outside React's render cycle can be read at different points during a concurrent render pass, producing inconsistent snapshots.

**Prevention:** Zustand 5 uses `useSyncExternalStore` internally, which was specifically designed to solve this. Use Zustand 5 — don't implement custom store subscriptions or use `useEffect` to sync WebSocket state into `useState`. Always go through Zustand's store for WebSocket-delivered state.

```typescript
// WRONG — susceptible to tearing
useEffect(() => {
  socket.on('item-claimed', (data) => {
    setItems(prev => updateItems(prev, data))  // useState — tears in concurrent mode
  })
}, [])

// RIGHT — Zustand 5 handles sync correctly
const { updateItemClaim } = useSessionStore()
useEffect(() => {
  socket.on('item-claimed', (data) => {
    updateItemClaim(data)  // Zustand store — uses useSyncExternalStore
  })
}, [])
```

---

## Minor Pitfalls

Small but sharp edges that waste debugging time.

---

### Pitfall 14: Touch Target Size Below 44px

**What goes wrong:** Item claim buttons that are too small cause frequent mis-taps. Users accidentally claim the wrong item or can't reliably tap the correct one. This is worse because items are in a list — adjacent items are close together.

**Prevention:** All interactive elements must be at minimum 44x44px tap target (WCAG 2.5.5 AA). Use Tailwind's `min-h-[44px] min-w-[44px]` or `p-3` on buttons. For list items, make the entire row tappable, not just a small button within it.

---

### Pitfall 15: Session URL Leaks Who Ordered What

**What goes wrong:** The session share URL, if it encodes state or uses a predictable ID, could allow someone outside the table to join and see what others ordered. Predictable IDs (`/s/1234`) let someone guess active sessions.

**Prevention:** Use `nanoid` (default: 21 characters, URL-safe, cryptographically random) for session IDs. A 21-character nanoid has ~3×10^29 possible values — brute force is not feasible.

---

### Pitfall 16: OCR Confidence Score Ignored

**What goes wrong:** Tesseract.js returns a confidence score (0–100) for each recognized word. Ignoring this means garbled text passes through to the item list without any warning to the user.

**Prevention:** After OCR, flag any item where the average word confidence is below 70. Show a visual warning ("Low confidence — please verify") on those rows. Make them visually distinct (yellow highlight, warning icon).

---

### Pitfall 17: AI-Generated State Logic Accumulates Structural Debt

**What goes wrong:** When using Claude (or any LLM) to generate session state logic, claim calculations, or WebSocket message handlers across multiple prompts, the code starts to drift. Each generation is locally coherent but globally inconsistent. Type definitions diverge between files. The same concept gets three different shapes in different handlers. State updates that should be in the Zustand store end up scattered in component `useEffect` hooks. By Phase 4, the codebase requires a state logic rewrite rather than incremental extension.

**Why it happens:** AI-generated code prioritizes local functional correctness over global architectural coherence (confirmed by IEEE Spectrum and Qodo research, 2025). Context windows miss the full picture. Each prompt generates something that "works" in isolation but creates integration debt.

**Consequences:** 39% increase in cognitive complexity in agent-assisted repositories (CodeRabbit 2025 study). Rewrites are required when the claim calculation touches three incompatible state shapes.

**Prevention:**
1. **Define a canonical schema before writing any state logic** and put it in a single `types.ts` file. Never let AI generate types — write them once by hand and reference them in every prompt.
2. **Encode state transitions as pure functions first**, get them unit-tested, then wire up UI. AI code generation on tested pure functions stays coherent.
3. **Review generated code for store/component boundary violations** before accepting. State that belongs in Zustand must not live in component-local state.
4. **Prefer small, focused prompts** ("implement the `splitItemCents` function") over large prompts ("implement all the session state management").

---

### Pitfall 18: Tesseract.js vs Server-Side OCR — Architectural Decision Must Be Made Early

**What goes wrong:** The STACK.md and ARCHITECTURE.md in this project currently disagree: STACK.md recommends Tesseract.js (client-side), ARCHITECTURE.md recommends a server-side Vision API. This is an unresolved fork that blocks implementation. Choosing one path late (after UI is built around the other) requires refactoring the capture flow.

**Why it matters:** Client-side OCR means no server, simpler deployment, privacy-preserving, but WASM bundle overhead and lower accuracy. Server-side OCR means better accuracy, adds server cost and complexity, requires sending images off-device.

**Recommendation (opinionated):** Start with Tesseract.js + canvas preprocessing because it matches the Vite SPA + PartyKit stack (no server to maintain). Build the mandatory manual correction step. If user testing shows OCR accuracy is unacceptable, the correction step already exists — swap the OCR engine for server-side Vision API as an enhancement, not a rewrite. The UI contract (array of `{ id, name, price }`) is the same regardless of OCR source.

**Resolution:** Lock this decision in Phase 1 before writing any OCR code. Document which approach was chosen and why in a decision log.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| OCR implementation | Tesseract WASM download blocks first use | Preload worker on app boot; show progress |
| OCR implementation | Thermal font misreads | Canvas grayscale/contrast filter before OCR |
| Camera capture | getUserMedia fails on iOS Safari HTTP | HTTPS tunnel (Cloudflare Tunnel) from day one |
| Session creation | Floating point price math | Cents-integer model from day one, not retrofitted |
| Real-time sync | Last-write-wins on simultaneous claims | Append-only Set model; full state snapshot on reconnect |
| Participant join UI | Keyboard hides CTA button on iOS | `dvh` units; flow-positioned buttons |
| Claim UI | Touch targets too small in list | 44px minimum; full-row tap area |
| Summary math | Zero subtotal person causes NaN totals | Guard division; person with $0 items gets $0 tax/tip |
| Summary math | Shared item splits don't sum exactly | Largest-remainder algorithm; cents arithmetic |
| All phases | AI-generated state logic drifts | Hand-write `types.ts` first; small targeted prompts |
| Deployment | Vercel serverless won't support WebSocket | Railway/Fly.io for any custom server variant |

---

## Sources

- [Tesseract.js performance (mobile timing)](https://github.com/naptha/tesseract.js/blob/master/docs/performance.md) — MEDIUM confidence
- [Tesseract OCR improving quality guide](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html) — HIGH confidence
- [Faded/torn receipt OCR with preprocessing](https://medium.com/@jaelin_75015/faded-torn-rotated-receipt-ocr-with-image-preprocessing-1fb03c036504) — MEDIUM confidence
- [JavaScript floating point rounding errors](https://www.robinwieruch.de/javascript-rounding-errors/) — HIGH confidence
- [How to handle monetary values in JavaScript](https://frontstuff.io/how-to-handle-monetary-values-in-javascript) — HIGH confidence
- [MDN getUserMedia — permission errors and error types](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — HIGH confidence
- [iOS Safari position:fixed and keyboard](https://medium.com/@im_rahul/safari-and-position-fixed-978122be5f29) — MEDIUM confidence
- [Fix mobile keyboard overlap with dvh](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) — MEDIUM confidence
- [WebSocket reconnection strategies](https://oneuptime.com/blog/post/2026-01-24-websocket-reconnection-logic/view) — MEDIUM confidence
- [Safari drops WebSocket on screen lock (graphql-ws GitHub)](https://github.com/enisdenjo/graphql-ws/discussions/290) — MEDIUM confidence
- [React state tearing and useSyncExternalStore](https://frontendmastery.com/posts/the-new-wave-of-react-state-management/) — HIGH confidence
- [AI-assisted code creates 1.7x more issues (CodeRabbit 2025)](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report) — MEDIUM confidence
- [AI coding degrades — IEEE Spectrum](https://spectrum.ieee.org/ai-coding-degrades) — MEDIUM confidence
- [Accessible touch target sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/) — HIGH confidence
- [WCAG 2.5.5 target size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — HIGH confidence
- [Bill splitting algorithm (OpenGenus)](https://iq.opengenus.org/algorithm-behind-bill-splitting-app/) — MEDIUM confidence
