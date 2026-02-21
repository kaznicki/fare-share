# Phase 2: Host Flow - Research

**Researched:** 2026-02-21
**Domain:** Mobile camera capture UI, inline OCR correction, session creation API, QR code display, clipboard sharing
**Confidence:** HIGH (core patterns verified via official docs and multiple corroborating sources)

---

## Summary

Phase 2 is a pure frontend phase building on top of the working API infrastructure from Phase 1. Three screens are needed: (1) camera capture with preview and retake, (2) OCR correction (inline item editing, tax/tip fields, add/delete rows), and (3) session creation with QR code and copy link. All state is local React state until the host presses "Create Session," at which point a POST to `/api/sessions` locks the items and returns a session ID used to render the share screen.

The dominant complexity is the OCR correction UI. The pattern is: receive `OcrResult` from `POST /api/ocr`, hydrate a local `useState` copy of items, let the host freely mutate that copy inline, then POST the final shape to `POST /api/sessions`. No optimistic updates or real-time sync are needed in this phase — all mutations are local until session creation. Quantity expansion (CORR-05) happens server-side when the session is created, not in the UI.

Camera capture is simpler than it looks: `<input type="file" accept="image/*" capture="environment">` delegates everything to the native OS camera app, returns a `File` object, and works correctly on all modern mobile browsers. iOS automatically converts HEIC photos to JPEG before handing them to JavaScript, so HEIC handling is not needed client-side. The only pitfall is image size: large phone photos (12-24MP) can be 5-15MB, so client-side canvas compression to JPEG quality 0.7 is required before POSTing to `/api/ocr`.

QR code generation uses `qrcode.react` (v4+, exports `QRCodeSVG`), which is a pure client-side React component requiring only `'use client'`. Clipboard copy uses `navigator.clipboard.writeText()` with a `document.execCommand('copy')` fallback for older Safari.

**Primary recommendation:** Three-screen flow driven by a single page-level state machine (`'capture' | 'review' | 'share'`). Local `useState` for item list mutations. `qrcode.react` for QR code. Canvas compression before OCR upload. Session creation via POST to `/api/sessions` using `useTransition` for loading state.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

None — the CONTEXT.md contains no locked decisions. The user deferred all implementation choices to Claude.

### Claude's Discretion

- All OCR correction UI interaction patterns
  - Tax and tip field placement (pinned vs scrollable)
  - Inline edit interaction (tap-to-edit vs bottom sheet)
  - Quantity adjustment (stepper vs tap-to-type)
  - Add missing item flow (blank row vs bottom sheet)
- Camera capture experience (guidance overlay, preview layout, retake flow)
- Loading and error states during OCR processing
- Share screen design (QR code prominence, copy link, session info shown)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OCR-01 | User can photograph a receipt using the phone's rear camera from within the app via `<input type="file" accept="image/*" capture="environment">` | `capture="environment"` is the standard HTML attribute — OS delegates to rear camera app. No JS needed. Verified via MDN. |
| OCR-02 | After capturing a photo, user sees an image preview and can choose to retake before submitting to OCR | `URL.createObjectURL(file)` for preview. Retake = reset file input ref and state. |
| OCR-03 | App extracts line items from the receipt photo automatically and presents them as a structured list | POST to existing `/api/ocr` endpoint (Phase 1). Client reads `OcrResult` shape. |
| OCR-04 | If OCR fails, user sees an error message and can proceed to add items manually | Catch block on fetch → show error banner → pre-populate with empty item list. |
| CORR-01 | Host can edit any extracted item's name, price, or quantity inline before session is created | Local `useState` array. Tap cell → show `<input>` in place of display text. Blur → commit to state. |
| CORR-02 | Host can delete spurious rows from the extracted item list | Filter item from state array by ID. Swipe or delete icon. |
| CORR-03 | Host can add items manually when a receipt is partially unreadable | Append new item `{ id: uuid(), name: '', priceCents: 0, qty: 1 }` to state. Auto-focus name field. |
| CORR-04 | Host can edit the extracted tax and tip amounts before creating the session | Two controlled `<input type="number">` fields below item list. Store as cents in state. Display as dollars. |
| CORR-05 | Items with qty > 1 are expanded into separate individually-claimable rows when session is created | Server-side logic in `POST /api/sessions`. UI only sends raw items with qty — no client expansion needed. |
| SESS-01 | After reviewing items, host creates a session that locks the item list and generates a unique URL | POST `/api/sessions` with items, taxCents, tipCents. Returns `{ sessionId }`. |
| SESS-02 | Host sees a QR code that participants can scan to join | `qrcode.react` QRCodeSVG component with join URL as value. Client component with `'use client'`. |
| SESS-03 | Host can copy a shareable link to clipboard as a fallback | `navigator.clipboard.writeText()` + `execCommand('copy')` fallback. Show "Copied!" confirmation. |

