# Phase 1: Foundation - Research

**Researched:** 2026-02-21
**Domain:** Next.js custom server + ws WebSocket + GPT-4o Vision OCR + in-memory session store
**Confidence:** HIGH (core patterns verified via official Next.js docs and official examples; OpenAI patterns verified via official cookbook)

---

## Summary

Phase 1 builds the server infrastructure that every subsequent phase depends on. The three pillars are: (1) a custom Next.js server that bridges HTTP and WebSocket on one port, (2) an in-memory session store with TTL, and (3) a GPT-4o Vision OCR endpoint. None of these are novel patterns — each has an established, documented implementation path. The risk is in the assembly: the custom server setup has specific constraints around TypeScript compilation, upgrade-event routing for WebSockets alongside Next.js HMR, and environment setup for mobile HTTPS testing.

The STACK.md and FEATURES.md produced during project research recommended Tesseract.js + Vite SPA + PartyKit. Those recommendations are superseded by the locked decisions in STATE.md: the project uses GPT-4o Vision API (server-side OCR), a custom `ws` WebSocket server, and Next.js App Router. This research is scoped to those locked decisions only.

The single most important thing to get right in Phase 1 is the custom server pattern. Changing from Next.js Route Handlers to a custom server after code has been written is disruptive — it rewrites the dev/build/start scripts, changes the deployment shape, and breaks static optimization assumptions. Lock it in first, verify it works end-to-end with a curl test, then build the session store and OCR endpoint on top.

**Primary recommendation:** Scaffold with `create-next-app`, immediately replace the default `next dev` script with a `tsx watch server.ts` script, attach `ws` to the same HTTP server using `noServer: true` + the `upgrade` event, and wire up GPT-4o Vision with `zodResponseFormat` for guaranteed JSON output.

---

<user_constraints>
## User Constraints (from STATE.md Accumulated Decisions)

### Locked Decisions
- **OCR engine:** Server-side GPT-4o Vision API (not Tesseract.js). Manual correction is an explicit v1 requirement, implying OCR must be good enough that corrections are occasional fixes — Tesseract on thermal receipt fonts produces too many errors. Server is already required for WebSockets so no extra infrastructure cost. If GPT-4o costs are unacceptable, the UI contract (`{ id, name, price, qty }`) is identical and the swap to Tesseract is isolated to `POST /api/ocr`.
- **Real-time layer:** Custom `ws` WebSocket server attached to Next.js custom HTTP server (not PartyKit). Server-side OCR requires a server anyway; custom ws adds no extra infrastructure and avoids PartyKit's free-tier 10-project limit.
- **Deployment target:** Railway, Fly.io, or Render — NOT Vercel. Vercel serverless does not support persistent WebSocket connections.
- **Money math:** All prices stored as integer cents from day one. Floating-point arithmetic is never used for monetary values. Largest Remainder Method for shared item and tax/tip distribution.
- **Claims model:** Append-only Set per item (`claims[itemId] = Set<participantName>`). No single-owner model. Full-state broadcast after every change. Full snapshot sent on every WebSocket connect (handles reconnects).

### Claude's Discretion
- TypeScript runner for server.ts (ts-node vs tsx vs Node.js --experimental-strip-types)
- Exact project folder structure
- Whether to use `zodResponseFormat` or `response_format: { type: "json_object" }` for GPT-4o
- HTTPS tunnel tool (ngrok vs cloudflared quick tunnel)
- TTL implementation approach (setTimeout vs library)

