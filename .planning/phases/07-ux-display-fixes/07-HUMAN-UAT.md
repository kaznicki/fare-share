---
status: partial
phase: 07-ux-display-fixes
source: [07-VERIFICATION.md]
started: 2026-04-30T00:00:00.000Z
updated: 2026-04-30T00:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Host-only button visibility
expected: Only the host tab shows "Go back to claiming" on the summary screen; participant tab does not show the button
result: [pending]

### 2. Full unfinalize round-trip
expected: Host clicks "Go back to claiming"; both host and participant tabs transition back to the claiming screen; all prior item claims are still present (nothing needs to be re-claimed)
result: [pending]

### 3. TaxTipFields reactive UI
expected: The "Total $X.XX" row in the OcrReview sticky footer updates reactively as items, tax, and tip change; the active tip preset button highlights blue when its percentage matches the current tip; no preset is highlighted when a custom tip amount is entered
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
