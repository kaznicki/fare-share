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
    rowClass += 'bg-blue-50 border-blue-200'
  } else if (isMine) {
    rowClass += 'bg-green-50 border-green-200'
  } else if (isTheirs) {
    rowClass += 'bg-gray-50 border-gray-200'
  } else {
    rowClass += 'bg-white border-gray-200'
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
        <span className={`text-gray-900 ${isMine ? 'font-bold' : 'font-normal'}`}>
          {item.name}
        </span>
        <span className="text-gray-700 text-sm whitespace-nowrap ml-2">
          {splitPrice}
        </span>
      </div>
      {claimants.length > 0 && (
        <span className="text-xs text-gray-400 mt-1 text-left">
          {claimants.join(', ')}
        </span>
      )}
    </button>
  )
}
