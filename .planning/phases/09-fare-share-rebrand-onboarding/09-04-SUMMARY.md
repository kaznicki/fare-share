---
phase: 09-fare-share-rebrand-onboarding
plan: 04
status: complete
completed: 2026-05-05
executor: orchestrator-inline (sequential, after 09-03)
commits:
  - a479136 feat(09-04): insert guest onboarding copy — description + 4-step instructions
  - aa2ada3 feat(09-04): rename Tab Splitter → Fare Share across source tree
requirements:
  - BRAND-01
  - ONBOARD-03
  - ONBOARD-04
---

# Plan 09-04 — Guest Onboarding Copy + Final String Sweep

## What was built

### JoinForm onboarding insertion (ONBOARD-03 + ONBOARD-04)

Replaced the placeholder comment that 09-03 reserved between the hero lockup and the join card with two JSX blocks (verbatim per UI-SPEC):

```tsx
<p className="text-center text-ink-2 text-base mb-4">
  Fare Share splits a restaurant bill by the items each person ordered.
</p>

<ol className="text-sm text-ink-2 mb-6 space-y-2 list-decimal list-inside">
  <li>Enter your name to join.</li>
  <li>Tap any item you ordered.</li>
  <li>Tap shared items to split them with others.</li>
  <li>When the host finalizes, you&apos;ll see exactly what you owe.</li>
</ol>
```

DOM order on the guest join page: HeaderBar → hero lockup → description `<p>` → instruction `<ol>` → join card with "Join the table" heading + name input + Join button.

Hero `<div>`, card `<div>`, form, input, and Join button all preserved verbatim from 09-03's output.

### Five-site string-rename sweep (BRAND-01)

| File | Line | Before | After |
|---|---|---|---|
| `package.json` | 2 | `"name": "tab-splitter"` | `"name": "fare-share"` |
| `server.ts` | 225 | `console.log(\`> Tab Splitter ready on http://localhost:${port}\`)` | `console.log(\`> Fare Share ready on http://localhost:${port}\`)` |
| `types/index.ts` | 1 | `// Canonical domain types for Tab Splitter.` | `// Canonical domain types for Fare Share.` |
| `lib/bill-split.ts` | 1 | `// Bill-splitting math engine for Tab Splitter.` | `// Bill-splitting math engine for Fare Share.` |
| `README.md` | — | (already canonical Fare Share per pre-phase scan) | no change needed |

## Verification

- ✓ Task 1 verify (JoinForm): 13/13 checks pass — description + ol present, hero + card untouched, no `space-y-1.5`, no curly apostrophe, comment placeholder consumed
- ✓ Task 2 verify (renames): 9/9 checks pass — all five sites renamed, no remaining "Tab Splitter" or "tab-splitter" in tracked source
- ✓ Final BRAND-01 sweep: `git grep -i "tab splitter" -- ':!.planning' ':!.claude' ...` returns no matches
- ✓ Final BRAND-01 sweep (kebab): `git grep "tab-splitter" -- ':!.planning' ...` returns no matches
- ✓ `npm run build` — TypeScript clean, all 7 routes generate

## Final-sweep result

Empty. Zero unexpected "Tab Splitter" occurrences outside the five known rename sites and the excluded-by-CONTEXT planning/teaching directories (`.planning/`, `.claude/`, `lesson-modules/`, `course-structure.json`, `PROJECT_BRIEF.md`, `SUMMARY.md`).

## Deviations

None. Plan executed exactly as written.

## Phase 9 closure

This is the final plan in Phase 9. Combined with prior plans:

- **09-01** wired font loaders + Fare Share metadata in `app/layout.tsx`, vendored brand SVGs + raster icons
- **09-02** defined 8 brand CSS tokens + Tailwind v4 `@theme inline` bridge + `<FareShareLogo />` inline-SVG component
- **09-03** mounted persistent HeaderBar globally, placed hero lockups on host + guest start pages, repainted 10 components to ink/paper/copper palette
- **09-04** inserted guest onboarding copy + final string-rename sweep

Phase requirements fully closed:
- BRAND-01 (rename to Fare Share) — closed across 09-01 (metadata), 09-03 (HeaderBar wordmark), 09-04 (source tree)
- BRAND-02 (logo system) — closed in 09-01 + 09-02
- BRAND-03 (design tokens) — closed in 09-02
- BRAND-04 (icons) — closed in 09-01
- BRAND-05 (full repaint) — closed in 09-03
- BRAND-06 (typography) — closed in 09-01 + 09-02
- ONBOARD-01 (host hero) — closed in 09-03
- ONBOARD-02 (guest hero) — closed in 09-03
- ONBOARD-03 (app description) — closed in 09-04
- ONBOARD-04 (4-step instructions) — closed in 09-04
- ONBOARD-05 (persistent header) — closed in 09-03

PWA installability remains deferred per CONTEXT.
