# Phase 09: Fare Share Rebrand & Guest Onboarding — Pattern Map

**Mapped:** 2026-05-02
**Files analyzed:** 22 (3 new, 12 modified components, 6 modified config/string-rename targets, 1 new CSS-token block)
**Analogs found:** 22 / 22

---

## Pre-Locked Design Tokens (verbatim from `design_handoff_logo/README.md`)

These values are **not** to be re-derived. Copy verbatim into `app/globals.css`:

| Token | Hex Fallback | OKLCH (preferred) | Use |
|---|---|---|---|
| `--ink` | `#1A1714` | n/a (use hex) | Primary stroke, body text, dark surfaces |
| `--ink-2` | `#3A332D` | n/a (use hex) | Secondary text |
| `--paper` | `#FAF7F2` | n/a (use hex) | Page background, receipt body, light fills |
| `--paper-deep` | `#F2ECE2` | n/a (use hex) | Card backgrounds, secondary surfaces |
| `--rule` | `#E6DFD2` | n/a (use hex) | Borders, hairlines |
| `--muted` | `#8A8175` | n/a (use hex) | Tertiary text, captions |
| `--accent` | `#C75B3D` | `oklch(64% 0.17 35)` | Logo fold, totals, primary CTA |
| `--accent-deep` | `#A04425` | `oklch(52% 0.17 35)` | Hover/pressed accent state |

**Type families** (load via `next/font/google` in `app/layout.tsx`):
- **Plus Jakarta Sans** — UI + wordmark, weights 400/500/600/700
- **Instrument Serif** — editorial display, regular + italic
- **JetBrains Mono** — prices, codes, tabular nums, weights 500/600

**Wordmark:** "Fare Share" (title case, normal space, no ligature), Plus Jakarta Sans 700, letter-spacing `-0.02em`

**Logo min sizes:** mark 24×24 px, lockup 120 px wide

**CRITICAL — SVG asset palette discrepancy:** The shipped SVGs in `design_handoff_logo/assets/` use `#2D6BD9` (blue) on the fold path and total line. The README spec **overrides** this — the accent must render as copper `#C75B3D`. When integrating: either (a) use inline-SVG components with `var(--accent, #C75B3D)` per the README's `FareShareLogo` example, or (b) edit the static `.svg` files in `public/` to swap `#2D6BD9` → `#C75B3D` before shipping. **Do not ship the SVGs unmodified.**

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `components/brand/FareShareLogo.tsx` (new) | presentation (inline-SVG component) | static render, no props beyond `size`/`className` | `components/host/TaxTipFields.tsx` (small `'use client'` presentational with named props) + README's verbatim `FareShareLogo` example | exact (README provides the literal JSX) |
| `components/brand/HeaderBar.tsx` (new) | layout / chrome wrapper | static render, no state | `components/host/ShareScreen.tsx` (centered card layout w/ Tailwind utilities) — no existing persistent shell, so reuse the project's `'use client'` + Tailwind container conventions | role-match (no header chrome exists yet) |
| `app/globals.css` (modified) | config / theme | CSS custom-properties + Tailwind v4 `@theme inline` | self (lines 3–13 already define `:root` + `@theme inline` block) | exact |
| `app/layout.tsx` (modified) | config / root layout | `next/font/google` loader + `<Metadata>` | self (lines 2–13 already use the same `next/font/google` pattern for Geist) | exact |
| `components/host/CameraCapture.tsx` (modified) | presentation (host start screen) | hero + subhead demotion + palette repaint | self (current structure: `<h1>` + `<p>` + `<button bg-blue-600>`) | exact |
| `components/session/JoinForm.tsx` (modified) | presentation (guest start screen) | hero + app description + 4-step instructions + palette repaint | self (line 19–42) — already a max-w-sm card form | exact |
| `components/host/OcrReview.tsx` (modified) | presentation | palette repaint only | self | exact |
| `components/host/ShareScreen.tsx` (modified) | presentation | palette repaint (note: `bg-indigo-600` → `bg-[--accent]` on "Join as host") | self | exact |
| `components/host/TaxTipFields.tsx` (modified) | presentation | palette repaint (tip preset chips, focus rings) | self | exact |
| `components/host/ItemRow.tsx` (modified) | presentation | palette repaint (focus borders, delete `text-red-400`) | self | exact |
| `components/session/SessionRoom.tsx` (modified) | presentation | palette repaint (`bg-indigo-600` Finalize button, `bg-yellow-50` reconnect banner) | self | exact |
| `components/session/ClaimableItem.tsx` (modified) | presentation | palette repaint — claim states (mine/shared/theirs) need new token-based pairs | self | exact |
| `components/session/SummaryScreen.tsx` (modified) | presentation | palette repaint (`text-indigo-600` total → `text-[--accent]`) | self | exact |
| `components/session/UnclaimedModal.tsx` (modified) | presentation | palette repaint (`bg-indigo-600` primary, `bg-black/50` overlay) | self | exact |
| `package.json` (modified) | config / metadata | string rename (`name` field) | self | exact |
| `README.md` (modified) | docs | already done — verify | self (already says "Fare Share") | n/a |
| `server.ts` (modified) | infra / log strings | string rename (line 225 console.log) | self | exact |
| `types/index.ts` (modified) | config / type defs | JSDoc string rename (line 1 comment) | self | exact |
| `lib/bill-split.ts` (modified) | infra / lib | JSDoc string rename (line 1 comment) — discovered during scan | self | exact |
| `public/favicon.svg` (new — copy from `design_handoff_logo/assets/`) | asset | static file | `public/next.svg` (existing pattern) | exact |
| `public/logo-receipt-fold.svg`, `public/logo-lockup.svg`, etc. (new — copy from handoff) | asset | static file | `public/next.svg` | exact |
| `public/apple-touch-icon-180.png`, `public/favicon-32x32.png`, `public/favicon-16x16.png` (new — generate from `app-icon-512.svg`) | asset | static file | none — first raster fallbacks in this project | no analog |