</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React `useState` | (built-in) | Local item list state for OCR correction | No server sync needed until session creation — local state is correct choice |
| React `useTransition` | (built-in, React 19) | Loading state for OCR POST and session creation POST | Returns `isPending` boolean; prevents double-submit; no extra library needed |
| `qrcode.react` | ^4.x | Client-side QR code as SVG | Most-used React QR library; zero backend dependency; SVG scales infinitely |
| Browser Canvas API | (built-in) | Client-side image compression before OCR upload | Required to keep uploads under 10MB limit; canvas.toBlob() is universally supported |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | (built-in) | Generate IDs for manually added items | Available in all modern browsers; no dependency needed |
| `URL.createObjectURL()` | (built-in) | Image preview from `File` object | Zero-cost blob URL for img src; remember to revoke on unmount |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `qrcode.react` | `react-qr-code` or `next-qrcode` | All are viable; `qrcode.react` is the most downloaded (60M+/week) and well-maintained |
| Canvas compression | `browser-image-compression` npm package | Package adds 15KB; canvas approach is 10 lines and zero dependencies — prefer canvas |
| `useTransition` for loading | `useState` with manual `isLoading` boolean | Both work; `useTransition` is idiomatic React 19 and prevents concurrent mutation bugs |
| Tap-to-edit `<input>` | `contenteditable` div | `contenteditable` has known React reconciliation bugs and poor mobile keyboard UX — avoid |

**Installation:**

```bash
npm install qrcode.react
npm install --save-dev @types/qrcode.react  # if needed
```

Note: `qrcode.react` v4+ ships its own TypeScript types. Check `package.json` — separate `@types` package may not be needed.

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── page.tsx                    # Root → redirect or host landing
├── host/
│   └── page.tsx                # Phase 2: Host flow (capture → review → share)
├── session/
│   └── [sessionId]/
│       └── page.tsx            # Phase 3+: Participant join/claim view
components/
├── host/
│   ├── CameraCapture.tsx       # OCR-01, OCR-02: file input + preview + retake
│   ├── OcrReview.tsx           # CORR-01..05: item list editor
│   ├── ItemRow.tsx             # Single editable row (name, price, qty, delete)
│   ├── TaxTipFields.tsx        # CORR-04: tax and tip inputs
│   └── ShareScreen.tsx         # SESS-01..03: QR code + copy link
```

### Pattern 1: Three-Screen State Machine

**What:** A single page (`app/host/page.tsx`) owns a `screen` state variable (`'capture' | 'reviewing' | 'share'`). Each screen is a separate component. No router navigation between screens — just conditional rendering. This avoids back-button complications and keeps OCR data in memory without URL serialization.

**When to use:** Linear wizard flows where intermediate state is ephemeral and should not be bookmarkable.

```typescript
// app/host/page.tsx  (client component)
'use client'
import { useState } from 'react'
import CameraCapture from '@/components/host/CameraCapture'
import OcrReview from '@/components/host/OcrReview'
import ShareScreen from '@/components/host/ShareScreen'
import type { OcrResult } from '@/types'

type Screen = 'capture' | 'reviewing' | 'share'

