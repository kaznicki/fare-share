# Stack Research: Receipt-Scanning Bill Splitter

**Research Date:** 2026-02-14
**Project:** SplitCheck
**Milestone:** Greenfield - Technology stack recommendations

## Executive Summary

SplitCheck is a mobile-friendly web app with OCR receipt scanning, real-time calculations, and share-via-link functionality. The recommended stack prioritizes fast mobile UX, reliable OCR, and minimal backend complexity. A client-heavy architecture with a lightweight backend for OCR processing and share links is the sweet spot.

---

## Frontend Framework

### Recommendation: Next.js 14+ with App Router
**Confidence:** HIGH

**Why:**
- Server-side rendering for fast initial load on mobile
- App Router with React Server Components reduces client bundle size
- Built-in API routes eliminate need for separate backend
- Image optimization built-in (useful for receipt photos)
- Easy deployment to Vercel or similar

**Alternatives considered:**
- **Vite + React SPA** - Simpler, but loses SSR benefits and API routes. Would need separate backend.
- **Remix** - Good alternative, but smaller ecosystem for this use case.
- **Vue/Nuxt** - Viable but React ecosystem has better OCR/camera libraries.

**What NOT to use:**
- **Create React App** - Deprecated, no SSR, slow builds
- **Angular** - Overkill for this scope, heavier bundle
- **Svelte/SvelteKit** - Smaller ecosystem for camera/OCR integrations

---

## UI Framework

### Recommendation: Tailwind CSS + shadcn/ui
**Confidence:** HIGH

**Why:**
- Tailwind enables rapid mobile-first responsive design
- shadcn/ui provides accessible, customizable components (not a heavy dependency)
- Touch-friendly components out of the box
- Easy to customize for the specific UX needs (tap-to-assign, item lists)

**Alternatives considered:**
- **Material UI** - Heavier, opinionated design, harder to customize for mobile-first
- **Chakra UI** - Good but larger bundle than shadcn/ui approach

---

## OCR / Receipt Scanning

### Recommendation: Tesseract.js (client-side) with cloud fallback
**Confidence:** MEDIUM

**Primary approach - Tesseract.js:**
- Runs entirely in the browser (no server costs for OCR)
- Good accuracy on clean printed receipts
- Free, open source
- Works offline once WASM model is loaded

**Cloud fallback - Google Cloud Vision API:**
- Superior accuracy on messy/blurry receipts
- Handles diverse receipt formats better
- Pay-per-use pricing (~$1.50 per 1000 images)
- Use when client-side OCR confidence is low

**Receipt parsing layer:**
- Custom parsing logic to extract line items from raw OCR text
- Regex patterns for quantity detection ("x2", "qty 2", etc.)
- Price extraction with currency symbol handling
- Tax/subtotal/total line detection

**What NOT to use:**
- **AWS Textract** - More expensive, similar quality to Google Vision for receipts
- **Azure Computer Vision** - Less receipt-specific training data
- **OCR-only solutions without parsing** - Raw text isn't useful; need structured extraction

---

## Camera / Image Capture

### Recommendation: Native HTML input + canvas API
**Confidence:** HIGH

**Why:**
- `<input type="file" accept="image/*" capture="environment">` triggers native camera on mobile
- No library needed for basic capture
- Canvas API for image preprocessing (crop, rotate, enhance contrast)
- Lightweight, no dependencies

**Enhancement - react-webcam or similar:**
- Only if custom camera UI is needed (viewfinder overlay, guides)
- For MVP, native input is sufficient

---

## State Management

### Recommendation: Zustand
**Confidence:** HIGH

**Why:**
- Lightweight (~1KB), minimal boilerplate
- Perfect for the bill-splitting data model (people, items, assignments, calculations)
- Supports computed/derived state (per-person totals)
- Easy to persist state to localStorage for session recovery
- Simpler than Redux for this scope

**What NOT to use:**
- **Redux/Redux Toolkit** - Overkill for a single-page calculation app
- **React Context alone** - Performance issues with frequent recalculations
- **Jotai/Recoil** - Atomic state model is less intuitive for this data shape

---

## Backend / API

### Recommendation: Next.js API Routes (minimal backend)
**Confidence:** HIGH

**Why:**
- Share-via-link needs a backend to store/retrieve split data
- API routes in Next.js keep everything in one project
- Minimal: just a few endpoints (create share link, retrieve split data)
- No separate server to deploy/manage

**Endpoints needed:**
- `POST /api/splits` - Save a completed split, return shareable ID
- `GET /api/splits/[id]` - Retrieve split data for shared link
- `POST /api/ocr` - Cloud OCR fallback (proxy to Google Vision)

---

## Database / Storage

### Recommendation: SQLite via Turso (or Vercel KV/Postgres)
**Confidence:** MEDIUM

**Why:**
- Shared links need persistent storage
- Turso (libSQL) is lightweight, cheap, edge-compatible
- Alternative: Vercel KV (Redis-based) for simple key-value storage of split data
- No user accounts needed, so schema is minimal

**Data to store:**
- Split results (JSON blob with people, items, assignments, totals)
- Created timestamp
- Optional: expiry (auto-delete after 30 days)

**What NOT to use:**
- **Full Postgres/MySQL** - Overkill for storing JSON blobs with no relational queries
- **MongoDB** - Unnecessary complexity for this simple use case
- **Firebase** - Adds SDK weight and vendor lock-in for minimal benefit

---

## Deployment

### Recommendation: Vercel
**Confidence:** HIGH

**Why:**
- Native Next.js support (same company)
- Free tier covers MVP traffic easily
- Edge functions for fast API responses globally
- Automatic HTTPS, preview deploys, easy CI/CD
- Image optimization included

---

## Testing

### Recommendation: Vitest + Playwright
**Confidence:** HIGH

- **Vitest** - Unit tests for calculation logic (tip, tax, splitting, rounding)
- **Playwright** - E2E tests for the full flow (upload → assign → calculate → share)
- **Testing Library** - Component tests for React components

**Critical test areas:**
- Rounding logic (totals must add up to the penny)
- Shared item splitting (equal distribution)
- Multi-quantity item expansion
- All 3 tip modes
- Edge cases: 0 items, 1 person, all shared items

---

## Full Stack Summary

| Layer | Technology | Confidence |
|-------|-----------|------------|
| Framework | Next.js 14+ (App Router) | HIGH |
| UI | Tailwind CSS + shadcn/ui | HIGH |
| State | Zustand | HIGH |
| OCR (primary) | Tesseract.js (client-side) | MEDIUM |
| OCR (fallback) | Google Cloud Vision API | HIGH |
| Camera | Native HTML input + Canvas | HIGH |
| Backend | Next.js API Routes | HIGH |
| Database | Turso or Vercel KV | MEDIUM |
| Deployment | Vercel | HIGH |
| Testing | Vitest + Playwright | HIGH |

---

## Risk Areas

1. **OCR accuracy** - Receipt scanning is hard. Tesseract.js may struggle with poor photos. Cloud fallback mitigates this.
2. **Receipt parsing** - Extracting structured data from OCR text is custom logic. Will need iterative improvement.
3. **Mobile camera UX** - Native input is functional but not polished. May need custom camera UI later.
4. **WASM load time** - Tesseract.js WASM model is ~2MB. Need to lazy-load after initial page render.

---

*Research based on current ecosystem knowledge. Versions should be verified against official docs before implementation.*