---

## Pattern Assignments

### `components/brand/FareShareLogo.tsx` (NEW — presentation, inline SVG)

**Analog:** `design_handoff_logo/README.md` lines 139–154 (literal verbatim example) + `components/host/TaxTipFields.tsx` lines 1–13 (project conventions: `'use client'` directive, named-export `default function`, `interface Props`).

**Geometry source of truth:** `design_handoff_logo/README.md` lines 50–73 (paths, stroke widths, dasharray) AND `design_handoff_logo/assets/logo-receipt-fold.svg` (verify path values match).

**Verbatim React pattern from README** (lines 139–154):
```jsx
export function FareShareLogo({ size = 32, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className={className} aria-label="Fare Share">
      <path d="M22 10 L22 78 L28 74 L34 78 L40 74 L46 78 L52 74 L58 78 L64 74 L70 78 L70 10 Z"
        fill="var(--paper, #FAF7F2)" stroke="var(--ink, #1A1714)" strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 6 L46 82"
        stroke="var(--accent, #C75B3D)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 4" />
      <path d="M28 24 L40 24 M52 24 L64 24" stroke="var(--ink, #1A1714)" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 34 L42 34 M52 34 L62 34" stroke="var(--ink, #1A1714)" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 44 L38 44 M52 44 L64 44" stroke="var(--ink, #1A1714)" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 58 L42 58 M52 58 L64 58" stroke="var(--accent, #C75B3D)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
```

**Project conventions to apply** (so it matches the rest of the codebase):
- Add `'use client'` is **not required** for a pure stateless render — project convention shows `'use client'` only when hooks are used (compare `ClaimableItem.tsx` line 1 — no `'use client'` because no hooks used. Wait — actually `ClaimableItem.tsx` does have `'use client'` line 1). Project default: include `'use client'` directive on every component file (e.g. `TaxTipFields.tsx:1`, `UnclaimedModal.tsx:1`, `ClaimableItem.tsx:1`). **Match that convention.**
- Use TypeScript `interface Props { size?: number; className?: string }` — see `TaxTipFields.tsx:5–11` for the pattern.
- Use **default export** (project standard — every component file in `components/` uses `export default function`).
- Import path alias: `@/types`, `@/components/...` (see `OcrReview.tsx:3–5`).
- Add a `<title>` element child of the `<svg>` (or the `aria-label` attribute already shown) for accessibility.

