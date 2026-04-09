# Feature Landscape

**Domain:** Mobile web restaurant bill splitter (item-level claiming, OCR, real-time multi-device)
**Researched:** 2026-02-20
**Overall confidence:** MEDIUM-HIGH (core patterns HIGH, OCR accuracy specifics MEDIUM, Tesseract receipt performance LOW)

---

## Context Note: Stack Conflict to Resolve

The STACK.md researcher recommends **Tesseract.js (client-side OCR)** while ARCHITECTURE.md recommends **server-side Vision API**. These are mutually exclusive. This FEATURES.md covers both approaches honestly and flags the tradeoffs for the roadmap decision.

- **Tesseract.js (client-side):** No API cost, no server needed, privacy-preserving, but raw text output only (requires LLM post-processing for structure), WASM bundle load on first use, mobile performance not benchmarked for v7.
- **Server-side Vision API (GPT-4o or Google Vision):** Best structured output, reliable latency, API cost per scan (~$0.01-0.03/image for GPT-4o), requires backend, images leave device.
- **Recommended for v1:** Server-side Vision API. The manual correction requirement (explicitly requested) implies OCR quality must be high enough that corrections are occasional, not constant. Tesseract on receipts without preprocessing frequently produces garbled output that needs heavy corrections, defeating the purpose.

---

## Table Stakes

Features users expect from an item-level bill splitter. Missing any of these = product feels broken or unusable.

| Feature | Why Expected | Complexity | Notes |
| --- | --- | --- | --- |
| Receipt photo capture | Core premise of the product — no manual entry | Low | `<input type="file" capture="environment">` is sufficient; getUserMedia optional enhancement |
| Automatic line item extraction (OCR) | The differentiating action that saves time vs. manual entry | Medium | Server-side Vision API for structured JSON; see OCR section |
| Manual item correction | OCR is never 100%; users must be able to fix name/price/qty errors before claiming begins | Medium | Per-project requirement (explicitly requested). Inline edit UX |
| Session sharing via QR code and link | No one will type a URL at a restaurant table; QR is essential | Low | qrcode.react SVG component; copy-to-clipboard fallback |
| No-friction participant join | Participants must not need to create accounts or download apps | Low | Just name entry after opening link; confirmed pattern in BillBob, Nowa, Split apps (2025) |
| Claim items by tapping | Core claiming interaction — must be fast and obvious | Low | Large tap targets (≥48px per WCAG 2.2 / NN/G); visual state change on tap |
| Shared item splitting | Multiple people claim same item → cost divided proportionally among claimants | Medium | Fundamental fairness requirement |
| Duplicate item support | Two people ordered the same dish → each gets a separate, claimable instance | Medium | Requires quantity expansion before claiming: Qty 2 of "Burger" becomes two separate claimable rows |
| Live presence / claim updates | See others' claims appear in real-time — prevents double-claiming disputes | Medium | WebSocket broadcast via PartyKit; essential social trust signal |
| Per-person total with proportional tax/tip | The final output everyone needs | Low | Math only; proportional is explicitly required (not equal split) |
| Final summary screen | Each person sees their total clearly before putting away their phone | Low | One screen per person, or a host summary showing everyone |

---

## Differentiators

Features that set Tab Splitter apart from generic bill splitters (Splitwise, Venmo, calculator). Not expected by everyone, but meaningfully valued.

| Feature | Value Proposition | Complexity | Notes |
| --- | --- | --- | --- |
| Item-level OCR (not just total amount) | Splitwise splits the total; this splits by what you actually ate | High (OCR) | The core differentiator vs. all generic bill splitters |
| Real-time collaborative claiming on individual phones | Vs. one person assigning everyone's items — participants own their own claims | Medium | Nowa and Tab apps use this model; builds trust |
| No app download required for participants | Participants use a mobile browser; zero install friction | Low | Confirmed differentiator: BillBob explicitly markets "friends don't need the app" |
| Quantity expansion (not just shared-item toggle) | Correctly handles "2x Burger" → two separate claimable items, not one item split two ways | Medium | Avoids ambiguity between "we shared one burger" vs "we each had a burger" |
| Image preview before OCR | User can retake if photo is blurry before wasting an OCR call | Low | Preview step with retake option; established best practice in document scanning UX |

