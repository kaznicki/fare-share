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

    const { items, taxCents, tipCents } = parsed.data
    const sessionId = sessionStore.create({ items, taxCents, tipCents })

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
