'use client'
import { useState } from 'react'
import type { Item } from '@/types'

interface Props {
  item: Item
  onChange: (patch: Partial<Item>) => void
  onDelete: () => void
  autoFocusName?: boolean
}

export default function ItemRow({ item, onChange, onDelete, autoFocusName = false }: Props) {
  const [editingField, setEditingField] = useState<'name' | 'price' | null>(
    autoFocusName ? 'name' : null
  )

  return (
    <div className="flex items-center gap-3 border-b py-3">
      {/* Name cell — tap-to-edit */}
      <div className="flex-1">
        {editingField === 'name' ? (
          <input
            autoFocus
            type="text"
            className="flex-1 w-full border-b border-muted outline-none bg-transparent"
            defaultValue={item.name}
            onBlur={(e) => {
              onChange({ name: e.target.value })
              setEditingField(null)
            }}
          />
        ) : (
          <span
            className="cursor-pointer text-ink"
            onClick={() => setEditingField('name')}
          >
            {item.name || 'Tap to add name'}
          </span>
        )}
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-1">
        <button
          className="w-7 h-7 rounded-full border border-rule text-ink-2 flex items-center justify-center hover:bg-paper-deep"
          onClick={() => onChange({ qty: Math.max(1, item.qty - 1) })}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span className="w-5 text-center text-sm">{item.qty}</span>
        <button
          className="w-7 h-7 rounded-full border border-rule text-ink-2 flex items-center justify-center hover:bg-paper-deep"
          onClick={() => onChange({ qty: item.qty + 1 })}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Price cell — tap-to-edit */}
      <div className="w-24 text-right">
        {editingField === 'price' ? (
          <input
            autoFocus
            type="number"
            step="0.01"
            min="0"
            className="w-24 text-right border-b border-muted outline-none bg-transparent"
            defaultValue={(item.priceCents / 100).toFixed(2)}
            onBlur={(e) => {
              onChange({ priceCents: Math.round((parseFloat(e.target.value) || 0) * 100) })
              setEditingField(null)
            }}
          />
        ) : (
          <span
            className="cursor-pointer text-ink font-mono tabular-nums"
            onClick={() => setEditingField('price')}
          >
            ${(item.priceCents / 100).toFixed(2)}
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={onDelete}
        aria-label="Delete item"
        className="text-muted hover:text-accent ml-1"
      >
        ✕
      </button>
    </div>
  )
}
