'use client'

interface Props {
  unclaimedCount: number
  onSplit: () => void
  onHostAbsorb: () => void
}

export default function UnclaimedModal({ unclaimedCount, onSplit, onHostAbsorb }: Props) {
  const itemWord = unclaimedCount === 1 ? 'item' : 'items'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-paper-deep rounded-2xl shadow-lg max-w-sm w-full p-6">
        <h2 className="text-2xl font-bold text-ink mb-2">
          {unclaimedCount} {itemWord} not claimed
        </h2>
        <p className="text-sm text-ink-2 mb-6">
          Choose how to handle the remaining cost before locking in totals.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onSplit}
            className="w-full py-2 min-h-[44px] rounded-xl bg-accent text-paper font-bold hover:bg-accent-deep transition-colors"
          >
            Split among everyone
          </button>
          <button
            type="button"
            onClick={onHostAbsorb}
            className="w-full py-2 min-h-[44px] rounded-xl border border-rule text-ink-2 bg-paper hover:bg-paper-deep transition-colors"
          >
            I&apos;ll cover the rest
          </button>
        </div>
      </div>
    </div>
  )
}
