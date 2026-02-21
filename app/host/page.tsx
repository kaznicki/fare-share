'use client'
import { useState } from 'react'
import CameraCapture from '@/components/host/CameraCapture'
import OcrReview from '@/components/host/OcrReview'
import ShareScreen from '@/components/host/ShareScreen'
import type { OcrResult } from '@/types'

type Screen = 'capture' | 'reviewing' | 'share'

export default function HostPage() {
  const [screen, setScreen] = useState<Screen>('capture')
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  if (screen === 'capture') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start max-w-md mx-auto px-4 pt-safe pb-safe">
        <CameraCapture
          onComplete={(result) => {
            setOcrResult(result)
            setScreen('reviewing')
          }}
        />
      </div>
    )
  }
  if (screen === 'reviewing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start max-w-md mx-auto px-4 pt-safe pb-safe">
        <OcrReview
          initial={ocrResult!}
          onComplete={(id) => {
            setSessionId(id)
            setScreen('share')
          }}
        />
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-start max-w-md mx-auto px-4 pt-safe pb-safe">
      <ShareScreen sessionId={sessionId!} />
    </div>
  )
}