export default function HostPage() {
  const [screen, setScreen] = useState<Screen>('capture')
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  if (screen === 'capture') {
    return <CameraCapture onComplete={(result) => { setOcrResult(result); setScreen('reviewing') }} />
  }
  if (screen === 'reviewing') {
    return <OcrReview initial={ocrResult!} onComplete={(id) => { setSessionId(id); setScreen('share') }} />
  }
  return <ShareScreen sessionId={sessionId!} />
}
```

### Pattern 2: Local Item State with Immutable Updates

**What:** `OcrReview` holds a `useState<Item[]>` copy of OCR items. Every mutation (edit, delete, add) produces a new array — no direct mutation. This is idiomatic React and enables undo if desired later.

**When to use:** Any list that the user will edit before a single final "commit" action.

```typescript
// components/host/OcrReview.tsx
'use client'
import { useState, useTransition } from 'react'
import type { OcrResult, Item } from '@/types'

interface Props {
  initial: OcrResult
  onComplete: (sessionId: string) => void
}

export default function OcrReview({ initial, onComplete }: Props) {
  const [items, setItems] = useState<Item[]>(initial.items)
  const [taxCents, setTaxCents] = useState(initial.taxCents)
  const [tipCents, setTipCents] = useState(initial.tipCents)
  const [isPending, startTransition] = useTransition()

  const updateItem = (id: string, patch: Partial<Item>) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const deleteItem = (id: string) =>
    setItems(prev => prev.filter(it => it.id !== id))

  const addItem = () =>
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      priceCents: 0,
      qty: 1
    }])

  const createSession = () => startTransition(async () => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, taxCents, tipCents }),
    })
    const { sessionId } = await res.json()
    onComplete(sessionId)
  })

  // render ...
}
```

### Pattern 3: Camera Capture with Canvas Compression

**What:** `<input type="file" accept="image/*" capture="environment">` gives back a `File`. Draw it to a canvas, export as JPEG at 0.7 quality, post the blob. This reliably brings 15MB phone photos under 2MB.

**When to use:** Any user-generated image upload where size is a concern.

```typescript
// components/host/CameraCapture.tsx
'use client'
import { useRef, useState, useTransition } from 'react'
import type { OcrResult } from '@/types'

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  // Scale down if > 2000px on longest side
  const maxDim = 2000
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.7))
}

interface Props {
  onComplete: (result: OcrResult) => void
}

export default function CameraCapture({ onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setCapturedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCapturedFile(null)
    // Reset file input
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSubmit = () => startTransition(async () => {
    if (!capturedFile) return
    try {
      const compressed = await compressImage(capturedFile)
      const formData = new FormData()
      formData.append('image', compressed, 'receipt.jpg')
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('OCR failed')
      const result: OcrResult = await res.json()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      onComplete(result)
    } catch {
      setError('OCR failed. You can add items manually instead.')
      // Still call onComplete with empty result to allow manual entry (OCR-04)
      onComplete({ items: [], taxCents: 0, tipCents: 0 })
    }
  })

  // render: file input (hidden), preview img, retake/submit buttons, error banner
}
```

### Pattern 4: QR Code + Clipboard Share Screen

**What:** `qrcode.react`'s `QRCodeSVG` renders a scalable QR code from the session join URL. Clipboard copy uses Async Clipboard API with `execCommand` fallback. A "Copied!" flash provides confirmation.

```typescript
// components/host/ShareScreen.tsx
'use client'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  sessionId: string
}

export default function ShareScreen({ sessionId }: Props) {
  const joinUrl = `${window.location.origin}/session/${sessionId}`
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
    } catch {
      // Fallback for older Safari / non-HTTPS contexts
      const el = document.createElement('textarea')
      el.value = joinUrl
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <QRCodeSVG value={joinUrl} size={256} level="M" marginSize={4} />
      <p>{joinUrl}</p>
      <button onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
    </div>
  )
}
```

### Pattern 5: Inline Cell Editing (Tap-to-Edit)

**What:** Display value as text. On tap/click, swap to an `<input>`. On blur, commit and swap back to text. Do NOT use `contenteditable` — it has React reconciliation bugs and worse mobile keyboard UX.

**Recommendation for this phase:** Tap-to-edit with `<input>` is the right choice. It gives a native keyboard with appropriate type (text for name, number for price/qty). A bottom sheet pattern would add animation complexity for no UX gain on a small item list.

```typescript
// components/host/ItemRow.tsx
'use client'
import { useState } from 'react'
import type { Item } from '@/types'

