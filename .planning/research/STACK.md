# Stack Research

**Domain:** Mobile web receipt-splitting app (ephemeral sessions, OCR, real-time multi-user)
**Researched:** 2026-02-20
**Confidence:** MEDIUM-HIGH (core stack HIGH, OCR accuracy claims MEDIUM, PartyKit free tier MEDIUM)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x | UI component framework | Industry standard for reactive UIs; hooks model maps cleanly to session state; large ecosystem of mobile-friendly primitives |
| TypeScript | 5.7+ | Type safety across all layers | Catches session/state shape bugs at compile time; critical when OCR output is unstructured |
| Vite | 6.x | Build tool + dev server | Pure SPA — no SSR needed, so Next.js overhead is waste; Vite starts in <300ms, HMR is instant; first-class React + TS template |
| Tailwind CSS | 4.x | Utility-first styling | v4 ships with a Vite plugin (no PostCSS config); single `@import "tailwindcss"` line; mobile-first utility classes cover touch targets, safe areas |
| Zustand | 5.0.x | Client state management | Session state (items, claimants, totals) is inherently global but simple; Zustand is hook-based with zero boilerplate; no Redux overhead for an ephemeral app |

### Real-Time Sync

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PartyKit | latest | Ephemeral multi-user session server | Built on Cloudflare Durable Objects; each receipt session is a "party room" — all joiners get real-time WebSocket sync; free tier supports 10 live projects with 24h data lifecycle, which exactly matches a restaurant session; no infrastructure to manage |
| PartySocket | latest | Client SDK for PartyKit | Type-safe WebSocket client that auto-reconnects, handles presence, and manages room lifecycle; ~2 KB gzipped |

**Why PartyKit over raw WebSocket server:** A bare Node.js + ws server on Fly.io costs $5/month minimum, requires managing connection state, and adds ops overhead. PartyKit's free tier (10 projects, data clears every 24h) perfectly matches ephemeral session semantics. The "party" abstraction is conceptually identical to a restaurant table — one host creates it, others join by ID, it evaporates naturally.

**Why not Y.js / CRDTs:** This app has no conflict resolution problem. There's a single list of items and claimants make append-only claims. CRDTs add complexity without benefit. A simple broadcast of state updates over PartyKit WebSockets is sufficient.

### OCR

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tesseract.js | 7.0.0 | In-browser OCR via WebAssembly | Runs entirely client-side in a Web Worker — no server round-trip, no API cost, no receipt images leaving the device (privacy win); v7 released Dec 2025, builds on v5's 50% file-size reduction; WASM SIMD acceleration in Chrome ≥91, Firefox ≥90, Safari ≥16.4 |
| Canvas 2D API | (browser native) | Image preprocessing before OCR | Applying `grayscale(100%) contrast(150%)` via canvas filters before Tesseract dramatically improves accuracy on thermal receipt paper; no external dependency |

**Why not Google Vision API:** Google Vision achieves 98% text accuracy vs Tesseract's lower baseline, but requires: (1) sending receipt images to a third-party server, (2) an API key and billing setup, (3) a server-side proxy to hide the key. For an ephemeral no-account app, this is architectural overreach. Tesseract.js with canvas preprocessing on high-resolution mobile camera images is accurate enough for structured receipt text, and a manual correction step covers edge cases.

**Why not AWS Textract:** Same objections as Google Vision — server dependency, billing, privacy.

### Camera Access

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| MediaDevices.getUserMedia | (browser native) | Rear camera capture | `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` accesses rear camera on mobile; supported in all modern browsers on HTTPS; no library needed |
| Canvas 2D API | (browser native) | Frame capture from video stream | `drawImage(videoElement, ...)` captures still frame; then `canvas.toBlob()` for OCR input |

