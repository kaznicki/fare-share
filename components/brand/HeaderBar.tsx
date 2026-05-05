'use client'
import Link from 'next/link'
import FareShareLogo from '@/components/brand/FareShareLogo'

interface Props {}

export default function HeaderBar({}: Props) {
  return (
    <header className="w-full h-14 bg-paper border-b border-rule px-4 py-3">
      <div className="max-w-md mx-auto h-full flex items-center justify-between">
        <Link href="/" aria-label="Fare Share home" className="flex items-center gap-2">
          <FareShareLogo size={32} />
          <span className="text-base font-bold tracking-[-0.02em] text-ink">
            Fare Share
          </span>
        </Link>
        <div aria-hidden="true" />
      </div>
    </header>
  )
}
