'use client'
import { useEffect, useRef, useState } from 'react'
import type { SessionData, ServerMessage } from '@/types'
import ClaimableItem from './ClaimableItem'

interface Props {
  sessionId: string
  participantName: string
  isHost?: boolean   // true when the participant viewing is the host — controls Finalize button visibility
}

export default function SessionRoom({ sessionId, participantName, isHost }: Props) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [reconnecting, setReconnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws?session=${sessionId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', participantName }))
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ServerMessage
      if (msg.type === 'session-snapshot') {
        setSession(msg.data)
        setConnectionError(null)
        setReconnecting(false)
      }
    }

    ws.onclose = (event) => {
      if (event.code === 1008) {
        setConnectionError('Session not found or expired.')
      } else {
        // Unexpected disconnect — show reconnect banner
        setReconnecting(true)
      }
    }

    ws.onerror = () => {
      setConnectionError('Connection lost. Please refresh to rejoin.')
    }

    return () => {
      ws.close()
    }
  }, [sessionId, participantName])

  const sendClaim = (itemId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'claim', sessionId, participantName, itemId }))
  }

  const sendUnclaim = (itemId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'unclaim', sessionId, participantName, itemId }))
  }

  const myTotalCents = session
    ? session.items.reduce((sum, item) => {
        const claimants = session.claims[item.id] ?? []
        if (!claimants.includes(participantName)) return sum
        return sum + Math.round(item.priceCents / claimants.length)
      }, 0)
    : 0

  if (connectionError) {
    return (
      <div className="w-full max-w-sm mx-auto p-4">
        <p className="text-red-500 text-center p-4">{connectionError}</p>
        <p className="text-gray-500 text-center text-sm">Ask the host to reshare the link.</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="w-full max-w-sm mx-auto p-4">
        <p className="text-gray-400 text-center p-8">Connecting...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Session items</h1>

      <p className="text-xs text-gray-400 mb-3">
        At the table: {session.participants.join(', ')}
      </p>

      {reconnecting && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-lg mb-4 text-center">
          Reconnecting... Pull down to refresh if this persists.
        </div>
      )}

      <ul className="divide-y divide-gray-100 mb-24">
        {session.items.map((item) => (
          <ClaimableItem
            key={item.id}
            item={item}
            claimants={session.claims[item.id] ?? []}
            participantName={participantName}
            onClaim={sendClaim}
            onUnclaim={sendUnclaim}
          />
        ))}
      </ul>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">
          Your total: ${(myTotalCents / 100).toFixed(2)}
        </span>
        {isHost && (
          <button
            type="button"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            onClick={() => {/* Phase 5 will wire this */}}
          >
            Finalize
          </button>
        )}
      </div>
    </div>
  )
}
