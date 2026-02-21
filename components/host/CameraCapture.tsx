'use client'
import { useRef, useState, useTransition } from 'react'
import type { OcrResult } from '@/types'

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const maxDim = 2000
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.7))
}

interface Props {
  onComplete: (result: OcrResult) => void
}

export default function CameraCapture({ onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCapturedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCapturedFile(null)
    setError(null)
    // CRITICAL: reset input value so re-selecting the same file fires onChange again (Pitfall 5)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSubmit = () => startTransition(async () => {
    if (!capturedFile) return
    try {
      const compressed = await compressImage(capturedFile)
      const formData = new FormData()
      formData.append('image', compressed, 'receipt.jpg')
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(`OCR request failed: ${res.status}`)
      const result: OcrResult = await res.json()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onComplete(result)
    } catch {
      // OCR-04: on failure, show error banner — host advances via "Continue anyway" button
      setError('Could not read the receipt. You can add items manually instead.')
    }
  })

  return (
    <div className="w-full flex flex-col gap-4 py-6">
      <h1 className="text-2xl font-bold text-center text-gray-900">Photograph Receipt</h1>
      <p className="text-center text-gray-500 text-sm">
        Point your camera at the receipt and tap the button below.
      </p>

      {/* Hidden file input — triggered by the styled button below */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />

      {/* Take Photo button — shown when no preview yet */}
      {!previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Take Photo
        </button>
      )}

      {/* Error banner */}
      {error && (
        <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-amber-800 text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => onComplete({ items: [], taxCents: 0, tipCents: 0 })}
            className="self-start text-amber-700 underline text-sm font-medium"
          >
            Continue anyway
          </button>
        </div>
      )}

      {/* Image preview */}
      {previewUrl && (
        <>
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="w-full rounded-lg mt-2 object-contain max-h-96"
          />

          {/* Retake / Submit buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleRetake}
              disabled={isPending}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !capturedFile}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Analyzing...' : 'Submit Receipt'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
