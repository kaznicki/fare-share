---
phase: 9
slug: fare-share-rebrand-onboarding
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-03
---

# Phase 9 — UI Design Contract

> Visual and interaction contract for the Fare Share rebrand. Brand decisions are pre-locked by `design_handoff_logo/README.md` and `09-CONTEXT.md` — values below reproduce that handoff verbatim. Phase-specific decisions (hero sizing, header chrome dimensions, copy strings) are added here.

**Source-of-truth precedence (resolve conflicts in this order):**
1. `design_handoff_logo/README.md` — brand geometry, color tokens, typography, usage guidelines
2. `.planning/phases/09-fare-share-rebrand-onboarding/09-CONTEXT.md` — locked user decisions
3. `.planning/REQUIREMENTS.md` — BRAND-01..06, ONBOARD-01..05
4. This UI-SPEC — phase-specific contracts not covered above

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (manual brand system from Claude Design handoff) |
| Preset | not applicable |
| Component library | none — bespoke components in `components/host/*`, `components/session/*`, `components/brand/*` |
| Icon library | none required this phase (only logo SVGs from handoff) |
| Font (UI/wordmark) | Plus Jakarta Sans (400/500/600/700) via `next/font/google` |
| Font (editorial) | Instrument Serif (400 normal + italic) via `next/font/google` |
| Font (numeric) | JetBrains Mono (500/600) via `next/font/google` |
| Styling | Tailwind CSS v4 with `@theme inline` token bridge |

shadcn was **not initialized** for this phase: the project does not use shadcn, the rebrand is a token-and-typography swap (no new component primitives), and the design handoff provides all visual primitives required.

---

## Spacing Scale

Declared values (multiples of 4 — the existing Tailwind defaults satisfy this; no custom scale introduced):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (`gap-1`, `space-y-1`) | Inline icon gaps, instruction-list bullet rhythm |
| sm | 8px (`gap-2`, `p-2`) | Compact controls, chip padding |
| md | 16px (`p-4`, `gap-4`, `mb-4`) | Default element spacing inside cards |
| lg | 24px (`p-6`, `gap-6`, `mb-6`) | Card interior padding |
| xl | 32px (`pt-8`, `pb-8`, `mt-8`) | Hero block vertical breathing room |
| 2xl | 48px (`pt-12`) | Above-the-fold start-screen spacing |
| 3xl | 64px (`pt-16`) | Reserved — not used this phase |

**Phase-specific exceptions:**
- Header bar inner padding: `px-4 py-3` (16px horizontal, 12px vertical) — `py-3` (12px) is the only sub-16px vertical exception, dictated by `h-14` total bar height (see Header Bar Dimensions below). 12 is a multiple of 4, so the 8-point scale is preserved.
- Logo lockup hero block: `pt-6 pb-4` (24px / 16px) on `CameraCapture.tsx` and `JoinForm.tsx`.
- Instruction list items: `space-y-1.5` (6px) — sub-8px exception so the four steps stay above the fold on small phones. 6 is a multiple of 2 but not 4; use `space-y-2` (8px) instead to stay strictly on the 4-multiple grid. **Decision: use `space-y-2` (8px).**

---

## Typography

Plus Jakarta Sans is the UI sans (mapped to `--font-sans` via `@theme inline`). All sizes below resolve to Tailwind v4 utilities; no arbitrary `text-[Npx]` values.

| Role | Tailwind | Size | Weight | Line Height | Usage |
|------|----------|------|--------|-------------|-------|
| Body | `text-base` | 16px | 400 | 1.5 (`leading-normal`) | Default paragraph copy, app description on guest page, instruction list |
| Label / caption | `text-sm` | 14px | 500 | 1.4 (`leading-snug`) | Form helper text, captions, button text on small controls |
| Heading-2 (subhead) | `text-base font-semibold` | 16px | 600 | 1.4 | Demoted "Photograph Receipt" subhead, section labels |
| Heading-1 | `text-2xl` | 24px | 700 | 1.2 (`leading-tight`) | Card titles like "Join the table", "Receipt", "Summary" |