### Deferred Ideas (OUT OF SCOPE for Phase 1)
- Camera capture UI (Phase 2)
- Session creation UI (Phase 2)
- QR code display (Phase 2)
- Participant join UI (Phase 3)
- Item claiming UI (Phase 4)
- Tax/tip math / summary (Phase 5)
- WebSocket claiming messages (Phase 3/4 — only the ws server scaffold is needed in Phase 1)
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | App Router framework + HTTP server base | Official, provides getRequestHandler() and getUpgradeHandler() |
| typescript | 5.x | Type safety | Built into Next.js scaffold |
| ws | 8.x | WebSocket server | Minimal, no abstraction overhead; the standard raw WebSocket library for Node.js |
| openai | 4.x | GPT-4o Vision API client | Official SDK; provides zodResponseFormat helper |
| zod | 3.x | Schema validation + structured output typing | Used with zodResponseFormat for guaranteed GPT-4o JSON shape |
| tsx | 4.x | TypeScript runner for server.ts | Faster startup than ts-node, no tsconfig.server.json required |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/ws | 8.x | TypeScript types for ws | Required dev dependency |
| @types/node | 20.x | Node.js types | Required for http, crypto, etc. |
| multer OR formidable | latest | Multipart form parsing for image uploads | POST /api/ocr receives `multipart/form-data` — Next.js Route Handlers need explicit handling |
| dotenv | 16.x | OPENAI_API_KEY in .env.local | Standard env loading for custom server (Next.js built-in env handling may not fire before server.ts runs) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| tsx | ts-node | ts-node requires a separate tsconfig.server.json and is slower to start; tsx just works |
| tsx | Node.js --experimental-strip-types | Experimental flag, not production-stable yet (Node 22 feature) |
| zodResponseFormat | response_format: json_object | json_object mode doesn't enforce schema shape — parse errors still possible; zodResponseFormat uses constrained decoding for 100% schema compliance |
| ws noServer + upgrade event | ws server: httpServer | Direct server attachment works but conflicts with Next.js dev HMR websocket; noServer + manual upgrade routing is safer |

**Installation:**
```bash
npx create-next-app@latest tab-splitter --typescript --tailwind --app --src-dir --import-alias "@/*"
cd tab-splitter
npm install ws openai zod
npm install --save-dev @types/ws tsx
```

---

## Architecture Patterns

### Recommended Project Structure
```
tab-splitter/
├── server.ts                  # Custom HTTP + ws server entry point
├── app/
│   ├── api/
│   │   ├── ocr/
│   │   │   └── route.ts       # POST /api/ocr - GPT-4o Vision call
│   │   └── sessions/
│   │       ├── route.ts       # POST /api/sessions
│   │       └── [id]/
│   │           └── route.ts   # GET /api/sessions/[id]
│   └── layout.tsx
├── lib/
│   ├── session-store.ts       # In-memory Map with TTL
│   ├── ws-server.ts           # WebSocket server singleton + room logic
│   └── ocr.ts                 # GPT-4o Vision call wrapper
├── types/
│   └── index.ts               # Canonical SessionState, Item, Claim types — hand-written, not generated
└── .env.local                 # OPENAI_API_KEY
```

### Pattern 1: Custom Next.js Server with ws in noServer Mode

**What:** A `server.ts` file creates an HTTP server, prepares Next.js, and attaches a WebSocket server using `noServer: true`. The HTTP server's `upgrade` event routes WebSocket connections, distinguishing `/ws` (app) from `/_next/webpack-hmr` (Next.js dev HMR).

**When to use:** Always for this project — required because WebSocket connections need to persist and Next.js Route Handlers only handle standard HTTP.

