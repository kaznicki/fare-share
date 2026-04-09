import { describe, it, expect } from 'vitest'
import { billSplit } from '@/lib/bill-split'

// Helper: build a simple item list
const item = (id: string, priceCents: number) => ({ id, priceCents })

describe('billSplit', () => {
  describe('MATH-01: proportional tax distribution (Largest Remainder Method)', () => {
    it('distributes $1.00 tax equally among 3 participants with equal subtotals', () => {
      // 3 participants × $10.00 food => each 33/34 cents tax
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('c', 1000)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 100,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const taxes = result.participants.map(p => p.taxShareCents)
      expect(taxes.reduce((s, t) => s + t, 0)).toBe(100)
      // LRM: first participant gets 34, rest get 33
      expect(taxes).toContain(34)
      expect(taxes.filter(t => t === 33).length).toBe(2)
    })

    it('distributes $1.00 tax with 75/25 subtotal split', () => {
      const result = billSplit({
        items: [item('a', 1500), item('b', 500)],
        claims: { a: ['Alice'], b: ['Bob'] },
        participants: ['Alice', 'Bob'],
        taxCents: 100,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const byName = Object.fromEntries(result.participants.map(p => [p.name, p]))
      expect(byName['Alice'].taxShareCents).toBe(75)
      expect(byName['Bob'].taxShareCents).toBe(25)
    })

    it('distributes $1.00 tax with unequal subtotals ($10, $10, $9)', () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('c', 900)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 100,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const taxes = result.participants.map(p => p.taxShareCents)
      expect(taxes.reduce((s, t) => s + t, 0)).toBe(100)
      // $10+$10+$9 = $29; Alice=34.48→34, Bob=34.48→34, Carol=31.03→31 + 1 remainder = 35,34,31 or similar
      // Key: sum must be 100 exactly
    })
  })

  describe('MATH-02: proportional tip distribution (Largest Remainder Method)', () => {
    it('distributes $1.00 tip equally among 3 participants with equal subtotals', () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('c', 1000)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 0,
        tipCents: 100,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const tips = result.participants.map(p => p.tipShareCents)
      expect(tips.reduce((s, t) => s + t, 0)).toBe(100)
      expect(tips).toContain(34)
      expect(tips.filter(t => t === 33).length).toBe(2)
    })
  })

  describe('MATH-03: exact sum constraint', () => {
    it('sum of all totalCents equals itemSubtotal + taxCents + tipCents exactly (3 equal participants)', () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('c', 1000)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 100,
        tipCents: 150,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const totalOwed = result.participants.reduce((s, p) => s + p.totalCents, 0)
      expect(totalOwed).toBe(3000 + 100 + 150)
    })

    it('sum of all totalCents equals grand total with unequal subtotals', () => {
      const result = billSplit({
        items: [item('a', 1500), item('b', 800), item('c', 700)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 300,
        tipCents: 200,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const totalOwed = result.participants.reduce((s, p) => s + p.totalCents, 0)
      expect(totalOwed).toBe(1500 + 800 + 700 + 300 + 200)
    })

    it('sum is exact when tip has awkward rounding (7 cents, 3 participants)', () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('c', 1000)],
        claims: { a: ['Alice'], b: ['Bob'], c: ['Carol'] },
        participants: ['Alice', 'Bob', 'Carol'],
        taxCents: 0,
        tipCents: 7,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const total = result.participants.reduce((s, p) => s + p.totalCents, 0)
      expect(total).toBe(3000 + 7)
    })
  })

  describe('shared items', () => {
    it('splits a shared item cost via LRM between 2 claimants', () => {
      // 1 item at $10.01 shared by 2 => LRM gives Alice 501 cents, Bob 500 cents
      const result = billSplit({
        items: [item('a', 1001)],
        claims: { a: ['Alice', 'Bob'] },
        participants: ['Alice', 'Bob'],
        taxCents: 0,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const byName = Object.fromEntries(result.participants.map(p => [p.name, p]))
      expect(byName['Alice'].subtotalCents).toBe(501)
      expect(byName['Bob'].subtotalCents).toBe(500)
    })
  })

  describe('unclaimed item handling', () => {
    it("unclaimedHandling 'host' adds unclaimed item cost to host's subtotal only", () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 500)],
        claims: { a: ['Alice'] }, // 'b' is unclaimed
        participants: ['Alice', 'Bob'],
        taxCents: 0,
        tipCents: 0,
        unclaimedHandling: 'host',
        hostName: 'Alice',
      })
      const byName = Object.fromEntries(result.participants.map(p => [p.name, p]))
      // Alice claimed 'a' ($10) + unclaimed 'b' ($5) => $15
      expect(byName['Alice'].subtotalCents).toBe(1500)
      // Bob claimed nothing
      expect(byName['Bob'].subtotalCents).toBe(0)
    })

    it("unclaimedHandling 'split' distributes unclaimed item proportionally", () => {
      const result = billSplit({
        items: [item('a', 1000), item('b', 1000), item('unclaimed', 500)],
        claims: { a: ['Alice'], b: ['Bob'] }, // 'unclaimed' is unclaimed
        participants: ['Alice', 'Bob'],
        taxCents: 0,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const total = result.participants.reduce((s, p) => s + p.totalCents, 0)
      // Total items: $10 + $10 + $5 = $25
      expect(total).toBe(2500)
    })
  })

  describe('edge cases', () => {
    it('distributes tax/tip equally when grandSubtotal is 0 (no one claimed anything)', () => {
      const result = billSplit({
        items: [item('a', 1000)],
        claims: {},
        participants: ['Alice', 'Bob'],
        taxCents: 100,
        tipCents: 50,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      // No NaN — must return numeric values
      for (const p of result.participants) {
        expect(p.taxShareCents).not.toBeNaN()
        expect(p.tipShareCents).not.toBeNaN()
        expect(p.totalCents).not.toBeNaN()
      }
      const taxSum = result.participants.reduce((s, p) => s + p.taxShareCents, 0)
      const tipSum = result.participants.reduce((s, p) => s + p.tipShareCents, 0)
      expect(taxSum).toBe(100)
      expect(tipSum).toBe(50)
    })

    it('single participant gets 100% of tax and tip', () => {
      const result = billSplit({
        items: [item('a', 2000)],
        claims: { a: ['Alice'] },
        participants: ['Alice'],
        taxCents: 200,
        tipCents: 300,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      expect(result.participants.length).toBe(1)
      expect(result.participants[0].taxShareCents).toBe(200)
      expect(result.participants[0].tipShareCents).toBe(300)
      expect(result.participants[0].totalCents).toBe(2500)
    })

    it('participant who claimed nothing gets $0 subtotal', () => {
      const result = billSplit({
        items: [item('a', 1000)],
        claims: { a: ['Alice'] },
        participants: ['Alice', 'Bob'],
        taxCents: 0,
        tipCents: 0,
        unclaimedHandling: 'split',
        hostName: 'Alice',
      })
      const byName = Object.fromEntries(result.participants.map(p => [p.name, p]))
      expect(byName['Bob'].subtotalCents).toBe(0)
    })
  })
})
