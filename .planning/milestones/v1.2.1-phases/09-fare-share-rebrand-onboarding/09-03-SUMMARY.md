---
phase: 09-fare-share-rebrand-onboarding
plan: 03
status: complete
completed: 2026-05-05
executor: orchestrator-inline (sequential, after worktree retry hit usage cap)
commits:
  - 6814824 feat(09-03): mount persistent Fare Share HeaderBar globally
  - e478273 feat(09-03): hero lockup + repaint on host capture and guest join screens
  - e90d15c feat(09-03): repaint 8 components to ink/paper/copper palette
requirements:
  - BRAND-05
  - ONBOARD-01
  - ONBOARD-02
  - ONBOARD-05
---

# Plan 09-03 — Persistent Header + Hero Lockups + Full Repaint

## What was built

### HeaderBar component (`components/brand/HeaderBar.tsx`, new — 19 lines)

- `'use client'` component, default export, no props
- Renders `<header>` with `h-14 bg-paper border-b border-rule px-4 py-3`
- Inner `max-w-md mx-auto` container with `<Link href="/" aria-label="Fare Share home">` wrapping `<FareShareLogo size={32} />` + inline `<span>` "Fare Share" wordmark in `font-bold tracking-[-0.02em] text-ink`
- Right slot is an empty `<div aria-hidden="true" />` reserved for future session-id / leave-button affordances
- Mounted globally in `app/layout.tsx` directly above `{children}`, so it appears on every route without per-page wiring

### Hero lockups

- `/host` (CameraCapture.tsx): `<img src="/logo-lockup.svg" h-16 w-auto>` centered above the existing capture content; the legacy `<h1>Photograph Receipt</h1>` is demoted to `<h2 text-base font-semibold text-ink-2>`. Subtitle `<p>` retained verbatim, recolored `text-muted text-sm`.
- Guest join page (JoinForm.tsx): hero lockup `<div>` placed as the first child of the outer wrapper. The card moves below it, repainted to `bg-paper-deep`. Insertion point for Plan 09-04 (app description + 4-step instruction list) is reserved between the hero and the card via an HTML comment marker `{/* Plan 09-04 inserts ... */}`.

### Component repaint coverage (10 files, full sweep)

Repaint applied per UI-SPEC Component Repaint Contract:

