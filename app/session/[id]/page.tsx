'use client'
import { use, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import JoinForm from '@/components/session/JoinForm'
import SessionRoom from '@/components/session/SessionRoom'
import SummaryScreen from '@/components/session/SummaryScreen'
import type { BillSplitResult } from '@/lib/bill-split'
import type { SessionData } from '@/types'

type Screen = 'joining' | 'session' | 'summary'

function SessionPageInner({ sessionId }: { sessionId: string }) {
  const searchParams = useSearchParams()
  const prefilledName = searchParams.get('name') ?? ''

  const [screen, setScreen] = useState<Screen>('joining')
  const [participantName, setParticipantName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [finalBill, setFinalBill] = useState<BillSplitResult | null>(null)

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      {screen === 'joining' && (
        <JoinForm
          initialName={prefilledName}
          onSubmit={(name) => {
            setParticipantName(name)
            setScreen('session')
          }}
        />
      )}
      {screen !== 'joining' && (
        <div className={screen === 'session' ? '' : 'hidden'}>
          <SessionRoom
            sessionId={sessionId}
            participantName={participantName}
            isHost={isHost}
            onFinalized={(bill: BillSplitResult) => {
              setFinalBill(bill)
              setScreen('summary')
            }}
            onSessionData={(data: SessionData) => {
              if (!isHost && data.hostName.trim().toLowerCase() === participantName.trim().toLowerCase()) {
                setIsHost(true)
              }
            }}
            onUnfinalized={() => {
              setScreen('session')
            }}
          />
        </div>
      )}
      {screen === 'summary' && finalBill && (
        <SummaryScreen
          bill={finalBill}
          participantName={participantName}
          isHost={isHost}
          onUnfinalize={async () => {
            await fetch(`/api/sessions/${sessionId}/unfinalize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ hostName: participantName }),
            })
          }}
        />
      )}
    </main>
  )
}

interface Props {
  params: Promise<{ id: string }>
}

export default function SessionPage({ params }: Props) {
  const { id } = use(params)
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><p className="text-ink-2">Loading...</p></div>}>
      <SessionPageInner sessionId={id} />
    </Suspense>
  )
}
