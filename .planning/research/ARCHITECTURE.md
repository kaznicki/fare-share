# Architecture Patterns

**Project:** Tab Splitter
**Researched:** 2026-02-20
**Overall confidence:** HIGH (MDN, Next.js official docs, Vercel official docs verified)

---

## Recommended Architecture

A split-process Node.js deployment: Next.js handles pages and REST API, a WebSocket server (running in the same Node.js process via a custom server) handles real-time events. Session state lives in-memory on the WebSocket server. OCR runs server-side via an AI Vision API call.

```
┌─────────────────────────────────────────────────────┐
│                  Client (Browser)                    │
│                                                      │
│  [Camera Input]  [Session Page]  [Claim UI]          │
│       │               │              │               │
│   multipart/form  WebSocket      WebSocket           │
│       │           (receive)       (send)             │
└───────┼───────────────┼──────────────┼───────────────┘
        │               │              │
        ▼               ▼              ▼
┌──────────────────────────────────────────────────────┐
│              Node.js Custom Server                   │
│                                                      │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │   Next.js App   │   │    WebSocket Server (ws)  │ │
│  │                 │   │                          │ │
│  │  GET /          │   │  Session rooms (Map)     │ │
│  │  GET /s/[id]    │   │  Broadcast on claim      │ │
│  │  POST /api/ocr  │   │  Join / leave events     │ │
│  │  POST /api/     │   │                          │ │
│  │    sessions     │   │                          │ │
│  └────────┬────────┘   └──────────────────────────┘ │
│           │                                          │
└───────────┼──────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  OCR Vision API │
   │  (e.g. OpenAI   │
   │   gpt-4o or     │
   │   Google Vision)│
   └─────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js pages** | Renders host flow (scan, review items), participant flow (join, claim), final summary | REST API endpoints, WebSocket client |
| **POST /api/sessions** | Creates session, stores parsed items, returns sessionId + share URL | In-memory session store |
| **POST /api/ocr** | Accepts image upload, forwards to Vision API, returns structured line items | OCR Vision API |
| **WebSocket server (ws)** | Manages per-session rooms, broadcasts `item-claimed`, `participant-joined`, `session-updated` events | All browser clients in session |
| **In-memory session store** (Map) | Holds session state: items, participants, claims — for the lifetime of the session | WebSocket server, REST API handlers |
| **Browser camera module** | Captures receipt image via `<input capture>` or `getUserMedia` + canvas | POST /api/ocr |
| **OCR Vision API** | Extracts structured line items from receipt image | POST /api/ocr handler |

---

## Data Flow

### Flow 1: Host scans receipt

```
1. Host opens app → GET /
2. Host captures photo
   - Mobile: <input type="file" accept="image/*" capture="environment">
   - OR: getUserMedia() → canvas.toBlob() → FormData
3. Browser POST /api/ocr (multipart, image blob)
4. Server forwards image to Vision API
5. Server returns: { items: [{id, name, price, qty}] }
6. Host reviews/corrects items in UI
7. Browser POST /api/sessions { items, tipAmount, taxAmount }
8. Server creates session:
   - sessionId = crypto.randomUUID()
   - stores { items, participants: {}, claims: {} } in Map
   - returns { sessionId, shareUrl }
9. Browser renders QR code + copyable link for shareUrl
```

### Flow 2: Participant joins

```
1. Participant opens shareUrl → GET /s/[sessionId]
2. Browser renders name-entry form
3. Participant enters name → browser opens WebSocket to /ws?session=[id]
4. Server registers participant in session store:
   - participants[socketId] = { name, joinedAt }
5. Server broadcasts { type: "participant-joined", name } to all sockets in session
6. Browser renders item list with live claim indicators
```

### Flow 3: Real-time item claiming

```
1. Participant taps item → browser sends WS message:
   { type: "claim-item", itemId, participantName, share: "full" | "split" }
2. Server validates claim (item exists)
3. Server mutates session state: claims[itemId].push(participantName)
4. Server broadcasts to ALL sockets in session:
   { type: "item-claimed", itemId, claimedBy: [...] }
