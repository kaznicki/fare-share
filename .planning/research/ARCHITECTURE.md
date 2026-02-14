# Architecture Research: Receipt-Scanning Bill Splitter

**Research Date:** 2026-02-14
**Project:** SplitCheck
**Milestone:** Greenfield - Architecture patterns and component design

## Executive Summary

SplitCheck is a client-heavy web application with a thin backend. The core logic (OCR parsing, item assignment, calculation) runs in the browser. The backend exists only for share-link persistence and cloud OCR fallback. This architecture minimizes costs, maximizes responsiveness, and keeps the app simple.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser (Client)               │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Camera   │→│  OCR      │→│  Receipt      │  │
│  │  Capture  │  │  Engine   │  │  Parser       │  │
│  └──────────┘  └──────────┘  └───────┬───────┘  │
│                                       │          │
│  ┌──────────┐  ┌──────────┐  ┌───────▼───────┐  │
│  │  People   │→│  Item     │→│  Calculation  │  │
│  │  Manager  │  │  Assigner │  │  Engine       │  │
│  └──────────┘  └──────────┘  └───────┬───────┘  │
│                                       │          │
│                               ┌───────▼───────┐  │
│                               │  Results &    │  │
│                               │  Share View   │  │
│                               └───────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ API calls (minimal)
┌────────────────────▼────────────────────────────┐
│                   Backend (API Routes)            │
│                                                   │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Share Link   │  │  Cloud OCR Proxy         │  │
│  │  CRUD         │  │  (Google Vision fallback) │  │
│  └──────┬───────┘  └──────────────────────────┘  │
│         │                                         │
│  ┌──────▼───────┐                                │
│  │  Database     │                                │
│  │  (Turso/KV)   │                                │
│  └──────────────┘                                │
└──────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Camera Capture Module
**Responsibility:** Acquire receipt image from user
**Boundary:** Outputs a preprocessed image (cropped, enhanced)

**Inputs:** User action (tap "scan receipt")
**Outputs:** Optimized image blob ready for OCR

**Implementation:**
- Native `<input type="file" capture>` for camera access
- Canvas API for preprocessing (auto-crop, contrast enhancement, rotation)
- Image compression before OCR (reduce processing time)

**Build order:** Phase 1 — foundation, no dependencies

---

### 2. OCR Engine
**Responsibility:** Convert receipt image to raw text
**Boundary:** Receives image, outputs raw text with bounding boxes

**Inputs:** Preprocessed image blob
**Outputs:** Raw text string with line-by-line structure

**Implementation:**
- Primary: Tesseract.js (client-side WASM)
- Fallback: Google Cloud Vision API via backend proxy
- Confidence scoring to decide when to use fallback

**Build order:** Phase 1 — depends on Camera Capture

---

### 3. Receipt Parser
**Responsibility:** Extract structured data from raw OCR text
**Boundary:** Receives raw text, outputs structured item list

**Inputs:** Raw OCR text
**Outputs:** Array of `{ name, price, quantity, rawText }`

**Implementation:**
- Line-by-line parsing with regex patterns
- Quantity detection: "x2", "2x", "qty 2", "2 @"
- Price extraction: "$12.99", "12.99", trailing numbers
- Special line detection: subtotal, tax, total, tip, gratuity
- Confidence scoring per item (flag low-confidence extractions)

**Critical logic:**
- Multi-quantity expansion: "Burger x2 $30" → 2 items at $15 each
- Tax/total detection to pre-fill tip calculations
- Handling of modifiers/add-ons (e.g., "+cheese $1.50" belongs to previous item)

**Build order:** Phase 1-2 — depends on OCR Engine

---

### 4. People Manager
**Responsibility:** Manage the list of people in the party
**Boundary:** CRUD operations on people list

**Inputs:** User actions (add, remove, rename people)
**Outputs:** Array of `{ id, name }`

**Implementation:**
- Simple list with add/remove
- Quick-add: enter comma-separated names
- Persist to Zustand store

**Build order:** Phase 1 — no dependencies, parallel with OCR

---

### 5. Item Assigner
**Responsibility:** Map items to people
**Boundary:** Receives items + people, outputs assignment map

**Inputs:** Parsed items, people list
**Outputs:** Map of `{ itemId → [personIds] }`

**Implementation:**
- Tap item → tap person(s) to assign
- "Shared by all" quick button
- Visual indicators: assigned (green), unassigned (red/gray)
- Multi-select for shared items
- Unassigned items warning before calculation

**Build order:** Phase 2 — depends on Receipt Parser + People Manager

---

### 6. Calculation Engine
**Responsibility:** Compute per-person totals including tax and tip
**Boundary:** Pure function, no UI concerns