**Suggested file** (already aligned):
```tsx
'use client'

interface Props {
  size?: number
  className?: string
}

export default function FareShareLogo({ size = 32, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none"
         className={className} aria-label="Fare Share" role="img">
      {/* ...verbatim paths from README example above... */}
    </svg>
  )
}
```

**Optional sibling component — `FareShareLockup.tsx`** (mark + wordmark side-by-side). Since the lockup includes a `<text>` element rendered with Plus Jakarta Sans 700 (see `design_handoff_logo/assets/logo-lockup.svg:10`), the cleanest path is to **render the `/logo-lockup.svg` static asset via `<img>`** (see README "<img> reference" lines 156–160) instead of inlining text-with-font into JSX. The planner should choose: inline-SVG mark for header, `<img src="/logo-lockup.svg">` for hero — but **the lockup SVG must be edited to swap `#2D6BD9` → `#C75B3D` first** OR the lockup must be re-implemented as inline SVG with token-driven colors.

---

### `components/brand/HeaderBar.tsx` (NEW — layout chrome)

**Analog:** No existing persistent header in the codebase. Closest analog for a self-contained "card-like wrapper at fixed position" pattern is `SessionRoom.tsx` lines 185–204 (the `fixed bottom-0` footer bar). Apply that pattern *inverted* (top-of-screen, full width, paper background).

**Footer-bar pattern from `SessionRoom.tsx:185–204`** (the structural reference):
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
  {/* content left-aligned, optional right slot for actions */}
</div>
```

**Project conventions:**
- `'use client'` at top (every component uses it — `TaxTipFields.tsx:1`).
- `interface Props {}` even when empty, exported default function (`UnclaimedModal.tsx:3–9`).
- Mobile-first Tailwind utilities (no media queries — match `max-w-md mx-auto` pattern from CONTEXT line 81).
- Constraint from CONTEXT decision B: lockup left-aligned, lockup ≥ 120 px wide, paper background, "leave room" for future session-id / leave-button slots without adding them now.

**Suggested structure:**
```tsx
'use client'
import Link from 'next/link'

interface Props {
  variant?: 'compact' | 'hero'  // 'hero' renders larger lockup; 'compact' renders mark + wordmark sized for header
}

export default function HeaderBar({ variant = 'compact' }: Props) {
  return (
    <header className="w-full bg-[--paper] border-b border-[--rule] px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" aria-label="Fare Share home">
          {/* lockup at min 120px wide per design min-size rule */}
          <img src="/logo-lockup.svg" alt="Fare Share" className="h-8 w-auto" />
        </Link>
        {/* right slot reserved (empty now) for session-id / leave button */}
      </div>
    </header>
  )
}
```

**Mount point:** `app/layout.tsx` `<body>` directly above `{children}` so it appears on every screen (host capture, OCR review, share, join, session, summary). Per CONTEXT decision B: header on **every** screen.

---

### `app/globals.css` (MODIFIED — token system)

**Analog:** self, lines 1–26.

**Existing pattern** (lines 1–13) — keep the `@import` and `@theme inline` block structure:
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

**Replacement pattern** (extend `:root` with brand tokens, swap `@theme` font vars to new families, ensure tokens are exposed as Tailwind utilities):
```css
@import "tailwindcss";

:root {
  /* Brand tokens — verbatim from design_handoff_logo/README.md */
  --ink: #1A1714;
  --ink-2: #3A332D;
  --paper: #FAF7F2;
  --paper-deep: #F2ECE2;
  --rule: #E6DFD2;
  --muted: #8A8175;
  --accent: oklch(64% 0.17 35);       /* fallback: #C75B3D */
  --accent-deep: oklch(52% 0.17 35);  /* fallback: #A04425 */

  /* Semantic mapping — preserve existing names so no global rename of bg-background/foreground is needed */
  --background: var(--paper);
  --foreground: var(--ink);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-paper: var(--paper);
  --color-paper-deep: var(--paper-deep);
  --color-rule: var(--rule);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-deep: var(--accent-deep);

  --font-sans: var(--font-jakarta);
  --font-serif: var(--font-instrument);
  --font-mono: var(--font-jetbrains);
}

