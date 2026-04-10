# Tab Splitter

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

### Active

(None — all v1 requirements shipped. See `/gsd-new-milestone` to define v1.1 requirements.)

### Out of Scope

- User accounts / authentication — ephemeral sessions only
- In-app payments — app shows balances, people settle externally
- Saving session history — sessions are disposable
- Native mobile app — mobile web browser only
- Even-split mode — item-level splitting is the product
- Live camera viewfinder (getUserMedia) — native camera picker used instead
- PWA offline support — sessions require live WebSocket

## Context

Shipped v1.0 with ~24,000 LOC TypeScript/TSX across 105 files.

Tech stack: Next.js 15, custom WebSocket server (ws), GPT-4o Vision, Zustand, Tailwind v4, Vitest.

Session flow: host scans receipt → OCR extracts items → host reviews/corrects → host creates session (QR/link generated) → participants join by name → participants claim items with real-time sync → host finalizes → all participants see exact amounts owed.

OCR is mock-mode capable (`USE_OCR_MOCK=true`). Real GPT-4o Vision requires `OPENAI_API_KEY` in `.env.local`. Accuracy on real receipts unvalidated — manual correction UI is a first-class feature.

Known todos (captured in `.planning/todos/pending/`):
- Bill total should include tax (display issue)
- Unfinalize/go-back option
- Tip selector buttons not working
- Add visual design elements

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
| GPT-4o Vision for OCR | Manual correction is v1 requirement; needs to be good enough to correct, not rebuild | — Pending real-receipt validation |
| Custom ws server (not PartyKit) | Server required anyway; avoids 10-project free-tier limit | ✓ Good — clean integration |
| Integer cents throughout | Eliminates float rounding bugs | ✓ Good — LRM passes all edge-case tests |
| Largest Remainder Method | Guaranteed exact sum even with cent-level rounding | ✓ Good — 13/13 Vitest tests pass |
| globalThis singleton for session store | Next.js App Router module isolation breaks shared Map | ✓ Good — required pattern for this architecture |

---
*Last updated: 2026-04-10 after v1.0 milestone*
