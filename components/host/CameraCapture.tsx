'use client'
import type { OcrResult } from '@/types'

interface Props {
  onComplete: (result: OcrResult) => void
}

export default function CameraCapture({ onComplete }: Props) {
  return <div>Camera stub</div>
}
