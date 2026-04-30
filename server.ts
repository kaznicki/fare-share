import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { sessionStore } from '@/lib/session-store'
import { billSplit } from '@/lib/bill-split'
import type { SessionData, ClientMessage } from '@/types'

const port = parseInt(process.env.PORT ?? '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, hostname: 'localhost', port })
const handle = app.getRequestHandler()

// WebSocket server — noServer mode; we route upgrade events manually.
// This avoids conflicts with Next.js HMR websocket on /_next/webpack-hmr.
const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`)
  const sessionId = url.searchParams.get('session')

  if (!sessionId || !sessionStore.has(sessionId)) {
    ws.close(1008, 'Session not found')
    return
  }

  // Register this socket with the session
  sessionStore.addSocket(sessionId, ws)

  // Send full state snapshot on connect — covers both new joins and reconnects.
  // Per STATE.md locked decision: full snapshot on every WebSocket connect.
  const session = sessionStore.get(sessionId)!
  const { sockets, ...data } = session
  const snapshot: { type: 'session-snapshot'; data: SessionData } = {
    type: 'session-snapshot',
    data,
  }
  ws.send(JSON.stringify(snapshot))

  ws.on('close', () => {
    sessionStore.removeSocket(sessionId, ws)
  })

  ws.on('error', (err) => {
    console.error(`WebSocket error for session ${sessionId}:`, err)
    sessionStore.removeSocket(sessionId, ws)
  })

  ws.on('message', (raw) => {
    let msg: unknown
    try { msg = JSON.parse(raw.toString()) } catch { return }

    if (typeof msg !== 'object' || msg === null) return

    const MAX_NAME_LEN = 64
    const MAX_ID_LEN = 64

    // join branch
    if (
      (msg as any).type === 'join' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const name = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
      if (!name) return

      const session = sessionStore.get(sessionId!)
      if (!session) return

      if (!session.participants.includes(name)) {
        session.participants.push(name)
      }

      const data = sessionStore.getData(sessionId!)
      if (data) {
        sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
      }
      return
    }

    // claim branch
    if (
      (msg as any).type === 'claim' &&
      typeof (msg as any).itemId === 'string' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const itemId = ((msg as any).itemId as string).slice(0, MAX_ID_LEN)
      const name = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
      if (!name) return

      const session = sessionStore.get(sessionId!)
      if (!session) return

      // Verify item exists in session (silent ignore if not)
      if (!session.items.find(i => i.id === itemId)) return

      // Append-only Set semantics: only add if not already claiming
      if (!session.claims[itemId]) session.claims[itemId] = []
      if (!session.claims[itemId].includes(name)) {
        session.claims[itemId].push(name)
      }

      const data = sessionStore.getData(sessionId!)
      if (data) sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
      return
    }

    // unclaim branch
    if (
      (msg as any).type === 'unclaim' &&
      typeof (msg as any).itemId === 'string' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const itemId = ((msg as any).itemId as string).slice(0, MAX_ID_LEN)
      const name = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
      if (!name) return

      const session = sessionStore.get(sessionId!)
      if (!session) return

      if (session.claims[itemId]) {
        session.claims[itemId] = session.claims[itemId].filter(n => n !== name)
      }

      const data = sessionStore.getData(sessionId!)
      if (data) sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
      return
    }

    // finalize branch — only host can finalize (security: T-5-01)
    if (
      (msg as any).type === 'finalize' &&
      typeof (msg as any).unclaimedHandling === 'string' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const senderName = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
      const session = sessionStore.get(sessionId!)
      if (!session) return

      // Only host can finalize (T-5-01: elevation of privilege mitigation)
      if (senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()) return

      // Idempotency guard — do not re-run if already finalized (T-5-03)
      if (session.finalized) return

      // Coerce unclaimedHandling to prevent tampering (T-5-02)
      const handling = (msg as any).unclaimedHandling === 'host' ? 'host' : 'split'

      const result = billSplit({
        items: session.items,
        claims: session.claims,
        participants: session.participants,
        taxCents: session.taxCents,
        tipCents: session.tipCents,
        unclaimedHandling: handling,
        hostName: session.hostName,
      })

      sessionStore.finalize(sessionId!, result)

      // Broadcast updated snapshot (now includes finalized: true and finalizedBill)
      const data = sessionStore.getData(sessionId!)
      if (data) {
        sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
      }
      return
    }

    // unfinalize branch — host-only, idempotency guard
    if (
      (msg as any).type === 'unfinalize' &&
      typeof (msg as any).participantName === 'string'
    ) {
      const senderName = ((msg as any).participantName as string).trim().slice(0, MAX_NAME_LEN)
      const session = sessionStore.get(sessionId!)
      if (!session) return

      // Only host can unfinalize (T-07-02-03)
      if (senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()) return

      // Idempotency guard — already unfinalized, no-op (T-07-02-04)
      if (!session.finalized) return

      sessionStore.unfinalize(sessionId!)

      const data = sessionStore.getData(sessionId!)
      if (data) {
        sessionStore.broadcast(sessionId!, { type: 'session-snapshot', data })
      }
      return
    }
  })
})

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? '/', true)
    handle(req, res, parsedUrl)
  })

  // Route WebSocket upgrade events by pathname.
  // /_next/webpack-hmr goes to Next.js (HMR in dev mode).
  // /ws goes to our WebSocket server.
  // All other paths: destroy socket.
  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url ?? '/', true)

    if (pathname === '/_next/webpack-hmr') {
      // Delegate HMR to Next.js internals
      const upgradeHandler = (app as any).getUpgradeHandler?.()
      if (upgradeHandler) {
        upgradeHandler(req, socket, head)
      }
      // If getUpgradeHandler is unavailable, let it pass through — Next.js handles its own HMR
    } else if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    } else {
      socket.destroy()
    }
  })

  httpServer.listen(port, () => {
    console.log(`> Tab Splitter ready on http://localhost:${port}`)
    console.log(`> WebSocket server on ws://localhost:${port}/ws`)
    console.log(`> Environment: ${dev ? 'development' : 'production'}`)
  })
})