/* Drop the dark-mode @media block — out of scope per CONTEXT */
body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}
```

**Result:** Tailwind v4 generates utility classes `bg-paper`, `text-ink`, `bg-accent`, etc. **Use the named utility (`bg-accent`) preferentially over the arbitrary-value form (`bg-[--accent]`)** — both work, but named utilities are idiomatic in Tailwind v4 with `@theme inline`.

**Drop:** the `@media (prefers-color-scheme: dark)` block (lines 15–20) — dark mode is explicitly out of scope per CONTEXT line 109.

---

### `app/layout.tsx` (MODIFIED — fonts + metadata)

**Analog:** self, lines 1–34.

**Existing font-loader pattern** (lines 2–13):
```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

**Replacement** (mirror the same pattern with three families per design tokens):
```tsx
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "600"],
});
```

**Metadata replacement** (lines 15–18 — currently still Next defaults):
```tsx
// BEFORE
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

// AFTER
export const metadata: Metadata = {
  title: "Fare Share",
  description: "Split a restaurant bill by the items each person ordered.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon-180.png",
  },
};
```

**Body className update** (line 27–29):
```tsx
// BEFORE
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

// AFTER (also mount HeaderBar)
<body className={`${jakarta.variable} ${instrument.variable} ${jetbrains.variable} antialiased`}>
  <HeaderBar />
  {children}
</body>
```

---

### `components/host/CameraCapture.tsx` (MODIFIED — host hero + subhead demotion + palette)

**Analog:** self.

**Current heading pattern** (lines 65–68):
```tsx
<h1 className="text-2xl font-bold text-center text-gray-900">Photograph Receipt</h1>
<p className="text-center text-gray-500 text-sm">
  Point your camera at the receipt and tap the button below.
</p>
```

**Replacement pattern per CONTEXT decision D** (hero lockup → demoted "Photograph Receipt" subhead → existing subtitle → button):
```tsx
{/* Hero lockup — larger sizing on start pages per CONTEXT decision B */}
<div className="flex justify-center pt-6 pb-4">
  <img src="/logo-lockup.svg" alt="Fare Share" className="h-16 w-auto" />
</div>

{/* Demoted subhead — was h1 text-2xl font-bold; now h2-equivalent, smaller */}
<h2 className="text-base font-semibold text-center text-ink-2">Photograph Receipt</h2>

{/* Existing subtitle — palette swap only */}
<p className="text-center text-muted text-sm">
  Point your camera at the receipt and tap the button below.
</p>
```

**Button repaint** (line 85):
```tsx
// BEFORE
className="w-full py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors"

// AFTER
className="w-full py-4 bg-accent text-paper text-lg font-semibold rounded-xl hover:bg-accent-deep active:bg-accent-deep transition-colors"
```

**Submit button repaint** (line 128): same `bg-blue-600`→`bg-accent` swap.

**Error banner repaint** (lines 93–102): `bg-amber-50` → `bg-paper-deep`, `border-amber-200` → `border-rule`, `text-amber-800` → `text-ink`, `text-amber-700` → `text-accent` (for the underline link, since the accent is reserved for high-emphasis cues).

**Retake button** (line 120): `border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100` → `border-rule text-ink hover:bg-paper-deep active:bg-paper-deep`.

---

### `components/session/JoinForm.tsx` (MODIFIED — hero + description + instructions + palette)

**Analog:** self.

**Current structure** (lines 18–42) — single card with title + form. **Replacement structure per CONTEXT decision C** (above-form additions in this exact order):

```tsx
return (
  <div className="max-w-sm mx-auto w-full">
    {/* Hero lockup */}
    <div className="flex justify-center pt-6 pb-4">
      <img src="/logo-lockup.svg" alt="Fare Share" className="h-16 w-auto" />
    </div>

    {/* App description — concise/utilitarian copy from CONTEXT decision C */}
    <p className="text-center text-ink-2 text-base mb-4">
      Fare Share splits a restaurant bill by the items each person ordered.
    </p>

    {/* Usage instructions — verbatim copy from CONTEXT decision C */}
    <ol className="text-sm text-ink-2 mb-6 space-y-1.5 list-decimal list-inside">
      <li>Enter your name to join.</li>
      <li>Tap any item you ordered.</li>
      <li>Tap shared items to split them with others.</li>
      <li>When the host finalizes, you&apos;ll see exactly what you owe.</li>
    </ol>

    {/* Existing card — palette repaint only */}
    <div className="bg-paper-deep rounded-2xl shadow-md p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center text-ink">Join the table</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full py-3 px-4 rounded-xl border border-rule text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3 px-4 rounded-xl bg-accent text-paper font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          Join
        </button>
      </form>
    </div>
  </div>
)
```

