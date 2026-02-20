# Tab Splitter

## What This Is

A mobile web app for splitting restaurant bills at the item level. One person photographs the receipt, the app extracts line items via OCR, and each person in the group claims what they ordered — including shared items and duplicates — before seeing their individual total.

## Core Value

Everyone pays exactly what they ordered (plus their proportional share of tax and tip) without doing any mental math.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can photograph a receipt and have line items extracted automatically
- [ ] User can share a session via QR code or link so others can join on their phones
- [ ] Each person can enter their name and claim the items they ordered
- [ ] Duplicate items (same item ordered by two people) can each be claimed independently
- [ ] Shared items can be claimed by multiple people and the cost split among them
- [ ] Tax and tip are distributed proportionally based on each person's subtotal
- [ ] Each person sees their final amount owed at the end

### Out of Scope

- User accounts / authentication — ephemeral sessions only
- In-app payments — app shows balances, people settle externally
- Saving session history — sessions are disposable
- Native mobile app — mobile web browser only

## Context

- Session flow: one person (the "host") scans the receipt, a QR code / shareable link is generated, others join on their own phones and claim items
- OCR edge cases to handle: duplicate line items (two people ordered the same thing), shared items (one item, multiple claimants)
- No backend persistence needed beyond the active session lifetime

## Constraints

- **Platform**: Mobile web — must work well on phone browsers, camera access via browser API
- **Auth**: None — no login, no accounts
- **Session**: Ephemeral — no long-term storage required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No accounts | Lower friction, fits one-off restaurant use case | — Pending |
| Proportional tax/tip | Fairer than equal split when orders vary in price | — Pending |
| Browser camera (not native app) | Faster to build, no app store | — Pending |

---
*Last updated: 2026-02-20 after initialization*
