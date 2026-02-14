# Features Research: Bill-Splitting & Receipt-Scanning Apps

**Research Date:** 2026-02-14
**Project:** SplitCheck
**Milestone:** Greenfield - Feature landscape analysis

## Executive Summary

Bill-splitting and receipt-scanning apps operate in a crowded market with clear table stakes (OCR, basic splitting, payment integration) and room for differentiation through UX simplicity, edge case handling, and friction reduction. The competitive set includes Splitwise (expense tracking focus), Tab (receipt scanning focus), Plates (restaurant-specific), and Venmo/PayPal (payment-first with splitting bolted on).

**Key Finding:** Most apps fail at handling messy real-world receipts (poor OCR quality, missing edge cases) or create too much friction in the splitting flow. Opportunity exists in photo-first UX with intelligent defaults and robust edge case handling.

---

## Table Stakes Features

Features users expect as baseline. Missing any of these = immediate abandonment.

### 1. Receipt Capture & OCR
**Complexity:** High
**Dependencies:** None
**Description:** Photograph receipt and extract line items automatically.

**Must handle:**
- Standard printed receipts (thermal, ink)
- Restaurant-specific formats (varying layouts)
- Poor lighting/image quality (blurry, crooked photos)
- Multiple columns (item, quantity, price)
- Tax and subtotal detection

**Market benchmark:** Tab, Splitwise Scan, Plates all offer this. Users expect 80%+ accuracy on standard receipts.

**Notes:** This is technically complex but absolutely non-negotiable. Fallback to manual entry is required when OCR fails.

---

### 2. Basic Item Assignment
**Complexity:** Medium
**Dependencies:** Receipt OCR or manual entry
**Description:** Assign line items to people in the party.

**Core capabilities:**
- Add people to split (names or labels like "Person 1")
- Tap/click items to assign to specific person
- Visual indication of who owes what
- Unassigned items clearly marked

**Market benchmark:** Universal across all competitors. Interaction patterns vary (drag-and-drop, tap-to-assign, checkboxes).

---

### 3. Tax & Tip Handling
**Complexity:** Medium
**Dependencies:** Item assignment
**Description:** Apply tax and tip proportionally or as flat amounts.

**Required modes:**
- Tip as percentage (15%, 18%, 20%, custom)
- Tip as flat dollar amount
- Tax proportional distribution (based on items assigned)
- "Tip already included" option

**Market benchmark:** All major apps support this. SplitCheck specifically calls out three tip modes as core requirement.

**Edge case:** Some apps let users exclude certain people from tip (e.g., if someone didn't drink alcohol, don't charge them for bar tip). This is becoming expected in restaurant-focused apps.

---

### 4. Per-Person Breakdown
**Complexity:** Low
**Dependencies:** Item assignment, tax/tip calculation
**Description:** Show each person what they owe with itemized breakdown.

**Display requirements:**
- Total amount per person (clear, large)
- Itemized list (what they ordered)
- Their share of tax/tip
- Running total

**Market benchmark:** Universal. Presentation varies but functionality is identical.

---

### 5. Manual Entry Fallback
**Complexity:** Low
**Dependencies:** None
**Description:** Ability to manually enter items when OCR fails or receipt unavailable.

**Must include:**
- Add item (name, price, quantity)
- Edit/delete items
- Manual tax/tip entry
- Same splitting flow as OCR path

**Market benchmark:** All apps support this. It's the fallback for OCR failures and the primary mode when no receipt exists (e.g., Splitwise for non-receipt expenses).

**Notes:** Should be equally first-class as photo entry, not feel like a "degraded" experience.

---

### 6. Simple Sharing/Export
**Complexity:** Low
**Dependencies:** Per-person breakdown calculated
**Description:** Share results with party members.

**Minimum viable:**
- Share link or text summary
- Shows what each person owes
- No account required to view (recipient just sees breakdown)

**Market benchmark:** Text/link sharing is universal. Some apps require account creation to view, which adds friction.

---

## Differentiating Features

Features that provide competitive advantage. Not all are worth building, but these separate good apps from great ones.

