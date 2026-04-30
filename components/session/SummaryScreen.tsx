'use client'
import type { BillSplitResult } from '@/lib/bill-split'

interface Props {
  bill: BillSplitResult
  participantName: string
  isHost: boolean
  onUnfinalize?: () => void
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function SummaryScreen({ bill, participantName, isHost, onUnfinalize }: Props) {
  const myBill = bill.participants.find(p => p.name === participantName)
  const grandTotal = bill.participants.reduce((s, p) => s + p.totalCents, 0)

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Summary</h1>

      {/* Personal breakdown card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        {myBill && myBill.subtotalCents > 0 ? (
          <>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Food subtotal</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">{formatCents(myBill.subtotalCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Your tax share</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">{formatCents(myBill.taxShareCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Your tip share</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">{formatCents(myBill.tipShareCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px] border-t border-gray-100 mt-2">
              <span className="text-2xl font-bold text-indigo-600">Total owed</span>
              <span className="text-2xl font-bold text-indigo-600 tabular-nums">{formatCents(myBill.totalCents)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Food subtotal</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Your tax share</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-gray-700">Your tip share</span>
              <span className="text-base font-bold text-gray-900 tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px] border-t border-gray-100 mt-2">
              <span className="text-2xl font-bold text-indigo-600">Total owed</span>
              <span className="text-2xl font-bold text-indigo-600 tabular-nums">$0.00</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">You didn&apos;t claim any items.</p>
          </>
        )}
      </div>

      {/* Host-only: everyone's totals table */}
      {isHost && (
        <div className="mt-6 w-full max-w-sm mx-auto px-4 pb-16">
          <h2 className="text-base font-bold text-gray-700 mb-2">Everyone&apos;s totals</h2>
          <div>
            {bill.participants.map((p) => (
              <div
                key={p.name}
                className="flex justify-between items-center py-2 min-h-[44px] border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-900">{p.name}</span>
                <span className="text-gray-900 font-bold tabular-nums">{formatCents(p.totalCents)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 min-h-[44px] border-t border-gray-300">
            <span className="text-gray-700 font-bold">Total</span>
            <span className="text-gray-900 font-bold tabular-nums">{formatCents(grandTotal)}</span>
          </div>
          {onUnfinalize && (
            <button
              type="button"
              onClick={onUnfinalize}
              className="mt-4 w-full py-3 border border-gray-300 rounded-xl text-gray-700 font-normal hover:bg-gray-50 transition-colors"
            >
              Go back to claiming
            </button>
          )}
        </div>
      )}
    </div>
  )
}
