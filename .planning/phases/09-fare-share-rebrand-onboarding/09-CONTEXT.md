# Phase 9 Context: Fare Share Rebrand & Guest Onboarding

**Created:** 2026-05-02
**Milestone:** v1.2.1
**Status:** Context gathered — ready for planning

## Domain

User-visible identity for the app: name, logo, typography, palette, and first-impression copy on the guest join page. The phase delivers a complete brand-system adoption (not just string replacements) plus guest onboarding copy. Internal symbols, type names, and function names are out of scope.

## Canonical Refs

These files MUST be read by downstream agents (researcher, planner, executor):

- `.planning/REQUIREMENTS.md` — locked v1.2.1 requirements (11 reqs after this phase's expansion)
- `.planning/ROADMAP.md` — Phase 9 goal, success criteria, requirement mapping
- `design_handoff_logo/README.md` — **complete brand system specification from Claude Design** (geometry, color tokens, typography, usage rules, implementation examples). Authoritative for ALL visual decisions. Reproduce precisely.
- `design_handoff_logo/assets/` — 6 production SVG deliverables (primary, mono, reverse, lockup, app-icon, favicon)
- `design_handoff_logo/reference/` — HTML/JSX prototypes for visual context only; not production code
- `app/layout.tsx` — page metadata (currently still "Create Next App" defaults)
- `app/host/page.tsx`, `components/host/CameraCapture.tsx` — host start screen
- `app/session/[id]/page.tsx`, `components/session/JoinForm.tsx` — guest join screen
- `package.json`, `README.md`, `server.ts`, `types/index.ts` — files containing "Tab Splitter" strings

## Decisions

### A. Logo style
**Decision:** Use the Claude Design "Receipt Fold" logo system as delivered. No improvisation on the mark itself.
- Primary mark: `logo-receipt-fold.svg` (96×96, color, transparent bg)
- Lockup: `logo-lockup.svg` (mark + "Fare Share" wordmark, 420×120)
- Mono / reverse / app-icon / favicon variants used per the README's "Use" column
- Integrate as a React component using inline SVG for the small header occurrences (per the README's `FareShareLogo` example) and `<img>` references for app-icon / favicon
- Reproduce geometry, stroke weights, and color tokens exactly per `design_handoff_logo/README.md`

### B. Visual treatment
**Decision:** Hybrid — compact persistent header bar with the Fare Share lockup on **every screen** (host capture, OCR review, share, join, session, summary), plus a larger hero treatment of the lockup at the top of the two start pages (host capture, guest join). Other screens get only the header bar.
- Header bar: full-width, paper background, lockup left-aligned, sized to keep the lockup ≥ 120px wide per design min-size rule
- Hero on start pages: larger lockup or mark above the existing screen content
- Header bar may later carry shared chrome (session ID, leave button) — leave room but don't add now

### C. App description + guest instructions copy
**Decision:** Concise / utilitarian tone (Draft A). Copy appears on the **guest join page only** (host already has guidance — keep host as-is).

**App description (one line, above the join form):**
> Fare Share splits a restaurant bill by the items each person ordered.

**Usage instructions (numbered list, scannable, mobile-first above the fold):**
1. Enter your name to join.
2. Tap any item you ordered.
3. Tap shared items to split them with others.
4. When the host finalizes, you'll see exactly what you owe.

### D. Host page title integration
**Decision:** Hero (lockup) at top → smaller "Photograph Receipt" subhead → existing subtitle "Point your camera at the receipt and tap the button below." → Take Photo button. Demote `<h1>Photograph Receipt</h1>` from current h1 weight to a clear section label (e.g., h2-equivalent or smaller heading style) so it doesn't compete with the hero, but stays present so the host knows what to do on this screen.

### E. Brand system scope (full adoption, not just rename)
**Decision:** Adopt the complete brand system specified in `design_handoff_logo/README.md`:
- **Color tokens** — replace the current blue-600 + amber palette with the warm ink/paper/copper system. Define as CSS custom properties at `:root` (Tailwind v4 supports `@theme` for tokenizing into utility classes). Use `oklch()` values where supported with hex fallbacks.
- **Typography** — swap Geist Sans → Plus Jakarta Sans for UI and wordmark. Add Instrument Serif (editorial moments) and JetBrains Mono (numbers/prices/codes) as supporting families. Load via `next/font/google`.
- **Component repaint** — re-skin existing buttons, cards, inputs, backgrounds to the new palette. Primary CTA color shifts from `bg-blue-600` to copper accent. Card backgrounds shift from white to `--paper-deep`. The two-accent split from VIS-01 is replaced by the ink/paper/accent token system.
- **Raster icons** — generate apple-touch-icon-180.png and favicon 16/32 PNG fallbacks from `app-icon-512.svg`. PWA installability is **out of scope** (still deferred per v1.0/v1.1 out-of-scope list — sessions require live WebSocket).
- **Accent restraint** — accent (`#C75B3D`) used sparingly per design guidelines: CTAs, totals, the dashed fold in the logo. Not a flood color.

### F. Strings and metadata to rename
**Decision:** All user-visible "Tab Splitter" occurrences become "Fare Share":
- `app/layout.tsx` metadata `title` and `description` (currently still "Create Next App" defaults — fix in same pass)
- `package.json` `name` field
- `README.md`
- `server.ts` log/comment strings that surface to users
- `types/index.ts` JSDoc that surfaces in tooltips
- Any other user-facing strings discovered during execution

Internal git history, internal symbol names, type names, function names → unchanged.

### G. Folded todo
**Decision:** Pending todo `001-add-app-title-brief.md` is folded into this phase. The todo's three acceptance criteria (title prominent, host instructions, guest instructions) are subsumed by ONBOARD-01..05. Move to `.planning/todos/done/` when phase ships.

## Code Context

**Reusable patterns from prior phases (carry forward):**
- Mobile-first container: `min-h-screen flex flex-col items-center justify-start max-w-md mx-auto px-4 pt-safe pb-safe`
- Card pattern (currently white): `bg-white rounded-2xl shadow-md p-6` — will become `bg-[--paper-deep] rounded-2xl shadow-md p-6` (or token-equivalent) post-repaint
- `next/font/google` already used for Geist Sans/Mono — same loader pattern works for Plus Jakarta Sans / Instrument Serif / JetBrains Mono
- `app/layout.tsx` already structured around font CSS variables — token swap is local

**Files that will change (non-exhaustive — planner will refine):**
- `app/layout.tsx` — fonts, metadata
- `app/globals.css` — CSS custom properties for new tokens; potentially Tailwind `@theme` block
- `package.json` — name, possibly `description`
- `README.md` — name + any user-facing strings
- `server.ts` — user-facing strings only
- `types/index.ts` — JSDoc strings
- `components/host/CameraCapture.tsx` — host hero, subhead demotion, button repaint
- `components/host/OcrReview.tsx`, `components/host/ShareScreen.tsx`, `components/host/TaxTipFields.tsx`, `components/host/ItemRow.tsx` — palette repaint
- `components/session/JoinForm.tsx` — title hero, app description, instructions list, button repaint
- `components/session/SessionRoom.tsx`, `components/session/ClaimableItem.tsx`, `components/session/SummaryScreen.tsx`, `components/session/UnclaimedModal.tsx` — palette repaint
- New: `components/brand/FareShareLogo.tsx` (or similar) — inline SVG mark
- New: `components/brand/HeaderBar.tsx` — persistent header
- New: `public/` — copy/place SVG assets, generate raster fallbacks

## Out of Scope (Captured but Deferred)

- PWA installability (still deferred — v1.0/v1.1 out-of-scope holds; sessions require live WebSocket)
- Animated logo, dark mode, or theming
- Translation / i18n
- Onboarding overlay / tooltips / interactive tutorial
- Adding instructions to the host page (host already has guidance)
- Renaming internal code symbols, type names, function names
- Multi-currency support, custom typography per brand mode

## Acceptance Bar (informs verification)

A first-time guest opening the join URL on mobile should:
1. See the Fare Share lockup at the top (hero + header bar)
2. Read what Fare Share is in one line above the form
3. Read the four-step instruction list before entering their name
4. See the new copper accent on the Join button (not blue)
5. Read no remaining "Tab Splitter" anywhere in chrome (tab title, page text, footer if any)

The host opening `/host` should see the same brand chrome (header bar + hero), with "Photograph Receipt" demoted to a smaller subhead under the hero.

## Decisions Pre-Locked by Design Handoff (do not re-derive)

- Logo geometry (paths, stroke widths, viewBox) — verbatim from `design_handoff_logo/README.md`
- Color hex values — `#1A1714`, `#3A332D`, `#FAF7F2`, `#F2ECE2`, `#E6DFD2`, `#8A8175`, `#C75B3D`, `#A04425`
- Type families — Plus Jakarta Sans 700 (wordmark, weights 400/500/600 for UI), Instrument Serif (editorial), JetBrains Mono 500/600 (prices/codes)
- Wordmark casing/letter-spacing — "Fare Share" title case, `-0.02em` letter-spacing
- Logo min sizes — mark 24×24, lockup 120px wide minimum
- Don'ts — no recolor of receipt body, no dash-pattern change, no gradients/shadows/bevels, no font substitution for wordmark
