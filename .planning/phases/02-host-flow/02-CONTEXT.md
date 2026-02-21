# Phase 2: Host Flow - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Host-side experience only: photograph a receipt, review and correct extracted items (name, price, quantity), edit tax and tip, then share a QR code or join link. No participant joining or item claiming in this phase.

</domain>

<decisions>
## Implementation Decisions

### OCR Correction UI
- Tax and tip field placement: Claude's discretion (pinned vs scrollable)
- Inline edit interaction (tap-to-edit vs bottom sheet): Claude's discretion
- Quantity adjustment (stepper vs tap-to-type): Claude's discretion
- Add missing item flow (blank row vs bottom sheet): Claude's discretion

### Claude's Discretion
- All OCR correction UI interaction patterns — user deferred to Claude on every choice
- Camera capture experience (guidance overlay, preview layout, retake flow)
- Loading and error states during OCR processing
- Share screen design (QR code prominence, copy link, session info shown)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User deferred all implementation choices to Claude.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-host-flow*
*Context gathered: 2026-02-21*
