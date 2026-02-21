// Canonical domain types for Tab Splitter.
// All monetary values are integer cents. No floats for money.

export interface Item {
  id: string
  name: string
  priceCents: number  // integer cents — e.g. $12.99 = 1299
  qty: number         // quantity as received from OCR; always >= 1
}

// SessionState is the in-memory shape. `sockets` is excluded from API responses.
export interface SessionState {
  id: string
  items: Item[]
  taxCents: number
  tipCents: number
  claims: Record<string, string[]>   // itemId -> participantName[] (append-only Set semantics)
  participants: string[]
  sockets: Set<import('ws').WebSocket>
  createdAt: number
  expiresAt: number
}

// Shape returned by GET /api/sessions/[id] (sockets excluded)
export type SessionData = Omit<SessionState, 'sockets'>

// Shape of OCR endpoint response
export interface OcrResult {
  items: Item[]
  taxCents: number
  tipCents: number
}

// WebSocket message types
export type ServerMessage =
  | { type: 'session-snapshot'; data: SessionData }
  | { type: 'session-expired' }

export type ClientMessage =
  | { type: 'join'; sessionId: string; participantName: string }