**Copy is verbatim** — do not paraphrase the four bullet points.

---

### Palette Repaint — Other Components (concrete old → new mapping)

These components need only utility-class swaps. Apply this consistent mapping:

| Current Class | New Class | Notes |
|---|---|---|
| `bg-blue-600` | `bg-accent` | Primary CTA |
| `bg-blue-700` (hover) | `bg-accent-deep` | Hover state |
| `bg-blue-800` (active) | `bg-accent-deep` | Pressed state |
| `bg-blue-300` (disabled) | `bg-accent opacity-50` (or keep `disabled:opacity-50`) | Use opacity, not separate color |
| `bg-blue-50` (hover light) | `bg-paper-deep` | Subtle hover surface |
| `border-blue-400`, `border-blue-600` | `border-accent` | |
| `text-blue-700` | `text-accent` | |
| `focus:ring-blue-500` | `focus:ring-accent` | Focus ring |
| `bg-indigo-600` | `bg-accent` | Same accent (was inconsistent old palette) |
| `bg-indigo-700` | `bg-accent-deep` | |
| `text-indigo-600` | `text-accent` | Used on Total in `SummaryScreen.tsx:42,43,61,62` |
| `bg-white` | `bg-paper-deep` (cards) or `bg-paper` (page bg) | Cards = paper-deep per CONTEXT line 82 |
| `bg-gray-50` | `bg-paper-deep` | Subtle surface |
| `bg-gray-100` (active) | `bg-paper-deep` | |
| `text-gray-900` | `text-ink` | Primary text |
| `text-gray-800` | `text-ink` | |
| `text-gray-700` | `text-ink-2` | Secondary text |
| `text-gray-600` | `text-ink-2` | |
| `text-gray-500` | `text-muted` | Captions |
| `text-gray-400` | `text-muted` | Tertiary |
| `border-gray-100` | `border-rule` | Hairline |
| `border-gray-200` | `border-rule` | |
| `border-gray-300` | `border-rule` | |
| `border-gray-400` | `border-muted` | Editing input bottom-border (`ItemRow.tsx:25,69`) |
| `bg-amber-50` | `bg-paper-deep` | Warning banner |
| `border-amber-200` | `border-accent` | Warning border (use accent for emphasis) |
| `text-amber-800` | `text-ink` | Warning text |
| `text-amber-700` | `text-accent` | Warning link |
| `bg-yellow-50` | `bg-paper-deep` | Reconnect banner (`SessionRoom.tsx:167`) |
| `border-yellow-200` | `border-accent` | |
| `text-yellow-800` | `text-ink` | |
| `bg-red-50` | `bg-paper-deep` | Error banner (`OcrReview.tsx:64`) |
| `border-red-200` | `border-accent` | |
| `text-red-800` | `text-ink` | |
| `text-red-600`, `text-red-500` | `text-accent` | Error text — accent does double-duty since palette has no dedicated red |
| `text-red-400`, `hover:text-red-600` (delete X) | `text-muted hover:text-accent` | (`ItemRow.tsx:90`) |
| `bg-green-50`, `border-green-200` (mine state in `ClaimableItem.tsx:31`) | `bg-paper-deep border-accent` (or use a pale accent tint via `bg-accent/10`) | Mine-claim state — should read as positive emphasis |
| `bg-blue-50`, `border-blue-200` (shared state in `ClaimableItem.tsx:30`) | `bg-paper-deep border-rule` (or `bg-accent/5 border-accent/30`) | Shared state |
| `bg-gray-50`, `border-gray-200` (theirs/default) | `bg-paper border-rule` | |