**Source:** Official Next.js custom server docs (https://nextjs.org/docs/app/guides/custom-server), official Next.js example (https://github.com/vercel/next.js/blob/canary/examples/custom-server/server.ts), Fly.io WebSockets with Next.js guide.

**Example:**
```typescript
// server.ts
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { sessionStore } from './lib/session-store'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, hostname: 'localhost', port })
const handle = app.getRequestHandler()

// WebSocket server — noServer means we control upgrade manually
const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://localhost:${port}`)
  const sessionId = url.searchParams.get('session')
  if (!sessionId || !sessionStore.has(sessionId)) {
    ws.close(1008, 'Session not found')
    return
  }

  // Register socket with session
  sessionStore.addSocket(sessionId, ws)

  // Send full state snapshot on connect (covers both new joins and reconnects)
  const snapshot = sessionStore.get(sessionId)
  ws.send(JSON.stringify({ type: 'session-snapshot', data: snapshot }))

  ws.on('close', () => {
    sessionStore.removeSocket(sessionId, ws)
  })
})

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Route WebSocket upgrade events
  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url || '/', true)

    if (pathname === '/_next/webpack-hmr') {
      // Delegate HMR websocket to Next.js
      app.getUpgradeHandler()(req, socket, head)
    } else if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch server.ts",
    "build": "next build",
    "start": "NODE_ENV=production node server.ts"
  }
}
```

**Critical caveat (HIGH confidence — official Next.js docs):** Using a custom server disables Automatic Static Optimization. This is acceptable for Tab Splitter since session pages are fully dynamic. Custom server also does NOT work with Vercel serverless deployment — must use Railway, Fly.io, or Render.

**Next.js 15 `getUpgradeHandler()` availability (MEDIUM confidence):** This method is referenced in GitHub discussions and community usage. If it's unavailable in a specific Next.js version, the workaround is to simply let the HMR path fall through by not destroying the socket, or use `nextApp.hotReloader` directly. Verify availability after scaffold.

### Pattern 2: In-Memory Session Store as a Module Singleton

**What:** Export a single `sessionStore` instance from `lib/session-store.ts`. Both the REST Route Handlers and the WebSocket server import from this module. Node.js module caching guarantees they share the same Map instance.

**When to use:** Always — this is the standard singleton pattern for shared server-side state in a Node.js custom server.

**Example:**
```typescript
// lib/session-store.ts
import type { WebSocket } from 'ws'

export interface Item {
  id: string
  name: string
  priceCents: number   // integer cents always — no floats
  qty: number
}

export interface SessionState {
  id: string
  items: Item[]
  taxCents: number
  tipCents: number
  claims: Record<string, string[]>  // itemId -> participantName[]
  participants: string[]
  sockets: Set<WebSocket>           // active connections — not serialized
  createdAt: number
  expiresAt: number
}

class SessionStore {
  private store = new Map<string, SessionState>()

  create(items: Item[], taxCents: number, tipCents: number): string {
    const id = crypto.randomUUID()
    const now = Date.now()
    const ttl = 4 * 60 * 60 * 1000  // 4 hours

    const session: SessionState = {
      id,
      items,
      taxCents,
      tipCents,
      claims: {},
      participants: [],
      sockets: new Set(),
      createdAt: now,
      expiresAt: now + ttl,
    }

    this.store.set(id, session)

    // TTL cleanup
    setTimeout(() => {
      const s = this.store.get(id)
      if (s) {
        s.sockets.forEach(ws => ws.close(1001, 'Session expired'))
        this.store.delete(id)
      }
    }, ttl)

    return id
  }

  get(id: string): SessionState | undefined {
    return this.store.get(id)
  }

  has(id: string): boolean {
    return this.store.has(id)
  }

  addSocket(id: string, ws: WebSocket): void {
    this.store.get(id)?.sockets.add(ws)
  }

  removeSocket(id: string, ws: WebSocket): void {
    this.store.get(id)?.sockets.delete(ws)
  }

  broadcast(id: string, message: object, excludeSocket?: WebSocket): void {
    const session = this.store.get(id)
    if (!session) return
    const payload = JSON.stringify(message)
    session.sockets.forEach(ws => {
      if (ws !== excludeSocket && ws.readyState === 1 /* OPEN */) {
        ws.send(payload)
      }
    })
  }
}