interface Props {
  item: Item
  onChange: (patch: Partial<Item>) => void
  onDelete: () => void
}

export default function ItemRow({ item, onChange, onDelete }: Props) {
  const [editingField, setEditingField] = useState<'name' | 'price' | 'qty' | null>(null)

  const displayPrice = `$${(item.priceCents / 100).toFixed(2)}`

  const commitPrice = (raw: string) => {
    // Parse dollars to integer cents — consistent with Math.round pattern from Phase 1
    const dollars = parseFloat(raw) || 0
    onChange({ priceCents: Math.round(dollars * 100) })
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b">
      {/* Name cell */}
      {editingField === 'name' ? (
        <input
          autoFocus
          type="text"
          defaultValue={item.name}
          className="flex-1"
          onBlur={e => { onChange({ name: e.target.value }); setEditingField(null) }}
        />
      ) : (
        <span className="flex-1" onClick={() => setEditingField('name')}>{item.name || 'Tap to name'}</span>
      )}

      {/* Price cell */}
      {editingField === 'price' ? (
        <input
          autoFocus
          type="number"
          step="0.01"
          min="0"
          defaultValue={(item.priceCents / 100).toFixed(2)}
          className="w-20 text-right"
          onBlur={e => { commitPrice(e.target.value); setEditingField(null) }}
        />
      ) : (
        <span className="w-20 text-right" onClick={() => setEditingField('price')}>{displayPrice}</span>
      )}

      {/* Qty stepper */}
      <div className="flex items-center gap-1">
        <button onClick={() => onChange({ qty: Math.max(1, item.qty - 1) })}>-</button>
        <span className="w-6 text-center">{item.qty}</span>
        <button onClick={() => onChange({ qty: item.qty + 1 })}>+</button>
      </div>

      {/* Delete */}
      <button onClick={onDelete} aria-label="Delete item">✕</button>
    </div>
  )
}
```

**Recommendation for qty stepper:** Use `+/-` stepper buttons (not tap-to-type). Steppers are faster for typical receipt corrections (qty 1→2), and avoid the number keyboard appearing for qty when the host just wants to nudge. Tap-to-type is better for name and price where exact text entry is required.

**Recommendation for tax/tip placement:** Pin tax and tip fields at the bottom of the screen (sticky footer or after the list), not scrollable. These fields are always actionable, and hiding them requires the user to scroll to the end of a potentially long list.

**Recommendation for add item flow:** Append a blank row inline (not a bottom sheet). The host is already looking at the list; a bottom sheet breaks spatial context. Auto-focus the name field of the new row.

### Anti-Patterns to Avoid

- **`contenteditable` for item editing:** React tracks DOM children; `contenteditable` bypasses this and causes desync warnings and bugs on re-render. Always use `<input>` or `<textarea>`.
- **Sending uncompressed phone photos:** 15MB JPEG uploads time out on mobile networks. Compress to <2MB before POST.
- **Floating-point price inputs:** When reading price from `<input type="number">`, always use `Math.round(parseFloat(value) * 100)` — never `parseInt` or `Math.floor`. Consistent with the established project convention from Phase 1.
- **`window.location` in server components:** `ShareScreen` reads `window.location.origin` — it MUST be a client component with `'use client'`. Do not attempt to pre-render the join URL server-side.
- **Navigation for the three screens:** Do not use Next.js `router.push()` to navigate between capture/review/share. Intermediate state (OCR items, pending edits) would be lost unless serialized to URL or storage. Keep it as in-memory state with conditional rendering.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom QR encoding algorithm | `qrcode.react` (QRCodeSVG) | QR encoding has complex error correction math (Reed-Solomon). qrcode.react is battle-tested across 60M+/week downloads |
| Image compression | Custom byte manipulation | Browser Canvas API (`toBlob`) | Canvas handles EXIF, color profiles, multi-format input; zero dependency |
| HEIC conversion | `heic2any` or server conversion | None needed — iOS auto-converts | iOS converts HEIC to JPEG before handing File to JavaScript. Adding heic2any (2.7MB) for a problem that doesn't exist wastes bundle space |
| Clipboard API | Manual textarea hack as primary | `navigator.clipboard.writeText()` with execCommand fallback | Modern API; use fallback only as safety net |
| UUID for new items | Manual random string | `crypto.randomUUID()` | Built into all modern browsers; zero dependency |

**Key insight:** Phase 2 is almost entirely standard browser APIs and one small React component library. Resist the urge to add libraries — the bundle stays tiny, and the dev experience stays simple.

---

## Common Pitfalls

### Pitfall 1: Uncompressed Image Upload Timeouts

**What goes wrong:** Host takes a 12MP photo on their iPhone (15MB). The upload to `/api/ocr` times out or hits the 10MB body size limit. OCR never runs.

**Why it happens:** Mobile cameras produce enormous files. The Phase 1 route handler set a 10MB limit, but real iPhone photos regularly exceed this.

**How to avoid:** Compress client-side with canvas before upload. Max dimension 2000px, JPEG quality 0.7. This reliably produces <1MB for receipt photos.

**Warning signs:** OCR returns 413 or times out. Check compressed size in the Network tab.

### Pitfall 2: HEIC File Type Mismatch

**What goes wrong:** `imageFile.type` is `'image/heic'` which isn't in `ALLOWED_TYPES` in the existing route handler, returning a 400 error. But this only happens in non-iOS browsers (Chrome on iPhone, Firefox).

**Why it happens:** iOS converts HEIC to JPEG automatically at the OS level, so `file.type` is always `image/jpeg` on iOS Safari. Other browsers may expose the raw HEIC type.

**How to avoid:** The existing route handler already allows `image/heic` and `image/heif` in `ALLOWED_TYPES`. This is covered. Canvas `createImageBitmap` will fail on HEIC in non-Safari browsers — but this is edge case territory (Firefox users on iPhone). Accept the limitation for v1 per project scope.

**Warning signs:** 400 "Unsupported image type: image/heic" on Android Firefox.

### Pitfall 3: `window` Access in RSC / Pre-render

**What goes wrong:** `ShareScreen` uses `window.location.origin` to build the join URL. If the component is a Server Component or pre-rendered, this throws `ReferenceError: window is not defined`.

**Why it happens:** Next.js App Router Server Components run in Node.js where `window` is undefined. Even client components with `'use client'` can throw on the server during SSR hydration if the code runs synchronously at module level.

**How to avoid:** Add `'use client'` to `ShareScreen.tsx`. Read `window.location.origin` inside the component function body (not at module level), so it only runs client-side. Alternatively, construct the URL from a server-provided `sessionId` prop and a hardcoded base URL from env vars (`NEXT_PUBLIC_BASE_URL`).

**Warning signs:** Build error or `ReferenceError` on `window` during `next build`.

### Pitfall 4: Price Input Float Accumulation

**What goes wrong:** User taps a price cell showing "$12.99". Types "12.99". After blur, `parseFloat("12.99") * 100 = 1298.9999...`. If stored as float, subsequent reads and re-displays accumulate error. If rounded on every write, this is prevented.

**Why it happens:** JavaScript floating-point. This pitfall is documented in Phase 1 STATE.md.

**How to avoid:** Always `Math.round(parseFloat(value) * 100)` when converting input to cents. Store only integer cents in state. Display by dividing: `(priceCents / 100).toFixed(2)`.

**Warning signs:** Prices drift by 1 cent after editing.

### Pitfall 5: File Input Reset After Retake

**What goes wrong:** User captures photo, sees preview, presses "Retake". The `input[type=file]` still holds the original file. Clicking the input again doesn't fire `onChange` because the selected file hasn't changed.

**Why it happens:** Browsers don't fire `change` if the same file is re-selected.

**How to avoid:** On retake, programmatically reset the input value: `inputRef.current.value = ''`. This clears the browser's cached selection so the next file pick fires `onChange`.

**Warning signs:** "Retake" works once but subsequent retakes don't trigger a new capture.

### Pitfall 6: Clipboard API Requires HTTPS or localhost

**What goes wrong:** `navigator.clipboard.writeText()` throws `DOMException: NotAllowedError` in production if the page is served over HTTP.

**Why it happens:** The Async Clipboard API is restricted to secure contexts (HTTPS or localhost).

**How to avoid:** Deployment targets (Railway, Fly.io, Render) all provide HTTPS automatically. During local development, localhost is a secure context. No action needed for this project, but worth documenting.

**Warning signs:** Copy button silently fails or throws in a non-HTTPS preview environment.

---

## Code Examples

Verified patterns from official sources:

### Camera File Input (OCR-01, OCR-02)

```typescript
// Source: MDN Web Docs - HTML input element capture attribute
// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
<input
  ref={inputRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="sr-only"   // visually hidden; triggered by a styled button
  onChange={handleFileChange}
/>
<button type="button" onClick={() => inputRef.current?.click()}>
  Take Photo
</button>
```

Note: `capture="environment"` is the standard value for rear-facing camera. The browser/OS handles camera UI entirely — no camera permissions JavaScript needed for this approach.

### Canvas Image Compression

```typescript
// Source: MDN Web Docs - HTMLCanvasElement.toBlob()
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
async function compressImage(file: File, maxDim = 2000, quality = 0.7): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve =>
    canvas.toBlob(blob => resolve(blob!), 'image/jpeg', quality)
  )
}
```

### QR Code Component (SESS-02)

```typescript
// Source: qrcode.react official README
// https://github.com/zpao/qrcode.react
'use client'
import { QRCodeSVG } from 'qrcode.react'

