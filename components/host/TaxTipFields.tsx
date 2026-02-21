'use client'

interface Props {
  taxCents: number
  tipCents: number
  onChangeTax: (cents: number) => void
  onChangeTip: (cents: number) => void
}

export default function TaxTipFields({ taxCents, tipCents, onChangeTax, onChangeTip }: Props) {
  return (
    <div className="sticky bottom-0 bg-white border-t p-4">
      <div className="flex gap-4">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">Tax</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              key={taxCents}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-right outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={(taxCents / 100).toFixed(2)}
              onBlur={(e) => {
                onChangeTax(Math.round((parseFloat(e.target.value) || 0) * 100))
              }}
            />
          </div>
        </label>

        <label className="flex-1 flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-600">Tip</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              key={tipCents}
              type="number"
              step="0.01"
              min="0"
              className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-right outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue={(tipCents / 100).toFixed(2)}
              onBlur={(e) => {
                onChangeTip(Math.round((parseFloat(e.target.value) || 0) * 100))
              }}
            />
          </div>
        </label>
      </div>
    </div>
  )
}
