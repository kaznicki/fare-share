# Project Research Summary

**Project:** SplitCheck
**Domain:** Receipt-scanning bill splitter (mobile web app)
**Researched:** 2026-02-14
**Confidence:** MEDIUM-HIGH

## Executive Summary

SplitCheck is a mobile-first web application for scanning restaurant receipts and automatically calculating per-person bills. Research shows this is a well-understood domain with clear table stakes (OCR, item assignment, tip calculation, sharing) and competitive differentiation through UX simplicity and robust edge case handling. The recommended architecture is client-heavy with a thin backend, using Next.js for the framework, Tesseract.js for client-side OCR with cloud fallback, and Zustand for state management.

The critical success factor is mathematical accuracy. Users will forgive poor OCR or clunky UI, but never forgive incorrect calculations. Rounding errors that cause person totals to not sum to the bill total will destroy trust permanently. Use integer arithmetic (cents, not dollars) throughout and apply rounding only at the final step using largest-remainder method.

The recommended approach prioritizes getting the core OCR-to-assignment flow working first, then layering calculation logic, and finally adding sharing capabilities. Handle shared items and multi-quantity items from the start — these are key differentiators and common real-world patterns. Defer payment integration, receipt history, and multi-currency support to v2+.

## Key Findings

### Recommended Stack

A modern JavaScript stack optimized for mobile UX with minimal backend complexity. Next.js provides SSR for fast load times while keeping API routes and frontend in one codebase. Client-side OCR reduces server costs but requires cloud fallback for poor-quality images.

**Core technologies:**
- **Next.js 14+**: Framework with App Router — SSR for mobile performance, built-in API routes, image optimization
- **Tailwind CSS + shadcn/ui**: UI framework — mobile-first responsive design, accessible touch-friendly components
- **Zustand**: State management — lightweight, perfect for bill-splitting data model with computed totals
- **Tesseract.js**: Primary OCR — client-side WASM, no server costs, works offline once loaded
- **Google Cloud Vision API**: OCR fallback — superior accuracy on messy receipts, use when client-side confidence is low
- **Turso or Vercel KV**: Database — minimal storage for shared link data (JSON blobs)
- **Vercel**: Deployment — native Next.js support, free tier sufficient, edge functions
- **Vitest + Playwright**: Testing — unit tests for calculation logic, E2E for full flow

**Risk areas:**
- OCR accuracy on real-world receipts (Tesseract.js struggles with poor photos)
- Receipt parsing complexity (extracting structure from raw text requires custom logic)
- WASM load time (Tesseract.js model is ~2MB, needs lazy loading)

### Expected Features

**Must have (table stakes):**
- **Receipt OCR with manual fallback** — photograph receipt and extract line items automatically, fall back to manual entry when OCR fails
- **Basic item assignment** — tap items to assign to specific people, visual indication of who owes what
- **Tax & tip handling** — three modes: percentage, flat amount, already included
- **Per-person breakdown** — clear display of what each person owes with itemized detail
- **Simple sharing** — share link or text summary, no account required to view

**Should have (competitive differentiators):**
- **Shared item handling** — split appetizers/wine across multiple people with equal distribution (explicitly called out in project requirements)
- **Multi-quantity items** — recognize "Burger x2" notation and allow splitting instances to different people
- **Photo-first UX** — intelligent defaults to minimize taps (goal: photo → confirm → share in 30 seconds)

**Defer (v2+):**
- **Payment integration** — deep linking to Venmo/PayPal as interim, full payment processing later
- **Receipt history** — requires user accounts and cloud storage
- **Offline-first** — client-side OCR enables this but adds complexity vs value
- **Multi-currency** — not essential for US market focus

**Anti-features (never build):**
- Social network features (friend graphs, activity feeds)
- Dispute/negotiation tools (interpersonal issues, not software issues)
- Gamification (misaligned with utility use case)
- Complex splitting algorithms (no custom percentages, keep it simple)

### Architecture Approach

Client-heavy architecture with minimal backend. Core logic (OCR parsing, assignment, calculation) runs in browser. Backend only exists for share-link persistence and cloud OCR fallback. This minimizes costs, maximizes responsiveness, and keeps deployment simple.

**Major components:**
1. **Camera Capture** — acquire receipt image, preprocess (crop, enhance, rotate)
2. **OCR Engine** — convert image to raw text (Tesseract.js primary, Google Vision fallback)
3. **Receipt Parser** — extract structured items from raw text (regex patterns for quantity, price, tax)
4. **People Manager** — CRUD operations on party list
5. **Item Assigner** — map items to people with shared item support
6. **Calculation Engine** — pure function computing per-person totals with tax/tip distribution
7. **Results View** — display breakdown and generate shareable link
8. **Share Link Backend** — simple CRUD API for persisting split data