// Module singleton — all importers share the same instance
export const sessionStore = new SessionStore()
```

**Why `setTimeout` (not a library):** The TTL requirement is a single 4-hour timer per session. Using `node-cache` or similar libraries adds a dependency for zero benefit at this scale. The raw `setTimeout` pattern is standard for simple TTL scenarios. (MEDIUM confidence — multiple sources confirm this is the common approach; no library needed for single-timer-per-key TTL.)

### Pattern 3: GPT-4o Vision with Structured Output

**What:** Accept a multipart/form-data upload containing the receipt image, convert to base64, call GPT-4o Vision API with `response_format: { type: "json_object" }`, parse and validate the response.

**When to use:** POST /api/ocr Route Handler.

**Source:** OpenAI Cookbook data extraction example (https://developers.openai.com/cookbook/examples/data_extraction_transformation), getstream.io GPT-4o Vision guide.

**Important model note (MEDIUM confidence — verified from search results):** `response_format: { type: "json_schema" }` with `strict: true` (true Structured Outputs) requires model `gpt-4o-2024-08-06` or later snapshot. The generic `"gpt-4o"` alias may or may not map to a supported version. To be safe, either use `"gpt-4o-2024-08-06"` explicitly, or use `response_format: { type: "json_object" }` with JSON in the prompt text, then validate with Zod.

**Example (safe approach — json_object mode + Zod validation):**
```typescript
// lib/ocr.ts
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI()  // reads OPENAI_API_KEY from env

const ReceiptItemSchema = z.object({
  name: z.string(),
  price: z.number(),  // dollars (from GPT response) — convert to cents in handler
  qty: z.number().int().positive().default(1),
})

const ReceiptSchema = z.object({
  items: z.array(ReceiptItemSchema),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  tip: z.number().optional(),
})

export type ReceiptData = z.infer<typeof ReceiptSchema>

const OCR_PROMPT = `Extract all line items from this restaurant receipt as JSON.
Return ONLY valid JSON with no explanation:
{
  "items": [{ "name": string, "price": number (dollars), "qty": number }],
  "subtotal": number,
  "tax": number,
  "tip": number
}
Rules:
- Exclude subtotal, tax, tip, and service charge from the items array
- If qty is not shown on the receipt, use 1
- Prices are in dollars (e.g., 12.99 not 1299)
- If a line cannot be parsed as a food item, omit it`

export async function extractReceiptItems(imageBuffer: Buffer, mimeType: string): Promise<ReceiptData> {
  const base64 = imageBuffer.toString('base64')
  const dataUri = `data:${mimeType};base64,${base64}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0,  // deterministic extraction
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: dataUri,
              detail: 'high',  // high detail for small receipt text
            },
          },
        ],
      },
    ],
  })

  const raw = response.choices[0].message.content
  if (!raw) throw new Error('GPT-4o returned empty response')

  const parsed = JSON.parse(raw)
  return ReceiptSchema.parse(parsed)  // throws ZodError if shape is wrong
}
```

**Route Handler (app/api/ocr/route.ts):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { extractReceiptItems } from '@/lib/ocr'
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer())
    const receipt = await extractReceiptItems(buffer, imageFile.type)

    // Convert prices to integer cents
    const items = receipt.items.map((item, i) => ({
      id: `item-${i}`,
      name: item.name,
      priceCents: Math.round(item.price * 100),
      qty: item.qty,
    }))

    return NextResponse.json({
      items,
      taxCents: Math.round((receipt.tax ?? 0) * 100),
      tipCents: Math.round((receipt.tip ?? 0) * 100),
    })
  } catch (err) {
    console.error('OCR error:', err)
    return NextResponse.json(
      { error: 'OCR failed. Please add items manually.' },
      { status: 500 }
    )
  }
}
```

### Pattern 4: HTTPS Dev Tunnel for Mobile Testing

**What:** Use Cloudflare Quick Tunnels (no account required) to expose the local dev server over HTTPS. Required because `getUserMedia` (camera) requires a secure context, and iOS Safari does not treat local IP addresses as secure even when accessed from the same network.

**Command (verified via official Cloudflare docs — HIGH confidence):**
```bash
# One-time install
npm install -g cloudflared