**Files affected by palette repaint** (all already listed in classification table — per the Grep above, total of 88 utility-class occurrences across 10 component files):
- `components/host/ItemRow.tsx` (7 occurrences)
- `components/host/TaxTipFields.tsx` (9 — note the active/inactive tip-preset chip pair on lines 47–50)
- `components/host/ShareScreen.tsx` (7)
- `components/host/OcrReview.tsx` (6)
- `components/host/CameraCapture.tsx` (8)
- `components/session/JoinForm.tsx` (2)
- `components/session/ClaimableItem.tsx` (7 — the mine/shared/theirs state pairs)
- `components/session/UnclaimedModal.tsx` (4)
- `components/session/SessionRoom.tsx` (10)
- `components/session/SummaryScreen.tsx` (28 — the largest target; many `text-gray-*` and `text-indigo-600`)

**Apply tabular-nums + JetBrains Mono to prices** — per design spec, prices/codes use JetBrains Mono. Locations:
- `SummaryScreen.tsx:31,35,39,43,50,54,58,62,80,86` — `tabular-nums` already set; add `font-mono` (which now resolves to JetBrains Mono via the @theme update).
- `SessionRoom.tsx:191` — Your total span; add `font-mono tabular-nums`.
- `ClaimableItem.tsx:53` — split price; add `font-mono tabular-nums`.
- `TaxTipFields.tsx:75` — Total span; add `font-mono tabular-nums`.
- `ItemRow.tsx:81` — price display span; add `font-mono tabular-nums`.

---

## String-Rename Targets (precise line-level grep-verifiable changes)

| File | Line | Current | Target |
|---|---|---|---|
| `package.json` | 2 | `"name": "tab-splitter",` | `"name": "fare-share",` |
| `server.ts` | 225 | `console.log(\`> Tab Splitter ready on http://localhost:${port}\`)` | `console.log(\`> Fare Share ready on http://localhost:${port}\`)` |
| `types/index.ts` | 1 | `// Canonical domain types for Tab Splitter.` | `// Canonical domain types for Fare Share.` |
| `lib/bill-split.ts` | 1 | `// Bill-splitting math engine for Tab Splitter.` | `// Bill-splitting math engine for Fare Share.` |
| `app/layout.tsx` | 16–17 | `title: "Create Next App", description: "Generated by create next app",` | `title: "Fare Share", description: "Split a restaurant bill by the items each person ordered.",` |
| `README.md` | (entire file) | already says "Fare Share" — verified | no change |

**Out-of-scope renames** (do not change — internal symbols only):
- `.planning/**` (history, decisions, prior milestones)
- `.claude/worktrees/**` (sandboxed copies)
- `SUMMARY.md` (untracked, not user-facing)
- Type names like `TabSplitter*` if any exist (none found in the search; verify during execution)
- Function names, variable names

**Acceptance check** (planner can convert directly into a verification step):
```bash
# Should return zero matches in tracked source files (excluding .planning/, .claude/, .git/)
git grep -i "tab splitter" -- ':!.planning' ':!.claude' ':!*.md'
# Expected: empty
```

---

### `public/` Asset Drop

**Analog:** existing `public/next.svg`, `public/vercel.svg` etc. (line-level: not applicable — these are bare SVG files).

**Files to copy from `design_handoff_logo/assets/`**:
- `logo-receipt-fold.svg` → `public/logo-receipt-fold.svg`
- `logo-receipt-fold-mono.svg` → `public/logo-receipt-fold-mono.svg`
- `logo-receipt-fold-reverse.svg` → `public/logo-receipt-fold-reverse.svg`
- `logo-lockup.svg` → `public/logo-lockup.svg`
- `app-icon-512.svg` → `public/app-icon-512.svg`
- `favicon.svg` → `public/favicon.svg`

