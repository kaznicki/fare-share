---
phase: 05
slug: summary-and-finalization
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-10
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client → WebSocket server | Any participant can send any WebSocket message type; server must validate sender identity for privileged actions (finalize) | `participantName`, `sessionId`, `unclaimedHandling` — all untrusted |
| Client → REST API (POST /api/sessions) | Session creation body is untrusted input; `hostName` must be validated before storage | `hostName` (string, max 64 chars) |
| URL parameters → client | `?name=` query param is untrusted user-controlled input; used only for display pre-fill, not for authorization | `participantName` (display convenience only) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-5-01 | Elevation of Privilege | `server.ts` finalize handler | mitigate | Case-insensitive host identity check: `senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()` at line 140 — non-host finalize messages silently ignored | closed |
| T-5-02 | Tampering | `server.ts` finalize handler | mitigate | `unclaimedHandling` coerced to `'split'` if value is not `'host'`: `const handling = v === 'host' ? 'host' : 'split'` — rejects unexpected enum values | closed |
| T-5-03 | Tampering | `server.ts` finalize handler | mitigate | Idempotency guard: `if (session.finalized) return` — prevents double-finalization from overwriting stored `finalizedBill` | closed |
| T-5-04 | Tampering | `app/api/sessions/route.ts` | mitigate | Zod schema: `hostName: z.string().min(1).max(64)` — rejects empty or oversized values at the API boundary | closed |
| T-5-05 | Information Disclosure | Session-snapshot broadcast | accept | All participants see all claim data and the finalized bill; by design (everyone at the table sees totals) | closed |
| T-5-06 | Denial of Service | `server.ts` finalize handler | accept | Spam finalize: idempotency guard (T-5-03) means only first succeeds; subsequent are no-ops | closed |
| T-5-07 | Spoofing | `app/session/[id]/page.tsx` | accept | `?name=` param is convenience pre-fill only; actual host identity verified server-side via T-5-01 | closed |
| T-5-08 | Tampering | `components/session/SessionRoom.tsx` | accept | Client-side `isHost` controls UI visibility only (Finalize button); non-host finalize messages rejected server-side by T-5-01 | closed |
| T-5-09 | Information Disclosure | `components/session/SummaryScreen.tsx` | accept | Host sees all participants' totals by design (host is coordinating payment collection) | closed |
| T-5-10 | Denial of Service | `components/session/UnclaimedModal.tsx` | accept | Modal is client-side only; server-side idempotency guard (T-5-03) prevents any server-side impact | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-5-01 | T-5-05 | Session broadcast includes all claim data and totals for all participants. This is required — every participant needs to see who claimed what before finalizing, and the host needs all totals to collect payment. No PII beyond display names. | kaznicki | 2026-04-10 |
| AR-5-02 | T-5-06 | A malicious participant could send repeated finalize WebSocket messages. The idempotency guard at T-5-03 makes all but the first a no-op; no server state is modified after first finalization. Acceptable for a local dining app without authentication. | kaznicki | 2026-04-10 |
| AR-5-03 | T-5-07 | The `?name=` URL parameter is user-controlled. It is used only to pre-fill the join form input — no authorization decision is made from it. Server-side host identity verification (T-5-01) is the authoritative gate. | kaznicki | 2026-04-10 |
| AR-5-04 | T-5-08 | `isHost` state in the client controls Finalize button visibility only. A client could manipulate their local JS to show the button, but any finalize message from a non-host is rejected server-side. | kaznicki | 2026-04-10 |
| AR-5-05 | T-5-09 | Host summary table reveals all participants' totals. Required for the host to coordinate payment. Scope is limited to active session participants who have already joined voluntarily. | kaznicki | 2026-04-10 |
| AR-5-06 | T-5-10 | UnclaimedModal is purely client-side UI. No server interaction until a button is tapped. Server-side idempotency (T-5-03) covers any repeated finalize attempts that could result. | kaznicki | 2026-04-10 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-10 | 10 | 10 | 0 | Claude (gsd-security-auditor) |

---

## Verification Evidence

| Threat | Evidence |
|--------|----------|
| T-5-01 | `server.ts:140`: `senderName.trim().toLowerCase() !== session.hostName.trim().toLowerCase()` — confirmed via grep and Plan 03 SUMMARY commit a062429 |
| T-5-02 | `server.ts` finalize branch: `const handling = (msg as any).unclaimedHandling === 'host' ? 'host' : 'split'` — confirmed in Plan 01 SUMMARY |
| T-5-03 | `server.ts` finalize branch: `if (session.finalized) return` — confirmed in Plan 01 SUMMARY and 05-VERIFICATION.md |
| T-5-04 | `app/api/sessions/route.ts`: `hostName: z.string().min(1).max(64)` — confirmed in Plan 01 SUMMARY and 05-VERIFICATION.md |
| T-5-05–10 | Accepted per design rationale in Plan 01 and 02 threat models; documented in Accepted Risks Log above |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-10
