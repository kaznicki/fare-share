---
status: complete
phase: 04-item-claiming
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-04-08T00:00:00Z
updated: 2026-04-08T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server boots without errors. The app loads at http://localhost:3000/host. No crash in the terminal, no error overlay in the browser.
result: pass

### 2. Tap to Claim
expected: In a session room as "Alice", tap any item row. The row turns green with a bold "Alice" label — the "mine" state. The price shows full (no split yet since it's the only claimant).
result: pass

### 3. Tap to Unclaim
expected: Tap the same item Alice just claimed. The row returns to the unclaimed state (white/plain, no names shown, no green highlight).
result: pass

### 4. Shared Item Split Price
expected: Alice claims item 1. Then Bob (in a second tab) claims the same item 1. Both tabs now show "$X.XX ÷ 2 = $Y.YY" with both names listed. The price shown is half the full price.
result: pass

### 5. Claimant Names Visible to All
expected: With Alice owning item 1 and Bob owning item 2, open a third tab (or check both existing tabs). Both tabs show "Alice" under item 1 and "Bob" under item 2 — claimant names are globally visible regardless of who is looking.
result: pass

### 6. Running Total Footer
expected: After claiming some items, a pinned footer at the bottom of the screen shows "Your total: $X.XX" reflecting only the items (or share of items) claimed by the current participant.
result: pass

### 7. Real-Time Sync
expected: In Tab A, claim an item that Tab B is watching. Within 2 seconds, Tab B shows the claim update — no page reload required.
result: pass

### 8. Reconnect Banner
expected: With a session open, stop the dev server (Ctrl+C). The participant screen shows a yellow banner indicating the connection was lost and prompting a refresh. No crash or blank screen.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
