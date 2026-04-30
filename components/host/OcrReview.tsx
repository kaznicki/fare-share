'use client'
import { useState, useTransition } from 'react'
import type { OcrResult, Item } from '@/types'
import ItemRow from '@/components/host/ItemRow'
import TaxTipFields from '@/components/host/TaxTipFields'

interface Props {
  initial: OcrResult
  onComplete: (sessionId: string, hostName: string) => void
}

export default function OcrReview({ initial, onComplete }: Props) {
  const [items, setItems] = useState<Item[]>(initial.items)
  const [taxCents, setTaxCents] = useState(initial.taxCents)
  const [tipCents, setTipCents] = useState(initial.tipCents)
  const [hostName, setHostName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [newItemId, setNewItemId] = useState<string | null>(null)

  // Immutable item mutations — never mutate array in place
  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const deleteItem = (id: string) =>
    setItems(prev => prev.filter(it => it.id !== id))

  const addItem = () => {
    const id = crypto.randomUUID()
    setItems(prev => [...prev, { id, name: '', priceCents: 0, qty: 1 }])
    setNewItemId(id)
  }

  // SESS-01: POST to /api/sessions — server handles CORR-05 qty expansion
  const createSession = () => startTransition(async () => {
    setSessionError(null)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, taxCents, tipCents, hostName: hostName.trim() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { sessionId } = await res.json()
      onComplete(sessionId, hostName.trim())
    } catch {
      setSessionError('Could not create session. Please try again.')
    }
  })

  return (
    <div className="w-full flex flex-col min-h-0">
      <h1 className="text-2xl font-bold mb-4">Review Receipt</h1>

      {/* Zero-item banner */}
      {items.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-amber-800">
          OCR extracted 0 items — add items manually below
        </div>
      )}

      {/* Session creation error banner */}
      {sessionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
          {sessionError}
        </div>
      )}

      {/* Scrollable item list */}
      <div className="flex-1 overflow-y-auto">
        {items.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            onChange={patch => {
              updateItem(item.id, patch)
              if (item.id === newItemId) setNewItemId(null)
            }}
            onDelete={() => deleteItem(item.id)}
            autoFocusName={item.id === newItemId}
          />
        ))}

        {/* Add Item button */}
        <button
          onClick={addItem}
          className="mt-3 w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Sticky footer card — TaxTipFields + name input + Create Session */}
      <div className="bg-white rounded-2xl shadow-md">
        <TaxTipFields
          taxCents={taxCents}
          tipCents={tipCents}
          subtotalCents={items.reduce((sum, it) => sum + it.priceCents * it.qty, 0)}
          onChangeTax={setTaxCents}
          onChangeTip={setTipCents}
        />

        {/* Create Session button — disabled while pending or host name is empty */}
        <div className="px-4 pb-4 pt-2 bg-white">
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">Your name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={createSession}
            disabled={isPending || !hostName.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors"
          >
            {isPending ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
