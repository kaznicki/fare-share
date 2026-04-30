import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/session-store'
import { z } from 'zod'

const UnfinalizeSchema = z.object({
  hostName: z.string().min(1).max(64),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const body = await req.json()
    const parsed = UnfinalizeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { hostName } = parsed.data
    const sessionData = sessionStore.getData(id)
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Host-only guard — T-07-02-01: elevation of privilege mitigation
    if (hostName.trim().toLowerCase() !== sessionData.hostName.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Idempotency — already unfinalized, return success without mutation
    if (!sessionData.finalized) {
      return NextResponse.json({ ok: true })
    }

    sessionStore.unfinalize(id)

    // Broadcast updated snapshot to all connected WebSocket clients
    const data = sessionStore.getData(id)
    if (data) {
      sessionStore.broadcast(id, { type: 'session-snapshot', data })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/sessions/[id]/unfinalize error:', err)
    return NextResponse.json({ error: 'Failed to unfinalize session' }, { status: 500 })
  }
}
