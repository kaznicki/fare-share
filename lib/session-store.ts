import type { WebSocket } from 'ws'
import type { Item, SessionState } from '@/types'

const store = new Map<string, SessionState>()

export const sessionStore = {
  create(data: { items: Item[]; taxCents: number; tipCents: number }): string {
    const id = crypto.randomUUID()
    const now = Date.now()
    const ttl = 4 * 60 * 60 * 1000  // 4 hours in ms

    store.set(id, {
      id,
      items: data.items,
      taxCents: data.taxCents,
      tipCents: data.tipCents,
      claims: {},
      participants: [],
      sockets: new Set(),
      createdAt: now,
      expiresAt: now + ttl,
    })

    // TTL cleanup — close all sockets and remove session after 4 hours
    setTimeout(() => {
      const session = store.get(id)
      if (session) {
        session.sockets.forEach(ws => {
          if (ws.readyState === 1 /* WebSocket.OPEN */) {
            ws.close(1001, 'Session expired')
          }
        })
        store.delete(id)
      }
    }, ttl)

    return id
  },

  get: (id: string): SessionState | undefined => store.get(id),
  has: (id: string): boolean => store.has(id),

  addSocket(id: string, ws: WebSocket): void {
    store.get(id)?.sockets.add(ws)
  },

  removeSocket(id: string, ws: WebSocket): void {
    store.get(id)?.sockets.delete(ws)
  },

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