# Expose local server (generates a random *.trycloudflare.com HTTPS URL)
cloudflared tunnel --url http://localhost:3000
```

**Key limitation:** The URL changes each time you restart the tunnel. For development, this is acceptable. The URL is printed to the terminal; copy it and open on your phone.

**Alternative — ngrok:**
```bash
ngrok http 3000
# Free tier provides HTTPS, URL changes on restart
```

**Recommendation:** Use cloudflared — no account required, free, no rate limits for development use, and it routes through Cloudflare's edge network which is often faster than ngrok's free tier.

### Anti-Patterns to Avoid

- **Putting ws server on a separate port:** Using `new WebSocketServer({ port: 3001 })` means clients need to connect to a different port. This breaks in most deployment environments and causes CORS-like issues. Always attach to the same HTTP server via `noServer: true`.

- **Importing session-store in a Next.js Route Handler with edge runtime:** The session-store uses a Node.js `Map` and `setTimeout`. Edge runtime does not support these. Ensure Route Handlers run in Node.js runtime (default for custom server deployments).

- **Using `JSON.parse(response.choices[0].message.content)` without validation:** GPT-4o may occasionally return valid JSON that doesn't match the expected shape (e.g., `price` as a string instead of number). Always validate with Zod.

- **Float arithmetic for price conversion:** `$12.99 * 100 = 1298.9999...` — use `Math.round()` when converting dollars to cents, never `Math.floor()` or `parseInt()`.

- **Creating a new `WebSocketServer` instance per request:** The ws server is a singleton. It must be created once in server.ts, not recreated per connection or per module import.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript server runner | Custom Makefile/shell script | `tsx watch server.ts` | tsx handles tsconfig inheritance, source maps, and file watching with zero config |
| JSON schema enforcement on GPT-4o output | Custom regex/parser | `zod` + `ReceiptSchema.parse()` | Zod gives typed validation with helpful error messages; GPT-4o output is probabilistic and needs validation |
| WebSocket session management | Custom EventEmitter | `ws` library's built-in connection events | ws handles ping/pong keepalives, binary/text framing, close codes |
| Multipart image parsing in Route Handler | `Buffer` manual parsing | `req.formData()` (built into Next.js) | Next.js App Router Route Handlers support `FormData` natively; no multer needed |
| Session ID generation | `Math.random()` + base36 | `crypto.randomUUID()` | UUID v4 is cryptographically random (available in Node.js ≥ 15); `Math.random()` is not crypto-safe |
| TTL eviction scan | Polling setInterval over all sessions | `setTimeout` per session | Per-key setTimeout is simpler and avoids a global polling loop for a low-volume use case |

**Key insight:** This stack is deliberately minimal. The custom server pattern is 50 lines of code using only Node.js built-ins and the `ws` library. Resist the urge to add Express or other middleware layers — they add complexity without benefit for the REST API surface, which is only 3 endpoints.

---

## Common Pitfalls

### Pitfall 1: WebSocket upgrade conflicts with Next.js HMR in dev mode

**What goes wrong:** In development, Next.js also uses WebSockets for Hot Module Replacement (HMR). If the server's `upgrade` event is handled without routing, the first WebSocket upgrade request (which might be HMR from the Next.js dev overlay) gets sent to the app's WebSocket server instead of Next.js's hot reload handler.

**Why it happens:** Both HMR and app WebSockets use the same port. The `upgrade` event fires for all WebSocket upgrade requests.

**How to avoid:** In the `upgrade` event handler, check `pathname`. Route `/_next/webpack-hmr` to `app.getUpgradeHandler()`. Route `/ws` (or your app's WS path) to `wss.handleUpgrade()`. Destroy the socket for any other pathname.

**Warning signs:** HMR stops working (no auto-refresh on file save), OR the first participant WebSocket connection immediately closes.

### Pitfall 2: OPENAI_API_KEY not available in custom server

**What goes wrong:** Next.js loads `.env.local` for Route Handlers automatically. But `server.ts` runs as a plain Node.js script before Next.js initializes. If `OPENAI_API_KEY` is read before `app.prepare()`, it may be undefined.

**Why it happens:** Next.js's env loading (`loadEnvConfig`) is triggered as part of `app.prepare()`. The `openai` client reads the key at instantiation time.

**How to avoid:** Instantiate the `openai` client lazily (inside the function that calls it, not at module scope). OR add `import 'dotenv/config'` at the top of `lib/ocr.ts` and use a `.env` file (not `.env.local`). OR call `loadEnvConfig(process.cwd())` from `next/dist/lib/load-custom-routes` before instantiating the client.

**Simplest fix:** Create the `OpenAI()` client inside the handler function body, not at module top-level. This way it's created after `app.prepare()` has run:

```typescript
// lib/ocr.ts — create client lazily
import OpenAI from 'openai'
let _client: OpenAI | null = null
function getOpenAI() {
  if (!_client) _client = new OpenAI()  // reads env at first call, after app.prepare()
  return _client
}
```

**Warning signs:** `AuthenticationError: No API key provided` from OpenAI client at startup.

### Pitfall 3: Session store not shared between Route Handler and WebSocket server

**What goes wrong:** Session is created via POST /api/sessions (Route Handler), but the WebSocket server can't find it because the Route Handler imported a different instance of the session store module.

**Why it happens:** In some Next.js configurations (especially with standalone output mode or edge runtime), modules may be bundled separately. In a custom server with Node.js runtime, this should not happen — Node.js module caching guarantees one instance per require path. But if the import path differs (e.g., `../../lib/session-store` vs `@/lib/session-store` resolving to different absolute paths), two instances are created.

**How to avoid:** Use consistent import paths throughout. Use the `@/` alias consistently. Never import session-store with relative paths in some places and aliases in others.

**Warning signs:** WebSocket connection for a valid sessionId gets rejected with "Session not found" immediately after POST /api/sessions returns 200.

### Pitfall 4: `req.formData()` body size limit on image uploads

**What goes wrong:** Next.js Route Handlers have a default body size limit. A high-resolution receipt photo (from a modern phone camera) can be 3-8MB. If the limit is exceeded, the request fails with a 413 error or silent truncation.

**Why it happens:** Next.js (and its underlying infrastructure) applies a body size limit. The default is 4MB in some configurations.

**How to avoid:** Export a `config` from the Route Handler to increase the limit:

```typescript
// app/api/ocr/route.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
```

**Note:** For App Router Route Handlers (not Pages Router), body size limit configuration may work differently. If the above doesn't work, consider compressing the image client-side before upload (canvas `toBlob` with quality 0.7 reduces a 6MB photo to ~800KB without visible loss for OCR purposes).

**Warning signs:** POST /api/ocr returns 413 or silently returns empty body for large photos.

### Pitfall 5: tsx watch restarts break WebSocket connections in development

**What goes wrong:** `tsx watch server.ts` restarts the server on every file change. All active WebSocket connections are dropped. During development this is fine, but if you're testing WebSocket behavior, every code change forces a reconnect.

**Why it happens:** tsx watch kills and restarts the Node.js process on file change, just like nodemon.

**How to avoid:** Accept this as a dev-mode limitation. Implement the client-side WebSocket reconnect logic (exponential backoff with jitter) from the start — not as a later enhancement. The reconnect behavior needed for production (phone screen lock) is the same behavior needed in development.

**Warning signs:** Not a bug — expected behavior. But if you're seeing unexpected reconnects, check if tsx watch is over-triggering on non-server files.

### Pitfall 6: GPT-4o OCR cost per call

**What goes wrong:** Sending a 6MB raw JPEG to GPT-4o Vision at `detail: "high"` costs approximately 2,000-6,000 tokens per image (~$0.02-0.06 per OCR call on current pricing). During development, running OCR on every test photo adds up quickly.

**How to avoid:** In development, implement a mock OCR path: if `OPENAI_API_KEY` starts with `sk-test-` or if `NODE_ENV=development`, return a static fixture JSON instead of calling the API. Only call real GPT-4o for intentional accuracy testing.

```typescript
// lib/ocr.ts — dev mock
if (process.env.NODE_ENV === 'development' && process.env.USE_OCR_MOCK === 'true') {
  return OCR_FIXTURE  // static receipt data for UI development
}
```

---

## Code Examples

### Full session store with broadcast
```typescript
// lib/session-store.ts
// Source: Synthesized from Node.js docs + ws library docs
import { WebSocket } from 'ws'

