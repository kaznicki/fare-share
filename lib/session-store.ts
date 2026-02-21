import type { WebSocket } from 'ws'
import type { Item, SessionState, SessionData } from '@/types'

// Module singleton — one Map instance shared by all importers via Node.js module cache.
// Both the REST Route Handlers and the WebSocket server import this module.
// Use consistent @/ alias paths — never mix relative and alias imports of this file.
const store = new Map<string, SessionState>()

const TTL_MS = 4 * 60 * 60 * 1000  // 4 hours

export const sessionStore = {
  create(data: { items: Item[]; taxCents: number; tipCents: number }): string {
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
