import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/session-store'
import { z } from 'zod'

// Zod schema for request body validation
const ItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
})

const CreateSessionSchema = z.object({
  items: z.array(ItemSchema).min(1, 'At least one item required'),
  taxCents: z.number().int().nonnegative(),
  tipCents: z.number().int().nonnegative(),
  hostName: z.string().min(1).max(64),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CreateSessionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items, taxCents, tipCents, hostName } = parsed.data

    // CORR-05: Expand items with qty > 1 into separate claimable rows.
    // e.g. { name: 'Burger', qty: 2 } → two rows with qty: 1 and distinct IDs.
    // The session store records individual items so each guest can claim one unit.
    const expandedItems = items.flatMap(item =>
      item.qty === 1
        ? [{ ...item, qty: 1 }]
        : Array.from({ length: item.qty }, () => ({
            id: crypto.randomUUID(),
            name: item.name,
            priceCents: item.priceCents,
            qty: 1,
          }))
    )

    const sessionId = sessionStore.create({ items: expandedItems, taxCents, tipCents, hostName })

    return NextResponse.json(
      {
        sessionId,
        shareUrl: `/s/${sessionId}`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/sessions error:', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
