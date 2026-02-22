import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { sessionStore } from '@/lib/session-store'
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

    if (
      typeof msg !== 'object' || msg === null ||
      (msg as any).type !== 'join' ||
      typeof (msg as any).participantName !== 'string'
    ) return

    const name = ((msg as any).participantName as string).trim()
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
