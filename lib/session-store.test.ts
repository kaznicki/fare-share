import { describe, it, expect, beforeEach } from 'vitest'
import { sessionStore } from './session-store'

const TEST_SESSION_ID_PREFIX = 'test-unfinalize-'

// Use a unique session ID per test run to avoid cross-test pollution
// since sessionStore is a globalThis singleton
let testSessionId: string

beforeEach(() => {
  // Create a fresh finalized session before each test
  testSessionId = sessionStore.create({
    items: [
      { id: 'item-a', name: 'Burger', priceCents: 1000, qty: 1 },
      { id: 'item-b', name: 'Fries', priceCents: 500, qty: 1 },
    ],
    taxCents: 100,
    tipCents: 150,
    hostName: 'Alice',
  })

  // Manually finalize the session so tests can verify unfinalize resets it
  const mockBill = {
    participants: [],
    grandTotal: 1750,
  } as any

  const session = sessionStore.get(testSessionId)
  if (session) {
    // Seed some claims to verify they are preserved
    session.claims = { 'item-a': ['Alice'], 'item-b': ['Bob'] }
    session.participants = ['Alice', 'Bob']
    session.finalized = true
    session.finalizedBill = mockBill
  }
})

describe('sessionStore.unfinalize()', () => {
  it('sets finalized to false when session exists and was finalized', () => {
    sessionStore.unfinalize(testSessionId)
    const data = sessionStore.getData(testSessionId)
    expect(data?.finalized).toBe(false)
  })

  it('sets finalizedBill to null when session exists and was finalized', () => {
    sessionStore.unfinalize(testSessionId)
    const data = sessionStore.getData(testSessionId)
    expect(data?.finalizedBill).toBeNull()
  })

  it('does not touch claims when unfinalized', () => {
    const before = sessionStore.getData(testSessionId)
    const claimsBefore = JSON.stringify(before?.claims)

    sessionStore.unfinalize(testSessionId)

    const after = sessionStore.getData(testSessionId)
    const claimsAfter = JSON.stringify(after?.claims)

    expect(claimsAfter).toBe(claimsBefore)
    expect(after?.claims['item-a']).toEqual(['Alice'])
    expect(after?.claims['item-b']).toEqual(['Bob'])
  })

  it('is a no-op (does not throw) when session does not exist', () => {
    expect(() => sessionStore.unfinalize('nonexistent-session-id')).not.toThrow()
  })
})