export interface Item {
  id: string
  name: string
  priceCents: number
  qty: number
}

export interface SessionState {
  id: string
  items: Item[]
  taxCents: number
  tipCents: number
  claims: Record<string, string[]>
  participants: string[]
  sockets: Set<WebSocket>
  createdAt: number
}

const store = new Map<string, SessionState>()

export const sessionStore = {
  create(data: { items: Item[]; taxCents: number; tipCents: number }): string {
    const id = crypto.randomUUID()
    store.set(id, {
      id,
      ...data,
      claims: {},
      participants: [],
      sockets: new Set(),
      createdAt: Date.now(),
    })
    setTimeout(() => {
      const session = store.get(id)
      if (session) {
        session.sockets.forEach(ws =>
          ws.readyState === WebSocket.OPEN && ws.close(1001, 'Session expired')
        )
        store.delete(id)
      }
    }, 4 * 60 * 60 * 1000)
    return id
  },

  get: (id: string) => store.get(id),
  has: (id: string) => store.has(id),

  addSocket(id: string, ws: WebSocket) {
    store.get(id)?.sockets.add(ws)
  },

  removeSocket(id: string, ws: WebSocket) {
    store.get(id)?.sockets.delete(ws)
  },

  broadcast(id: string, msg: object, exclude?: WebSocket) {
    const s = store.get(id)
    if (!s) return
    const payload = JSON.stringify(msg)
    s.sockets.forEach(ws => {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) ws.send(payload)
    })
  },
}
```

### POST /api/sessions Route Handler
```typescript
// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sessionStore, type Item } from '@/lib/session-store'

