import type { WebSocket } from 'ws'
import type { Item, SessionState, SessionData } from '@/types'
import type { BillSplitResult } from '@/lib/bill-split'

// Global singleton — stored on globalThis to survive Next.js App Router module re-evaluation.
// Next.js 13+ App Router compiles route handlers in a separate module context from server.ts,
// causing a plain `const store = new Map()` to create two isolated Map instances.
// Anchoring to globalThis ensures both the REST route handlers and the WebSocket server
// share the same Map instance across all module contexts in the same Node.js process.
// Use consistent @/ alias paths — never mix relative and alias imports of this file.
declare global {
  // eslint-disable-next-line no-var
  var __tabSplitterSessionStore: Map<string, SessionState> | undefined
}
if (!globalThis.__tabSplitterSessionStore) {
  globalThis.__tabSplitterSessionStore = new Map<string, SessionState>()
}
const store = globalThis.__tabSplitterSessionStore

const TTL_MS = 4 * 60 * 60 * 1000  // 4 hours

export const sessionStore = {
  create(data: { items: Item[]; taxCents: number; tipCents: number; hostName: string }): string {
    const id = crypto.randomUUID()
    const now = Date.now()

    // Validate: all prices must be integer cents (no floats)
    // Per STATE.md locked decision: floating-point arithmetic is never used for money.
    for (const item of data.items) {
      if (!Number.isInteger(item.priceCents)) {
        throw new Error(`Item "${item.name}" priceCents must be an integer, got: ${item.priceCents}`)
      }
    }
    if (!Number.isInteger(data.taxCents)) {
      throw new Error(`taxCents must be an integer, got: ${data.taxCents}`)
    }
    if (!Number.isInteger(data.tipCents)) {
      throw new Error(`tipCents must be an integer, got: ${data.tipCents}`)
    }

    const session: SessionState = {
      id,
      items: data.items,
      taxCents: data.taxCents,
      tipCents: data.tipCents,
      claims: {},
      participants: [],
      sockets: new Set(),
      createdAt: now,
      expiresAt: now + TTL_MS,
      hostName: data.hostName,
      finalized: false,
      finalizedBill: null,
    }

    store.set(id, session)

    // 4-hour TTL: close active sockets and remove session
    setTimeout(() => {
      const s = store.get(id)
      if (s) {
        s.sockets.forEach(ws => {
          if (ws.readyState === 1 /* WebSocket.OPEN */) {
            ws.close(1001, 'Session expired')
          }
        })
        store.delete(id)
        console.log(`Session ${id} expired and removed from store`)
      }
    }, TTL_MS)

    return id
  },

  get(id: string): SessionState | undefined {
    return store.get(id)
  },

  has(id: string): boolean {
    return store.has(id)
  },

  // Returns serializable session data (sockets excluded — not JSON-safe)
  getData(id: string): SessionData | undefined {
    const session = store.get(id)
    if (!session) return undefined
    const { sockets, ...data } = session
    return data
  },

  addSocket(id: string, ws: WebSocket): void {
    store.get(id)?.sockets.add(ws)
  },

  removeSocket(id: string, ws: WebSocket): void {
    store.get(id)?.sockets.delete(ws)
  },

  finalize(id: string, bill: BillSplitResult): void {
    const session = store.get(id)
    if (!session) return
    session.finalized = true
    session.finalizedBill = bill
  },

  unfinalize(id: string): void {
    const session = store.get(id)
    if (!session) return
    session.finalized = false
    session.finalizedBill = null
    // claims are intentionally untouched — D-06
  },

  // Broadcast a message to all open sockets in a session.
  // Per STATE.md locked decision: full-state broadcast after every change.
  // optionally exclude the originating socket.
  broadcast(id: string, msg: object, exclude?: WebSocket): void {
    const session = store.get(id)
    if (!session) return
    const payload = JSON.stringify(msg)
    session.sockets.forEach(ws => {
      if (ws !== exclude && ws.readyState === 1 /* WebSocket.OPEN */) {
        ws.send(payload)
      }
    })
  },
}
