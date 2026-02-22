'use client'
import { useEffect, useRef, useState } from 'react'
import type { SessionData, ServerMessage } from '@/types'

interface Props {
  sessionId: string
  participantName: string
}

export default function SessionRoom({ sessionId, participantName }: Props) {
  const [session, setSession] = useState<SessionData | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
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
      }
    }

    ws.onclose = (event) => {
      if (event.code === 1008) {
        setConnectionError('Session not found or expired.')
      }
    }

    ws.onerror = () => {
      setConnectionError('Connection lost. Please refresh to rejoin.')
    }

    return () => {
      ws.close()
    }
  }, [sessionId, participantName])

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
      <h1 className="text-2xl font-bold mb-4">Session items</h1>

      <p className="text-sm text-gray-500 mb-4">
        Joined: {session.participants.join(', ')}
      </p>

      <ul className="divide-y divide-gray-100">
        {session.items.map((item) => (
          <li key={item.id} className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-900">{item.name}</span>
            <span className="text-gray-700">${(item.priceCents / 100).toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
