# Phase 9 Discussion Log

**Date:** 2026-05-02
**Phase:** 9 — Fare Share Rebrand & Guest Onboarding

## Gray areas presented

A. Logo style
B. Visual treatment (title/logo placement)
C. App description + guest instructions copy
D. Host page title integration

User selected: **all four**.

---

## A. Logo style

**Initial framing:** SVG glyph + wordmark, text-only, emoji + wordmark, deferred, or "something else".

**User pivot:** "Claude Design has created a logo. What's the hex for the indigo color?"

**Resolution:** No indigo in the delivered system — the accent is warm copper `#C75B3D` (oklch(64% 0.17 35)). User confirmed the design lives in `design_handoff_logo/`. Reading the README revealed a complete brand system (logo + tokens + typography + 6 SVG variants), not just a logo asset.

**Scope-check escalation:** Adopting the full system means typography swap (Geist → Plus Jakarta Sans), palette swap (blue/amber → ink/paper/copper), and a component repaint — beyond the original v1.2.1 scope.

**User decision:** Option 1 — expand v1.2.1 to adopt the full brand system now. New requirements (BRAND-03..06, ONBOARD-05) added.

**Locked:** Use `design_handoff_logo/` deliverables verbatim. Reproduce geometry, colors, typography exactly per the handoff README.

---

## B. Visual treatment

**Options presented:**
1. Hybrid — small persistent header bar everywhere + larger hero on start pages (recommended)
2. Header bar only
3. Hero on start pages only
4. Something else

**User selected:** 1 (hybrid).

**Locked:** Persistent header bar with lockup on every screen + hero treatment of the lockup at the top of host capture and guest join.

---

## C. App description + guest instructions copy

**Drafts presented:** A (concise/utilitarian), B (friendly/first-person), C (editorial/on-brand).

**User selected:** A.

**Locked copy** (guest join page only):
- Description: "Fare Share splits a restaurant bill by the items each person ordered."
- Instructions:
  1. Enter your name to join.
  2. Tap any item you ordered.
  3. Tap shared items to split them with others.
  4. When the host finalizes, you'll see exactly what you owe.

---

## D. Host page title integration

**Options presented:**
1. Hero (lockup) → smaller "Photograph Receipt" subhead → subtitle → button (recommended)
2. Hero only — drop "Photograph Receipt"
3. Keep "Photograph Receipt" at h1, hero above
4. Something else

**User selected:** 1.

**Locked:** "Photograph Receipt" stays but is demoted from h1 to a smaller subhead so it doesn't compete with the hero.

---

## Deferred ideas (captured, not in scope this milestone)

- PWA installability (still deferred — v1.0/v1.1 out-of-scope holds)
- Dark mode / theme switching
- Animated logo
- Translation / i18n
- Header bar utility chrome (session ID, leave button) — leave room, don't add yet

## Claude's discretion (not asked, decided by handoff or convention)

- Use Tailwind v4 `@theme` for tokenizing the new color tokens into utility classes (where possible) with `:root` CSS custom properties as fallback
- Load Plus Jakarta Sans / Instrument Serif / JetBrains Mono via `next/font/google` (same pattern as existing Geist Sans)
- Inline SVG component for header lockup (per handoff `FareShareLogo` example); `<img>` reference for app-icon and favicon
- Generate raster icons (apple-touch-icon, favicon PNG fallbacks) via `sharp` or equivalent during execution; do not adopt PWA manifest
