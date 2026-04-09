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

      <p className="text-gray-500 text-center">Scan to join</p>

      {/* QR code wrapped in a white card so it scans cleanly against any background */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <QRCodeSVG
          value={joinUrl}
          size={256}
          level="M"
          marginSize={4}
          className="mx-auto"
        />
      </div>

      {/* Readable URL — selectable for manual copy-paste */}
      <p className="text-sm text-gray-600 break-all text-center select-all">
        {joinUrl}
      </p>

      <button
        onClick={copyLink}
        disabled={copied}
        className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 text-gray-700 font-medium
                   hover:border-gray-400 hover:bg-gray-50 transition-colors
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>

      <a
        href={`/session/${sessionId}?name=${encodeURIComponent(hostName)}`}
        className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium text-center
                   hover:bg-indigo-700 transition-colors"
      >
        Join as host
      </a>

      <p className="text-xs text-gray-400">Link expires in ~4 hours</p>
    </div>
  )
}