**CRITICAL pre-process step:** All six SVGs currently contain `stroke="#2D6BD9"` (blue) on the fold path and total line. The README spec mandates accent = `#C75B3D` copper. Before copying to `public/`, **either**:
1. Edit each SVG to swap `#2D6BD9` → `#C75B3D` (simple text replacement; 2 occurrences per file), OR
2. Edit each SVG to use `var(--accent)` with hex fallback (e.g., `stroke="var(--accent, #C75B3D)"`) — works in inline SVG but **not** when referenced via `<img>` (CSS variables don't resolve through `<img>` boundary). So option 1 is the pragmatic choice for static-file assets, option 2 only works for inline-SVG components.

**Raster fallbacks to generate** (no analog — first time):
- `public/apple-touch-icon-180.png` (180×180, from `app-icon-512.svg`)
- `public/favicon-32x32.png` (32×32, from `app-icon-512.svg`)
- `public/favicon-16x16.png` (16×16, from `app-icon-512.svg`)

Tools per README line 41: `sharp`, ImageMagick, Inkscape, or `npx pwa-asset-generator`. Keep rounded corners (do not trim).

**Reference in `app/layout.tsx`** — see metadata block above (already specified).

---

## Shared Patterns

### Component file conventions
**Source:** Every component in `components/` (e.g., `TaxTipFields.tsx:1–13`)
**Apply to:** `FareShareLogo.tsx`, `HeaderBar.tsx`
```tsx
'use client'
// optional: imports from '@/types', '@/components/...', '@/lib/...'

interface Props {
  // explicit prop types
}

export default function ComponentName({ ...props }: Props) {
  // ...
  return ( /* JSX */ )
}
```

### Mobile-first container shell
**Source:** CONTEXT.md line 81 (carry-forward pattern)
**Apply to:** Any new screen-level wrapper, including `JoinForm.tsx` outermost div, `CameraCapture.tsx` outermost div
```tsx
className="min-h-screen flex flex-col items-center justify-start max-w-md mx-auto px-4 pt-safe pb-safe"
```

### Card pattern (post-repaint)
**Source:** CONTEXT.md line 82
**Apply to:** All card surfaces (was `bg-white` — now `bg-paper-deep`)
```tsx
className="bg-paper-deep rounded-2xl shadow-md p-6"
```

### Token-based palette utilities (Tailwind v4 with `@theme inline`)
**Source:** Updated `app/globals.css` `@theme inline` block (above)
**Apply to:** All component repaints
- Prefer named utilities (`bg-accent`, `text-ink`, `border-rule`) over arbitrary-value form (`bg-[--accent]`).
- Both are valid; named is idiomatic.

### Accent restraint
**Source:** README usage guideline line 131; CONTEXT.md decision E line 62
**Apply to:** All components doing repaint
- `--accent` reserved for: primary CTAs, "Total" amounts, the dashed fold in the logo, error/warning emphasis (replacing red).
- **Not** a flood color — do not use as background for cards, banners, or large surfaces. Use `--paper-deep` for those, with `--accent` borders or text where emphasis is needed.

### Header bar mounted globally
**Source:** CONTEXT.md decision B (every screen gets the header)
**Apply to:** `app/layout.tsx` body — mount `<HeaderBar />` directly above `{children}` so all six screens get it.

### Hero on start pages only
**Source:** CONTEXT.md decision B
**Apply to:** `CameraCapture.tsx` (host start), `JoinForm.tsx` (guest start) — these get the lockup at hero size (~`h-16` or larger). Other screens rely on the global `HeaderBar` only.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `public/apple-touch-icon-180.png`, `favicon-32x32.png`, `favicon-16x16.png` | asset (raster) | static file | First raster fallbacks in this project — no prior `.png` icons. Generation pattern documented in `design_handoff_logo/README.md` lines 36–44. |
| `components/brand/HeaderBar.tsx` (persistent header chrome) | layout | static | No persistent header exists in the codebase today. The footer-bar pattern in `SessionRoom.tsx:185–204` is the closest structural analog (fixed-position full-width strip). The new component re-uses that approach inverted to top-of-screen. |

---

## Metadata

**Analog search scope:** `components/`, `app/`, `lib/`, `public/`, `design_handoff_logo/`
**Files scanned:** 14 source files + 6 SVG assets + 4 config/string-rename targets
**Files read in full:** `app/layout.tsx`, `app/globals.css`, all 10 components in `components/host/` and `components/session/`, `package.json`, `README.md`, `server.ts`, `types/index.ts`, `lib/bill-split.ts` (head only), 2 SVG assets
**Pattern extraction date:** 2026-05-02
**Phase directory:** `.planning/phases/09-fare-share-rebrand-onboarding/`