**Data flow:** Photo → OCR → Parse → Review/Edit → Add People → Assign Items → Configure Tip → Calculate → Share

### Critical Pitfalls

1. **Rounding errors** — Sum of person totals must equal bill total to the penny. Use integer math (cents), apply rounding only at final step with largest-remainder method. Never use toFixed(2) for intermediate calculations. Test extensively with edge cases ($100 split 3 ways, single penny split 2 ways).

2. **OCR accuracy on real receipts** — Real-world receipts are crumpled, blurry, faded thermal paper with inconsistent formats. Image preprocessing is critical (auto-crop, deskew, contrast enhancement). Show confidence indicators per item. Make review/edit fast and easy, not buried. Manual entry should be equal-quality alternative.

3. **Multi-quantity item parsing** — Receipts use wildly different quantity notation ("2 Burger", "Burger x2", "Burger @15 x2 30"). Parse all known patterns. When quantity detected, calculate unit price and expand to individual items. Let users manually split/merge if parser fails. Default to quantity 1 when uncertain.

4. **Mobile camera/image issues** — Dim restaurant lighting produces blurry photos. Flash creates glare on glossy paper. Preprocessing pipeline (auto-brightness, contrast) is essential. Guide overlay helps alignment. Accept gallery photos for retakes. Show OCR results immediately so users can retry.

5. **Tax line misidentification** — OCR may read tax as a menu item or miss it entirely. Use keyword detection (TAX, HST, GST, VAT, TX) and position heuristics (appears after items, before total). Validate: tax should be 0-15% of subtotal. Auto-exclude from item list.

## Implications for Roadmap

Based on research, suggested phase structure follows the natural data flow with clear dependencies:

### Phase 1: Foundation — Receipt Capture & OCR
**Rationale:** Get the image-to-text pipeline working first. Everything depends on having items to work with. This is the highest technical risk area (OCR accuracy).

