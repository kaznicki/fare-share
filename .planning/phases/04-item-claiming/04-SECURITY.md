---
phase: 04
slug: item-claiming
status: verified
threats_open: 0
asvs_level: L1
created: 2026-04-08
---

# Phase 04 — Security (Item Claiming)

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| WebSocket client → server | Participants send claim/unclaim messages over ws | participantName (string), itemId (string), sessionId (URL param) |
| Server → all clients | Full session-snapshot broadcast after every claim change | items[], claims{}, participants[], taxCents, tipCents |
| Server in-memory store → WebSocket handlers | Session state (Map) accessed by claim branches | SessionState (items, claims, participants, sockets) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-04-01 | Spoofing | server.ts — claim/unclaim handlers | accept | No session-level auth model in v1. Social trust model (small group at a table). See accepted risks log. | closed |
| T-04-02 | Denial of Service | server.ts — ws.on('message') | accept | No rate limiting on WebSocket messages. Expected load <10 users/session. See accepted risks log. | closed |
| T-04-03 | Tampering | server.ts — claim branch | mitigate | `session.items.find(i => i.id === itemId)` check present — unknown itemIds are silently ignored (no crash, no state mutation). | closed |
| T-04-04 | Injection / XSS | ClaimableItem.tsx | mitigate | Claimant names rendered as React JSX text nodes (`{claimants.join(', ')}`). React auto-escapes all text content — no `dangerouslySetInnerHTML` used. | closed |
| T-04-05 | Information Disclosure | server.ts — wss.on('connection') | accept | Session IDs are `crypto.randomUUID()` (128-bit random). Only clients with the QR-shared link can join. Full snapshot broadcast is intentional by design (all participants see all claims). | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-04-01 | T-04-01 | Participant name spoofing in claim messages: server does not verify that `participantName` in claim/unclaim messages matches the name used at join time. Low impact — v1 is a social app for a table of trusted friends splitting a receipt. No server-side financial settlement occurs; all values are display-only. If impersonation occurs, the host can manually correct before finalization. | kaznicki | 2026-04-08 |
| AR-04-02 | T-04-02 | No rate limiting on WebSocket claim/unclaim messages. Each message triggers a full-state broadcast to all connected clients. Low impact — expected concurrent users per session is <10 (restaurant table). No hostile actor model for v1. Rate limiting deferred to a future hardening phase if the app scales beyond social use. | kaznicki | 2026-04-08 |
| AR-04-03 | T-04-05 | Full session snapshot (items, prices, claims, participant names) is broadcast to all WebSocket clients in the session. Intentional by design — all participants must see all items and claims to settle the bill. Session ID is a 128-bit UUID distributed only via host-shared QR code; unguessable by outsiders. | kaznicki | 2026-04-08 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-08 | 5 | 5 | 0 | claude-sonnet-4-6 (gsd-secure-phase) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-08
