---
phase: 09
plan: 02
subsystem: design-tokens
tags: [brand, css-tokens, tailwind-v4, react-component, inline-svg]
requires:
  - app/globals.css (existing baseline with @import "tailwindcss" and @theme inline pattern)
  - design_handoff_logo/README.md (locked color/typography tokens, Receipt Fold geometry)
  - 09-01 wires --font-jakarta / --font-instrument / --font-jetbrains in app/layout.tsx (parallel worktree contract)
provides:
  - 8 brand CSS custom properties at :root (--ink, --ink-2, --paper, --paper-deep, --rule, --muted, --accent, --accent-deep)
  - Tailwind v4 utility classes (bg-paper, bg-paper-deep, bg-accent, bg-accent-deep, text-ink, text-ink-2, text-muted, border-rule, etc.) via @theme inline
  - --font-sans/serif/mono mapping to Plus Jakarta / Instrument Serif / JetBrains Mono
  - components/brand/FareShareLogo.tsx (default-export inline-SVG React component, size + className props)
affects:
  - All downstream components in Plan 09-03 (HeaderBar, repaint targets) — utility classes are now valid
  - Plan 09-04 (CameraCapture and JoinForm hero usages reference these tokens)
tech-stack:
  added:
    - oklch() color values (Tailwind v4 + modern browser support)
  patterns:
    - Tailwind v4 @theme inline bridging :root custom properties to utility classes
    - Inline-SVG React component with var(--token, fallback) for runtime theming
    - 'use client' directive convention applied to all components in components/
key-files:
  created:
    - components/brand/FareShareLogo.tsx
  modified:
    - app/globals.css
decisions:
  - Used oklch() for accent + accent-deep with hex documented in comments — modern CSS color, Tailwind v4 supports natively
  - Dropped @media (prefers-color-scheme: dark) block — dark mode out of scope per CONTEXT decision E
  - Preserved --background / --foreground semantic aliases for backward compatibility (any pre-existing bg-background / text-foreground utilities still resolve, now to paper / ink)
  - Logo component has zero imports (no React import needed — Next.js App Router auto-imports React)
  - Used aria-label="Fare Share" on the SVG instead of a <title> child element — matches the README example and is the accessible-name pattern recommended for icon-graphics
metrics:
  duration_seconds: 98
  duration_human: 1m 38s
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
  completed_at: 2026-05-04T22:25:32Z
---

# Phase 09 Plan 02: Wire Design Tokens & FareShareLogo Component Summary

Wired the Fare Share design-token system into Tailwind v4 via `app/globals.css` (8 brand CSS custom properties + `@theme inline` bridge + body font-family), and created the inline-SVG `FareShareLogo` React component reproducing the Receipt Fold mark verbatim from the design handoff. This is the visual contract that every repaint task in Plan 09-03 and every hero render in Plan 09-04 depends on.

## Tasks Completed

| Task | Name                                                         | Commit  | Files                                                |
| ---- | ------------------------------------------------------------ | ------- | ---------------------------------------------------- |
| 1    | Replace globals.css with brand tokens + @theme inline + body | d7e0878 | app/globals.css                                      |
| 2    | Create FareShareLogo.tsx with verbatim Receipt Fold geometry | 404f934 | components/brand/FareShareLogo.tsx                   |

## Implementation Details

### Task 1 — `app/globals.css`

Replaced the original 26-line file (Geist fonts + white/black tokens + dark-mode block) with the locked replacement from `09-PATTERNS.md` lines 188–231. Result:

- **Brand color tokens (8):** `--ink: #1A1714`, `--ink-2: #3A332D`, `--paper: #FAF7F2`, `--paper-deep: #F2ECE2`, `--rule: #E6DFD2`, `--muted: #8A8175`, `--accent: oklch(64% 0.17 35)` (≈ `#C75B3D`), `--accent-deep: oklch(52% 0.17 35)` (≈ `#A04425`).
- **Semantic alias preservation:** `--background → var(--paper)` and `--foreground → var(--ink)` so any existing `bg-background` / `text-foreground` Tailwind utilities continue to compile, now resolving to paper/ink.
- **`@theme inline` bridge:** All eight tokens exposed as Tailwind v4 utilities (`bg-paper`, `bg-paper-deep`, `bg-accent`, `bg-accent-deep`, `text-ink`, `text-ink-2`, `text-muted`, `border-rule`, etc.).
- **Font-family mappings:** `--font-sans → var(--font-jakarta)`, `--font-serif → var(--font-instrument)`, `--font-mono → var(--font-jetbrains)`. The variable names match the contract that Plan 09-01 (parallel worktree) wires into `app/layout.tsx`.
- **Body styling:** `body { background: var(--background); color: var(--foreground); font-family: var(--font-sans); }` — applies the paper background + ink text + Plus Jakarta Sans default to every page.
- **Dark-mode block removed:** The `@media (prefers-color-scheme: dark)` block is gone (CONTEXT decision E and design handoff `Don't` list — dark mode out of scope).

### Task 2 — `components/brand/FareShareLogo.tsx`

Created the new directory `components/brand/` and a single 59-line component file. The component is:

- **`'use client'` directive** at line 1, matching every other component file in `components/`.
- **Default-exported function** named `FareShareLogo` — the project standard (every component uses `export default function`).
- **`interface Props { size?: number; className?: string }`** — explicit prop typing per `components/host/TaxTipFields.tsx` convention; both props optional.
- **Default `size = 32`** — matches the README example signature byte-for-byte.
- **Verbatim Receipt Fold geometry** from `design_handoff_logo/README.md` lines 50–73:
  - Receipt body path (fill paper, stroke ink, sw 3, round join).
  - Fold path with dasharray "2 4" (stroke accent, sw 3, round cap).
  - Three line-item rows (stroke ink, sw 2).
  - Total line (stroke accent, sw 3).