**Delivers:** Users can photograph receipts and see extracted items (even if assignment logic isn't built yet).

**Addresses:**
- Receipt OCR with manual fallback (table stakes)
- Camera capture module
- OCR engine (Tesseract.js + preprocessing)
- Basic receipt parser (extract items, prices, tax)

**Avoids:**
- OCR accuracy pitfall (via preprocessing and cloud fallback)
- Mobile camera issues (via guide overlays and image enhancement)

**Research flag:** Standard patterns for OCR integration (Tesseract.js docs, Google Vision API). May need brief `/gsd:research-phase` for receipt parsing regex patterns (non-standard).

### Phase 2: Core Flow — People & Assignment
**Rationale:** With items extracted, the next logical step is assigning them to people. This is the heart of the app's interaction model. Must handle shared items and multi-quantity from the start (project requirements).

**Delivers:** Users can add people, assign items (including shared items), and see visual feedback of assignments.

**Addresses:**
- People manager (add/remove/rename)
- Item assignment UI (tap to assign)
- Shared item handling (differentiator — split appetizers across N people)
- Multi-quantity item expansion (differentiator — handle "Burger x2")
- Review/edit screen for correcting OCR errors

**Avoids:**
- Multi-quantity parsing pitfall (recognize all notation patterns)
- Shared item UX confusion (clear two-path interaction: solo vs shared)

**Research flag:** Standard patterns (React interaction patterns). No research needed unless complex gesture support is added.

### Phase 3: Calculation — Tax, Tip, & Totals
**Rationale:** With assignments complete, calculate what everyone owes. This is the mathematical core where accuracy is critical.

**Delivers:** Per-person breakdown with itemized totals, tax share, and tip calculation.

**Addresses:**
- Tax & tip handling (3 modes: percentage, flat, included)
- Calculation engine (proportional distribution)
- Per-person breakdown display
- Rounding logic (CRITICAL)

**Avoids:**
- Rounding errors pitfall (integer math, largest-remainder distribution)
- Tip calculation edge cases (clear defaults, transparency)

**Research flag:** Standard patterns (financial calculation best practices well-documented). Brief spike on rounding algorithms recommended.

### Phase 4: Sharing — Links & Export
**Rationale:** With results calculated, enable sharing so the app is useful at the table. Requires backend for persistent share links.

**Delivers:** Shareable links and text summaries. Recipients can view breakdown without app/account.

**Addresses:**
- Simple sharing (table stakes)
- Share link backend (Next.js API routes)
- Database integration (Turso/Vercel KV)
- Standalone shared view page

**Avoids:**
- State loss pitfall (persist data when generating share link)

**Research flag:** Standard patterns (Next.js API routes, simple CRUD). No research needed.

### Phase 5: Polish — Edge Cases & Mobile UX
**Rationale:** With core functionality complete, refine the real-world experience. Handle messy inputs and prevent frustration.

**Delivers:** Robust handling of edge cases, state persistence, improved mobile UX, comprehensive test coverage.

**Addresses:**
- State persistence (localStorage for recovery)
- Navigation guards (prevent accidental loss)
- OCR error handling and retry flows
- Enhanced preprocessing for poor images
- Comprehensive test suite (Vitest + Playwright)

**Avoids:**
- State loss from accidental navigation
- Poor OCR from suboptimal image quality

**Research flag:** Standard patterns. May need brief investigation of specific edge cases discovered during testing.

### Phase Ordering Rationale

- **Sequential dependencies:** Phase 2 needs items from Phase 1, Phase 3 needs assignments from Phase 2, Phase 4 needs results from Phase 3. This is the natural data flow.
- **Risk-first approach:** Phase 1 tackles the highest technical risk (OCR accuracy) early. If OCR proves unworkable, we discover it before investing in downstream features.
- **Differentiator priority:** Shared items and multi-quantity handling (key differentiators) are built into Phase 2, not deferred. The architecture research identified these as core patterns, not add-ons.
- **Pitfall alignment:** Phase order matches pitfall severity. Rounding (CRITICAL) is addressed in Phase 3 before sharing. OCR accuracy (HIGH) is Phase 1 focus.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1 (Receipt Parser):** Receipt format patterns are non-standard. May need `/gsd:research-phase` to catalog regex patterns for quantity/price extraction across different POS systems.
- **Phase 3 (Rounding Logic):** Largest-remainder algorithm is well-documented but implementation for multi-person bill splitting may warrant brief spike to verify correctness.

**Phases with standard patterns (skip research-phase):**
- **Phase 2:** React interaction patterns, Zustand state management
- **Phase 4:** Next.js API routes, simple database operations
- **Phase 5:** Standard testing patterns, localStorage API

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Next.js, Tailwind, Zustand are well-established for this use case. OCR approach (client + cloud fallback) is proven pattern. |
| Features | MEDIUM-HIGH | Table stakes are clear from competitive analysis. Differentiators (shared items, multi-quantity) validated in project requirements. Payment integration deferred appropriately. |
| Architecture | HIGH | Client-heavy pattern is correct for this use case. Component boundaries are clear. Build order follows natural dependencies. |
| Pitfalls | HIGH | Rounding pitfall is well-documented in financial calculation apps. OCR challenges are known from domain research. Mitigation strategies are concrete. |

**Overall confidence:** MEDIUM-HIGH

Research is based on established patterns and competitive analysis. The stack choices are mainstream and well-supported. The primary uncertainty is OCR parsing complexity — real-world receipt formats may reveal edge cases not covered in research.

### Gaps to Address

- **OCR parsing patterns:** Research identified common quantity notations but real POS systems may have variants. Plan to iterate on parser during Phase 1 based on test receipts from multiple restaurants.

- **Tip calculation conventions:** Research recommends pre-tax tipping as default (US convention) but some regions tip post-tax. May need to make this configurable or add regional detection in v2. Not critical for MVP.

- **Shared link persistence strategy:** Research recommends auto-expiry after 30 days but doesn't specify cleanup mechanism. Implementation detail to resolve in Phase 4.

- **OCR confidence threshold:** When to trigger cloud fallback? Research suggests showing confidence indicators but doesn't specify threshold (e.g., below 70% confidence = auto-fallback). Needs experimentation during Phase 1.

## Sources

### Primary (HIGH confidence)
- **Stack research:** Current ecosystem knowledge of Next.js, React, OCR libraries (Tesseract.js, Google Vision), state management patterns. Verified against mainstream use in similar applications.
- **Architecture patterns:** Industry best practices for client-heavy web apps, well-documented patterns for OCR integration and financial calculations.

### Secondary (MEDIUM confidence)
- **Competitive analysis:** Inferred from knowledge of Splitwise, Tab, Plates, Venmo/PayPal feature sets and UX patterns (as of Jan 2025 knowledge cutoff).
- **Feature priorities:** Based on project requirements and general bill-splitting app user expectations. Project context explicitly calls out shared items and multi-quantity as requirements.

### Tertiary (LOW confidence)
- **OCR accuracy estimates:** "80%+ on standard receipts" and "confidence below 70%" thresholds are approximations. Need validation during Phase 1 implementation.
- **Receipt format patterns:** Regex patterns for quantity/price extraction are based on general knowledge of POS systems, not exhaustive catalog. May need iteration.

### Methodology Note
Research conducted Feb 14, 2026 with knowledge cutoff Jan 2025. Did not include live user research or recent market surveys. Recommends validating assumptions (especially OCR parsing patterns and shared item UX) with prototypes during implementation.

---
**Research completed:** 2026-02-14
**Ready for roadmap:** Yes