export async function POST(req: NextRequest) {
  const body = await req.json() as { items: Item[]; taxCents: number; tipCents: number }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'items required' }, { status: 400 })
  }

  const sessionId = sessionStore.create(body)
  return NextResponse.json({
    sessionId,
    shareUrl: `/s/${sessionId}`,
  })
}
```

### GET /api/sessions/[id] Route Handler
```typescript
// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/session-store'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = sessionStore.get(id)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  // Return serializable session data (exclude sockets Set)
  const { sockets, ...data } = session
  return NextResponse.json(data)
}
```

### curl verification commands (Phase 1 acceptance test)
```bash
# Test OCR endpoint
curl -X POST http://localhost:3000/api/ocr \
  -F "image=@receipt.jpg" \
  | jq .

# Test session creation
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"1","name":"Burger","priceCents":1299,"qty":1}],"taxCents":150,"tipCents":300}' \
  | jq .

# Test session retrieval
curl http://localhost:3000/api/sessions/[SESSION_ID] | jq .

# Test WebSocket connection (requires wscat: npm install -g wscat)
wscat -c "ws://localhost:3000/ws?session=[SESSION_ID]"
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ts-node with separate tsconfig.server.json | tsx (no config needed) | ~2023 | tsx is faster, simpler, no separate tsconfig |
| `ws` server on separate port | `noServer: true` + upgrade event routing | ~2022 | Single port, compatible with deployment environments |
| `JSON.parse()` + manual validation | Zod + structured output | 2023–2024 | Type-safe, validated, handles LLM output variance |
| Tesseract.js client-side OCR | GPT-4o Vision API | 2023 | Orders of magnitude better accuracy on receipts, structured output |
| `response_format: json_object` | `response_format: json_schema` (Structured Outputs) | Aug 2024 | 100% schema compliance vs probabilistic compliance |
| nodemon + ts-node | tsx watch | 2023 | Single tool, no extra config |

**Deprecated/outdated:**
- `ts-node` with `--project tsconfig.server.json`: Still works but tsx is preferred for new projects in 2025.
- `new WebSocketServer({ server: httpServer })` direct attachment: Works but conflicts with Next.js HMR; prefer `noServer: true` pattern.
- `gpt-4-vision-preview` model: Superseded by `gpt-4o` for vision tasks.

---

## Open Questions