// QRCodeSVG renders as an SVG element — scales without pixelation
// level="M" provides 15% error correction — sufficient for clean QR display
// marginSize={4} meets the QR spec minimum (4 modules of quiet zone)
<QRCodeSVG
  value={joinUrl}
  size={256}
  level="M"
  marginSize={4}
  className="mx-auto"
/>
```

### Clipboard Copy with Fallback (SESS-03)

```typescript
// Source: MDN Web Docs Clipboard API
// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
// Safari fallback pattern from: https://wolfgangrittner.dev/how-to-use-clipboard-api-in-safari/
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback: document.execCommand (deprecated but still functional)
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}
```

### Dollar Input → Integer Cents Conversion

```typescript
// Consistent with Math.round pattern established in Phase 1 (lib/ocr.ts)
// Source: STATE.md accumulated decisions
const commitPriceInput = (rawValue: string): number => {
  const dollars = parseFloat(rawValue)
  if (isNaN(dollars) || dollars < 0) return 0
  return Math.round(dollars * 100)  // $12.99 → 1299, never 1298
}
```

### useTransition for Session Creation (SESS-01)

```typescript
// Source: React 19 official docs
// https://react.dev/reference/react/useTransition
const [isPending, startTransition] = useTransition()

const handleCreateSession = () => startTransition(async () => {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, taxCents, tipCents }),
  })
  if (!res.ok) throw new Error('Session creation failed')
  const { sessionId } = await res.json()
  onComplete(sessionId)
})

