// Bill-splitting math engine for Tab Splitter.
// All monetary values are integer cents. No floats are used for money.
// Tax and tip are distributed using the Largest Remainder Method (LRM)
// to guarantee cent-exact proportional distribution with no rounding errors.

export interface ParticipantBill {
  name: string
  subtotalCents: number
  taxShareCents: number
  tipShareCents: number
  totalCents: number
}

export interface BillSplitResult {
  participants: ParticipantBill[]
}

export interface BillSplitParams {
  items: Array<{ id: string; priceCents: number }>
  claims: Record<string, string[]>
  participants: string[]
  taxCents: number
  tipCents: number
  unclaimedHandling: 'split' | 'host'
  hostName: string
}

/**
 * Distributes `totalCents` proportionally across `subtotals` using the
 * Largest Remainder Method, guaranteeing the outputs sum to exactly `totalCents`.
 *
 * When grandSubtotal === 0 (no one claimed anything), falls back to equal split
 * with remainder distributed to the first participants.
 */
function distributeProportionally(totalCents: number, subtotals: number[]): number[] {
  if (subtotals.length === 0) return []

  const grandSubtotal = subtotals.reduce((a, b) => a + b, 0)

  if (grandSubtotal === 0) {
    // Equal split fallback: prevents NaN when no one claimed anything
    const base = Math.floor(totalCents / subtotals.length)
    const remainder = totalCents % subtotals.length
    return subtotals.map((_, i) => base + (i < remainder ? 1 : 0))
  }

  // Compute exact float shares and floor each
  const floatShares = subtotals.map(s => (s / grandSubtotal) * totalCents)
  const floored = floatShares.map(f => Math.floor(f))
  const leftover = totalCents - floored.reduce((a, b) => a + b, 0)

  // Sort by descending remainder, tiebreak by ascending index
  const remainders = floatShares.map((f, i) => ({ i, remainder: f - floored[i] }))
  remainders.sort((a, b) =>
    b.remainder !== a.remainder ? b.remainder - a.remainder : a.i - b.i
  )

  // Give 1 extra cent to top `leftover` indices
  for (let k = 0; k < leftover; k++) {
    floored[remainders[k].i] += 1
  }

  return floored
}

/**
 * Computes each participant's bill with cent-exact proportional tax and tip.
 *
 * Steps:
 *   1. Build per-participant subtotals from claimed items (shared items split via LRM)
 *   2. Handle unclaimed items per `unclaimedHandling` policy
 *   3. Distribute tax proportionally (LRM)
 *   4. Distribute tip proportionally (LRM)
 *   5. Return ParticipantBill[] with totalCents = subtotal + tax + tip
 */
export function billSplit(params: BillSplitParams): BillSplitResult {
  const { items, claims, participants, taxCents, tipCents, unclaimedHandling, hostName } = params

  // Step 1: Build per-participant subtotals from claimed items
  const subtotals: Record<string, number> = {}
  for (const name of participants) {
    subtotals[name] = 0
  }

  const claimedItemIds = new Set<string>()

  for (const item of items) {
    const claimants = claims[item.id] ?? []
    if (claimants.length === 0) continue

    claimedItemIds.add(item.id)

    // Shared item: split cost via LRM to avoid cent loss/gain from Math.round
    const claimantCount = claimants.length
    const base = Math.floor(item.priceCents / claimantCount)
    const remainder = item.priceCents % claimantCount

    // Give 1 extra cent to the first `remainder` claimants (stable order)
    for (let k = 0; k < claimantCount; k++) {
      const name = claimants[k]
      if (subtotals[name] !== undefined) {
        subtotals[name] += base + (k < remainder ? 1 : 0)
      }
    }
  }

  // Step 2: Handle unclaimed items
  const unclaimedItems = items.filter(i => !claimedItemIds.has(i.id))
  const unclaimedTotal = unclaimedItems.reduce((s, i) => s + i.priceCents, 0)

  if (unclaimedTotal > 0) {
    if (unclaimedHandling === 'host') {
      // Add full unclaimed cost to host's subtotal
      if (subtotals[hostName] !== undefined) {
        subtotals[hostName] += unclaimedTotal
      }
    } else {
      // 'split': distribute unclaimed proportionally across all participants
      const currentSubtotals = participants.map(n => subtotals[n])
      const shares = distributeProportionally(unclaimedTotal, currentSubtotals)
      for (let i = 0; i < participants.length; i++) {
        subtotals[participants[i]] += shares[i]
      }
    }
  }

  // Step 3: Distribute tax (LRM)
  const subtotalValues = participants.map(n => subtotals[n])
  const taxShares = distributeProportionally(taxCents, subtotalValues)

  // Step 4: Distribute tip (LRM)
  const tipShares = distributeProportionally(tipCents, subtotalValues)

  // Step 5: Build result
  const participantBills: ParticipantBill[] = participants.map((name, i) => {
    const subtotalCents = subtotals[name]
    const taxShareCents = taxShares[i]
    const tipShareCents = tipShares[i]
    return {
      name,
      subtotalCents,
      taxShareCents,
      tipShareCents,
      totalCents: subtotalCents + taxShareCents + tipShareCents,
    }
  })

  return { participants: participantBills }
}
