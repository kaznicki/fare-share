'use client'
import { use, useState } from 'react'
import JoinForm from '@/components/session/JoinForm'
import SessionRoom from '@/components/session/SessionRoom'

type Screen = 'joining' | 'session'

interface Props {
  params: Promise<{ id: string }>
}

export default function SessionPage({ params }: Props) {
  const { id } = use(params)
  const [screen, setScreen] = useState<Screen>('joining')
  const [participantName, setParticipantName] = useState('')

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {screen === 'joining' ? (
        <JoinForm
          onSubmit={(name) => {
            setParticipantName(name)
            setScreen('session')
          }}
        />
      ) : (
        <SessionRoom sessionId={id} participantName={participantName} />
      )}
    </main>
  )
}