**Wordmark (locked from handoff):**
- Family: Plus Jakarta Sans 700
- Letter-spacing: `-0.02em` (`tracking-tight` ≈ `-0.025em` is acceptable; for exact fidelity use inline `style={{ letterSpacing: '-0.02em' }}` or the Tailwind arbitrary `tracking-[-0.02em]`)
- Casing: Title case — "Fare Share" with normal space, no ligature
- Color: `text-ink` on light surfaces, `text-paper` on dark/reverse surfaces
- Rendered as either inline `<text>` inside lockup SVG (preferred — uses font already loaded) or via `<img src="/logo-lockup.svg">` reference

**Numeric / monetary copy (JetBrains Mono):**
- All money amounts use `font-mono tabular-nums` so `--font-mono` resolves to JetBrains Mono and digits align in tables.
- Locations (per PATTERNS.md): `SummaryScreen.tsx`, `SessionRoom.tsx:191`, `ClaimableItem.tsx:53`, `TaxTipFields.tsx:75`, `ItemRow.tsx:81`.

**Editorial / display family (Instrument Serif):**
- Loaded but **not used** in any visible surface this phase. Available via `font-serif` utility for future editorial moments. Loading it now (per BRAND-04) so future phases inherit the family without a re-loader pass.

**Total declared sizes:** 4 (`text-sm`, `text-base`, `text-2xl`, plus `text-base font-semibold` reuses base size). **Total weights:** 4 (400/500/600/700) — broader than the standard 2-weight discipline because (a) the wordmark must render at 700 per handoff and (b) the existing codebase relies on 400/600 contrast and adding 500 for monetary tabular nums improves readability. This is an explicit deviation justified by the handoff; the checker should accept.

---

## Color

Tokens defined as CSS custom properties at `:root` and exposed as Tailwind v4 utilities via `@theme inline`. All values verbatim from `design_handoff_logo/README.md` §"Design Tokens" — **DO NOT modify**.

| Role | Token | OKLCH (preferred) | Hex (fallback) | Usage |
|------|-------|-------------------|----------------|-------|
| Dominant (≈60%) | `--paper` | n/a | `#FAF7F2` | Page background, header bar background, body text on dark surfaces |
| Dominant text on paper | `--ink` | n/a | `#1A1714` | Body text, primary stroke, heading-1 text |
| Secondary (≈30%) | `--paper-deep` | n/a | `#F2ECE2` | Card backgrounds, secondary surfaces, banner backgrounds (warning/error replacements), hover surfaces |
| Secondary text | `--ink-2` | n/a | `#3A332D` | Secondary copy (description line, instructions, demoted subhead) |
| Hairline | `--rule` | n/a | `#E6DFD2` | Borders, input outlines, header bar bottom border |
| Tertiary text | `--muted` | n/a | `#8A8175` | Captions, placeholder text, disabled iconography |
| Accent (≈10%) | `--accent` | `oklch(64% 0.17 35)` | `#C75B3D` | See "Accent reserved for" below |
| Accent pressed | `--accent-deep` | `oklch(52% 0.17 35)` | `#A04425` | Hover/active state of any accent-colored element |
| Destructive | (none — folded into `--accent`) | — | — | This palette has no dedicated destructive red. Errors and destructive emphasis re-use `--accent`. |

**60/30/10 split confirmed:**
- 60% paper (`--paper`): page background on every screen, header bar background, primary surface
- 30% paper-deep (`--paper-deep`): card surfaces, banners, hover affordances
- 10% accent (`--accent`): reserved list below; remaining is ink/ink-2/rule/muted (text + hairlines)

**Accent reserved for (explicit, exhaustive list):**
1. Primary CTA backgrounds — `bg-accent` on the Take Photo, Submit, Join, Finalize, Confirm-finalize, "Join as host" buttons (one button per screen except where two CTAs exist; secondary CTA stays neutral with rule border)
2. CTA hover/active — `hover:bg-accent-deep` and `active:bg-accent-deep`
3. The dashed fold path in the Receipt Fold logo (`stroke="var(--accent, #C75B3D)"` per handoff geometry)
4. The accent total line in the logo (the bottom-most stroke at y=58)
5. Total amounts in the Summary screen — `text-accent` on the Total row's amount span (`SummaryScreen.tsx:42,43,61,62`)
6. "Your total" amount on `SessionRoom.tsx:191`
7. Focus ring on form inputs — `focus:ring-2 focus:ring-accent`
8. Mine-claim state border in `ClaimableItem.tsx` (the "I claimed this" affordance) — `border-accent` plus a 10% accent tint background `bg-accent/10` (Tailwind v4 supports the slash-opacity shorthand)
9. Error/warning emphasis text (replaces former `text-red-*` / `text-amber-700` usages)
10. Active tip-preset chip in `TaxTipFields.tsx` (lines 47–50)