// isPending is true while the fetch is in flight
// Disable the Create Session button while isPending to prevent double-submit
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-qr-reader` for QR generation | `qrcode.react` QRCodeSVG | ~2022 | qrcode.react is simpler, pure generation (no camera scanning needed here) |
| `useState` + manual `isLoading` boolean | `useTransition` + `isPending` | React 18/19 | Less boilerplate, prevents concurrent mutation bugs |
| `document.execCommand('copy')` as primary | `navigator.clipboard.writeText()` as primary | ~2020 | Async, permission-aware; execCommand still needed as fallback for older Safari |
| `getUserMedia` viewfinder for camera | `<input capture="environment">` for simple capture | Established | getUserMedia is deferred to v2; input element delegates to OS camera app with zero JS |
| Separate pages for wizard steps | Single page conditional rendering | App Router era | Avoids URL-serializing ephemeral form state; simpler implementation |

**Deprecated/outdated:**
- `react-qr-reader`: This is a QR *scanner*, not generator. Do not confuse with qrcode.react.
- `ZXing` browser library: QR scanning library. Out of scope for this phase.
- `getUserMedia` live viewfinder: Deferred to v2 per REQUIREMENTS.md. Do not implement in this phase.

---

## Open Questions

1. **Session ID to join URL format**
   - What we know: `POST /api/sessions` returns `{ sessionId }`. Phase 3 will handle the join page at `/session/[sessionId]`.
   - What's unclear: Is `sessionId` opaque enough to prevent guessing? The Phase 1 `session-store.ts` generates IDs — need to verify format (UUID vs shorter ID).
   - Recommendation: Check `lib/session-store.ts` when implementing ShareScreen. If IDs are UUID-length (36 chars), they are unguessable (SESS-01 requirement met). If shorter, the planner should flag this.

2. **Error handling when OCR returns zero items**
   - What we know: `POST /api/ocr` may return `{ items: [], taxCents: 0, tipCents: 0 }` if GPT-4o finds nothing. This is not an HTTP error.
   - What's unclear: Should the review screen show an empty list with a prominent "Add item" prompt, or redirect the host back to capture with an error?
   - Recommendation: Show empty review screen with a prominent "OCR extracted 0 items — add items manually" banner. This keeps the UX linear and satisfies OCR-04 without a separate empty state.

3. **Tax/tip display: dollars or cents in the input?**
   - What we know: State stores integer cents. Display convention is established (divide by 100, toFixed(2)).
   - What's unclear: Should the tax/tip input accept dollar strings ("$2.50") or raw numbers?
   - Recommendation: Use `<input type="number" step="0.01">` showing dollar values (divide priceCents by 100 for defaultValue). On blur, apply `Math.round(parseFloat * 100)` to store as cents. Consistent with price cells.

---

## Sources

### Primary (HIGH confidence)

- MDN Web Docs - HTML input capture attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture
- MDN Web Docs - HTMLCanvasElement.toBlob: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- MDN Web Docs - Clipboard.writeText: https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- React 19 Official Docs - useTransition: https://react.dev/reference/react/useTransition
- qrcode.react GitHub README (v4): https://github.com/zpao/qrcode.react/blob/trunk/README.md
- Project STATE.md decisions (Math.round for cents, session store patterns)

### Secondary (MEDIUM confidence)

- WebSearch: iOS auto-converts HEIC to JPEG before File API — confirmed by multiple Apple Developer Forums and HN threads (no HEIC handling needed client-side on iOS)
- WebSearch: `navigator.clipboard` requires secure context (HTTPS/localhost) — confirmed by multiple sources including Apple Developer Forums
- qrcode.react npm page (fetched) — confirmed v4+, QRCodeSVG export, key props

### Tertiary (LOW confidence)

- Canvas compression quality=0.7 producing <2MB for receipt photos — empirical guidance from blog posts; actual compression ratio depends on receipt photo content. Validate during implementation by logging compressed file size.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — qrcode.react is well-documented; canvas API is a browser standard; useTransition is React 19 official
- Architecture: HIGH — three-screen state machine and local useState patterns are established React idioms
- Pitfalls: HIGH for HTTPS and file input reset (confirmed in multiple sources); MEDIUM for HEIC (behavior varies by iOS version and browser)

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable APIs; 30-day window appropriate)
