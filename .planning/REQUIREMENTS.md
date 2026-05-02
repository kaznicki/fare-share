# Requirements: Fare Share v1.2.1

## v1.2.1 Requirements

### BRAND — Rebrand to Fare Share

**BRAND-01** — All user-visible "Tab Splitter" strings are replaced with "Fare Share" across the app: page `<title>`/metadata, README, `package.json` name, and any other user-facing copy. Internal git history may retain references.

**BRAND-02** — A simple logo (visual mark) exists in the repo and is referenced from both start pages. Static SVG/PNG is acceptable; no animation or build step required.

---

### ONBOARD — Start Page Identity & Guest Onboarding

**ONBOARD-01** — The "Fare Share" title (with logo) is displayed at the top of the host start page (`/host`).

**ONBOARD-02** — The "Fare Share" title (with logo) is displayed at the top of the guest join page (the page guests land on after scanning the QR / opening the link).

**ONBOARD-03** — The guest join page shows a brief app description explaining what Fare Share does (one or two short sentences — enough to orient a first-time guest).

**ONBOARD-04** — The guest join page shows usage instructions for how a guest claims items in a session (short, scannable — fits above the fold on mobile).

---

## Coverage Summary

| ID | Category | Phase | Status | Validated |
|----|----------|-------|--------|-----------|
| BRAND-01 | Rename Tab Splitter → Fare Share | Phase 9 | Pending | — |
| BRAND-02 | Logo asset + integration | Phase 9 | Pending | — |
| ONBOARD-01 | Title on host start page | Phase 9 | Pending | — |
| ONBOARD-02 | Title on guest join page | Phase 9 | Pending | — |
| ONBOARD-03 | App description on guest page | Phase 9 | Pending | — |
| ONBOARD-04 | Guest usage instructions | Phase 9 | Pending | — |

**Total v1.2.1 requirements: 6**

---

## Future Requirements (Deferred)

*(none specific to this milestone — see archived v1.1 requirements for the deferred v2 list, which still applies)*

---

## Out of Scope

- Rebranding internal code symbols, type names, or function names — user-visible strings only
- Animated logo, theming, or dark mode support — static visual mark is sufficient
- Translating the app description / instructions — English only for this milestone
- Onboarding overlay, tooltips, or interactive tutorial — static copy on the join page only
- Adding instructions to the host page (host already has guidance)
