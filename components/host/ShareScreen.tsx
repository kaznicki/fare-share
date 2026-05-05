'use client'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  sessionId: string
  hostName: string
}

export default function ShareScreen({ sessionId, hostName }: Props) {
  // window.location.origin accessed inside function body — NOT at module level
  // (avoids SSR crash; see RESEARCH.md Pitfall 3)
  const joinUrl = `${window.location.origin}/session/${sessionId}`

  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
    } catch {
      // Fallback for older Safari or non-HTTPS preview environments
      const el = document.createElement('textarea')
      el.value = joinUrl
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm py-8">
      <h1 className="text-2xl font-bold text-center">Share with your table</h1>

      <p className="text-ink-2 text-center">Scan to join</p>

      {/* QR code wrapped in a paper card so it scans cleanly against any background */}
      <div className="bg-paper-deep rounded-2xl shadow-md p-4">
        <QRCodeSVG
          value={joinUrl}
          size={256}
          level="M"
          marginSize={4}
          className="mx-auto"
        />
      </div>

      {/* Readable URL — selectable for manual copy-paste */}
      <p className="text-sm text-ink-2 break-all text-center select-all">
        {joinUrl}
      </p>

      <button
        onClick={copyLink}
        disabled={copied}
        className="w-full py-3 px-4 rounded-xl border-2 border-rule text-ink-2 font-medium
                   hover:border-muted hover:bg-paper-deep transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>

      <a
        href={`/session/${sessionId}?name=${encodeURIComponent(hostName)}`}
        className="w-full py-3 px-4 rounded-xl bg-accent text-paper font-medium text-center
                   hover:bg-accent-deep transition-colors"
      >
        Join as host
      </a>

      <p className="text-xs text-muted">Link expires in ~4 hours</p>
    </div>
  )
}
