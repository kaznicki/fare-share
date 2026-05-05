'use client'

const TIP_PRESETS = [15, 18, 20]

interface Props {
  taxCents: number
  tipCents: number
  subtotalCents: number
  onChangeTax: (cents: number) => void
  onChangeTip: (cents: number) => void
}

export default function TaxTipFields({ taxCents, tipCents, subtotalCents, onChangeTax, onChangeTip }: Props) {
  const totalCents = subtotalCents + taxCents + tipCents
  return (
    <div className="bg-paper-deep border-t border-rule p-4">
      <div className="flex gap-4">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-medium text-ink-2">Tax</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted">$</span>
            <input
              key={taxCents}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-6 pr-2 py-2 border border-rule rounded-lg text-right outline-none focus:ring-2 focus:ring-accent"
              defaultValue={(taxCents / 100).toFixed(2)}
              onBlur={(e) => {
                onChangeTax(Math.round((parseFloat(e.target.value) || 0) * 100))
              }}
            />
          </div>
        </label>

        <div className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-medium text-ink-2">Tip</span>
          <div className="flex gap-1 mb-1">
            {TIP_PRESETS.map(pct => {
              const isActive = tipCents === Math.round(subtotalCents * pct / 100)
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onChangeTip(Math.round(subtotalCents * pct / 100))}
                  className={
                    isActive
                      ? "flex-1 py-1 text-xs font-normal border rounded transition-colors bg-accent text-paper border-accent"
                      : "flex-1 py-1 text-xs font-normal border border-rule rounded bg-paper-deep text-ink-2 hover:bg-paper transition-colors"
                  }
                >
                  {pct}%
                </button>
              )
            })}
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted">$</span>
            <input
              key={tipCents}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-6 pr-2 py-2 border border-rule rounded-lg text-right outline-none focus:ring-2 focus:ring-accent"
              defaultValue={(tipCents / 100).toFixed(2)}
              onBlur={(e) => {
                onChangeTip(Math.round((parseFloat(e.target.value) || 0) * 100))
              }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-between items-center text-sm font-bold text-ink">
        <span>Total</span>
        <span className="font-mono tabular-nums">${(totalCents / 100).toFixed(2)}</span>
      </div>
    </div>
  )
}
