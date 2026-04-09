---
phase: 05-summary-and-finalization
reviewed: 2026-04-09T12:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - app/api/sessions/route.ts
  - app/host/page.tsx
  - app/session/[id]/page.tsx
  - components/host/OcrReview.tsx
  - components/host/ShareScreen.tsx
  - components/session/JoinForm.tsx
  - components/session/SessionRoom.tsx
  - components/session/SummaryScreen.tsx
  - components/session/UnclaimedModal.tsx
  - lib/bill-split.test.ts
  - lib/bill-split.ts
  - lib/session-store.ts
  - server.ts
  - types/index.ts
  - vitest.config.ts
findings:
  critical: 0
  warning: 2
  info: 4
  total: 6
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-04-09
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

All fifteen source files were reviewed at standard depth. The previous four warnings (Math.round shared-item split, host-absent unclaimed drop, case-sensitive isHost, missing WebSocket reconnect) have all been correctly resolved. The bill-splitting math engine is now rigorous: LRM is applied to shared items, unclaimed handling guards the host-absent edge case, and the WebSocket reconnect implements exponential backoff.

Two new warnings were found. The most impactful is a broken test assertion in `bill-split.test.ts` — it was written to verify the old `Math.round` behavior and will fail against the current correct LRM implementation, silently undermining CI confidence. The second is a UI layout bug in `SessionRoom.tsx` where the finalize error message renders behind the fixed bottom bar and is invisible to the user.

Four info-level items are also noted: a missing client-side item-count guard in `OcrReview`, redundant non-null assertions in `server.ts`, an inaccurate inline comment in `ShareScreen`, and a stale test description string.

---

## Warnings

### WR-01: Broken test assertion for shared-item LRM split

**File:** `lib/bill-split.test.ts:134-135`

**Issue:** The test "splits a shared item cost via Math.round between 2 claimants" asserts that both Alice and Bob receive 501 cents for a $10.01 item:

```ts
expect(byName['Alice'].subtotalCents).toBe(501)  // line 134
expect(byName['Bob'].subtotalCents).toBe(501)    // line 135
```

The test description and assertion were written for the old `Math.round` implementation (501 + 501 = 1002 > 1001 — actually gains a cent). The current code correctly uses LRM: `Math.floor(1001 / 2) = 500`, remainder `1`. Alice (index 0) gets `501`; Bob (index 1) gets `500`. Bob's assertion will **fail**. Running `vitest` will report a failing test, making CI unreliable.

**Fix:** Correct the assertion and description to match LRM behavior:

```ts
it('splits a shared item cost via LRM between 2 claimants', () => {
  // 1 item at $10.01 (1001 cents) shared by 2:
  // base = floor(1001/2) = 500, remainder = 1
  // Alice (index 0) gets 501, Bob (index 1) gets 500 — sum = 1001 exactly
  const result = billSplit({
    items: [item('a', 1001)],
    claims: { a: ['Alice', 'Bob'] },
    participants: ['Alice', 'Bob'],
    taxCents: 0,
    tipCents: 0,
    unclaimedHandling: 'split',
    hostName: 'Alice',
  })
  const byName = Object.fromEntries(result.participants.map(p => [p.name, p]))
  expect(byName['Alice'].subtotalCents).toBe(501)
  expect(byName['Bob'].subtotalCents).toBe(500)
  // Verify no cents are lost
  expect(byName['Alice'].subtotalCents + byName['Bob'].subtotalCents).toBe(1001)
})
```

---

### WR-02: `finalizeError` renders behind the fixed bottom bar

**File:** `components/session/SessionRoom.tsx:189-191`

**Issue:** The finalize error paragraph is rendered inside the scrollable content `div` (line 147), positioned after the item list `ul`:

```tsx
{finalizeError && (
  <p className="text-sm text-red-600 mt-2 text-center">{finalizeError}</p>
)}
```

The fixed bottom bar at line 174 uses `position: fixed; bottom: 0` and sits over the page. The item list has `mb-24` (96 px) to ensure content is not obscured by the bar. However, `finalizeError` is rendered after the `ul` in normal flow, placing it in the ~96 px gap region directly behind the fixed bar. The error message is invisible to the user unless they scroll further, which is also unlikely since the fixed bar covers the bottom viewport. The host receives no feedback that finalization failed.

**Fix:** Move the error message inside the fixed bottom bar `div`, adjacent to the Finalize button:

```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
  <div className="flex items-center justify-between">
    <span className="text-lg font-semibold text-gray-900">
      Your total: ${(myTotalCents / 100).toFixed(2)}
    </span>
    {isHost && (
      <button
        type="button"
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
        onClick={handleFinalizeClick}
      >
        Finalize
      </button>
    )}
  </div>
  {finalizeError && (
    <p className="text-sm text-red-600 mt-1 text-center">{finalizeError}</p>
  )}
</div>
```

---

## Info

### IN-01: No client-side guard when zero items exist in OcrReview

**File:** `components/host/OcrReview.tsx:114-120`

**Issue:** The "Create Session" button is disabled only when `isPending || !hostName.trim()`. If the host deletes all items, the button remains enabled. The POST to `/api/sessions` will be rejected with HTTP 400 (the Zod schema requires `items.min(1)`), and the user sees the generic "Could not create session. Please try again." banner instead of a specific message. The zero-item warning banner is shown correctly (line 56-60), but the button is not disabled.

**Fix:** Add `items.length === 0` to the disabled condition:

```tsx
disabled={isPending || !hostName.trim() || items.length === 0}
```

Optionally, update the button label or error message to specifically call out the empty state.

---

### IN-02: Redundant non-null assertions on `sessionId` in `server.ts`

**File:** `server.ts:66, 73, 74, 75, 91, 102, 111, 122, 125, 135, 158, 161, 163`

**Issue:** `sessionId` is narrowed to be non-null by the early-return guard at line 22 (`if (!sessionId || !sessionStore.has(sessionId))`). Every subsequent use of `sessionId` inside the same closure is guaranteed non-null, but the code uses `sessionId!` throughout the message handler. These are not incorrect, but they add visual noise and would silently suppress a TypeScript error if the early-return guard were ever removed during a refactor.

**Fix:** Narrow the type once after the guard:

```ts
// After line 25 (the early-return block):
const safeSessionId = sessionId  // TypeScript infers string (non-null narrowed)
```

Then replace all `sessionId!` occurrences inside the handler with `safeSessionId`.

---

### IN-03: Inaccurate SSR-safety comment in `ShareScreen`

**File:** `components/host/ShareScreen.tsx:11-13`

**Issue:** The comment states `window.location.origin` is safe because it is "inside function body — NOT at module level". This reasoning is incomplete. The actual protection is the `'use client'` directive, which prevents the component from running during SSR. A developer who copies this pattern into a server component based on the comment would produce an SSR crash, since the guard described ("function body, not module level") does not apply there.

**Fix:** Replace the comment to name the actual protection:

```ts
// Safe to access window here: 'use client' ensures this component only runs
// in the browser, never during SSR. Remove 'use client' and this will crash.
const joinUrl = `${window.location.origin}/session/${sessionId}`
```

---

### IN-04: Stale test description still references `Math.round`

**File:** `lib/bill-split.test.ts:122`

**Issue:** The `describe` block at line 121 and the test description at line 122 both say "splits a shared item cost via Math.round". The implementation was changed to LRM (the `Math.round` fix was part of WR-01 in the prior review). The description text is now misleading to anyone reading the test output or the file.

**Fix:** Update the test description string (covered by the WR-01 fix above — this is the same test case).

---

_Reviewed: 2026-04-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
