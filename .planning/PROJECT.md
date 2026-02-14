# SplitCheck

## What This Is

A mobile-friendly web app that lets you photograph a restaurant receipt, extract line items via OCR, assign items to people in your party, and calculate what each person owes including their share of tax and tip. Designed for the real-world messiness of group dining — shared appetizers, bottles of wine, auto-gratuity, and duplicate items.

## Core Value

Accurately split a restaurant bill among any number of people so everyone pays exactly their fair share, with minimal manual effort.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Photograph a receipt and extract line items via OCR (item names, prices, quantities)
- [ ] Review and edit OCR results — fix names, correct prices, adjust quantities
- [ ] Automatically split multi-quantity line items (e.g., "Burger x2 - $30") into individual assignable items
- [ ] Add people by name to the party
- [ ] Assign each item to one person, multiple specific people, or everyone at the table
- [ ] Shared items split evenly among assigned people
- [ ] Tip options: choose percentage (15/18/20/custom), flat dollar amount, or gratuity already included
- [ ] Tax split proportionally based on each person's subtotal
- [ ] Display final breakdown showing what each person owes (subtotal + tax share + tip share)
- [ ] Share results — send each person their total via text or link
- [ ] Manual item entry as backup when photo scanning isn't available or practical

### Out of Scope

- Native mobile app (iOS/Android) — web-first, evaluate later
- Payment processing or Venmo integration — just show amounts
- User accounts or login — stateless, no persistence needed for v1
- Receipt history or saving past splits — v2 consideration

## Context

- Receipt OCR is the primary input method; manual entry is a backup
- Receipts are messy: abbreviated item names, varied formats, quantity notation differences (x2, qty 2, separate lines)
- Wine and shared dishes are common edge cases — same item name can appear multiple times as different things (glass vs bottle, different tables sharing)
- Restaurants often auto-add gratuity for large parties — must handle gracefully
- Users will be at a restaurant table on their phones — UI must be fast and thumb-friendly

## Constraints

- **Platform**: Mobile-friendly responsive web app (works in phone browsers)
- **OCR**: Needs reliable receipt text extraction — research best approach
- **UX**: Must be usable at a dinner table — quick, intuitive, minimal taps
- **Math**: Rounding must be handled so totals add up to the penny

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app over native | Faster to build, no app store, works on any phone | — Pending |
| Photo-first input | Core differentiator over manual-entry-only splitters | — Pending |
| Three tip modes | Covers percentage, flat amount, and auto-gratuity scenarios | — Pending |
| Split multi-quantity items automatically | Handles "Burger x2" and similar receipt patterns | — Pending |
| Review/edit step after OCR | Receipts are messy — users need to verify and fix before assigning | — Pending |

---
*Last updated: 2026-02-14 after initialization*
