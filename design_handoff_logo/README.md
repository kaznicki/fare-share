# Handoff: Fare Share — Logo

## Overview

Logo system for **Fare Share**, a web app that lets diners photograph a restaurant bill, run it through OCR, and share the line items via link or QR code. Each guest claims items, and the app calculates per-person totals.

The chosen mark is **"Receipt Fold"** — a stylized receipt with a perforated/dashed fold down the centerline. The fold reads as both *a tear-line* and *the act of dividing*, which mirrors what the app does to a bill. It is approachable, literal, restaurant-adjacent, and crisp at favicon sizes.

---

## About the Design Files

Everything in `reference/` is a **design reference created in HTML**, not production code. The HTML prototypes were used to explore and present concepts; the SVGs in `assets/` are the actual deliverables.

Your job is to **integrate this logo into the Fare Share codebase** using whatever framework/conventions the codebase already uses (React component, Vue SFC, Svelte, plain `<img>`, native asset, etc.). If no codebase exists yet, choose the most appropriate framework for the project and drop the SVG in.

## Fidelity

**High-fidelity.** Exact colors, geometry, stroke weights, and typography are specified below and embodied in the provided SVG files. Reproduce them precisely.

---

## Deliverables

All files live in `assets/`.

| File | Use |
|---|---|
| `logo-receipt-fold.svg` | **Primary mark.** Color, transparent background. 96×96 viewBox. Use this everywhere the brand mark stands alone. |
| `logo-receipt-fold-mono.svg` | **Monochrome.** Single-color (ink) version for places where the accent can't render — print, embossing, single-color contexts. Transparent bg. |
| `logo-receipt-fold-reverse.svg` | **Reverse.** Mark on dark ink background. Use on dark UI surfaces. |
| `logo-lockup.svg` | **Horizontal lockup** — mark + "Fare Share" wordmark side-by-side. Use in headers, footers, signup screens, marketing. 420×120 viewBox. |
| `app-icon-512.svg` | **App / install icon.** 512×512 with rounded-rect accent background and the mark reversed out in paper. Source for generating PWA / iOS / Android icons. |
| `favicon.svg` | **Favicon.** Same as primary mark, optimized for tiny sizes. Reference as `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`. |

### Generating raster sizes

For PWA / iOS / Android, raster the `app-icon-512.svg` at:
- **PWA**: 192×192, 512×512, 192×192 maskable, 512×512 maskable
- **iOS**: 180×180 (apple-touch-icon)
- **Android**: 192×192, 512×512
- **Favicon fallback**: 32×32, 16×16 PNG

Any vector tool works — `sharp`, ImageMagick, Inkscape, or `npx pwa-asset-generator`. Keep the rounded corners; **do not** trim them.

---

## The Mark (Receipt Fold) — Geometry

Drawn in a **96×96 viewBox**. Single-weight outline.

### Receipt body
- Rectangular receipt with a **scalloped/zig-zag bottom edge** simulating a torn paper edge.
- Path: `M22 10 L22 78 L28 74 L34 78 L40 74 L46 78 L52 74 L58 78 L64 74 L70 78 L70 10 Z`
- Fill: **Paper** `#FAF7F2`
- Stroke: **Ink** `#1A1714`, **stroke-width 3**, `stroke-linejoin: round`

### The fold (the "share" cut)
- Vertical dashed line down the center, **slightly overshooting** the receipt top and bottom (extends 4px past).
- Path: `M46 6 L46 82`
- Stroke: **Accent** `oklch(64% 0.17 35)` (≈ `#C75B3D`), **stroke-width 3**, `stroke-linecap: round`, `stroke-dasharray: 2 4`

### Line items
Two columns of short horizontal lines on either side of the fold, three rows:
- Row 1: `M28 24 L40 24 M52 24 L64 24`
- Row 2: `M28 34 L42 34 M52 34 L62 34`
- Row 3: `M28 44 L38 44 M52 44 L64 44`
- Stroke: **Ink** `#1A1714`, **stroke-width 2**, `stroke-linecap: round`