**Inputs:** Items with assignments, tip config, tax amount
**Outputs:** Per-person breakdown `{ person, items, subtotal, taxShare, tipShare, total }`

**Implementation:**
- Core splitting logic (item cost / number of sharers)
- Tax distribution (proportional to subtotal)
- Tip calculation:
  - Percentage mode: tip = subtotal * percentage, split proportionally
  - Flat amount mode: split tip proportionally to subtotal
  - Already included mode: no additional tip calculation
- Rounding strategy: round per-person, assign remainder to last person (or distribute pennies)

**Critical requirement:** Sum of all person totals MUST equal the bill total (to the penny).

**Build order:** Phase 2-3 — depends on Item Assigner

---

### 7. Results & Share View
**Responsibility:** Display breakdown and enable sharing
**Boundary:** Read-only view of calculation results

**Inputs:** Calculation results
**Outputs:** Rendered UI + shareable link/text

**Implementation:**
- Per-person cards showing itemized breakdown
- Total prominently displayed
- Share button → generates link via backend API
- Text share → formatted summary for copy/paste or SMS
- Shared link view: standalone page showing the split (no app needed)

**Build order:** Phase 3 — depends on Calculation Engine

---

### 8. Share Link Backend
**Responsibility:** Persist and retrieve split data for sharing
**Boundary:** Simple CRUD API

**Inputs:** Split data JSON
**Outputs:** Unique shareable URL, retrieved split data

**Implementation:**
- `POST /api/splits` → save JSON, return short ID
- `GET /api/splits/[id]` → return split data
- Auto-expiry after 30 days
- No authentication needed

**Build order:** Phase 3 — parallel with Results View

---

## Data Flow

```
User takes photo
      │
      ▼
Camera Capture (preprocess image)
      │
      ▼
OCR Engine (image → raw text)
      │
      ▼
Receipt Parser (raw text → structured items)
      │
      ▼
Review & Edit Screen ← User corrects OCR errors
      │
      ▼
People Manager ← User adds names
      │
      ▼
Item Assigner ← User assigns items to people
      │
      ▼
Tip/Tax Config ← User selects tip mode + amount
      │
      ▼
Calculation Engine (compute per-person totals)
      │
      ▼
Results View (display breakdown)
      │
      ▼
Share (generate link or text summary)
```

---

## Data Model

```typescript
interface Receipt {
  items: ReceiptItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  tipConfig: TipConfig
}

interface ReceiptItem {
  id: string
  name: string
  price: number        // per-unit price
  quantity: number     // expanded to individual items
  rawText: string      // original OCR text
  confidence: number   // OCR confidence 0-1
}

interface Person {
  id: string
  name: string
}

interface Assignment {
  itemId: string
  personIds: string[]  // who shares this item
}

interface TipConfig {
  mode: 'percentage' | 'flat' | 'included'
  value: number        // percentage (0.18) or flat amount (20.00)
}

interface PersonBreakdown {
  person: Person
  items: { item: ReceiptItem, share: number }[]
  subtotal: number
  taxShare: number
  tipShare: number
  total: number
}
```

---

## Suggested Build Order

| Phase | Components | Rationale |
|-------|-----------|-----------|
| 1 | Project setup, Camera Capture, OCR Engine, basic Receipt Parser, People Manager | Foundation — get image-to-text working and people management |
| 2 | Receipt Parser refinement, Review/Edit screen, Item Assigner | Core interaction — the assignment flow is the heart of the app |
| 3 | Calculation Engine, Tip/Tax config, Results View | The payoff — show people what they owe |
| 4 | Share functionality, backend API, shared link view | Sharing — make it useful at the table |
| 5 | Polish: error handling, edge cases, mobile UX refinement | Quality — handle the messy real world |

**Dependencies:**
- Phase 2 depends on Phase 1 (need items + people to assign)
- Phase 3 depends on Phase 2 (need assignments to calculate)
- Phase 4 depends on Phase 3 (need results to share)
- Phase 5 can partially overlap with Phase 4

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Client-heavy, thin backend | Minimizes costs, maximizes responsiveness, OCR runs in browser |
| Client-side OCR primary | No server costs per scan, works offline, good enough for clean receipts |
| Cloud OCR as fallback only | Better accuracy on messy receipts, but costs money per call |
| Zustand for state | Lightweight, computed state for totals, easy persistence |
| No user accounts | Stateless simplifies everything, share links work without auth |
| JSON blob storage for shares | No relational queries needed, just store and retrieve |

---

*Architecture designed for minimal complexity. Each component has clear boundaries and can be built/tested independently.*