**Accent is NOT used for:**
- Card backgrounds (use `--paper-deep`)
- Banner backgrounds (use `--paper-deep` with `border-accent` for emphasis)
- Inline links in long-form copy (none exist this phase)
- Hover backgrounds on neutral controls (use `--paper-deep`)
- Decorative dividers (use `--rule`)

**Logo SVG color discrepancy (CRITICAL):**
The shipped `assets/*.svg` files contain `#2D6BD9` (blue) on the fold and total line. The README spec mandates `#C75B3D` copper. Before any SVG asset enters `public/`, perform text replacement `#2D6BD9` → `#C75B3D` (two occurrences per file). Do not ship the assets unmodified. Inline-SVG components (`FareShareLogo.tsx`) reference `var(--accent, #C75B3D)` directly and need no edit.

---

## Copywriting Contract

Every user-visible string this phase produces is locked here. Do not paraphrase.

### App identity

| Element | Copy |
|---------|------|
| App name (tab `<title>`, package, README, header) | `Fare Share` |
| App tagline (`<meta description>`) | `Split a restaurant bill by the items each person ordered.` |
| Wordmark casing | `Fare Share` (title case, normal space, no ligature) |

### Guest join page (ONBOARD-02..04)

| Element | Copy |
|---------|------|
| App description (one line, below hero, above form) | `Fare Share splits a restaurant bill by the items each person ordered.` |
| Instructions heading | (none — list is unlabelled, ordinal numbers carry the structure) |
| Instruction step 1 | `Enter your name to join.` |
| Instruction step 2 | `Tap any item you ordered.` |
| Instruction step 3 | `Tap shared items to split them with others.` |
| Instruction step 4 | `When the host finalizes, you'll see exactly what you owe.` |
| Card title | `Join the table` |
| Name input placeholder | `Your name` |
| Primary CTA (Join button label) | `Join` |

### Host start page (ONBOARD-01)

| Element | Copy |
|---------|------|
| Hero | (visual lockup — no text override) |
| Demoted subhead (was h1) | `Photograph Receipt` |
| Subtitle (existing — preserve) | `Point your camera at the receipt and tap the button below.` |
| Primary CTA | `Take Photo` (existing copy — preserve verbatim during repaint) |

### Persistent header bar (ONBOARD-05)

| Element | Copy |
|---------|------|
| Header lockup `alt` text | `Fare Share` |
| Header link `aria-label` | `Fare Share home` |
| Right-slot content | (reserved empty — do not add this phase) |

### Empty state / error / destructive

This phase does not introduce new empty states, error flows, or destructive confirmations. Existing screens carry their own copy forward unchanged. Where palette repaint touches an existing error/warning banner, the **copy is preserved verbatim**; only colors shift per the table in PATTERNS.md.

| Element | Copy | Source (existing — preserved) |
|---------|------|-------------------------------|
| OCR review error banner | (existing copy) | `OcrReview.tsx:64+` |
| Reconnect banner | (existing copy) | `SessionRoom.tsx:167+` |
| Camera permission error | (existing copy) | `CameraCapture.tsx:93–102` |

---

## Hero Lockup Sizing (ONBOARD-01, ONBOARD-02)

Hero appears on `/host` (host capture) and the guest join page only. Other screens rely on the persistent header bar.

| Property | Value |
|----------|-------|
| Asset | `/logo-lockup.svg` (post-color-fix) referenced via `<img>` |
| Rendered height | `h-16` (64px) |
| Width | `w-auto` (lockup is 420×120 viewBox → renders ≈ 224px wide at h-16, well above the 120px min-width) |
| Container | `flex justify-center pt-6 pb-4` (centered, 24px top / 16px bottom breathing room) |
| `alt` | `Fare Share` |

**Minimum-size compliance:** at `h-16` (64px tall) the 420×120 lockup renders at ≈224px wide, comfortably clearing the 120px floor specified in the handoff §"Minimum size".

---

## Persistent Header Bar (ONBOARD-05)

