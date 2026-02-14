# Roadmap: SplitCheck

**Created:** 2026-02-14
**Depth:** Standard (5-8 phases)
**Coverage:** 25/25 v1 requirements mapped

## Overview

This roadmap delivers a collaborative receipt-scanning bill splitter through seven phases. The architecture centers on a real-time collaborative session where a host scans the receipt and shares a link, then everyone claims their own items live. Phases follow the natural data flow while front-loading the highest-risk work (OCR, real-time infrastructure).

## Phases

### Phase 1: Foundation & Project Setup

**Goal:** Mobile-responsive Next.js application is running with project structure, state management, integer math utilities, and localStorage persistence

**Dependencies:** None (foundation)

**Requirements:**
- FOUN-01: App is a mobile-friendly responsive web app that works in phone browsers
- FOUN-02: App uses integer arithmetic (cents) for all calculations to prevent rounding errors
- FOUN-03: State persists to localStorage so progress isn't lost on accidental navigation

**Success Criteria:**
1. User can access the app from a mobile browser and see a responsive, touch-friendly interface
2. User can navigate away and return without losing their current work
3. All internal monetary values are stored and calculated in cents (integer math)
4. Project has Tailwind CSS + shadcn/ui configured with mobile-first responsive layout

**Status:** Pending

---

### Phase 2: Receipt Scanning & OCR

**Goal:** Host can photograph a receipt and see extracted line items with confidence indicators, with manual entry as fallback

**Dependencies:** Phase 1 (foundation)

**Requirements:**
- SCAN-01: User can photograph a receipt and have line items extracted automatically via OCR
- SCAN-02: Receipt image is preprocessed (crop, enhance contrast, deskew) before OCR
- SCAN-03: User can manually enter items as fallback when OCR is unavailable or fails
- SCAN-04: App uses cloud OCR fallback when client-side OCR confidence is low
- SCAN-05: Each extracted item shows a confidence indicator so user knows what to double-check

**Success Criteria:**
1. Host can capture a receipt photo and see extracted items within seconds
2. Each extracted item shows a confidence indicator (high/medium/low)
3. Host can switch to manual entry mode and type items in directly
4. Receipt images are automatically enhanced before OCR processing
5. Low-confidence extractions trigger cloud OCR fallback for better accuracy

**Status:** Pending

---

### Phase 3: Item Management & Review

**Goal:** Host can review, edit, and refine the extracted item list before sharing, including multi-quantity expansion and tax line detection

**Dependencies:** Phase 2 (needs extracted items)

**Requirements:**
- ITEM-01: User can review and edit OCR-extracted items (fix names, correct prices, adjust quantities)
- ITEM-02: User can manually add or remove items from the list
- ITEM-03: Multi-quantity line items (e.g., "Burger x2 $30") are automatically expanded into individual assignable items
- ITEM-04: Tax, subtotal, and total lines are auto-detected and excluded from the item list

**Success Criteria:**
1. Host can tap any item to edit its name, price, or quantity
2. Host can add new items or delete incorrect ones
3. "Burger x2 $30" is automatically split into two separate $15 items
4. Tax and total lines are excluded from the claimable item list
5. Host sees a clean, accurate item list ready for the group to claim

**Status:** Pending

---

### Phase 4: Live Session & Collaborative Claiming

**Goal:** Host can create a live session and share a link; participants join, enter their name, and claim items with real-time updates visible to everyone

**Dependencies:** Phase 3 (needs reviewed item list)

**Requirements:**
- CLAM-01: Host can generate a shareable session link after reviewing items
- CLAM-02: Each person opens the shared link and enters their name to join the session
- CLAM-03: Each person can claim items for themselves from the item list
- CLAM-04: A person can mark an item as shared with specific other people (split equally)
- CLAM-05: A person can mark an item as "shared by everyone" with one tap
- CLAM-06: Items show visual indicators of claim status (unclaimed, claimed by whom, shared)
- CLAM-07: All participants see claims update in real-time as people claim items

**Success Criteria:**
1. Host taps "Share" and gets a link to send to the group
2. Participant opens the link, enters their name, and sees the item list
3. Participant can tap items to claim them; their name appears on claimed items instantly
4. Participant can mark an item as shared and select who shares it
5. All participants see claims appear in real-time without refreshing
6. Unclaimed items are visually distinct from claimed items

**Status:** Pending

---

### Phase 5: Tax, Tip & Calculation Engine

**Goal:** Host configures tax and tip; the calculation engine computes accurate per-person totals that update live as items are claimed

**Dependencies:** Phase 4 (needs item claims/assignments)

**Requirements:**
- CALC-01: Tax is split proportionally based on each person's subtotal
- CALC-02: User can choose tip as a percentage (15%, 18%, 20%, or custom)
- CALC-03: User can enter a flat dollar tip amount
- CALC-04: User can select "gratuity already included" to skip additional tip calculation
- CALC-05: Tax amount is pre-filled from receipt OCR when detected

**Success Criteria:**
1. Host can select tip mode (percentage, flat amount, or already included)
2. Tax is pre-filled from the receipt when detected by OCR
3. Each person's tax and tip share is proportional to their claimed subtotal
4. Per-person totals update live as items are claimed or unclaimed
5. Sum of all person totals equals the bill total to the penny

**Status:** Pending

---

### Phase 6: Results & Sharing

**Goal:** Each participant sees their own itemized breakdown; host can share a text summary; unclaimed items are clearly surfaced

**Dependencies:** Phase 5 (needs calculated results)

**Requirements:**
- RSLT-01: Each person sees their own breakdown showing items, subtotal, tax share, tip share, and total
- RSLT-02: Sum of all person totals equals the bill total to the penny (correct rounding)
- RSLT-03: Host can copy/share the full breakdown as formatted text
- RSLT-04: Breakdown updates live as items are claimed (no page refresh needed)
- RSLT-05: Unclaimed items are clearly visible so the group knows what's left to claim

**Success Criteria:**
1. Each participant sees a personalized view: "You owe $X" with itemized breakdown
2. Host sees the full breakdown for everyone
3. Host can copy the breakdown as formatted text to paste in a message
4. Results update live as remaining items get claimed
5. Unclaimed items are prominently shown so the group can resolve them

**Status:** Pending

---

### Phase 7: Polish & Edge Cases

**Goal:** App handles real-world edge cases gracefully, mobile UX is refined, and the end-to-end flow is smooth

**Dependencies:** Phase 6 (all features built)

**Requirements:**
- (Cross-cutting quality across all requirements)

**Success Criteria:**
1. Full flow works end-to-end: scan → review → share → claim → see totals
2. Edge cases handled: 0 items claimed, 1 person, all shared items, disconnected participant
3. Mobile UX is polished: thumb-friendly tap targets, fast interactions, clear visual hierarchy
4. Error states are handled gracefully (OCR failure, lost connection, expired session)

**Status:** Pending

---

## Progress

| Phase | Status | Plans | Completed |
|-------|--------|-------|-----------|
| 1 - Foundation | Pending | 0/0 | - |
| 2 - Receipt Scanning | Pending | 0/0 | - |
| 3 - Item Management | Pending | 0/0 | - |
| 4 - Live Session & Claiming | Pending | 0/0 | - |
| 5 - Calculation | Pending | 0/0 | - |
| 6 - Results & Sharing | Pending | 0/0 | - |
| 7 - Polish & Edge Cases | Pending | 0/0 | - |

**Overall:** 0/7 phases complete

---
*Last updated: 2026-02-14 after roadmap creation*