| File | Highlights |
|------|------------|
| CameraCapture.tsx | Take Photo / Submit / Retake CTAs → copper. Error banner → `bg-paper-deep border-accent`. |
| JoinForm.tsx | Card → `bg-paper-deep`. Input → `border-rule placeholder-muted focus:ring-accent`. Join button → `bg-accent`. |
| OcrReview.tsx | Both error banners → `bg-paper-deep border-accent text-ink`. Add Item button → `border-rule text-muted hover:bg-paper-deep`. Footer card → `bg-paper-deep`. Create Session → `bg-accent`, `disabled:bg-blue-300` replaced with `disabled:opacity-50`. |
| ShareScreen.tsx | QR card → `bg-paper-deep` (qrcode.react paints its own internal white inside `marginSize={4}` quiet zone, so scannability is preserved). "Join as host" → `bg-accent`. Copy link button → `border-rule text-ink-2 hover:border-muted hover:bg-paper-deep`. |
| TaxTipFields.tsx | Active tip preset → `bg-accent text-paper border-accent`. Inactive → `bg-paper-deep text-ink-2 border-rule hover:bg-paper`. Total span → `font-mono tabular-nums`. |
| ItemRow.tsx | Qty stepper → `border-rule text-ink-2 hover:bg-paper-deep`. Edit underline → `border-muted`. Delete X → `text-muted hover:text-accent`. Price span → `text-ink font-mono tabular-nums`. |
| SessionRoom.tsx | Reconnect banner → `bg-paper-deep border-accent text-ink`. Finalize CTA → `bg-accent text-paper hover:bg-accent-deep`. "Your total" span → `text-ink font-mono tabular-nums`. Sticky footer → `bg-paper-deep border-rule`. Connection-error `<p>` → `text-accent`. `divide-gray-100` → `divide-rule`. |
| ClaimableItem.tsx | Three-state palette pairs: mine alone → `bg-accent/10 border-accent`; shared (mine + others) → `bg-paper-deep border-rule`; theirs → `bg-paper border-rule`; unclaimed default → `bg-paper-deep border-rule`. Inner spans recolored `text-ink` / `text-ink-2` / `text-muted`. Split price → `font-mono tabular-nums`. |
| SummaryScreen.tsx | Card → `bg-paper-deep border-rule`. "Total owed" label + amount → `text-accent` (one of UI-SPEC's locked accent-reserved usages). All 10 monetary spans → `text-ink font-mono tabular-nums`. Host totals table dividers → `border-rule`. "Go back to claiming" button → `border-rule text-ink-2 hover:bg-paper-deep`. |
| UnclaimedModal.tsx | Overlay `bg-black/50` PRESERVED (intentional — outside brand-token system per UI-SPEC). Panel → `bg-paper-deep`. Primary "Split" → `bg-accent text-paper hover:bg-accent-deep`. Secondary "I'll cover the rest" → `border-rule text-ink-2 bg-paper hover:bg-paper-deep`. |

### Out-of-scope fix

`app/session/[id]/page.tsx` (line 78) had a Suspense fallback `<p className="text-gray-400">` that was outside the plan's `files_modified` list but caught by the must_have grep "Zero gray Tailwind palette utilities remain in components/ or app/". Repainted to `text-ink-2` (text-base default, accessibility guard upgrade) to satisfy the must_have. One-line touch, no behavioral change.

## Verification

- ✓ Task 1 verify (HeaderBar component + global mount): all 15 checks pass
- ✓ Task 2 verify (hero + repaint): all 21 checks pass
- ✓ Task 3 verify (8-file repaint): brand utilities present, legacy palette absent
- ✓ Full-app grep `(bg|text|border)-(blue|indigo|amber|yellow|red|green|gray)-[0-9]+ components/ app/` — no matches
- ✓ Full-app grep `focus:ring-(blue|indigo)-[0-9]+` — no matches
- ✓ Full-app grep `placeholder-gray-[0-9]+` — no matches
- ✓ `npm run build` — TypeScript clean, all 7 routes generate, Tailwind v4 resolves every brand utility
- ✓ `bg-black/50` overlay preserved in UnclaimedModal

## Notes for downstream plans

### For Plan 09-04 (parallel-wave string sweep + onboarding copy)

**JoinForm insertion point**: The hero lockup sits at the top of `<div className="max-w-sm mx-auto w-full">`. Immediately below it is an HTML comment:
```
{/* Plan 09-04 inserts the app description <p> and the 4-step <ol> here, between the hero and the card. Do not place anything else in this slot. */}
```
Followed by the `<div className="bg-paper-deep ...">` card. 09-04 should insert its app description `<p>` and 4-step `<ol>` between the comment and the card (and may keep or remove the comment after insertion).

**File overlap audit**: 09-03 modified `components/session/JoinForm.tsx`. 09-04 also modifies it. The repaint is applied; 09-04 should only insert content, not modify className strings.

## Deviations

- One file outside the plan's `files_modified` list (`app/session/[id]/page.tsx`) was touched to satisfy the global `text-gray-*` must_have grep. Documented above.
- No deviations from PATTERNS.md or UI-SPEC.

## Text-muted upgrade audit (accessibility guard)

The UI-SPEC Accessibility Contract requires `text-muted` only on `text-sm` or smaller. Three legacy `text-gray-400` / `text-gray-500` instances on `text-base` body copy were upgraded to `text-ink-2` instead of `text-muted`:

- `ShareScreen.tsx` line 39 — "Scan to join" `<p>` (no text-size class, default `text-base`) → `text-ink-2`
- `SessionRoom.tsx` line 153 — "Connecting..." `<p>` (no text-size class, default `text-base`) → `text-ink-2`
- `app/session/[id]/page.tsx` line 78 — "Loading..." Suspense fallback (no text-size class, default `text-base`) → `text-ink-2`