### 1. Shared Item Handling
**Complexity:** Medium
**Dependencies:** Item assignment
**Description:** Split appetizers, bottles of wine, shared desserts across multiple people.

**Implementation approaches:**
- Mark item as "shared" then select which people split it
- Equal split (3-way, 4-way) or custom percentages
- Common use case: "Bottle of wine split among 3 people"

**Market benchmark:** Tab and Plates support this. Splitwise has weaker support. This is a STRONG differentiator for restaurant use cases.

**Priority:** HIGH - Explicitly called out in project context ("shared items: appetizers, bottles of wine").

**Notes:** Edge case of edge cases: What if 2 people split an appetizer but one person had more? Let's not solve this (see anti-features).

---

### 2. Multi-Quantity Item Handling
**Complexity:** Medium
**Dependencies:** Receipt OCR
**Description:** Recognize and handle "Burger x2" style line items.

**Scenarios:**
- OCR detects "x2" or "2x" or "qty: 2"
- User manually indicates item was ordered multiple times
- Split 2x items to different people (e.g., 2 burgers, one to Alice, one to Bob)

**Market benchmark:** Tab handles this moderately well. Most other apps struggle, requiring manual item duplication.

**Priority:** HIGH - Explicitly called out in project context. Common in real receipts.

**Technical note:** OCR needs to parse quantity notation. UI needs to show "Burger (qty 2)" and let user split instances across people.

---

### 3. Photo-First UX with Intelligent Defaults
**Complexity:** Medium
**Dependencies:** Receipt OCR, item assignment
**Description:** Optimize entire flow for "take photo → done in 30 seconds" use case.

**Intelligent defaults:**
- If party size = number of items, auto-assign one item per person
- Default tip to local standard (18% in US)
- Auto-detect tax from receipt
- One-tap fixes for common OCR errors

**Market benchmark:** Most apps require too many taps. Tab is closest to this vision but still has friction points.

**Priority:** HIGH - This is THE differentiator. SplitCheck's value prop is speed and simplicity.

**UX note:** Every tap removed is a win. Goal is "photo → confirm → share" in minimal steps.

---

### 4. Offline-First Functionality
**Complexity:** High
**Dependencies:** None (architectural decision)
**Description:** App works without internet connection; syncs when online.

**Capabilities:**
- Take photo and process locally (if OCR runs client-side)
- Complete splitting flow offline
- Share via text/screenshot even without connectivity
- Sync to cloud when connection available (if accounts exist)

**Market benchmark:** Most apps are online-only. This is a rare differentiator.

**Priority:** MEDIUM - Nice to have for restaurants with poor WiFi, but adds significant technical complexity.

**Trade-off:** Client-side OCR (TensorFlow.js, Tesseract) is lower quality than cloud OCR (Google Vision, AWS Textract). May not be worth it.

---

### 5. Currency & Multi-Language Support
**Complexity:** Medium
**Dependencies:** Receipt OCR
**Description:** Handle receipts in different languages and currencies.

**Capabilities:**
- Detect currency symbols (USD, EUR, GBP, etc.)
- Parse non-English receipt formats
- Display amounts in local currency
- Optional: Currency conversion for international groups

