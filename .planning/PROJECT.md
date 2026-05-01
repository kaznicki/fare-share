# Tab Splitter

## Current State

**Shipped:** v1.1 Real Receipts & Polish (2026-04-30)

v1.1 closed all 4 v1.0 todos: live OCR validated on real receipts, bill total displayed before session creation, tip selector shows selected state, unfinalize flow preserves claims, and consistent visual polish applied across all screens.

---

## What This Is

A mobile web app for splitting restaurant bills at the item level. One person photographs the receipt, the app extracts line items via GPT-4o Vision OCR, and each person at the table claims what they ordered — including shared items and duplicates — before seeing their individual total with proportional tax and tip.

## Core Value

Everyone pays exactly what they ordered (plus their proportional share of tax and tip) without doing any mental math.

## Requirements

### Validated

- ✓ User can photograph a receipt and have line items extracted automatically — v1.0
- ✓ User can share a session via QR code or link so others can join on their phones — v1.0
- ✓ Each person can enter their name and claim the items they ordered — v1.0
- ✓ Duplicate items (same item ordered by two people) can each be claimed independently — v1.0
- ✓ Shared items can be claimed by multiple people and the cost split among them — v1.0
- ✓ Tax and tip are distributed proportionally based on each person's subtotal — v1.0
- ✓ Each person sees their final amount owed at the end — v1.0
- ✓ Real OCR enabled and validated on 3 actual restaurant receipts — v1.1
- ✓ Bill total (items + tax + tip) displayed on the OcrReview screen before session creation — v1.1
- ✓ Tip selector buttons visually indicate selected state — v1.1
- ✓ Host can unfinalize and return to claiming view with all claims intact — v1.1
- ✓ Targeted visual polish applied across all screens — v1.1

### Active

*(None — v1.1 complete. Next milestone requirements TBD via /gsd-new-milestone)*

### Out of Scope

- User accounts / authentication — ephemeral sessions only
- In-app payments — app shows balances, people settle externally
- Saving session history — sessions are disposable
- Native mobile app — mobile web browser only
- Even-split mode — item-level splitting is the product
- Live camera viewfinder (getUserMedia) — native camera picker used instead; PWA option deferred to v2
- PWA offline support — sessions require live WebSocket

## Context

Shipped v1.1 with ~24,000 LOC TypeScript/TSX across ~112 files.

Tech stack: Next.js 15, custom WebSocket server (ws), GPT-4o Vision, Zustand, Tailwind v4, Vitest.

Session flow: host scans receipt → OCR extracts items → host reviews/corrects → host creates session (QR/link generated) → participants join by name → participants claim items with real-time sync → host finalizes → all participants see exact amounts owed.

OCR is mock-mode capable (`USE_OCR_MOCK=true`). Real GPT-4o Vision requires `OPENAI_API_KEY` in `.env.local`. v1.1 validated real receipt accuracy on 3 restaurant types.

Real receipt testing notes: GPT-4o handles most receipt formats well. Known edge case: quantity-prefixed items like "2 Taco Tuesday Pollo $2.00" may be extracted as qty=1 at the extended price — correctable via the correction-first UI.

## Constraints

- **Platform**: Mobile web — must work well on phone browsers, camera access via browser API
- **Auth**: None — no login, no accounts
- **Session**: Ephemeral — no long-term storage required
- **Deployment**: Railway/Fly.io/Render (not Vercel — persistent WebSocket required)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No accounts | Lower friction, fits one-off restaurant use case | ✓ Good — no friction complaints in UAT |
| Proportional tax/tip | Fairer than equal split when orders vary in price | ✓ Good — LRM ensures exact cent accuracy |
| Browser camera (not native app) | Faster to build, no app store | ✓ Good — works on all mobile browsers |
| GPT-4o Vision for OCR | Manual correction is v1 requirement; needs to be good enough to correct, not rebuild | ✓ Good — validated on 3 receipt types; correction-first handles edge cases |
| Custom ws server (not PartyKit) | Server required anyway; avoids 10-project free-tier limit | ✓ Good — clean integration |
| Integer cents throughout | Eliminates float rounding bugs | ✓ Good — LRM passes all edge-case tests |
| Largest Remainder Method | Guaranteed exact sum even with cent-level rounding | ✓ Good — 13/13 Vitest tests pass |
| globalThis singleton for session store | Next.js App Router module isolation breaks shared Map | ✓ Good — required pattern for this architecture |
| CSS hidden pattern for SessionRoom | Conditional render disconnects WebSocket; all participants need broadcast | ✓ Good — unfinalize broadcast works for all tabs |
| totalCents derived from existing props | No interface change; subtotalCents/taxCents/tipCents already in TaxTipFields | ✓ Good — zero prop proliferation |
| isActive formula mirrors click handler | Guarantees exact match on preset detection | ✓ Good — no off-by-one issues |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-30 after v1.1 milestone*
