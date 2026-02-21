---
phase: 01-foundation
plan: "03"
subsystem: api
tags: [openai, gpt-4o, vision, ocr, zod, multipart, next.js, route-handler]

# Dependency graph
requires:
  - phase: 01-01
    provides: "lib/ocr.ts stub, types/index.ts with Item type, next.js scaffold"
provides:
  - POST /api/ocr endpoint accepting multipart/form-data receipt images
  - GPT-4o Vision wrapper (lib/ocr.ts) with lazy client, Zod validation, cents conversion
  - Dev mock mode (USE_OCR_MOCK=true) returning fixture data without API calls
  - User-friendly error message "OCR failed. Please add items manually." on GPT-4o failure
affects: [02-host-flow, 03-realtime, 04-claiming, 05-summary]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy OpenAI client init (module-level singleton) to prevent env-before-prepare errors
    - Zod validation after JSON.parse for GPT-4o probabilistic output
    - Math.round() for dollar-to-cent conversion (never Math.floor/parseInt)
    - Dev mock mode gated on env var (USE_OCR_MOCK=true) for cost-free UI development
    - App Router native formData() for multipart parsing (no multer/busboy needed)

key-files:
  created:
    - app/api/ocr/route.ts
  modified:
    - lib/ocr.ts

key-decisions:
  - "response_format: json_object + Zod validation chosen over zodResponseFormat for vision inputs (safer for image understanding)"
  - "Lazy OpenAI client via getOpenAI() singleton — prevents API key error before app.prepare() loads .env.local"
  - "Math.round() for dollar->cent conversion — $12.99 * 100 = 1298.9999... rounds to 1299 correctly"
  - "USE_OCR_MOCK=true dev mode returns fixture data instantly — avoids GPT-4o costs during UI development"
  - "Client-side compression recommended over raising body size limit for large phone photos"

patterns-established:
  - "OCR mock pattern: USE_OCR_MOCK=true env var bypasses API, returns deterministic fixture for UI development"
  - "Integer cents pattern: Math.round(dollars * 100) for all monetary conversions"
  - "Error boundary pattern: catch all GPT-4o errors, log server-side, return user-friendly message to client"

requirements-completed: [infrastructure]

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 1 Plan 03: OCR Endpoint Summary

**GPT-4o Vision receipt OCR endpoint with Zod validation, integer-cent conversion, dev mock mode, and user-friendly error handling — POST /api/ocr fully operational**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-21T17:02:54Z
- **Completed:** 2026-02-21T17:06:34Z
- **Tasks:** 2
- **Files modified:** 2 (1 modified, 1 created)

## Accomplishments
- Full `lib/ocr.ts` implementation: lazy OpenAI client, ReceiptSchema Zod validator, Math.round cents conversion, OCR_PROMPT for structured extraction, dev mock fixture
- POST /api/ocr route handler with MIME type validation, 10MB size limit, multipart parsing via native formData(), and graceful GPT-4o error handling
- Mock mode verified: `USE_OCR_MOCK=true` returns 4-item fixture instantly, all prices as integer cents (1299, 499, 699, 299, taxCents: 209, tipCents: 400)
- TypeScript compiles clean with zero errors across all new and existing files

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GPT-4o Vision OCR library** - `f213799` (feat)
2. **Task 2: Implement POST /api/ocr Route Handler** - `7ff85bf` (feat)

## Files Created/Modified
- `lib/ocr.ts` - Full GPT-4o Vision wrapper: lazy client, Zod ReceiptSchema, OCR_PROMPT, Math.round cents, USE_OCR_MOCK fixture
- `app/api/ocr/route.ts` - POST /api/ocr: multipart parsing, MIME/size validation, extractReceiptItems call, 400/500 error responses

## Decisions Made

- Used `response_format: { type: 'json_object' }` + `ReceiptSchema.parse()` instead of `zodResponseFormat` for GPT-4o Vision. Vision inputs are less predictable than pure text completions; manual Zod validation after JSON.parse gives clearer error messages when the shape is wrong.
- Kept the 10MB body limit without raising it. For App Router Route Handlers the body size configuration differs from Pages Router. If phone photos are rejected, the recommended path is client-side canvas compression (quality 0.7) before upload.
- Chose HEIC/HEIF in ALLOWED_TYPES alongside JPEG/PNG/WebP since iPhone users photograph receipts with the default camera which produces HEIC files; GPT-4o Vision handles them natively.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Initial curl test of mock mode returned `OCR failed. Please add items manually.` because the pre-existing server process (PID 42068) was started without `USE_OCR_MOCK=true`. Killed the process and restarted with mock mode enabled. All subsequent tests passed correctly.

## Real OCR Testing

Real OCR with a live `OPENAI_API_KEY` was not tested in this plan execution — the API key was not configured in `.env.local`. Mock mode was used to verify the full request/response pipeline. The OCR accuracy concern noted in STATE.md blockers remains outstanding and should be validated in a subsequent session with real receipt photographs before building the correction UI in Phase 2.

## getUpgradeHandler() availability (Open Question 1 from research)

Not directly tested in this plan (Plan 01-01 already resolved WebSocket routing using `noServer: true` mode without needing `getUpgradeHandler()`). The custom server.ts upgrade routing is already working as confirmed in Plan 01-01 testing.

## User Setup Required

**OpenAI API key required for real OCR (not mock mode).**

1. Get key from: https://platform.openai.com -> API keys -> Create new secret key. Ensure account has credits (GPT-4o Vision calls cost ~$0.02-0.06 per image).
2. Copy `.env.local.example` to `.env.local`
3. Set `OPENAI_API_KEY=sk-your-key-here`
4. Verify with: `curl -s -X POST http://localhost:3000/api/ocr -F "image=@receipt.jpg" | head -c 200`

For cost-free UI development, set `USE_OCR_MOCK=true` in `.env.local`.

## Next Phase Readiness
- Phase 1 is complete: scaffold (01-01), session API (01-02), and OCR endpoint (01-03) all done
- Phase 2 (host flow) can proceed immediately — all four Phase 1 APIs are operational via curl
- OCR accuracy validation on real receipts should happen before Phase 2 correction UI is built (currently unvalidated — see STATE.md blocker)
- OpenAI API key setup required for production testing; mock mode covers all UI development

---
*Phase: 01-foundation*
*Completed: 2026-02-21*

## Self-Check: PASSED

All claimed files verified:
- lib/ocr.ts: FOUND
- app/api/ocr/route.ts: FOUND
- .planning/phases/01-foundation/01-03-SUMMARY.md: FOUND

All claimed commits verified:
- f213799 (Task 1: GPT-4o Vision OCR library): FOUND
- 7ff85bf (Task 2: POST /api/ocr Route Handler): FOUND
