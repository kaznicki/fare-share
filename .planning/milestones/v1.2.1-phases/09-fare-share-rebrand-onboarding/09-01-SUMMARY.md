---
phase: 09-fare-share-rebrand-onboarding
plan: 01
subsystem: ui

tags: [brand, fonts, next-font, plus-jakarta-sans, instrument-serif, jetbrains-mono, svg, sharp, png, favicons, app-icon, metadata, copper-accent]

# Dependency graph
requires:
  - phase: design_handoff_logo
    provides: 6 source SVGs (mark, mono, reverse, lockup, app-icon, favicon) and the brand token spec (ink/paper/copper)
provides:
  - 6 brand SVGs in public/ with copper accent (#C75B3D) — color-fix #2D6BD9 -> #C75B3D applied at copy time
  - 3 raster icon fallbacks (apple-touch-icon-180.png, favicon-32x32.png, favicon-16x16.png) generated from app-icon-512.svg via sharp
  - app/layout.tsx loading Plus Jakarta Sans + Instrument Serif + JetBrains Mono via next/font/google
  - app/layout.tsx exposing CSS variables --font-jakarta, --font-instrument, --font-jetbrains on <body>
  - app/layout.tsx metadata locked to "Fare Share" + tagline + full icons map
affects: [09-02, 09-03, 09-04]

# Tech tracking
tech-stack:
  added:
    - Plus Jakarta Sans (next/font/google)
    - Instrument Serif (next/font/google)
    - JetBrains Mono (next/font/google)
    - sharp (for SVG -> PNG raster generation; already present transitively)
  patterns:
    - "Color-fix on copy: pre-process static SVGs at the filesystem boundary so the asset shipped to the browser carries the correct accent (#C75B3D), since CSS variables don't resolve through <img> references"
    - "Three font CSS variables exposed on <body> so globals.css @theme inline can map --font-sans/--font-serif/--font-mono in Plan 09-02"
    - "Metadata icons map covers SVG-first with PNG fallbacks (16/32 favicon, 180 apple-touch)"

key-files:
  created:
    - public/logo-receipt-fold.svg
    - public/logo-receipt-fold-mono.svg
    - public/logo-receipt-fold-reverse.svg
    - public/logo-lockup.svg
    - public/app-icon-512.svg
    - public/favicon.svg
    - public/apple-touch-icon-180.png
    - public/favicon-32x32.png
    - public/favicon-16x16.png
  modified:
    - app/layout.tsx

key-decisions:
  - "Pre-process SVGs on copy (literal #2D6BD9 -> #C75B3D text replace) rather than var(--accent) — CSS vars don't resolve through <img> boundary; static files referenced via <img> need baked-in colors"
  - "Used sharp directly (already transitively installed) instead of npx pwa-asset-generator — zero new dependency footprint"
  - "Did NOT add HeaderBar import in app/layout.tsx — Plan 09-03 owns that; adding it now would create a Wave 1/Wave 2 file conflict per the parallel-execution plan"
  - "Plus Jakarta Sans loads weights 400/500/600/700 (UI + 700 wordmark); Instrument Serif loads 400 normal+italic; JetBrains Mono loads 500/600 — exactly matches design handoff typography spec"

patterns-established:
  - "SVG color-fix at copy time: when a static SVG is referenced via <img>, hex values must be baked in (var(--token) won't resolve)"
  - "Raster fallback recipe: sharp(svg).resize(N,N).png().toFile(...) for icon generation"
  - "next/font/google three-family layout: each family gets its own const + variable; <body> className concatenates all three"

requirements-completed: [BRAND-01, BRAND-02, BRAND-04, BRAND-06]

# Metrics
duration: ~10 min
completed: 2026-05-04
---

# Phase 09 Plan 01: Brand Asset & Font Foundation Summary

**Six color-fixed brand SVGs + three PNG raster fallbacks in public/, plus app/layout.tsx loading Plus Jakarta Sans / Instrument Serif / JetBrains Mono via next/font/google with locked Fare Share metadata.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-04 (executor session)
- **Completed:** 2026-05-04T22:25:17Z
- **Tasks:** 3 of 3 complete
- **Files modified:** 1 (app/layout.tsx)
- **Files created:** 9 (6 SVGs + 3 PNGs in public/)

## Accomplishments
- All six brand SVGs now live in `public/` with the design-system-mandated copper accent (`#C75B3D`), having performed the literal `#2D6BD9` -> `#C75B3D` replacement that the shipped handoff assets required
- Three icon raster fallbacks (`apple-touch-icon-180.png`, `favicon-32x32.png`, `favicon-16x16.png`) generated from the color-fixed `app-icon-512.svg` via sharp (already a transitive dep — no new top-level dependencies added)
- `app/layout.tsx` swapped Geist + Geist_Mono for the three Fare Share families, replaced "Create Next App" defaults with the locked `Fare Share` title + tagline, and wired `metadata.icons` to the new SVG + 16/32/180 PNG references
- `npm run build` passes — Next.js validates all three font loaders and resolves the asset URLs

## Task Commits

Each task was committed atomically with `--no-verify` (parallel execution mode):

1. **Task 1: Color-fix and copy 6 brand SVGs into public/** — `de7f804` (feat)
2. **Task 2: Generate 3 raster icon fallbacks via sharp** — `0d82cbc` (feat)
3. **Task 3: Swap Geist for Jakarta/Instrument/JetBrains + Fare Share metadata in app/layout.tsx** — `ce938b7` (feat)

(Plan metadata + STATE.md/ROADMAP.md update is owned by the orchestrator after the wave merges — not committed here.)

## Files Created/Modified
- `public/logo-receipt-fold.svg` — primary mark, color-fixed
- `public/logo-receipt-fold-mono.svg` — mono variant, byte-equal to source (no accent uses)
- `public/logo-receipt-fold-reverse.svg` — reverse on dark, color-fixed
- `public/logo-lockup.svg` — mark + wordmark lockup, color-fixed (consumed by `<img>` hero in 09-04)
- `public/app-icon-512.svg` — app icon source, color-fixed (raster source for Task 2)
- `public/favicon.svg` — SVG favicon, color-fixed
- `public/apple-touch-icon-180.png` — 180×180 raster fallback (3910 bytes)
- `public/favicon-32x32.png` — 32×32 raster fallback (569 bytes)
- `public/favicon-16x16.png` — 16×16 raster fallback (334 bytes)
- `app/layout.tsx` — three font loaders (Plus_Jakarta_Sans / Instrument_Serif / JetBrains_Mono), Fare Share metadata, full icons map, body className uses three new --font-* variables

## Decisions Made
- **Did not import HeaderBar in app/layout.tsx** — that mount belongs to Plan 09-03 (Wave 2). Adding it here would create a worktree merge conflict between 09-01 (Wave 1) and 09-03 (Wave 2). 09-03's job per the plan is to mount HeaderBar; 09-01 only establishes the font/metadata/icon foundation it consumes.
- **Used sharp via Node script** — sharp is already a transitive dep of Next.js / image optimization; called it directly via `node -e` instead of `npx --yes sharp-cli` or installing `sharp` as a project dep. Zero added dependencies.
- **Did not migrate Geist CSS variables in globals.css** — Plan 09-02 owns the @theme inline rewrite that maps `--font-sans` → `--font-jakarta` etc. After this commit, `globals.css` still references `var(--font-geist-sans)` (which now resolves to nothing); UI is unstyled until 09-02 lands. This is by design per the plan's phased boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] app-icon-512.svg source has only 1 occurrence of #2D6BD9, not 2 as the plan acceptance criterion expected**
- **Found during:** Task 1 (Color-fix and copy SVGs)
- **Issue:** The plan acceptance criterion stated `git grep -c "#C75B3D" public/app-icon-512.svg` should return `>= 2`, mirroring the count expected on the other primary SVGs. Inspection of the source file (`design_handoff_logo/assets/app-icon-512.svg`) shows only ONE `#2D6BD9` occurrence — used as the rounded-rect background `fill` on the wrapping `<rect>`. The mark inside is rendered with `stroke="#1A1714"` (ink) on the dashed fold and total line — **not** `#2D6BD9` — because the app icon design is mark-on-copper-background rather than copper-on-paper. The README handoff confirms this geometry.
- **Fix:** Performed the literal `#2D6BD9` → `#C75B3D` replacement as instructed (preserving every other byte verbatim). Resulting file has exactly 1 `#C75B3D` occurrence (the background rect fill) and zero `#2D6BD9` occurrences. The "must_haves" truth requirement ("no remaining #2D6BD9 anywhere in public/*.svg") is satisfied. The acceptance criterion's `>= 2` for app-icon-512.svg specifically reflects an inaccurate assumption in plan authoring; the underlying intent (no remaining blue) holds.
- **Files modified:** public/app-icon-512.svg
- **Verification:** `grep -c "#2D6BD9" public/app-icon-512.svg` → 0; `grep -c "#C75B3D" public/app-icon-512.svg` → 1; visual inspection confirms the rounded-rect now renders copper, with the ink mark/text on top. Raster generation in Task 2 produced correctly-themed PNGs.
- **Committed in:** de7f804 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 plan-acceptance-criterion mismatch reconciled)
**Impact on plan:** No correctness or security impact. The `#C75B3D >= 2` criterion was an over-spec on plan author's part for a single-fill asset; the underlying brand-system requirement (no blue, copper background, ink mark) is fully met.

## Issues Encountered
- None. All three tasks executed as specified, all automated verifications passed, and `npm run build` succeeded on the first attempt.

## User Setup Required
None — no external service configuration required by this plan. PWA install / iOS home-screen install would consume these icons, but PWA installability is explicitly out-of-scope per CONTEXT.md decision E.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes introduced. All three threats in the plan's threat register (T-09-01 SVG content, T-09-02 font loader, T-09-03 raster tooling) were handled per their disposition: SVGs verified script-free before copy; `next/font/google` self-hosts at build time (no runtime CDN fetch); sharp ran locally against the just-color-fixed in-repo source SVG with output dimensions verified.

## Known Stubs

None. The components consuming this foundation (09-02 globals.css `@theme inline`, 09-03 HeaderBar, 09-04 hero `<img>` references) are intentional Wave 2 work — not stubs. After 09-01 merges, `globals.css` will still reference `var(--font-geist-sans)` (which now resolves to nothing) until 09-02 rewrites it; this is the planned cross-wave handoff.

## Next Phase Readiness
- **Plan 09-02 (Wave 2)** can now consume `--font-jakarta`, `--font-instrument`, `--font-jetbrains` CSS variables in `globals.css @theme inline` mapping
- **Plan 09-03 (Wave 2)** can mount `<HeaderBar />` in `app/layout.tsx`; the metadata + fonts + icons foundation is in place. It can also consume `<FareShareLogo />` (defined in 09-02) inline-SVG mark
- **Plan 09-04 (Wave 2)** can place `<img src="/logo-lockup.svg">` on `/host` and the guest join page — the asset is in `public/` with the correct copper accent
- All four icon URLs in `metadata.icons` resolve to existing files (verified)

## Self-Check: PASSED

**Files created:**
- FOUND: public/logo-receipt-fold.svg
- FOUND: public/logo-receipt-fold-mono.svg
- FOUND: public/logo-receipt-fold-reverse.svg
- FOUND: public/logo-lockup.svg
- FOUND: public/app-icon-512.svg
- FOUND: public/favicon.svg
- FOUND: public/apple-touch-icon-180.png
- FOUND: public/favicon-32x32.png
- FOUND: public/favicon-16x16.png

**Files modified:**
- FOUND: app/layout.tsx (Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono present; "Fare Share" title; no "Create Next App"; no Geist; metadata.icons wired)

**Commits:**
- FOUND: de7f804 (Task 1: feat — color-fix and copy 6 brand SVGs)
- FOUND: 0d82cbc (Task 2: feat — generate raster icon fallbacks)
- FOUND: ce938b7 (Task 3: feat — fonts + metadata in app/layout.tsx)

**Build:** `npm run build` passes (Next.js compiles all three font loaders; static page generation succeeds; no runtime errors).

---
*Phase: 09-fare-share-rebrand-onboarding*
*Plan: 01*
*Completed: 2026-05-04*
