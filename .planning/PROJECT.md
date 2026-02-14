# SplitCheck

## What This Is

A collaborative mobile-friendly web app that lets one person (the "host") photograph a restaurant receipt, extract line items via OCR, then share a live link with the table so everyone can claim their own items. The app calculates what each person owes including their share of tax and tip in real-time. Designed for the real-world messiness of group dining — shared appetizers, bottles of wine, auto-gratuity, and duplicate items.

## Core Value

Accurately split a restaurant bill among any number of people so everyone pays exactly their fair share, with minimal manual effort.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Photograph a receipt and extract line items via OCR (item names, prices, quantities)
- [ ] Review and edit OCR results — fix names, correct prices, adjust quantities
- [ ] Automatically split multi-quantity line items (e.g., "Burger x2 - $30") into individual assignable items
- [ ] Host shares a live link; each person opens it, enters their name, and claims their own items
- [ ] People can claim items for themselves, mark items as shared with specific people, or shared by everyone
- [ ] Shared items split evenly among people who claimed them
- [ ] Real-time updates — everyone sees claims appear live as people claim items
- [ ] Tip options: choose percentage (15/18/20/custom), flat dollar amount, or gratuity already included
- [ ] Tax split proportionally based on each person's subtotal
- [ ] Display final breakdown showing what each person owes (subtotal + tax share + tip share)
- [ ] Share results — each person sees their own total on the shared link
- [ ] Manual item entry as backup when photo scanning isn't available or practical

### Out of Scope

- Native mobile app (iOS/Android) — web-first, evaluate later
- Payment processing or Venmo integration — just show amounts
- User accounts or login — lightweight session via shared link, no formal accounts
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
| Collaborative claiming over host-assigns-all | Distributes the work, better UX for large parties | — Pending |
| Real-time sync via WebSocket/polling | Everyone sees claims live, feels collaborative | — Pending |
| No formal accounts | People enter their name on the shared link, no sign-up friction | — Pending |

---
*Last updated: 2026-02-14 after initialization*