---

## Anti-Features

Features to explicitly NOT build in v1. Each one either adds disproportionate complexity, contradicts the ephemeral design, or solves a problem the product doesn't have.

| Anti-Feature | Why Avoid | What to Do Instead |
| --- | --- | --- |
| User accounts / login | The product is explicitly ephemeral; accounts add sign-up friction that kills adoption at restaurants | Keep it anonymous with just a name field per session |
| Payment processing (Venmo/PayPal integration) | Adds legal, compliance (PCI), and integration complexity; out of scope per project definition | Show totals only; let people pay each other externally |
| Session history / receipt archive | Requires persistent storage (database), contradicts ephemeral design | Let session expire after 4 hours; done |
| Custom tip entry per person | Tip is inherently proportional to subtotal; giving people different tip rates creates social awkwardness | Distribute tip proportionally, period |
| Even-split mode | Contradicts the core value proposition (item-level fairness) | The product IS item-level splitting; even split is Splitwise territory |
| Edit items after claiming has started | Once claims exist, changing item prices creates cascading confusion | Lock item prices at the point claiming begins; only allow corrections in the pre-claiming review step |
| In-app chat / dispute resolution | Adds major surface area for a feature better served by people talking to each other at the table | Not needed for v1 |
| Barcode/menu scanning | Different problem (ordering) from receipt splitting (paying) | Out of scope |
| Multi-currency | Adds complexity with no clear market need for a restaurant table app | Out of scope |

---

## Feature: Receipt OCR

### Recommended Approach: Server-Side Vision API

**Why:** Receipts contain structured tabular data (item name, qty, price). Vision APIs like GPT-4o can be prompted to return structured JSON directly. Tesseract.js returns raw text requiring regex or LLM post-processing to extract structure — adding another failure point.

**Flow:**

```
1. Host takes photo (browser camera)
2. Image preview shown → host confirms or retakes
3. Image POSTed to /api/ocr (multipart)
4. Server calls Vision API with JSON schema prompt
5. Returns: { items: [{ id, name, price, qty }], subtotal, tax, tip }
6. Host reviews extracted items in inline-edit UI
7. Host can edit name, price, qty for any item
8. Host can delete spurious items (total line, subtotal line)
9. Host confirms → session created
```

**Image capture options (in order of recommendation):**

1. `<input type="file" accept="image/*" capture="environment">` — opens rear camera on mobile, simplest, works everywhere, no HTTPS required for the input itself. This is the right v1 default.
2. `getUserMedia({ video: { facingMode: 'environment' } })` + canvas capture — gives a live viewfinder with crop guidance overlay; requires HTTPS. Worth adding if image quality is a consistent problem.

**Image quality guidance (at capture time):**
- Show a message: "Lay receipt flat, good lighting, hold phone directly above"
- Optionally render a target rectangle overlay on the viewfinder to encourage straightening
- After capture, show a preview with "Looks good / Retake" before sending to OCR

**OCR prompt design (HIGH confidence — pattern from GPT-4o Vision use):**

```
Extract all line items from this restaurant receipt as JSON.
Return ONLY valid JSON, no explanation:
{
  "items": [{ "name": string, "price": number (in dollars), "qty": number }],
  "subtotal": number,
  "tax": number,
  "tip": number
}
Exclude subtotal, tax, and tip from the items array.
If qty is not shown, assume 1.
```

**Failure handling:**
- If OCR returns malformed JSON → fallback to empty item list with error message "Couldn't read receipt. Add items manually."
- Show a manual "Add item" button on the correction screen regardless of OCR success — some receipts are genuinely unreadable.

