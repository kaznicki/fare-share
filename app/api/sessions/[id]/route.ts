import { NextRequest, NextResponse } from 'next/server'
import { sessionStore } from '@/lib/session-store'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Next.js 15: params is a Promise — must await
  const { id } = await params

  const data = sessionStore.getData(id)
  if (!data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
