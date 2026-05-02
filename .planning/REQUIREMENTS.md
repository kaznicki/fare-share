# Requirements: Fare Share v1.2.1

## v1.2.1 Requirements

### BRAND — Rebrand to Fare Share & Adopt Brand System

**BRAND-01** — All user-visible "Tab Splitter" strings are replaced with "Fare Share" across the app: page `<title>`/metadata, README, `package.json` name, `server.ts` user-surfacing strings, and any other user-facing copy. The `app/layout.tsx` metadata default ("Create Next App") is also fixed to Fare Share metadata. Internal git history, type names, function names, and code symbols may retain references.

**BRAND-02** — All 6 brand SVG assets from `design_handoff_logo/assets/` are integrated into the app's static-asset pipeline (primary mark, mono, reverse, lockup, app-icon, favicon). Logo geometry, stroke weights, and color values are reproduced exactly per `design_handoff_logo/README.md`.

**BRAND-03** — The CSS design-token system from the handoff is introduced: `--ink`, `--ink-2`, `--paper`, `--paper-deep`, `--rule`, `--muted`, `--accent`, `--accent-deep`. Tokens are defined as CSS custom properties at `:root` and integrated with Tailwind v4 `@theme` so they are usable as utility classes. `oklch()` values used where supported with hex fallbacks.

**BRAND-04** — Plus Jakarta Sans replaces Geist Sans as the UI and wordmark family. Instrument Serif (editorial) and JetBrains Mono (prices/codes) are added as supporting families. All three are loaded via `next/font/google` following the existing font-loading pattern.

**BRAND-05** — Existing UI components are re-skinned to the new palette: primary CTA color shifts from `bg-blue-600` to copper accent (`--accent`), card backgrounds shift from white to paper-deep, screen backgrounds shift to paper, borders use `--rule`, secondary text uses `--ink-2` / `--muted`. The two-accent split from VIS-01 is replaced by the ink/paper/accent token system. Accent is used sparingly (CTAs, totals, fold) per design guidelines.

**BRAND-06** — Raster icon variants are generated from `app-icon-512.svg`: apple-touch-icon-180.png, favicon 32×32 PNG, favicon 16×16 PNG. PWA installability and PWA-manifest-driven icons are explicitly out of scope (deferred per existing v1/v2 scope).

---

### ONBOARD — Start Page Identity & Guest Onboarding

**ONBOARD-01** — A hero treatment of the Fare Share lockup is displayed at the top of the host start page (`/host` capture screen). The existing "Photograph Receipt" h1 is demoted to a smaller subhead so it does not compete with the hero.

**ONBOARD-02** — A hero treatment of the Fare Share lockup is displayed at the top of the guest join page above the join form.

**ONBOARD-03** — The guest join page shows the app description: "Fare Share splits a restaurant bill by the items each person ordered." (one line, above the join form, below the hero).

**ONBOARD-04** — The guest join page shows the four-step usage instructions list above the name input:
> 1. Enter your name to join.
> 2. Tap any item you ordered.
> 3. Tap shared items to split them with others.
> 4. When the host finalizes, you'll see exactly what you owe.

**ONBOARD-05** — A persistent header bar with the Fare Share lockup appears at the top of every screen (host capture, OCR review, share, join, session, summary). Lockup is sized to honor the design min-width (≥ 120px wide). Bar is full-width on paper background, lockup left-aligned.

---

## Coverage Summary

| ID | Category | Phase | Status | Validated |
|----|----------|-------|--------|-----------|
| BRAND-01 | Rename "Tab Splitter" → "Fare Share" | Phase 9 | Pending | — |
| BRAND-02 | 6 SVG assets integrated | Phase 9 | Pending | — |
| BRAND-03 | CSS design tokens | Phase 9 | Pending | — |
| BRAND-04 | Typography swap (Plus Jakarta Sans + supporting) | Phase 9 | Pending | — |
| BRAND-05 | Component repaint to new palette | Phase 9 | Pending | — |
| BRAND-06 | Raster icon variants | Phase 9 | Pending | — |
| ONBOARD-01 | Host start page hero | Phase 9 | Pending | — |
| ONBOARD-02 | Guest join page hero | Phase 9 | Pending | — |
| ONBOARD-03 | App description on guest page | Phase 9 | Pending | — |
| ONBOARD-04 | Guest usage instructions | Phase 9 | Pending | — |
| ONBOARD-05 | Persistent header bar across screens | Phase 9 | Pending | — |

**Total v1.2.1 requirements: 11**

---

## Future Requirements (Deferred)

*(see archived v1.1 requirements for the deferred v2 list — still applies)*

---

## Out of Scope

- **PWA installability and PWA manifest** — sessions require live WebSocket; deferred per v1.0/v1.1 out-of-scope
- Renaming internal code symbols, type names, function names — user-visible strings only
- Animated logo, dark mode, theme switching
- Translating description / instructions — English only this milestone
- Onboarding overlay, tooltips, interactive tutorial — static copy on join page only
- Adding instructions to the host page (host already has guidance — keep as-is)
- Logo geometry/color modifications — reproduce design handoff exactly, no creative variations