**Tesseract.js as fallback (LOW confidence on viability):**
Tesseract.js v7 is available and runs in a Web Worker. However, it returns raw text with no structure — extracting line items requires a regex parser or a second LLM call, adding latency and failure modes. The bundle (English lang data) is ~10MB (based on v5's 54% reduction from earlier sizes per official GitHub). Mobile performance on v7 is not officially benchmarked. If server-side API is not desired (cost, privacy), the viable path is: Tesseract.js raw text → LLM parse → structured JSON. Not recommended for v1.

---

## Feature: Manual OCR Correction UI

**This is a v1 requirement (explicitly requested by user).**

### Recommended Pattern: Full-Screen Inline Edit List

After OCR returns items, show the extracted list before creating the session. Host can correct anything.

**UI pattern (confirmed by industry research):**

```
┌─────────────────────────────────────────┐
│ Review your receipt                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [✓] Caesar Salad         $12.00  1  │ │
│ │ [✓] Margherita Pizza     $18.50  1  │ │
│ │ [✓] Chicken Tacos         $9.00  2  │ │ ← qty 2 = expand to 2 rows at session creation
│ │ [✓] Sparkling Water       $4.50  1  │ │
│ │ [trash] Subtotal         $44.00     │ │ ← delete button for non-items
│ └─────────────────────────────────────┘ │
│                                         │
│  + Add item manually                    │
│                                         │
│ Tax: [$  3.85]  Tip: [$  8.00]          │
│                                         │
│      [Create Session →]                 │
└─────────────────────────────────────────┘
```

**Interaction details:**
- Tap any item row → fields become editable inline (name text field, price number field, qty stepper)
- Confirm edit by tapping checkmark or tapping outside the row
- Delete button (trash icon) removes spurious rows (totals, subtotals, headers)
- "Add item manually" opens a bottom sheet / modal with name + price + qty inputs
- Tax and tip are editable fields in case OCR misread them
- Qty stepper: each unit in qty will become a separate claimable row at session creation

**Quantity expansion (critical design decision):**

When the host enters `qty: 2` for "Chicken Tacos $9.00", this means two people each had a taco at $9.00 each — NOT that one $18.00 chicken taco was shared. At session creation, expand:

```
"Chicken Tacos" qty:2 price:$9.00
→
Row A: "Chicken Tacos" qty:1 price:$9.00  (claimable by one person)
Row B: "Chicken Tacos" qty:1 price:$9.00  (claimable by another person)
```

This resolves the duplicate item problem without requiring any special UI — it's just row expansion.

**Shared items (multi-claim):** Any claimable row can be claimed by multiple people. When multiple people claim the same row, the $9.00 is divided equally among claimants. This covers "we split the nachos" scenarios.

---

## Feature: Session Sharing (QR Code + Link)

### Recommended Flow

```
Host creates session → Server returns sessionId
→ App generates share URL: https://[domain]/s/[sessionId]
→ Show QR code (rendered client-side with qrcode.react)
→ Show "Copy link" button below QR
→ Participants scan QR or open link on their own phone
```

**QR code implementation:**

Use `qrcode.react` with SVG output. SVG scales perfectly on all screen densities (HIGH confidence — standard practice). Render at ~200x200px. Display centered with good margin on a clean screen.

```tsx
import { QRCodeSVG } from 'qrcode.react'

<QRCodeSVG
  value={`https://tabsplitter.app/s/${sessionId}`}
  size={200}
  level="M"  // medium error correction — good for screen display
/>
```

**Copy link fallback:** Some participants may have trouble scanning. Always provide a copyable URL below the QR code. Use `navigator.clipboard.writeText()` with a "Copied!" confirmation.

**Short session IDs:** Use `nanoid(8)` for session IDs — generates a human-readable-ish ID that's short enough to type if truly needed, e.g. `V6h9pA2k`. (MEDIUM confidence — nanoid 8 chars provides ~10^14 combinations, more than sufficient for ephemeral sessions.)

---

## Feature: Real-Time Session Sync (WebSocket via PartyKit)

### Recommended Architecture: PartyKit Rooms

Each session is a PartyKit room. All participants connect to the same room. The room broadcasts state changes.

**Why PartyKit over raw ws server:** PartyKit is built on Cloudflare Durable Objects — each room is a persistent, single-threaded instance that guarantees consistent state. No race conditions between simultaneous claims. Free tier (10 live projects, 24h data lifecycle) matches ephemeral session semantics perfectly. (MEDIUM confidence — PartyKit free tier details from official site; Cloudflare acquisition confirmed HIGH confidence.)

**Messages the WebSocket layer handles:**

| Message Type | Direction | Payload | Effect |
| --- | --- | --- | --- |
| `join` | Client → Server | `{ name: string }` | Register participant; broadcast `participant-joined` |
| `claim` | Client → Server | `{ itemId: string, action: "add" \ | "remove" }` | Update room state; broadcast `state-update` |
| `participant-joined` | Server → All | `{ name: string, participants: string[] }` | Refresh participant list |
| `state-update` | Server → All | `{ claims: Record<itemId, string[]> }` | Re-render item list with claim indicators |
| `session-finalized` | Server → All | `{ totals: Record<name, number> }` | Navigate to summary screen |

**State sync strategy: full-state broadcast (not delta)**

When any claim changes, broadcast the complete `claims` object (not just the diff). For a receipt of 20 items with 10 participants, this object is under 2KB — negligible. Full-state broadcast is simpler, eliminates out-of-order message bugs, and eliminates reconciliation logic.

**Reconnection:** PartySocket handles auto-reconnect. On reconnect, the PartyKit room should send full state to the newly connected client via `onConnect`.

```typescript
// PartyKit server (party/session.ts)
export default class SessionRoom implements Party.Server {
  state: { claims: Record<string, string[]>; participants: string[] } = {
    claims: {},
    participants: [],
  }

  onConnect(conn: Party.Connection) {
    // Send full state to new joiner
    conn.send(JSON.stringify({ type: 'state-update', ...this.state }))
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message)
    if (msg.type === 'join') {
      this.state.participants.push(msg.name)
      this.room.broadcast(JSON.stringify({
        type: 'participant-joined',
        participants: this.state.participants,
      }))
    }
    if (msg.type === 'claim') {
      const claimants = this.state.claims[msg.itemId] ?? []
      if (msg.action === 'add' && !claimants.includes(msg.name)) {
        this.state.claims[msg.itemId] = [...claimants, msg.name]
      }
      if (msg.action === 'remove') {
        this.state.claims[msg.itemId] = claimants.filter(n => n !== msg.name)
      }
      this.room.broadcast(JSON.stringify({
        type: 'state-update',
        claims: this.state.claims,
      }))
    }
  }
}
```

---

## Feature: Item Claiming UX

### Core Claim Interaction

Each item row in the participant view must clearly show:
1. What the item is (name + price)
2. Whether the current participant has claimed it (their own visual state)
3. Who else has claimed it (other participants' names/avatars)

**Tap behavior:**
- Unclaimed by me → tap = claim (add my name)
- Claimed by me → tap = unclaim (remove my name)
- Can also be claimed by others simultaneously → shared cost split

**Visual states for an item row:**

```
┌────────────────────────────────────────────────┐
│  Caesar Salad                          $12.00  │  ← unclaimed
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐  ← claimed by me (highlighted)
│ ✓ Caesar Salad                         $12.00  │
│   You                                          │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐  ← shared (claimed by me + Alice)
│ ✓ Caesar Salad                          $6.00  │  ← price shows my share
│   You, Alice                                   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐  ← claimed by Alice, not me
│   Caesar Salad                         $12.00  │
│   Alice                                        │
└────────────────────────────────────────────────┘
```

**Touch target requirements (HIGH confidence — MDN, NN/G, WCAG 2.2):**
- Minimum 48×48px tap target per WCAG 2.2 AA recommendation
- Full row should be tappable, not just a checkbox
- Rows should be at minimum 64px tall to be comfortable for large fingers
- 8px vertical gap between rows to prevent accidental adjacent taps

### Duplicate Item Handling

Receipts show "Qty: 2 / Burger $9.00". This is the OCR output. At session creation, expand quantities into individual rows:

```
Before (OCR output):   Burger  qty:2  $9.00 each
After (claimable rows):
  Burger #1  $9.00  [unclaimed]
  Burger #2  $9.00  [unclaimed]