### Total line
A heavier, accent-colored line near the bottom representing the total:
- Path: `M28 58 L42 58 M52 58 L64 58`
- Stroke: **Accent** `#C75B3D`, **stroke-width 3**, `stroke-linecap: round`

---

## Design Tokens

### Colors

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1A1714` | Primary stroke, text, dark surfaces |
| `--ink-2` | `#3A332D` | Secondary text |
| `--paper` | `#FAF7F2` | Background, receipt body, light fills |
| `--paper-deep` | `#F2ECE2` | Card backgrounds, secondary surfaces |
| `--rule` | `#E6DFD2` | Borders, hairlines |
| `--accent` | `oklch(64% 0.17 35)` (`#C75B3D` fallback) | The fold, totals, CTAs |
| `--accent-deep` | `oklch(52% 0.17 35)` (`#A04425` fallback) | Pressed/hover state of accent |
| `--muted` | `#8A8175` | Tertiary text, captions |

> Prefer `oklch(...)` where the codebase supports modern CSS color. Fall back to the hex equivalents otherwise.

### Typography

| Family | Use | Source |
|---|---|---|
| **Plus Jakarta Sans** (700, also 400/500/600 for UI) | Wordmark, primary UI text | Google Fonts |
| **Instrument Serif** (regular + italic) | Editorial / display moments | Google Fonts |
| **JetBrains Mono** (500/600) | Receipt details, prices, codes | Google Fonts |

### Wordmark

- Family: **Plus Jakarta Sans**, **weight 700**
- Letter-spacing: **-0.02em**
- Casing: **Title case** — "Fare Share" (with a normal space — no ligature)
- Color: `--ink` on light, `--paper` on dark

When using the lockup, the mark sits to the left of the wordmark with a gap roughly **22% of the mark's height**. Mark and wordmark vertically center-align.

---

## Usage Guidelines

### Clear space
Maintain clear space equal to the **height of one line item** (~10% of the mark's height) on all sides of the mark or lockup.

### Minimum size
- Mark only: **24×24 px** is the smallest comfortable size before the dashed fold loses readability. Below that, switch to a simplified favicon variant (the dashed fold may render as a solid line at 16×16 — that's acceptable).
- Lockup: don't render below **120 px wide**.

### Don't
- Don't recolor the receipt body to anything other than paper or white.
- Don't change the dash pattern of the fold — it's the brand-defining detail.
- Don't add gradients, drop shadows, or bevels.
- Don't crop the mark or rotate it.
- Don't set the wordmark in any font other than Plus Jakarta Sans 700.

### Do
- Pair with warm cream / paper backgrounds whenever possible.
- Use the accent color sparingly — it should feel like a highlight, not a flood.

---

## Implementation Examples

### Inline SVG (React)

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

### `<img>` reference

```html
<img src="/assets/logo-receipt-fold.svg" alt="Fare Share" width="32" height="32" />
```

### Favicon

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png" />
```

### CSS tokens (paste into your stylesheet root)

```css
:root {
  --ink: #1A1714;
  --ink-2: #3A332D;
  --paper: #FAF7F2;
  --paper-deep: #F2ECE2;
  --rule: #E6DFD2;
  --muted: #8A8175;
  --accent: oklch(64% 0.17 35);
  --accent-deep: oklch(52% 0.17 35);
}
```

---

## Files in this bundle

```
design_handoff_logo/
├── README.md                            ← you are here
├── assets/
│   ├── logo-receipt-fold.svg            ← primary color mark
│   ├── logo-receipt-fold-mono.svg       ← monochrome
│   ├── logo-receipt-fold-reverse.svg    ← reverse on dark
│   ├── logo-lockup.svg                  ← mark + wordmark
│   ├── app-icon-512.svg                 ← app icon source
│   └── favicon.svg                      ← favicon
└── reference/
    ├── Fare Share Logo v1.html          ← original 6-concept exploration
    ├── logo-marks.jsx                   ← React source for all 6 marks
    └── design-canvas.jsx                ← canvas wrapper used in the prototype
```

The HTML in `reference/` is for visual context only — open it in a browser to see the mark in lockups, app-icon tiles, and at multiple sizes. The actual deliverables to ship are the SVGs in `assets/`.
