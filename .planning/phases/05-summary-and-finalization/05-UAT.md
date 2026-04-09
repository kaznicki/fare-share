---
status: diagnosed
phase: 05-summary-and-finalization
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md
started: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start fresh with `npm run dev`. Server boots without errors, Next.js compiles cleanly, and the home page (or host page at /host) loads in the browser.
result: pass
note: DEP0169 deprecation warning for url.parse() on startup — pre-existing node/ws internals issue, not introduced by Phase 05

### 2. Host Name Capture
expected: On the host OCR review screen (after scanning a receipt), a "Your name" input field appears above the "Create Session" button. The Create Session button is disabled (grayed out) until a name is typed in.
result: pass

### 3. Session Creation with Host Name
expected: After entering your name and clicking Create Session, the session is created successfully. The host proceeds to the share/QR code screen.
result: pass

### 4. Host Join URL on Share Screen
expected: The share screen shows a "Join as host" button or link in addition to the normal participant QR code/copy link. The host join URL includes your name as a query param (e.g., ?name=YourName).
result: pass

### 5. JoinForm Pre-fill from URL
expected: When you open the host join URL in a browser (the ?name= URL), the name field on the join form is pre-filled with your name. You can proceed directly without retyping.
result: pass

### 6. Finalize Button — No Unclaimed Items
expected: With all items claimed, the host clicks the Finalize button in the session room. No modal appears. The session transitions directly to the summary screen.
result: pass

### 7. Unclaimed Items Modal
expected: With at least one unclaimed item, the host clicks Finalize. A blocking modal appears showing how many items are unclaimed (e.g., "2 item(s) not claimed"). It has two buttons: "Split among everyone" and "I'll cover the rest". There is no way to dismiss it without choosing one.
result: pass

### 8. Split Among Everyone
expected: In the unclaimed modal, choosing "Split among everyone" finalizes the session. The summary screen appears and the unclaimed costs are distributed proportionally among all participants.
result: pass

### 9. I'll Cover the Rest
expected: In the unclaimed modal, choosing "I'll cover the rest" finalizes the session. The summary screen appears and the host's total includes the unclaimed item costs added to their share.
result: issue
reported: "There is no Finalize button on the host screen after clicking 'I'll cover the rest'"
severity: major

### 10. Summary Screen — Participant View
expected: A participant (non-host) sees their personal breakdown: food subtotal, tax share, tip share, and a bold "Total owed" amount. Money values are aligned in columns. No other participants' totals are shown.
result: pass

### 11. Summary Screen — Host View
expected: The host sees their own breakdown (same as participants) plus an "Everyone's totals" table listing each participant's name and total owed, with a grand total row at the bottom.
result: pass

## Summary

total: 11
passed: 10
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Choosing 'I'll cover the rest' in the unclaimed modal finalizes the session and shows the summary screen"
  status: failed
  reason: "User reported: There is no Finalize button on the host screen after clicking 'I'll cover the rest'"
  severity: major
  test: 9
  root_cause: "server.ts:140 uses case-sensitive strict equality (senderName !== session.hostName) to gate finalization. WR-03 fixed client-side isHost detection to be case-insensitive but left the server-side check unchanged. When participantName casing doesn't byte-match session.hostName the finalize message is silently dropped, no snapshot is broadcast, and the summary screen never appears."
  artifacts:
    - path: "server.ts"
      issue: "Line ~140: senderName !== session.hostName — strict equality, no toLowerCase/trim normalization"
    - path: "components/session/SessionRoom.tsx"
      issue: "useEffect deps missing onFinalized and onSessionData — stale closure risk on finalization path"
  missing:
    - "Normalize server-side host identity check: senderName.toLowerCase().trim() !== session.hostName.toLowerCase().trim()"
    - "Add onFinalized and onSessionData to SessionRoom useEffect dependency array (or stabilize with useCallback in parent)"
  debug_session: ".planning/debug/host-cover-rest-broken.md"
