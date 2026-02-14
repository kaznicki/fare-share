# Requirements: SplitCheck

**Defined:** 2026-02-14
**Core Value:** Accurately split a restaurant bill among any number of people so everyone pays exactly their fair share, with minimal manual effort.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Receipt Scanning

- [ ] **SCAN-01**: User can photograph a receipt and have line items extracted automatically via OCR
- [ ] **SCAN-02**: Receipt image is preprocessed (crop, enhance contrast, deskew) before OCR
- [ ] **SCAN-03**: User can manually enter items as fallback when OCR is unavailable or fails
- [ ] **SCAN-04**: App uses cloud OCR fallback when client-side OCR confidence is low
- [ ] **SCAN-05**: Each extracted item shows a confidence indicator so user knows what to double-check

### Item Management

- [ ] **ITEM-01**: User can review and edit OCR-extracted items (fix names, correct prices, adjust quantities)
- [ ] **ITEM-02**: User can manually add or remove items from the list
- [ ] **ITEM-03**: Multi-quantity line items (e.g., "Burger x2 $30") are automatically expanded into individual assignable items
- [ ] **ITEM-04**: Tax, subtotal, and total lines are auto-detected and excluded from the item list

### Collaborative Claiming

- [ ] **CLAM-01**: Host can generate a shareable session link after reviewing items
- [ ] **CLAM-02**: Each person opens the shared link and enters their name to join the session
- [ ] **CLAM-03**: Each person can claim items for themselves from the item list
- [ ] **CLAM-04**: A person can mark an item as shared with specific other people (split equally)
- [ ] **CLAM-05**: A person can mark an item as "shared by everyone" with one tap
- [ ] **CLAM-06**: Items show visual indicators of claim status (unclaimed, claimed by whom, shared)
- [ ] **CLAM-07**: All participants see claims update in real-time as people claim items

### Tax & Tip

- [ ] **CALC-01**: Tax is split proportionally based on each person's subtotal
- [ ] **CALC-02**: User can choose tip as a percentage (15%, 18%, 20%, or custom)
- [ ] **CALC-03**: User can enter a flat dollar tip amount
- [ ] **CALC-04**: User can select "gratuity already included" to skip additional tip calculation
- [ ] **CALC-05**: Tax amount is pre-filled from receipt OCR when detected

### Results & Sharing

- [ ] **RSLT-01**: Each person sees their own breakdown showing items, subtotal, tax share, tip share, and total
- [ ] **RSLT-02**: Sum of all person totals equals the bill total to the penny (correct rounding)
- [ ] **RSLT-03**: Host can copy/share the full breakdown as formatted text
- [ ] **RSLT-04**: Breakdown updates live as items are claimed (no page refresh needed)
- [ ] **RSLT-05**: Unclaimed items are clearly visible so the group knows what's left to claim

### Foundation

- [ ] **FOUN-01**: App is a mobile-friendly responsive web app that works in phone browsers
- [ ] **FOUN-02**: App uses integer arithmetic (cents) for all calculations to prevent rounding errors
- [ ] **FOUN-03**: State persists to localStorage so progress isn't lost on accidental navigation

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **V2-01**: Offline-first functionality (OCR runs without internet)
- **V2-02**: Receipt history and saved past splits
- **V2-03**: Deep links to Venmo/PayPal for payment requests
- **V2-04**: Multi-currency support for international receipts
- **V2-05**: Group/event management (track multiple bills across a trip)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Native mobile app (iOS/Android) | Web-first approach, evaluate after v1 |
| User accounts / login | Lightweight session via shared link, no formal sign-up |
| Payment processing | SplitCheck is a calculator, not a payment platform |
| Social features (friends, feeds) | Tool, not social network — adds moderation burden |
| Unequal shared item splits (60/40) | Adds UI complexity, marginal value — split equally or don't share |
| Dispute/negotiation features | Social problem, not software problem |
| Receipt templates | Each receipt is independent, no recurring use case |
| Gamification | Misaligned with utility-focused use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
| --- | --- | --- |
| (populated during roadmap creation) |  |  |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25

---
*Requirements defined: 2026-02-14*
*Last updated: 2026-02-14 after roadmap creation*