**Market benchmark:** Splitwise has strong multi-currency support (it's a global app). Restaurant-specific apps tend to be US-only.

**Priority:** LOW for MVP - Focus on US/English initially. Add later if expanding internationally.

---

### 6. Payment Integration
**Complexity:** High
**Dependencies:** Per-person breakdown, user accounts
**Description:** Let people pay directly through the app.

**Approaches:**
- Venmo/PayPal integration (deep link to payment)
- In-app payment (Stripe, Square) with real money movement
- Request money via app, users pay externally

**Market benchmark:** Venmo/PayPal have this natively (they're payment platforms). Splitwise, Tab, Plates generally don't move money—they just calculate and share breakdowns.

**Priority:** LOW for MVP - Adds regulatory complexity, fees, and technical overhead. Deep linking to Venmo/PayPal might be middle ground.

**Anti-feature risk:** Becoming a payment platform changes the product fundamentally. SplitCheck is a calculator, not a bank.

---

### 7. Receipt History & Expense Tracking
**Complexity:** Medium
**Dependencies:** User accounts, cloud storage
**Description:** Save past receipts and track spending over time.

**Capabilities:**
- Save receipts to user account
- View past splits
- Search/filter receipts by date, restaurant, people
- Optional: Analytics (how much you spent this month)

**Market benchmark:** Splitwise's core feature (expense tracking over time). Tab has history. Plates is more ephemeral.

**Priority:** LOW for MVP - Adds account requirement and storage costs. SplitCheck's core use case is "one-time split, then done."

**Decision point:** Is SplitCheck a single-use calculator or a long-term tracking tool? These are different products.

---

### 8. Group/Event Management
**Complexity:** High
**Dependencies:** User accounts, receipt history
**Description:** Track multiple receipts across a trip, event, or recurring group.

**Use cases:**
- Weekend trip with friends (multiple restaurant bills)
- Monthly dinner club (track who's paid over time)
- Roommates (recurring group with running balances)

**Market benchmark:** Splitwise excels here. Tab and Plates are single-receipt focused.

**Priority:** OUT OF SCOPE for MVP - This is a different product category (group expense tracking vs. single receipt splitting).

---

## Anti-Features

Features to deliberately NOT build. These add complexity without proportional value or conflict with core vision.

### 1. Social Network Features
**Why avoid:** Following friends, public profiles, activity feeds, etc. turn SplitCheck into a social app. Adds complexity, moderation burden, and distracts from core utility.

**Market examples:** Venmo has public feed (privacy concerns). Splitwise avoided this and stayed utility-focused.

**Decision:** SplitCheck is a tool, not a social network. No friend graphs, no feeds, no public activity.

---

### 2. Itemized Negotiation/Disputes
**Why avoid:** Features like "I don't think I should pay for this" or "request adjustment" create interpersonal conflict within the app. These are social issues, not software issues.

**Market examples:** Some apps let people "dispute" charges. This creates bad UX and doesn't solve the real problem (talk to your friends).

**Decision:** Calculations are final once agreed. If someone disagrees, they handle it offline. App doesn't mediate.

---

### 3. Gamification/Rewards
**Why avoid:** Points, badges, leaderboards, etc. are misaligned with use case. You don't want to "win" at splitting bills. Adds clutter and feels gimmicky.

**Market examples:** Some fintech apps add gamification to increase engagement. It works for habit-building (savings apps) but feels wrong for bill splitting.

**Decision:** No gamification. SplitCheck is utilitarian.

---

### 4. Complex Splitting Algorithms
**Why avoid:** Features like "split appetizer 60/40 because I ate more" or "charge Jane 5% extra because she ordered expensive wine" are edge cases that add UI complexity and create social friction.

**Market examples:** Some apps offer percentage-based custom splits. Rarely used and confusing.

**Decision:** Keep splitting simple. Items are either assigned to one person, split equally among N people, or left unassigned. No custom percentages or "weighted" splits.

**Boundary case:** Shared items with equal split (3-way, 4-way) is OK. Shared items with unequal split (60/40) is out of scope.

---

### 5. Receipt Editing/Templating
**Why avoid:** Features like "save this receipt as template" or "edit receipt details for future use" assume recurring use cases (same restaurant, same order). This is niche and adds complexity.

**Market examples:** Some expense tracking apps let you template recurring expenses. Not relevant for one-time restaurant splits.

**Decision:** Each receipt is independent. No templates, no "copy previous receipt."

---

### 6. Multi-Currency Conversion
**Why avoid:** Automatically converting currencies (e.g., splitting a EUR receipt among USD users) adds exchange rate complexity, potential for disputes ("that's not the rate I got"), and is a niche use case.

**Market examples:** Splitwise supports this for international groups. It's complex and error-prone.

**Decision:** For MVP, single currency per receipt. If receipt is in EUR, breakdown is in EUR. Users handle conversion externally if needed.

**Future consideration:** Could add in v2 for international expansion, but not core.

---

## Feature Dependencies Map

```
Receipt OCR
├── Item Assignment
│   ├── Shared Item Handling
│   ├── Multi-Quantity Handling
│   └── Tax & Tip Calculation
│       └── Per-Person Breakdown
│           ├── Sharing/Export
│           └── Payment Integration (future)
│
Manual Entry (parallel path)
└── (same tree as above)

User Accounts (optional layer)
└── Receipt History
    └── Group/Event Management (out of scope)
```

**Critical path:** Receipt capture → Item assignment → Tax/tip → Breakdown → Share. Everything else is secondary.

---

## Complexity Assessment

### Low Complexity (< 2 weeks dev time)
- Manual entry UI
- Per-person breakdown display
- Simple sharing (text/link)
- Basic item assignment UI

### Medium Complexity (2-4 weeks)
- Shared item handling
- Multi-quantity items
- Tax/tip modes (3 variants)
- Photo-first UX optimization

### High Complexity (4+ weeks)
- Receipt OCR (integration + error handling)
- Offline-first architecture
- Payment integration
- Multi-currency support

**MVP Recommendation:** Focus on Low + Medium complexity table stakes, plus shared items and multi-quantity (differentiators). Defer High complexity items except OCR (which is non-negotiable table stakes despite complexity).

---

## Competitive Positioning

| App | Strength | Weakness | SplitCheck Advantage |
|-----|----------|----------|---------------------|
| **Splitwise** | Group expense tracking, multi-currency | Weak receipt scanning, complex UI | Faster receipt-only flow, better OCR |
| **Tab** | Good OCR, restaurant focus | Cluttered UI, slow flow | Simpler UX, better edge case handling |
| **Plates** | Clean UI, restaurant-specific | Limited edge case support | Shared items, multi-quantity |
| **Venmo/PayPal** | Ubiquitous, integrated payment | Bill splitting is afterthought, poor UX | Purpose-built for splitting, better OCR |

**SplitCheck's positioning:** Fastest, simplest receipt-only splitting with robust edge case handling. Not trying to be Splitwise (long-term tracking) or Venmo (payment platform). Narrow focus, excellent execution.

---

## Recommendations for SplitCheck MVP

### Must Build (Table Stakes)
1. Receipt OCR with fallback to manual entry
2. Basic item assignment (tap to assign)
3. Tax & tip handling (3 modes: percentage, flat, included)
4. Per-person breakdown
5. Simple sharing (link/text)

### Should Build (Differentiators)
6. Shared item handling (equal split among N people)
7. Multi-quantity item handling ("Burger x2")
8. Photo-first UX with intelligent defaults

### Defer to V2
- Payment integration (deep link to Venmo/PayPal as interim)
- Receipt history (requires accounts)
- Offline-first (complexity vs. value trade-off)
- Multi-currency (not core US market)

### Never Build (Anti-Features)
- Social network features
- Dispute/negotiation tools
- Gamification
- Complex splitting algorithms (unequal percentages)
- Receipt templating

---

## Open Questions for Product Team

1. **Accounts vs. Accountless:** Should SplitCheck require user accounts, or be fully anonymous/ephemeral? (Impacts history, sharing, payment integration)

2. **OCR Provider:** Client-side (Tesseract.js, offline) vs. cloud (Google Vision API, higher accuracy)? Cost and latency trade-offs.

3. **Payment Integration Priority:** Is "request payment via Venmo" a V1 or V2 feature? Changes scope significantly.

4. **Shared Item UI:** How do users indicate an item is shared? (Long-press, toggle, separate flow?) Needs UX testing.

5. **Receipt Retention:** Do we store photos/receipts server-side, or only client-side? (Privacy, storage costs, feature implications)

---

## Research Methodology

This analysis draws from:
- Competitive analysis of Splitwise, Tab, Plates, Venmo, PayPal, and others (as of Jan 2025 knowledge cutoff)
- Common UX patterns in receipt scanning and bill splitting apps
- Project context provided (SplitCheck requirements)
- Industry best practices for mobile-first financial utilities

**Limitations:** Did not conduct live user research or recent market surveys (research date: Feb 2026, knowledge cutoff: Jan 2025). Recommend validating assumptions with user testing before committing to feature roadmap.

---

**Next Steps:** Use this research to inform requirements definition. Prioritize table stakes + top 2-3 differentiators for MVP. Validate edge case handling (shared items, multi-quantity) with prototypes before full build.
