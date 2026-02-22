# Requirements: Tab Splitter

## v1 Requirements

### OCR — Receipt Capture and Extraction

**OCR-01** — User can photograph a receipt using the phone's rear camera from within the app (via `<input type="file" accept="image/*" capture="environment">`).

**OCR-02** — After capturing a photo, user sees an image preview and can choose to retake before submitting to OCR.

**OCR-03** — The app extracts line items (name, price, quantity) from the receipt photo automatically and presents them as a structured list.

**OCR-04** — If OCR fails or produces no results, user sees an error message and can proceed to add items manually.

---

### CORR — Manual OCR Correction (explicit v1 requirement)

**CORR-01** — Host can edit any extracted item's name, price, or quantity inline before the session is created.

**CORR-02** — Host can delete spurious rows (subtotal lines, header rows, tip lines) from the extracted item list.

**CORR-03** — Host can add items manually (name + price) when a receipt is partially unreadable or an item is missing from the OCR output.

**CORR-04** — Host can edit the extracted tax and tip amounts before creating the session.

**CORR-05** — Items with quantity greater than 1 are expanded into separate individually-claimable rows when the session is created (e.g., qty:2 "Burger" $9.00 becomes two separate "Burger" rows at $9.00 each).

---

### SESS — Session Creation and Sharing

**SESS-01** — After reviewing and correcting items, host can create a session that locks the item list and generates a unique, unguessable session URL.

**SESS-02** — Host sees a QR code on screen that participants can scan to join the session on their own phones.

**SESS-03** — Host can copy a shareable link to the clipboard as a fallback for participants who cannot scan the QR code.

---

### JOIN — Participant Join Flow

**JOIN-01** — Participant can open the share URL on their phone, enter only their name (no account or password required), and immediately access the session.

**JOIN-02** — All participants in the session see when a new person joins in real time.

---

### CLAIM — Item Claiming

**CLAIM-01** — Participant can tap any item row to claim it as something they ordered; tapping again removes the claim.

**CLAIM-02** — Multiple participants can claim the same item row (shared item); the item's cost is divided equally among all claimants and each participant sees their share price in real time.

**CLAIM-03** — Duplicate items (two separate rows created from qty expansion) can each be claimed independently by different participants.

**CLAIM-04** — Each item row shows who has currently claimed it (names visible to all participants) so no one needs to ask at the table.

---

### SYNC — Real-Time Synchronization

**SYNC-01** — Claim updates from any participant appear on all other participants' screens within one to two seconds, without requiring a page reload.

**SYNC-02** — A participant who loses and regains their connection (e.g., phone locks, network switches) rejoins the session and sees the current, complete state of all claims without missing any updates.

---

### MATH — Tax, Tip, and Totals Calculation

**MATH-01** — Each person's tax share is calculated proportionally to their food subtotal, not as an equal split.

**MATH-02** — Each person's tip share is calculated proportionally to their food subtotal, not as an equal split.

**MATH-03** — The sum of all per-person totals equals the receipt total exactly (no missing or extra cents due to rounding).

---

### FINAL — Finalization and Summary

**FINAL-01** — Host can trigger finalization; each participant sees their individual total owed (subtotal + proportional tax + proportional tip) on a summary screen.

**FINAL-02** — Host sees a summary showing every participant's name and amount owed; if items remain unclaimed at finalization, host chooses to split them among all participants or assign them to the host.

---

## Coverage Summary

| ID | Category | Phase |
|----|----------|-------|
| OCR-01 | Camera capture | Phase 2 | COMPLETE (02-01) |
| OCR-02 | Image preview | Phase 2 | COMPLETE (02-01) |
| OCR-03 | OCR extraction | Phase 2 | COMPLETE (02-01) |
| OCR-04 | OCR failure handling | Phase 2 | COMPLETE (02-01) |
| CORR-01 | Inline item edit | Phase 2 | COMPLETE (02-02) |
| CORR-02 | Delete spurious rows | Phase 2 | COMPLETE (02-02) |
| CORR-03 | Add item manually | Phase 2 | COMPLETE (02-02) |
| CORR-04 | Edit tax/tip | Phase 2 | COMPLETE (02-02) |
| CORR-05 | Quantity expansion | Phase 2 | COMPLETE (02-02) |
| SESS-01 | Session creation | Phase 2 | COMPLETE (02-02) |
| SESS-02 | QR code display | Phase 2 | COMPLETE (02-03) |
| SESS-03 | Copy link fallback | Phase 2 | COMPLETE (02-03) |
| JOIN-01 | Participant name entry + join | Phase 3 | COMPLETE (03-02) |
| JOIN-02 | Participant joined broadcast | Phase 3 | COMPLETE (03-02) |
| CLAIM-01 | Tap to claim / unclaim | Phase 4 |
| CLAIM-02 | Shared item split | Phase 4 |
| CLAIM-03 | Duplicate item claiming | Phase 4 |
| CLAIM-04 | Claim indicators visible to all | Phase 4 |
| SYNC-01 | Real-time claim broadcast | Phase 4 |
| SYNC-02 | Reconnect full-state snapshot | Phase 3 | COMPLETE (03-02) |
| MATH-01 | Proportional tax | Phase 5 |
| MATH-02 | Proportional tip | Phase 5 |
| MATH-03 | Totals sum exactly | Phase 5 |
| FINAL-01 | Per-person summary | Phase 5 |
| FINAL-02 | Host summary + unclaimed handling | Phase 5 |

**Total v1 requirements: 25**
**All mapped to a phase: yes**

---

## v2 Requirements (Deferred)

- Live camera viewfinder with crop guidance overlay (getUserMedia + canvas, in-app viewfinder rather than native camera app)
- Share individual total via native share sheet (`navigator.share()`)
- PWA offline support / installable app
- Session expiry countdown indicator ("Session expires in ~4 hours")
- OCR confidence flagging: visually highlight low-confidence rows for correction
- Camera image quality guidance overlay at capture time ("lay receipt flat, good lighting")
- Host item override after claiming has started
- "Add to home screen" PWA install prompt

---

## Out of Scope

- User accounts, login, or session history — sessions are ephemeral and anonymous
- In-app payment processing — the app shows what each person owes; they settle externally
- Even-split mode — this product is item-level splitting only
- Custom tip percentage per person — tip is distributed proportionally, no per-person customization
- Editing item prices after claiming has started — items lock at session creation
- Multi-currency support
- In-app chat or dispute resolution
- Native mobile app (iOS/Android) — mobile web browser only
- Barcode or menu scanning — receipt splitting only, not order management
- Session history or receipt archive — disposable sessions only