5. All browsers update item's claim display immediately
```

### Flow 4: Summary calculation

```
1. Host or auto-trigger fires "finalize"
2. Server (or client) calculates per-person totals:
   - Each person's subtotal = sum of claimed item prices
     (split items: price / number of claimants)
   - Each person's tax share = (subtotal / total_subtotal) * total_tax
   - Each person's tip share = (subtotal / total_subtotal) * total_tip
   - Total owed = subtotal + tax_share + tip_share
3. Each person sees their own total owed
```

---

## Patterns to Follow

### Pattern 1: WebSocket + REST Hybrid (not WebSocket-only)

**What:** REST for mutation requests that don't need real-time feedback (session creation, OCR). WebSocket only for live state sync.

**When:** Always — the host creates a session once; that doesn't need real-time. Only item claims need broadcast.

**Why:** Simpler mental model. REST endpoints are easy to test and debug. WebSocket channel is narrow and focused.

**Example:**

```typescript
// REST: session creation (Next.js Route Handler)
// app/api/sessions/route.ts
export async function POST(req: Request) {
  const { items, tipAmount, taxAmount } = await req.json()
  const sessionId = crypto.randomUUID()
  sessionStore.set(sessionId, {
    items,
    tipAmount,
    taxAmount,
    participants: {},
    claims: {},
    createdAt: Date.now(),
  })
  return Response.json({ sessionId, shareUrl: `/s/${sessionId}` })
}
```

```typescript
// WebSocket: item claiming (ws server in custom server.ts)
ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString())
  if (msg.type === 'claim-item') {
    const session = sessionStore.get(msg.sessionId)
    const existing = session.claims[msg.itemId] ?? []
    session.claims[msg.itemId] = [...existing, msg.participantName]
    broadcastToSession(msg.sessionId, {
      type: 'item-claimed',
      itemId: msg.itemId,
      claimedBy: session.claims[msg.itemId],
    })
  }
})
```

### Pattern 2: Custom Next.js Server for WebSockets

**What:** A `server.ts` file that creates an HTTP server, attaches the `ws` WebSocket server to it, and passes all other requests to Next.js.

**When:** Whenever the app needs WebSockets alongside Next.js pages.

**Why:** Next.js Route Handlers do not support persistent WebSocket connections (verified: official Next.js Route Handler docs show only standard HTTP methods are supported). The custom server pattern is the officially documented Next.js escape hatch. Source: https://nextjs.org/docs/app/guides/custom-server

**Example:**

```typescript
// server.ts
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import next from 'next'

const app = next({ dev: process.env.NODE_ENV !== 'production' })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res))
  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws, req) => {
    const sessionId = new URL(req.url!, 'http://localhost')
      .searchParams.get('session')
    // register participant, handle messages, broadcast
  })

  httpServer.listen(3000)
})
```

**Trade-off:** Disables Next.js Automatic Static Optimization. Acceptable for this app since session pages are fully dynamic.

**Deployment constraint (HIGH confidence — Vercel official docs):** Vercel serverless does not support persistent WebSocket connections. Deploy on Railway, Fly.io, Render, DigitalOcean App Platform, or any platform running a long-lived Node.js process. Source: https://nextjs.org/docs/app/building-your-application/deploying

### Pattern 3: In-Memory Session Store (single-node)

**What:** A `Map<sessionId, SessionState>` held in the Node.js process memory.

**When:** Single-server deployment, ephemeral sessions (no persistence required).

**Why:** The project explicitly states sessions are disposable with no history. An in-memory Map has zero operational overhead and sub-millisecond read/write. Redis is unnecessary unless multi-server horizontal scaling is required, which is out of scope for v1.

**Expiry:** Set a 4-hour TTL via `setTimeout` on session creation — longer than any restaurant meal.

```typescript
setTimeout(() => {
  sessionStore.delete(sessionId)
  broadcastToSession(sessionId, { type: 'session-expired' })
}, 4 * 60 * 60 * 1000)
```

### Pattern 4: Server-Side OCR

**What:** Upload image to the server, call a Vision API (OpenAI GPT-4o or Google Cloud Vision), return structured JSON.

**When:** Always for this app.

**Why:** Client-side OCR (Tesseract.js) on mobile browsers requires downloading a large WASM model and is slow on mid-range phones. Server-side Vision APIs have better receipt parsing accuracy and consistent latency regardless of the client device. (Confidence on Tesseract.js limitations: LOW — from training knowledge. Recommendation to use server-side: HIGH — architectural best practice for compute-heavy tasks on mobile.)

**Recommended:** OpenAI GPT-4o with a structured prompt requesting JSON output. GPT-4o Vision handles receipt line items, quantities, and prices well.

```typescript
// app/api/ocr/route.ts
export async function POST(req: Request) {
  const formData = await req.formData()
  const image = formData.get('image') as File
  const base64 = Buffer.from(await image.arrayBuffer()).toString('base64')

  const result = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64}` }
        },
        {
          type: 'text',
          text: 'Extract all line items from this restaurant receipt as JSON: ' +
                '{ items: [{ name, price, qty }], subtotal, tax, tip }. ' +
                'Return only valid JSON, no explanation.'
        }
      ]
    }]
  })
  return Response.json(JSON.parse(result.choices[0].message.content!))
}
```

