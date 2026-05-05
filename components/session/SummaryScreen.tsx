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
  const grandTotal = isHost
    ? bill.participants.reduce((s, p) => s + p.totalCents, 0)
    : 0

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Summary</h1>

      {/* Personal breakdown card */}
      <div className="bg-paper-deep border border-rule rounded-2xl p-6 shadow-md">
        {myBill && myBill.subtotalCents > 0 ? (
          <>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Food subtotal</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">{formatCents(myBill.subtotalCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Your tax share</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">{formatCents(myBill.taxShareCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Your tip share</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">{formatCents(myBill.tipShareCents)}</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px] border-t border-rule mt-2">
              <span className="text-2xl font-bold text-accent">Total owed</span>
              <span className="text-2xl font-bold text-accent font-mono tabular-nums">{formatCents(myBill.totalCents)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Food subtotal</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Your tax share</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px]">
              <span className="text-base text-ink-2">Your tip share</span>
              <span className="text-base font-bold text-ink font-mono tabular-nums">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2 min-h-[44px] border-t border-rule mt-2">
              <span className="text-2xl font-bold text-accent">Total owed</span>
              <span className="text-2xl font-bold text-accent font-mono tabular-nums">$0.00</span>
            </div>
            <p className="text-xs text-muted mt-2">You didn&apos;t claim any items.</p>
          </>
        )}
      </div>

      {/* Host-only: everyone's totals table */}
      {isHost && (
        <div className="mt-6 w-full max-w-sm mx-auto px-4 pb-16">
          <h2 className="text-base font-bold text-ink-2 mb-2">Everyone&apos;s totals</h2>
          <div>
            {bill.participants.map((p) => (
              <div
                key={p.name}
                className="flex justify-between items-center py-2 min-h-[44px] border-b border-rule last:border-0"
              >
                <span className="text-ink">{p.name}</span>
                <span className="text-ink font-bold font-mono tabular-nums">{formatCents(p.totalCents)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2 min-h-[44px] border-t border-rule">
            <span className="text-ink-2 font-bold">Total</span>
            <span className="text-ink font-bold font-mono tabular-nums">{formatCents(grandTotal)}</span>
          </div>
          {onUnfinalize && (
            <button
              type="button"
              onClick={onUnfinalize}
              className="mt-4 w-full py-3 border border-rule rounded-xl text-ink-2 font-normal hover:bg-paper-deep transition-colors"
            >
              Go back to claiming
            </button>
          )}
        </div>
      )}
    </div>
  )
}
