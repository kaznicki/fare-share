---
status: partial
phase: 05-summary-and-finalization
source: [05-VERIFICATION.md]
started: 2026-04-09T17:10:00Z
updated: 2026-04-09T17:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. End-to-End Finalization — All Items Claimed
expected: Host taps Finalize (no modal). Both tabs immediately transition to Summary screen. Alice sees Food subtotal, Your tax share, Your tip share, Total owed — plus "Everyone's totals" table. Bob sees only his own breakdown.
result: [pending]

### 2. End-to-End Finalization — Split Among Everyone
expected: With unclaimed items, host taps Finalize, modal shows "{N} item(s) not claimed", tap "Split among everyone", Summary screen appears for all participants with unclaimed costs distributed proportionally.
result: [pending]

### 3. End-to-End Finalization — I'll Cover the Rest (WR-05 regression)
expected: With unclaimed items, host taps Finalize, choose "I'll cover the rest", Summary screen appears, host's total includes full unclaimed item costs, no silent drop. (Validates Plan 03 WR-05 case-insensitive host identity fix.)
result: [pending]

### 4. Math Accuracy Spot-Check
expected: On host's Summary screen, grand total in "Everyone's totals" row equals sum of all items + tax + tip exactly — no missing or extra cents.
result: [pending]

## Summary

total: 4
passed: 0
failed: 0
pending: 4