```

**Why this approach:** Each person can claim "their" burger without needing to understand quantity math. Row expansion is invisible to participants — they just see two "Burger" items. Simple, unambiguous.

**Alternative considered: qty stepper on claim** — allow participants to claim 1 of 2 from a qty:2 item. Rejected: creates race conditions (two people each try to claim "1 of 2"), requires conflict resolution logic, and is harder to explain without instruction.

### Shared Item Handling

Any item row can be claimed by multiple participants simultaneously. When multiple people tap the same row, each person's tap sends a `claim` WebSocket message. The server collects all claimants and broadcasts back. The item price is divided equally among all claimants.

**Shared item discovery UX (the hard part):**

The problem: participant A claims an item, then participant B realizes they also had it and taps to co-claim. Neither person sees the other's intent before they tap. This is fine — the real-time update shows the updated split immediately after both tap.

There is no "request to share" flow needed — co-claiming is first-come-first-served, and the price split updates in real-time for everyone. Anyone can unclaim if they tap again.

**Edge case: disputed items.** If Alice claims the last item and Bob wanted it too, they talk at the table. The app doesn't adjudicate disputes. This is the right scope boundary.

---

## Feature: Tax and Tip Distribution

### Recommended Math: Proportional with Largest Remainder Rounding

**Step 1: Calculate subtotals in integer cents (avoid floating-point errors)**

```typescript
// Store all prices as integer cents internally
// Example: $12.50 → 1250 cents
function splitBill(session: SessionState): Record<string, number> {
  // Calculate each person's item subtotal (in cents)
  const subtotalsCents: Record<string, number> = {}
  for (const item of session.items) {
    const claimants = session.claims[item.id] ?? []
    if (claimants.length === 0) continue
    const shareCents = Math.floor(item.priceCents / claimants.length)
    const remainderCents = item.priceCents % claimants.length
    claimants.forEach((name, i) => {
      subtotalsCents[name] = (subtotalsCents[name] ?? 0) + shareCents
      // Distribute remainder: first claimant(s) get the extra penny
      if (i < remainderCents) subtotalsCents[name]++
    })
  }

  // Total subtotal (in cents)
  const totalSubtotalCents = Object.values(subtotalsCents).reduce((a, b) => a + b, 0)
  if (totalSubtotalCents === 0) return {}

  // Proportional tax and tip distribution (Largest Remainder Method)
  const taxCents = session.taxCents
  const tipCents = session.tipCents
  const names = Object.keys(subtotalsCents)

  // Calculate exact proportional shares (may be fractional)
  const taxShares = names.map(name => (subtotalsCents[name] / totalSubtotalCents) * taxCents)
  const tipShares = names.map(name => (subtotalsCents[name] / totalSubtotalCents) * tipCents)

  // Floor all shares, then distribute remainders to those with largest fractional parts
  const floorAndDistribute = (shares: number[], total: number): number[] => {
    const floored = shares.map(Math.floor)
    const remainder = total - floored.reduce((a, b) => a + b, 0)
    const fractionals = shares.map((s, i) => ({ i, frac: s - floored[i] }))
    fractionals.sort((a, b) => b.frac - a.frac)
    for (let r = 0; r < remainder; r++) floored[fractionals[r].i]++
    return floored
  }

  const taxSharesCents = floorAndDistribute(taxShares, taxCents)
  const tipSharesCents = floorAndDistribute(tipShares, tipCents)

  const totals: Record<string, number> = {}
  names.forEach((name, i) => {
    totals[name] = subtotalsCents[name] + taxSharesCents[i] + tipSharesCents[i]
  })
  return totals  // values are in cents; display as dollars by dividing by 100
}
```

**Why Largest Remainder Method:** This is the standard algorithm for fair distribution of indivisible currency units (confirmed: Betterment engineering blog, POS bill-splitting research). It guarantees that all individual totals sum exactly to the grand total. No pennies disappear or appear.

**Why integer cents:** Floating-point arithmetic in JavaScript (and most languages) produces rounding errors that accumulate across multiple proportional calculations. Storing prices as integer cents eliminates this entirely (confirmed: Bright Inventions POS blog, standard financial engineering practice).

**Tax and tip editable by host:** The manual correction screen (see OCR section) allows the host to edit the detected tax and tip amounts. Some receipts show a suggested tip that wasn't actually paid; host sets the actual tip.

**Tip not entered / $0 tip:** Fully supported — proportional distribution of $0 = $0 each. No special case needed.

---

## Feature: Mobile-First Touch UI Patterns

### Design Principles (HIGH confidence — NN/G, WCAG, web.dev)

**Touch targets:**
- Minimum 48×48px per WCAG 2.2 Level AA
- Full-row tappable areas for item rows (not tiny checkboxes)
- 8px minimum gap between adjacent tap targets
- Bottom-screen actions (session create, finalize) placed in thumb zone

**Bottom thumb zone layout:**
- Primary actions (Claim, Finalize) go in the bottom 1/3 of screen
- Secondary actions (retake photo, edit) go higher where precision is easier
- Bottom sheet modals for secondary flows (add item manually, name entry)

**Safe areas (iOS, Android):**
- Use `env(safe-area-inset-bottom)` in CSS to avoid content under home indicator on iPhone
- Use `padding-bottom: max(16px, env(safe-area-inset-bottom))` on sticky footer bars

**Touch feedback:**
- Active press state: scale(0.97) + background color shift (instant, no animation lag)
- Claim confirmation: brief green flash + checkmark on claimed row
- Use `touch-action: manipulation` on interactive elements to disable 300ms tap delay

**Prevent scroll-while-claiming:**
- Item list can be long; use `overscroll-behavior: contain` on the list container
- Sticky participant header above item list showing claimed count
- Consider a progress bar: "You've claimed X of your items — does this look right?"

**Typography for receipts:**
- Item names: 16px minimum (WCAG mobile minimum)
- Prices: 16px, monospace or tabular-nums to align decimal points
- Participant name chips: 12px minimum with sufficient contrast

**Color coding for claim states:**
- Unclaimed: neutral (gray border, white background)
- Claimed by me: brand color highlight (green/blue), left border accent
- Shared: lighter highlight, multi-avatar display
- Claimed by others: subtle gray tint with name(s) shown
- No color as the ONLY indicator — always pair color with icon or text (accessibility)

---

## Feature: Final Summary

### Host Summary (all participants visible)

```
┌──────────────────────────────────┐
│  Final Tab                       │
│                                  │
│  Alice         $24.37            │
│  Bob           $18.92            │
│  Carol         $31.45            │
│  Dave          $19.26            │
│                                  │
│  Total:        $94.00      ✓     │
└──────────────────────────────────┘
```

### Participant Summary (individual view)

Each participant sees their own total. The host can trigger "finalize" or the app can auto-finalize when all items are claimed.

**Auto-finalize vs. host-finalize:**
- Recommended: host-finalize button. Not all items may be claimed (host may have bought a round separately). Auto-finalize on "all items claimed" is an anti-pattern — it triggers at wrong moment if someone unclaims temporarily.
- Show an indicator to the host: "All items claimed ✓ — ready to finalize"

**Unclaimed items at finalize:**
- If items remain unclaimed at finalize, host is prompted: "3 items unclaimed — split evenly among all, or add to host?"
- Options: "Split among all" or "Host covers them"

**Share individual total:**
- "Share my total" button → native share sheet (`navigator.share()`) with message like "I owe $24.37 for dinner tonight" — works on mobile browsers, degrades to clipboard copy.

---

## Feature Dependencies

```
Camera capture → Image preview → OCR call → Item correction UI → Session creation
Session creation → QR code display → Participant join flow → Claiming UI → Summary
Claiming UI → WebSocket real-time sync → Live claim updates
Item correction (qty expansion) → Duplicate item handling (no extra work needed)
Shared item claiming → Tax/tip proportional math (requires claim counts per item)
```

**Critical path:**

```
OCR → Item correction → Session → Claiming → Summary
```

The WebSocket real-time layer is needed before claiming can be built. Everything else can be mocked or done in sequence.

---

## MVP Recommendation

**Build in this order:**

1. **Camera capture + image preview** — input type file with capture, preview step, retake button
2. **OCR endpoint + item correction UI** — POST /api/ocr → correction screen with inline edit, qty stepper
3. **Session creation + QR code + share link** — POST /api/sessions → QR code screen
4. **Participant name entry + join** — /s/[id] route → name form → WebSocket connect
5. **Item claiming UI (no real-time yet)** — tap to claim, own state only, no broadcast
6. **Real-time WebSocket claim sync** — PartyKit room, broadcast state-update to all
7. **Tax/tip proportional math + summary screen** — client-side calculation, per-person view
8. **Manual "add item" + finalize flow** — host controls, unclaimed item handling

**Defer to v2:**
- Camera viewfinder with overlay (live crop guidance)
- Gamification / progress indicators
- PWA offline support
- Native share integration (`navigator.share()`) — worth adding but not critical path
- Item dispute / override by host

---

## Sources

| Finding | Source | Confidence |
| --- | --- | --- |
| Tab target minimums (48×48px) | [web.dev accessible tap targets](https://web.dev/articles/accessible-tap-targets), [NN/G touch target size](https://www.nngroup.com/articles/touch-target-size/) | HIGH |
| WCAG 2.2 Level AA: 24×24px minimum, 44×44px recommended | [Smashing Magazine accessible tap targets](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) | HIGH |
| 8px minimum gap between tap targets | [web.dev accessible tap targets](https://web.dev/articles/accessible-tap-targets) | HIGH |
| Largest Remainder Method for cent distribution | [Betterment engineering: penny-precise allocation](https://www.betterment.com/engineering/penny-precise-allocation-functions) | HIGH |
| Integer cents for bill splitting accuracy | [Bright Inventions: decimals in POS bill splitting](https://brightinventions.pl/blog/decimals-pos-bill-splitting-restaurants/) | HIGH |
| Proportional tax/tip is fairer than equal split | [FormulaForge: splitting restaurant bills fairly](https://www.formulaforge.org/math/splitting-bills-fairly) | MEDIUM |
| QR + link share, no app required for participants | [BillBob 2026 launch (Startup News)](https://startupnews.fyi/2026/01/23/billbob-launches-tackle-friendflation/) | MEDIUM |
| Tab app item claiming UX | [Tab app website](https://www.tabapp.co/) | MEDIUM |
| Real-time state sync on same page | Inferred from Nowa app real-time attendance, industry pattern | MEDIUM |
| PartyKit room patterns, onConnect/onMessage/broadcast | [PartyKit official docs](https://docs.partykit.io/guides/) | HIGH |
| Tesseract.js v7 release Dec 2025, no structured output | [Tesseract.js GitHub](https://github.com/naptha/tesseract.js) | HIGH |
| Image review before OCR: retake pattern | [Scanbot SDK blog](https://scanbot.io/blog/mobile-ocr-receipt-scanner-for-businesses/) | MEDIUM |
| Inline edit UX pattern for correction tables | [UX Design World: inline editing](https://uxdworld.com/2020/04/22/inline-editing-and-validation-in-tables/) | HIGH |
| Tesseract + LLM post-processing for structured output | [Medium: Tesseract.js + AI](https://medium.com/@ivmarcos/building-a-browser-based-ocr-app-tesseract-js-ai-grok-3a11d9703e4d) | MEDIUM |
| `<input capture="environment">` for rear camera | [MDN file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file) | HIGH |
| `getUserMedia` HTTPS requirement | [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | HIGH |

---

*Features research for: Tab Splitter (mobile web restaurant bill splitter)*
*Researched: 2026-02-20*
