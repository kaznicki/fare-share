'use client'
import type { Item } from '@/types'

interface Props {
  item: Item
  claimants: string[]        // claims[item.id] from session state — may be empty []
  participantName: string    // current user's name — to determine 'mine' vs 'theirs'
  onClaim: (itemId: string) => void
  onUnclaim: (itemId: string) => void
}

export default function ClaimableItem({ item, claimants, participantName, onClaim, onUnclaim }: Props) {
  const isMine = claimants.includes(participantName)
  const isShared = isMine && claimants.length > 1
  const isTheirs = claimants.length > 0 && !isMine

  const splitCents = claimants.length > 0
    ? Math.round(item.priceCents / claimants.length)
    : item.priceCents

  const fullPrice = `$${(item.priceCents / 100).toFixed(2)}`
  const splitPrice = claimants.length > 1
    ? `${fullPrice} ÷ ${claimants.length} = $${(splitCents / 100).toFixed(2)}`
    : fullPrice

  let rowClass =
    'flex flex-col py-3 px-3 w-full text-left border rounded-lg mb-2 transition-colors duration-300 '

  if (isShared) {
    rowClass += 'bg-paper-deep border-rule'
  } else if (isMine) {
    rowClass += 'bg-accent/10 border-accent'
  } else if (isTheirs) {
    rowClass += 'bg-paper border-rule'
  } else {
    rowClass += 'bg-paper-deep border-rule'
  }

  const handleTap = () => {
    if (isMine) {
      onUnclaim(item.id)
    } else {
      onClaim(item.id)
    }
  }

  return (
    <button type="button" className={rowClass} onClick={handleTap}>
      <div className="flex justify-between items-center w-full">
        <span className={`text-ink ${isMine ? 'font-bold' : 'font-normal'}`}>
          {item.name}
        </span>
        <span className="text-ink-2 text-sm whitespace-nowrap ml-2 font-mono tabular-nums">
          {splitPrice}
        </span>
      </div>
      {claimants.length > 0 && (
        <span className="text-xs text-muted mt-1 text-left">
          {claimants.join(', ')}
        </span>
      )}
    </button>
  )
}