### Pattern 5: Proportional Tax/Tip Calculation

**What:** Each person's tax and tip share is proportional to their food subtotal, not a flat equal split.

**When:** Final summary step.

**Why:** Documented project requirement. Fairer when orders vary in price.

**Can be computed purely client-side** from shared session state (no extra API call needed).

```typescript
function calculateTotals(session: SessionState): Record<string, number> {
  const personSubtotals: Record<string, number> = {}

  for (const [itemId, claimants] of Object.entries(session.claims)) {
    const item = session.items.find(i => i.id === itemId)!
    const share = item.price / claimants.length
    for (const name of claimants) {
      personSubtotals[name] = (personSubtotals[name] ?? 0) + share
    }
  }

  const totalSubtotal = Object.values(personSubtotals).reduce((a, b) => a + b, 0)
  const totals: Record<string, number> = {}

  for (const [name, subtotal] of Object.entries(personSubtotals)) {
    const proportion = subtotal / totalSubtotal
    totals[name] = subtotal
      + proportion * session.taxAmount
      + proportion * session.tipAmount
  }
  return totals
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side OCR with Tesseract.js

**What:** Running Tesseract.js in the browser to avoid a server-side API dependency.

**Why bad:** Tesseract.js WASM bundle is large (~10-15MB), unacceptable over mobile data. Processing time on mid-range phones is slow (10-30 seconds). Receipt thermal-print fonts have lower accuracy with Tesseract than cloud Vision models. (Confidence: LOW on specific numbers — flag for validation if reconsidered.)

**Instead:** POST the image to `/api/ocr` and call a cloud Vision API server-side every time.

### Anti-Pattern 2: WebSocket-Only Architecture

**What:** Tunneling all operations (session creation, OCR result delivery) through WebSocket messages.

**Why bad:** WebSocket connections are stateful and can drop. Session creation via REST is idempotent and retryable. OCR is a request/response operation — not a broadcast. Mixing these with real-time events on one channel creates complex message ordering and retry logic.

**Instead:** REST for request/response (create session, OCR), WebSocket for real-time broadcast only.

### Anti-Pattern 3: Deploying to Vercel Serverless with WebSockets

**What:** Deploying this app on Vercel's default serverless deployment expecting WebSockets to work.

**Why bad:** Vercel Functions are stateless — each invocation is independent. They do not maintain persistent connections. Serverless instances spin up for a request and then spin down. There is no persistent WebSocket support in Vercel's serverless model. (Verified: Vercel docs describe their compute model; serverless instances handle one request then terminate.)

**Instead:** Deploy on Railway, Fly.io, Render, or DigitalOcean App Platform — platforms that run a long-lived Node.js process.

### Anti-Pattern 4: Database Writes on Every Item Claim

**What:** Writing session state to Postgres or another database on every item claim event.

**Why bad:** Over-engineered for an ephemeral use case. Every item claim triggers a write, adding latency to real-time operations. The project explicitly rules out history and persistence.

**Instead:** In-memory Map with TTL expiry. If multi-server scaling is required later, Redis is the correct migration path.

### Anti-Pattern 5: SSE-Only (Server-Sent Events)

**What:** Using SSE for all real-time communication.

**Why bad:** SSE is server-to-client only. Participants need to *send* claim events to the server (client-to-server). With SSE, claims would require a separate HTTP POST per action, and the server would then push the broadcast. This is workable but adds complexity and an extra round-trip per claim. (Verified: MDN SSE docs confirm unidirectional server-to-client communication only.)

**Instead:** WebSocket provides bidirectional communication over a single persistent connection, which is the right fit for a claim event flowing client → server → all clients.

---

## Suggested Build Order

Dependencies drive this order: each phase unlocks the next.

| Step | Component | Why This Position | Depends On |
|------|-----------|-------------------|------------|
| 1 | **Project scaffold + custom server** | Everything else runs on this foundation. Custom server shape is disruptive to change later. | Nothing |
| 2 | **In-memory session store + session REST API** (`POST /api/sessions`, `GET /api/sessions/[id]`) | WebSocket server needs sessions to exist before it can join them. REST is testable without a browser. | Custom server |
| 3 | **WebSocket server** (join room, handle `claim-item`, broadcast) | Real-time layer. Requires session store to be in place. | Session store |
| 4 | **OCR endpoint** (`POST /api/ocr`) | Isolated and testable independently. Can be mocked during UI development. | Server |
| 5 | **Host UI** (camera capture, item review, share/QR code) | Needs OCR endpoint + session creation API. | OCR endpoint, POST /api/sessions |
| 6 | **Participant UI** (join by name, item list, claim buttons with live updates) | Needs WebSocket server running for live updates. | WebSocket server, GET /api/sessions/[id] |
| 7 | **Summary UI** (per-person totals display) | Needs completed claim state. Tax/tip math is pure client-side from session state. | Participant UI, WebSocket state |
| 8 | **Session expiry + cleanup** | Production hygiene. Add before first real use. | Session store |

**Phase ordering rationale:**

- The custom server (step 1) defines the deployment shape — changing from Route Handlers to a custom server after the fact is disruptive. Lock it in first.
- REST session API (step 2) before WebSocket (step 3) — the session store schema emerges from the REST contract, then the WebSocket layer reads from it.
- OCR (step 4) is intentionally isolated so host UI (step 5) can be developed with a static fixture JSON while OCR accuracy is being tuned.
- Participant UI (step 6) is gated on WebSocket but independent of OCR — these can be parallelized if multiple developers are working.
- Summary (step 7) is pure derivation — no new infrastructure, just math on existing state.

---

## Scalability Considerations

Tab Splitter is designed for a single session of 2-10 people at a restaurant table. Scalability is not a v1 design constraint.

| Concern | At 1 session (target) | At 100 concurrent sessions | At 10K concurrent sessions |
|---------|----------------------|--------------------------|---------------------------|
| Session state | In-memory Map, ~1KB | In-memory Map, ~100KB total | Redis required |
| WebSocket connections | 10 sockets | 1,000 sockets — single process fine | Redis pub/sub for cross-node broadcast |
| OCR calls | 1 per session | 100/hr, minimal API cost | Rate limiting + queue |
| Server | Single Node.js process | Single process sufficient | Horizontal scaling + sticky sessions |

---

## Sources

| Claim | Source | Confidence |
|-------|--------|------------|
| WebSockets are bidirectional; SSE is server-to-client only | https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API | HIGH |
| SSE 6-connection per-browser limit over HTTP/1.1 | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events | HIGH |
| Next.js Route Handlers support only standard HTTP methods, not WebSockets | https://nextjs.org/docs/app/building-your-application/routing/route-handlers | HIGH |
| Custom server is the documented Next.js escape hatch | https://nextjs.org/docs/app/guides/custom-server | HIGH |
| Custom server disables Automatic Static Optimization | https://nextjs.org/docs/app/guides/custom-server | HIGH |
| Vercel serverless does not support persistent WebSocket connections | https://nextjs.org/docs/app/building-your-application/deploying | HIGH |
| Node.js event loop handles thousands of concurrent WebSocket connections | https://nodejs.org/en/learn/getting-started/introduction-to-nodejs | HIGH |
| `<input capture="environment">` opens rear camera on mobile | https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file | HIGH |
| `getUserMedia` requires HTTPS; widely available since 2017 | https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia | HIGH |
| `crypto.randomUUID()` available in secure contexts since 2022 | https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID | HIGH |
| canvas.toBlob() for still photo capture from video stream | https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob | HIGH |
| Tesseract.js bundle size and mobile performance | Training knowledge only | LOW — validate if client-side OCR reconsidered |
| Vision API accuracy superiority for receipts | Training knowledge | LOW — validate with actual OCR comparison test |
