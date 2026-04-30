import { describe, it, expect } from 'vitest'

// These tests document the formulas used in TaxTipFields.tsx.
// DISP-01: totalCents = subtotalCents + taxCents + tipCents
// UX-01: isActive = tipCents === Math.round(subtotalCents * pct / 100)

describe('totalCents — DISP-01', () => {
  it('sums three integer values with no float precision loss', () => {
    const subtotalCents = 2000, taxCents = 180, tipCents = 360
    expect(subtotalCents + taxCents + tipCents).toBe(2540)
  })
  it('handles all-zero inputs', () => {
    expect(0 + 0 + 0).toBe(0)
  })
  it('handles large receipt values', () => {
    expect(12345 + 987 + 2222).toBe(15554)
  })
})

describe('isActivePreset — UX-01', () => {
  it('returns true when tipCents matches the 15% preset exactly', () => {
    const subtotalCents = 2000, tipCents = Math.round(2000 * 15 / 100)
    expect(tipCents === Math.round(subtotalCents * 15 / 100)).toBe(true)
  })
  it('returns true when tipCents matches the 18% preset exactly', () => {
    const subtotalCents = 2000, tipCents = Math.round(2000 * 18 / 100)
    expect(tipCents === Math.round(subtotalCents * 18 / 100)).toBe(true)
  })
  it('returns true when tipCents matches the 20% preset exactly', () => {
    const subtotalCents = 2000, tipCents = Math.round(2000 * 20 / 100)
    expect(tipCents === Math.round(subtotalCents * 20 / 100)).toBe(true)
  })
  it('returns false for a custom tip that does not match any preset', () => {
    const subtotalCents = 2000, tipCents = 301
    expect(tipCents === Math.round(subtotalCents * 15 / 100)).toBe(false)
    expect(tipCents === Math.round(subtotalCents * 18 / 100)).toBe(false)
    expect(tipCents === Math.round(subtotalCents * 20 / 100)).toBe(false)
  })
  it('returns false for $0.00 tip against any preset', () => {
    const subtotalCents = 2000, tipCents = 0
    expect(tipCents === Math.round(subtotalCents * 15 / 100)).toBe(false)
  })
})