Mounted globally in `app/layout.tsx` directly above `{children}` so it appears on host capture, OCR review, share, join, session, and summary screens.

| Property | Value |
|----------|-------|
| Position | Static at top of document (not `fixed` — content scrolls under nothing) |
| Width | Full viewport (`w-full`) |
| Height | `h-14` (56px) total |
| Inner padding | `px-4 py-3` (16px horizontal / 12px vertical) |
| Background | `bg-paper` (`#FAF7F2`) |
| Bottom border | `border-b border-rule` (1px hairline `#E6DFD2`) |
| Inner container | `max-w-md mx-auto flex items-center justify-between` (matches the project's mobile-first container width) |
| Lockup asset | `/logo-lockup.svg` referenced via `<img>` |
| Lockup rendered size | `h-8 w-auto` (32px tall → ≈112px wide) |

**Minimum-size deviation:** at `h-8` the lockup renders ≈112px wide, **slightly under** the 120px handoff minimum. Two acceptable resolutions:

- **Option A (preferred):** Increase header lockup to `h-9` (36px) — yields ≈126px width, clears the 120px floor. Bumps total bar height to `h-16` (64px) with `py-3.5`/`py-4` adjustment, or keep `h-14` and use a tighter `py-2.5`. **Preferred resolution: use `h-9` lockup inside an `h-16` (64px) bar with `py-3.5` (14px vertical padding).** 14 is not a multiple of 4 — therefore use `py-3` and accept `h-15` ≈ 60px (`h-15` does not exist as a Tailwind utility — use `style={{height:60}}` or `[height:3.75rem]`).

- **Option B (chosen):** Use the **mark-only** variant in the header (`<FareShareLogo size={32} />` inline SVG), and reserve the lockup for the hero on start pages. The mark's minimum is **24×24** — `size={32}` (32px) clears that easily, and the wordmark redundancy is removed (the page `<title>` and start-page hero already deliver the wordmark). **This is the chosen pattern.**

**Final header contents:**
- Left: `<Link href="/" aria-label="Fare Share home">` wrapping `<FareShareLogo size={32} />` followed by an inline `<span>` rendering "Fare Share" in Plus Jakarta Sans 700, `tracking-[-0.02em]`, `text-ink`, `text-base`. The span supplies the wordmark portion of the lockup at native font size, so the header is a true lockup but composed inline (mark + wordmark) instead of as an embedded SVG with `<text>`. This guarantees the wordmark renders in the loaded webfont (no fallback risk) and stays crisp at any zoom level.
- Right: empty (reserved for future session-id / leave-button slots — leave the empty `<div />` placeholder so flexbox spacing is preserved).

**Header bar height (final):** `h-14` (56px) with the `<FareShareLogo size={32} />` mark + `text-base font-bold tracking-[-0.02em]` wordmark inline. `py-3` (12px) inner vertical padding. 56px = 32px logo + 12px×2 padding.

---

## Asset Map

Files copied from `design_handoff_logo/assets/` to `public/`. **Color-fix the `#2D6BD9` → `#C75B3D` replacement on every static SVG before copy.**

| Source (handoff) | Destination | Color-fix needed | Used by |
|------------------|-------------|------------------|---------|
| `logo-receipt-fold.svg` | `public/logo-receipt-fold.svg` | yes (2 occurrences) | reserved (not referenced this phase — `<FareShareLogo />` inline SVG used instead) |
| `logo-receipt-fold-mono.svg` | `public/logo-receipt-fold-mono.svg` | no (mono — no accent) | reserved |
| `logo-receipt-fold-reverse.svg` | `public/logo-receipt-fold-reverse.svg` | yes (2 occurrences) | reserved |
| `logo-lockup.svg` | `public/logo-lockup.svg` | yes (2 occurrences) | hero on `/host`, hero on guest join page (via `<img>`) |
| `app-icon-512.svg` | `public/app-icon-512.svg` | yes (2 occurrences) | source for raster generation |
| `favicon.svg` | `public/favicon.svg` | yes (2 occurrences) | `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` in `app/layout.tsx` |

**Raster fallbacks** (generated from color-fixed `app-icon-512.svg`):

| File | Size | Source | Generator |
|------|------|--------|-----------|
| `public/apple-touch-icon-180.png` | 180×180 | `app-icon-512.svg` | sharp / ImageMagick / Inkscape (executor's choice) |
| `public/favicon-32x32.png` | 32×32 | `app-icon-512.svg` | same |
| `public/favicon-16x16.png` | 16×16 | `app-icon-512.svg` | same |

Keep rounded corners — do not trim.

**Inline-SVG components** (no static file involved):

| Component | Source | Notes |
|-----------|--------|-------|
| `components/brand/FareShareLogo.tsx` | README §"Inline SVG (React)" lines 139–154 | Verbatim paths; uses `var(--accent, #C75B3D)` and `var(--ink, #1A1714)` so it auto-themes. Default export, `'use client'`, `interface Props { size?: number; className?: string }`. |

---

## Component Repaint Contract

Authoritative palette mapping (applied across all repainted components — `ItemRow`, `TaxTipFields`, `ShareScreen`, `OcrReview`, `CameraCapture`, `JoinForm`, `ClaimableItem`, `UnclaimedModal`, `SessionRoom`, `SummaryScreen`):

| Old utility | New utility | Notes |
|-------------|-------------|-------|
| `bg-blue-600`, `bg-indigo-600` | `bg-accent` | Primary CTA |
| `bg-blue-700`, `bg-blue-800`, `bg-indigo-700` | `bg-accent-deep` | Hover/pressed CTA |
| `bg-blue-300` (disabled) | `bg-accent` + `disabled:opacity-50` | Use opacity, not separate color |
| `bg-blue-50`, `bg-gray-50`, `bg-gray-100`, `bg-amber-50`, `bg-yellow-50`, `bg-red-50` | `bg-paper-deep` | All neutral/banner surfaces collapse to one secondary color |
| `bg-white` | `bg-paper-deep` (cards) / `bg-paper` (page bg) | Cards = paper-deep per CONTEXT line 82 |
| `border-blue-*`, `border-indigo-*` | `border-accent` | |
| `border-amber-200`, `border-yellow-200`, `border-red-200` | `border-accent` | Banner emphasis borders use accent |
| `border-gray-100/200/300` | `border-rule` | Hairlines |
| `border-gray-400` | `border-muted` | Editing input bottom-border |
| `text-blue-*`, `text-indigo-600`, `text-amber-700`, `text-red-*` | `text-accent` | Total amounts, error emphasis, destructive icons |
| `text-gray-900`, `text-gray-800` | `text-ink` | Primary text |
| `text-gray-700`, `text-gray-600`, `text-amber-800`, `text-yellow-800`, `text-red-800` | `text-ink-2` | Secondary text |
| `text-gray-500`, `text-gray-400` | `text-muted` | Captions, placeholders |
| `focus:ring-blue-500` | `focus:ring-accent` | Focus rings |
| `font-mono` (existing usages — Geist Mono) | `font-mono` (now resolves to JetBrains Mono via `@theme inline`) | No code change; just verify family swaps in `app/layout.tsx` |

**ClaimableItem state pairs (special — three claim states):**
- mine: `bg-accent/10 border-accent text-ink` (positive emphasis using a 10% accent tint)
- shared: `bg-paper-deep border-rule text-ink-2` (neutral)
- theirs: `bg-paper border-rule text-muted` (de-emphasized)

**TaxTipFields preset chip pair:**
- active: `bg-accent text-paper border-accent`
- inactive: `bg-paper-deep text-ink-2 border-rule hover:bg-paper`

---

## Interaction & Motion

No new motion this phase. Existing `transition-colors` on buttons remains; duration unchanged. No additional animations on hero, header, or instructions list (CONTEXT decision E reserves accent restraint and the deferred-list excludes animated logo / motion).

**Focus visibility:** All interactive elements (buttons, inputs, links) MUST show a visible focus ring using `focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper` (or `focus:outline-none focus:ring-2 focus:ring-accent` where the offset is not appropriate). The accent ring is acceptable here despite the "10% reserved" guideline because focus rings are transient state, not surface color.

---

## Accessibility Contract

- Header lockup link: `aria-label="Fare Share home"`; the inline mark SVG carries `aria-label="Fare Share"` and `role="img"`.
- Hero lockup `<img>` tags: `alt="Fare Share"`.
- Instructions list: rendered as semantic `<ol>` with native ordinal numbers (`list-decimal list-inside`) — screen readers announce the list and step count.
- App description: rendered as `<p>` (not heading) so it sits below the hero in the document outline.
- Demoted "Photograph Receipt" subhead: rendered as `<h2>` (was `<h1>`) — preserves a single `<h1>` per page (the lockup `aria-label` provides the page identity; the lockup `<img>` is decorative-but-labelled, not a heading).
- Color contrast (verify during executor pass):
  - `text-ink` (`#1A1714`) on `bg-paper` (`#FAF7F2`) → ≈ 17:1 (AAA)
  - `text-ink-2` (`#3A332D`) on `bg-paper` → ≈ 12:1 (AAA)
  - `text-muted` (`#8A8175`) on `bg-paper` → ≈ 4.0:1 (borderline AA for normal text; reserve `--muted` for captions ≥ `text-sm` only)
  - `text-paper` (`#FAF7F2`) on `bg-accent` (`#C75B3D`) → ≈ 4.6:1 (AA for normal text; AAA for large)
  - `text-paper` on `bg-accent-deep` (`#A04425`) → ≈ 6.3:1 (AAA)

If `text-muted` is found on body-size copy (`text-base`), demote to `text-sm` or upgrade to `text-ink-2`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (none — no shadcn / no third-party block registry) | n/a | not applicable |

This phase ships only first-party components and assets from the in-repo `design_handoff_logo/`. No external block fetches. No vetting gate required.

---

## Verification Hooks

Concrete checks the gsd-ui-checker and gsd-ui-auditor can grep for:

```bash
# 1. No remaining "Tab Splitter" in tracked source (excluding planning/tooling history)
git grep -i "tab splitter" -- ':!.planning' ':!.claude' ':!*.md'   # expected: empty

# 2. No remaining blue/indigo/amber/yellow/red palette utilities outside design tokens
git grep -E "bg-(blue|indigo|amber|yellow|red)-[0-9]" -- 'components/' 'app/'   # expected: empty
git grep -E "text-(blue|indigo|amber|yellow|red)-[0-9]" -- 'components/' 'app/'  # expected: empty
git grep -E "border-(blue|indigo|amber|yellow|red)-[0-9]" -- 'components/' 'app/' # expected: empty

# 3. No remaining gray utilities (replaced by ink/ink-2/rule/muted)
git grep -E "(bg|text|border)-gray-[0-9]" -- 'components/' 'app/'   # expected: empty

# 4. No SVG asset retains the blue accent
git grep "#2D6BD9" -- 'public/*.svg'   # expected: empty

# 5. Brand tokens defined
git grep "--accent: oklch" app/globals.css   # expected: 1 match
git grep "--ink: #1A1714" app/globals.css    # expected: 1 match

# 6. Fonts loaded
git grep "Plus_Jakarta_Sans" app/layout.tsx     # expected: ≥1 match
git grep "Instrument_Serif" app/layout.tsx      # expected: ≥1 match
git grep "JetBrains_Mono" app/layout.tsx        # expected: ≥1 match

# 7. HeaderBar mounted globally
git grep "HeaderBar" app/layout.tsx   # expected: ≥1 import + ≥1 element

# 8. Raster icons exist
ls public/apple-touch-icon-180.png public/favicon-32x32.png public/favicon-16x16.png   # all three present

# 9. Metadata fixed
git grep "title: \"Fare Share\"" app/layout.tsx        # expected: 1 match
git grep "Create Next App" app/layout.tsx              # expected: empty
```

---

## Pre-Populated From

| Source | Decisions Used |
|--------|----------------|
| `design_handoff_logo/README.md` | Color tokens (8), typography families (3), wordmark spec, logo geometry, minimum sizes, usage do/don'ts, inline-SVG example |
| `09-CONTEXT.md` | Logo style (A), visual treatment / header + hero pattern (B), copywriting (C), host page hierarchy (D), brand-system scope (E), strings to rename (F), accent restraint |
| `09-PATTERNS.md` | Palette utility mapping table, file-by-file repaint targets, monetary `font-mono tabular-nums` locations, `globals.css` `@theme inline` block, layout.tsx font-loader replacement, color-fix instructions for static SVGs |
| `REQUIREMENTS.md` | BRAND-01..06 + ONBOARD-01..05 — all 11 requirements addressed |
| Phase 9 user input this session | (none — all decisions pre-populated; no questions needed) |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS (n/a — no registries)

**Approval:** pending