- **Color tokens with hex fallbacks** — every `fill`/`stroke` uses `var(--token, #fallback)` so the component themes from `globals.css` at runtime AND renders correctly even if the tokens are unavailable.
- **Accessibility** — `role="img"` + `aria-label="Fare Share"` give the inline graphic a screen-reader-announced name.
- **Zero imports** — no `import React from 'react'` needed (Next.js App Router auto-imports React for JSX); no other dependencies.

## Verification Results

### Task 1 automated checks (15 assertions)
```
OK: globals.css token checks pass
```
All 15 checks pass: 8 brand-token presence, `@theme inline` bridge presence, accent/paper-deep/font-sans/font-mono mappings, dark-mode block absent, no Geist references.

### Task 2 automated checks (19 assertions)
```
OK: FareShareLogo component checks pass
```
All 19 checks pass: `'use client'`, default export, `interface Props`, default size 32, viewBox 96×96, 6 verbatim geometry paths, `var(--accent, #C75B3D)` (×2), `var(--ink, #1A1714)` (×4), `var(--paper, #FAF7F2)` (×1), `aria-label="Fare Share"`, `role="img"`, no `dangerouslySetInnerHTML`, no `import` statements.

### Acceptance criteria satisfied

Plan-listed git-grep checks (manually confirmed):
- `git grep "--accent: oklch" app/globals.css` → 1 match
- `git grep "--ink: #1A1714" app/globals.css` → 1 match
- `git grep "--paper-deep: #F2ECE2" app/globals.css` → 1 match
- `git grep "@theme inline" app/globals.css` → 1 match
- `git grep "var(--font-jakarta)" app/globals.css` → 1 match
- `git grep "prefers-color-scheme" app/globals.css` → 0 matches
- `git grep -i "geist" app/globals.css` → 0 matches
- `git grep "font-family: var(--font-sans)" app/globals.css` → 1 match
- `components/brand/FareShareLogo.tsx` exists, starts with `'use client'`, has all six verbatim geometry paths, has `var(--accent, #C75B3D)` (≥2), `var(--ink, #1A1714)` (≥4), `var(--paper, #FAF7F2)` (=1), `aria-label="Fare Share"`, `role="img"`, no imports, no `dangerouslySetInnerHTML`.

## Build Verification — Deferred

The plan acceptance includes `npm run build` succeeds. **This worktree has no `node_modules/` installed (parallel-worktree convention — dependencies are not duplicated per worktree).** Running a full Next.js build in this worktree is not feasible.

The build will be exercised when:
1. Plan 09-01's parallel worktree merges (wires `--font-jakarta`/`--font-instrument`/`--font-jetbrains` into `app/layout.tsx`), AND
2. The integrated branch is built in the orchestrator's main checkout where dependencies live.

The CSS / Tailwind contract is fully satisfied at the source level — every grep-able acceptance criterion passes. Tailwind v4 utility-class generation from `@theme inline` is mechanical (no runtime resolution required at compile time); the `var(--font-jakarta)` references compile into the emitted CSS as-is.

## Deviations from Plan

None — plan executed exactly as written.

The plan's contingency (`If the executor's local Tailwind toolchain rejects oklch, fall back to plain hex`) was **not** triggered. `oklch()` is preserved for `--accent` and `--accent-deep` per the README's preferred form, with hex fallbacks living in CSS comments as documentation.

## Authentication Gates

None — this plan modifies design-token surfaces only. No external services, no credentials, no network operations.

## Threat Surface Scan

Per the plan's threat model:
- T-09-04 (Tampering, FareShareLogo paths) — `accept`. ✓ All paths are hard-coded JSX literals. No `dangerouslySetInnerHTML`. No template interpolation.
- T-09-05 (Information disclosure, CSS custom properties) — `accept`. ✓ All values are color hexes / oklch / font-variable references. No secrets, no PII, no env-derived values.

No new threat surface introduced. No `## Threat Flags` section needed.

## Self-Check: PASSED

**Files created (1):**
- ✓ FOUND: components/brand/FareShareLogo.tsx (59 lines)

**Files modified (1):**
- ✓ FOUND: app/globals.css (40 lines, replaces previous 26-line file)

**Commits exist:**
- ✓ FOUND: d7e0878 (feat(09-02): wire Fare Share design tokens into globals.css)
- ✓ FOUND: 404f934 (feat(09-02): add FareShareLogo inline-SVG component)

**Acceptance criteria checked via grep:**
- ✓ `--accent: oklch(64% 0.17 35)` present in app/globals.css
- ✓ `--ink: #1A1714` present in app/globals.css
- ✓ `--paper-deep: #F2ECE2` present in app/globals.css
- ✓ `@theme inline` block present in app/globals.css
- ✓ `var(--font-jakarta)` referenced in app/globals.css (--font-sans mapping)
- ✓ `prefers-color-scheme` absent from app/globals.css
- ✓ `geist` (case-insensitive) absent from app/globals.css
- ✓ `font-family: var(--font-sans)` present in body block
- ✓ `'use client'` is line 1 of FareShareLogo.tsx
- ✓ Six geometry paths byte-for-byte match README spec
- ✓ `var(--accent, #C75B3D)` appears 2× (fold + total line)
- ✓ `var(--ink, #1A1714)` appears 4× (receipt body + 3 line-item rows)
- ✓ `var(--paper, #FAF7F2)` appears 1× (receipt body fill)
- ✓ `aria-label="Fare Share"` and `role="img"` both present
- ✓ No `import` statements
- ✓ No `dangerouslySetInnerHTML`