**Why not react-webcam:** react-webcam is a thin wrapper with known issues on Android Chrome for `facingMode` switching (GitHub issues #170, #77). A custom `useCamera` hook over the raw MediaDevices API is ~40 lines and gives full control. The library adds a dependency with no meaningful benefit.

### QR Code Generation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| qrcode.react | 4.x | Session share QR code (SVG) | Renders SVG — scales perfectly on any screen density; exports `<QRCode>` and `<QRCodeCanvas>` components; more actively maintained (Cloudflare-backed) than react-qr-code; renders session join URL encoding |

### Deployment

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloudflare Pages | — | SPA hosting | Free tier; global CDN; automatic HTTPS (required for getUserMedia); deploys from GitHub push; Vite output drops straight into Pages with zero config |
| PartyKit hosted | — | WebSocket server | Free tier (10 projects, 24h ephemeral storage); Cloudflare edge network; zero ops |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-pwa | 0.21+ | PWA manifest + service worker | Add if offline receipt review after session close is desired; NOT needed for MVP |
| zod | 3.x | Runtime schema validation | Validate PartyKit message payloads before updating state; prevents malformed joins from corrupting session |
| nanoid | 5.x | Session ID generation | Generates short, URL-safe session IDs on the host's device; avoids server-side ID generation |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite dev server | Local development with HMR | Use `--host` flag to expose over local network for real-phone testing |
| ngrok / Cloudflare Tunnel | HTTPS tunnel for local dev | getUserMedia requires HTTPS; `cloudflare tunnel` is free and gets past iOS Safari's localhost restriction |
| Vitest | Unit + component testing | Same config as Vite; test OCR output parsing and item claim logic |
| Playwright | E2E testing | Can mock getUserMedia and PartyKit for automated session flow tests |

---

## Installation

```bash
# Core
npm create vite@latest tab-splitter -- --template react-ts
cd tab-splitter
npm install

# Tailwind v4 (Vite plugin — no postcss.config needed)
npm install tailwindcss @tailwindcss/vite

# State
npm install zustand

# Real-time sync
npm install partysocket

# OCR
npm install tesseract.js

# QR code
npm install qrcode.react

# Runtime validation
npm install zod

# Session IDs
npm install nanoid

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
```

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Add to `src/index.css`:
```css
@import "tailwindcss";
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite + React SPA | Next.js | If you later need SSR for SEO (receipt history pages, landing page with metadata) — not relevant for MVP |
| Tesseract.js (client-side) | Google Vision API | If accuracy on damaged/crumpled receipts is unacceptable after preprocessing; would require adding a server proxy layer and API key management |
| PartyKit | Raw Node.js + ws on Fly.io | If you need more than 10 concurrent live sessions, or need persistent session storage beyond 24h; costs $5+/month |
| PartyKit | Supabase Realtime | If you already have a Postgres-backed app needing real-time; Supabase is overkill for purely ephemeral state |
| Custom useCamera hook | react-webcam | If team strongly prefers a library abstraction; react-webcam works but has Android Chrome facingMode issues |
| qrcode.react | react-qr-code | Both are fine; qrcode.react has more active maintenance as of 2026 |
| Zustand | React Context + useReducer | For very small state trees (< 3 slices); but session state here spans items + claimants + totals, making Zustand's slice pattern cleaner |
| Tailwind v4 | Tailwind v3 | If the project already has v3 installed and upgrading is disruptive; v4 is the standard for new projects in 2026 |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux Toolkit | Massive boilerplate for ephemeral state with no persistence; adds 40KB to bundle | Zustand 5 |
| Next.js | Imposes SSR, App Router, and server component complexity on what is a pure client-side SPA; no SEO value for a camera app | Vite + React |
| Firebase Realtime Database | Requires Google account, project setup, and SDK bloat; designed for persistent data, not 30-minute restaurant sessions | PartyKit |
| Socket.io | 80KB library for a feature (WebSockets) natively available in browsers; PartyKit's PartySocket is purpose-built and smaller | PartySocket |
| pdf.js | Receipts are photos, not PDFs; Tesseract.js does not support PDF input | Canvas + Tesseract.js |
| navigator.getUserMedia (deprecated) | Legacy API, removed in most modern browsers | navigator.mediaDevices.getUserMedia |
| Ocrad.js | Much lower accuracy than Tesseract.js; last meaningful update was 2016 | Tesseract.js v7 |

---

## Stack Patterns by Variant

**If receipt OCR accuracy is unacceptable after canvas preprocessing:**
- Add server-side OCR via Google Vision API
- Requires: Express/Hono backend, API key management, image upload endpoint
- Adds: ~2 weeks of backend work, ongoing API cost (~$1.50 per 1000 receipts)

**If PartyKit free tier (10 live projects) is too restrictive:**
- Deploy a Hono + @hono/node-ws server on Fly.io ($5/month)
- Hono is 3.5x faster than Express and has first-class WebSocket and Cloudflare Workers support
- The server is stateless except for in-memory room state (acceptable for ephemeral sessions)

**If the app needs to work offline after initial load:**
- Add vite-plugin-pwa with a network-first caching strategy
- PWA install prompt gives users an app-like home screen icon
- Tesseract.js language data (~10MB for English) must be explicitly precached

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| tesseract.js@7 | Node.js ≥16, all modern browsers | WASM SIMD requires Chrome ≥91, Firefox ≥90, Safari ≥16.4; falls back gracefully |
| tailwindcss@4 | @tailwindcss/vite@4, Vite@6 | v4 uses CSS-first config — no `tailwind.config.js` needed; incompatible with v3 PostCSS setup |
| react@19 | zustand@5, qrcode.react@4 | React 19 concurrent mode is compatible with Zustand 5's subscription model |
| partysocket | partykit server | PartySocket is the official client; must use matching PartyKit server SDK version |

---

## Sources

- [Tesseract.js GitHub (v7.0.0, Dec 2025)](https://github.com/naptha/tesseract.js) — version and WASM SIMD support confirmed
- [Tesseract.js npm](https://www.npmjs.com/package/tesseract.js) — v7.0.0 latest confirmed
- [Tailwind CSS v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — Vite plugin, zero config, @import syntax confirmed HIGH confidence
- [PartyKit official site](https://www.partykit.io/) — free tier (10 projects, 24h storage), Cloudflare acquisition April 2024 confirmed MEDIUM confidence
- [Cloudflare acquires PartyKit blog](https://blog.cloudflare.com/cloudflare-acquires-partykit/) — acquisition and Durable Objects architecture confirmed HIGH confidence
- [Cloudflare Durable Objects free tier changelog](https://developers.cloudflare.com/changelog/2025-04-07-durable-objects-free-tier/) — free tier with Durable Objects confirmed HIGH confidence
- [MDN MediaDevices.getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) — facingMode: "environment", HTTPS requirement confirmed HIGH confidence
- [Zustand npm (v5.0.11, Feb 2026)](https://www.npmjs.com/package/zustand) — version confirmed HIGH confidence
- [Vite vs Next.js 2025 — Strapi](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison) — SPA recommendation confirmed MEDIUM confidence
- [Hono WebSocket helper](https://hono.dev/docs/helpers/websocket) — WebSocket support in Hono confirmed HIGH confidence
- [react-webcam GitHub issue #170](https://github.com/mozmorris/react-webcam/issues/170) — Android facingMode switching issues confirmed MEDIUM confidence
- [Image preprocessing for OCR — Medium](https://medium.com/@jaelin_75015/faded-torn-rotated-receipt-ocr-with-image-preprocessing-1fb03c036504) — canvas contrast/grayscale preprocessing confirmed MEDIUM confidence
- [Google Vision vs Tesseract for invoices — Ixor/Medium](https://medium.com/ixor/comparing-tesseract-ocr-with-google-vision-ocr-for-text-recognition-in-invoices-bddf98f3f3bd) — accuracy gap confirmed MEDIUM confidence

---

*Stack research for: Mobile web receipt-splitting app (Tab Splitter)*
*Researched: 2026-02-20*