1. **`app.getUpgradeHandler()` availability in Next.js 15**
   - What we know: Referenced in community examples and GitHub discussions; official docs do not document it explicitly.
   - What's unclear: Whether `getUpgradeHandler()` is a stable API or an internal implementation detail in Next.js 15.
   - Recommendation: Test at scaffold time. If unavailable, the workaround is to pass through `/_next/webpack-hmr` by not destroying the socket on that path. HMR will still work since Next.js handles its own upgrade for that path via its internal server.

2. **Next.js App Router params `await params` in GET /api/sessions/[id]**
   - What we know: Next.js 15 changed dynamic params to be async (`params` is a Promise). The `await params` pattern is correct for Next.js 15.
   - What's unclear: Whether this has any gotchas with TypeScript types in the current release.
   - Recommendation: Use `{ params }: { params: Promise<{ id: string }> }` signature as shown in the code example above.

3. **GPT-4o Structured Outputs (`json_schema`) vs json_object for vision**
   - What we know: Structured Outputs with `response_format: { type: "json_schema", ... }` guarantee 100% schema compliance. Requires model `gpt-4o-2024-08-06` or later. Compatible with vision inputs per OpenAI documentation.
   - What's unclear: Whether the `zodResponseFormat` helper (from `openai/helpers/zod`) works correctly when combined with vision (image_url) content in the messages array.
   - Recommendation: Start with `response_format: { type: "json_object" }` + Zod validation (simpler, works reliably). Upgrade to `zodResponseFormat` + `beta.chat.completions.parse()` if Zod validation errors from GPT-4o output become a problem.

4. **OCR accuracy on real restaurant receipts**
   - What we know: GPT-4o Vision is state-of-the-art for document OCR. Anecdotal reports of high accuracy on receipts.
   - What's unclear: Exact error rate on thermal printer fonts, low-light restaurant conditions, crumpled receipts.
   - Recommendation: STATE.md flags this as the primary blocker concern. In Phase 1, photograph 5 real receipts and test the OCR endpoint before declaring Phase 1 complete. Document the actual accuracy.

---

## Sources

### Primary (HIGH confidence)
- [Next.js Custom Server official docs](https://nextjs.org/docs/app/guides/custom-server) — server.ts pattern, getRequestHandler(), caveats
- [Next.js custom-server/server.ts GitHub example](https://github.com/vercel/next.js/blob/canary/examples/custom-server/server.ts) — official TypeScript reference implementation
- [OpenAI Cookbook: Data Extraction with GPT-4o](https://developers.openai.com/cookbook/examples/data_extraction_transformation) — base64 image_url pattern, json_object response_format
- [Cloudflare Quick Tunnels official docs](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/) — no-account tunnel command

### Secondary (MEDIUM confidence)
- [Fly.io: WebSockets with Next.js](https://fly.io/javascript-journal/websockets-with-nextjs/) — noServer + upgrade event routing pattern, verified against ws library docs
- [getstream.io GPT-4o Vision Guide](https://getstream.io/blog/gpt-4o-vision-guide/) — messages array format with base64 data URI and json_object mode
- [OpenAI Structured Outputs announcement](https://openai.com/index/introducing-structured-outputs-in-the-api/) — json_schema mode, model requirements, 100% compliance guarantee

### Tertiary (LOW confidence — flag for validation)
- `app.getUpgradeHandler()` method availability — referenced in community examples, not in official API docs; verify at scaffold time
- OCR accuracy claims on thermal receipt fonts — anecdotal; validate in Phase 1 with real receipts

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js, ws, openai SDK are all official and well-documented; tsx is widely adopted
- Architecture: HIGH — custom server + noServer ws pattern is verified in official Next.js docs and multiple production examples
- GPT-4o OCR pattern: HIGH (API call pattern) / LOW (accuracy on real receipts — needs empirical validation)
- Common pitfalls: MEDIUM — most derived from official docs and community sources; the env loading pitfall is verified against Next.js internals

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days — Next.js and OpenAI APIs are relatively stable; tsx and ws are very stable)
