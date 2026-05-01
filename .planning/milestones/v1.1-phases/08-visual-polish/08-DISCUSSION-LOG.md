# Phase 8: Visual Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 08-visual-polish
**Areas discussed:** Primary color, Typography & font, Card & surface treatment, Polish depth & scope

---

## Primary Color

| Option | Description | Selected |
|--------|-------------|----------|
| Blue-600 everywhere | Most buttons already use blue-600; indigo gets replaced | |
| Indigo-600 everywhere | More premium feel; would require retinting all blue buttons | |
| Keep both intentionally | Indigo for financial moments; blue for action buttons | ✓ |

**User's choice:** Keep both intentionally

**Follow-up — split rule:**

| Option | Description | Selected |
|--------|-------------|----------|
| Indigo = financial moments; blue = actions | Indigo on money text + session CTAs; blue on host action buttons | ✓ |
| Indigo = session screens; blue = host screens | File-level route split | |
| Indigo = primary CTA per screen; blue = secondary | Hierarchy-based split | |

**User's choice:** Indigo = financial moments; blue = actions

**Follow-up — "Join as host" edge case:**

| Option | Description | Selected |
|--------|-------------|----------|
| Stay indigo | Session-entry moment, not a utility action | ✓ |
| Flip to blue | It's an action button leading to the claiming flow | |

**User's choice:** Stay indigo

---

## Typography & Font

**Geist Sans activation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Remove Arial override | Activates Geist Sans (already configured via next/font) | ✓ |
| Keep Arial | No visual change; leave font as-is | |

**User's choice:** Remove Arial override

**Heading unification:**

| Option | Description | Selected |
|--------|-------------|----------|
| Unify to text-2xl font-bold | Bumps OcrReview to match all other screens | ✓ |
| Leave as-is | OcrReview's smaller heading is defensible given scrolling content | |

**User's choice:** Unify to text-2xl font-bold

---

## Card & Surface Treatment

**Shadow consistency:**

| Option | Description | Selected |
|--------|-------------|----------|
| Shadow everywhere it's a card | shadow-md on all white card containers | ✓ |
| Shadow only on entry/landing cards | Pre-session = shadow; in-session = flat | |
| No shadows anywhere | Border-only throughout for a flatter look | |

**User's choice:** Shadow everywhere it's a card

**OcrReview card treatment:**

| Option | Description | Selected |
|--------|-------------|----------|
| Leave it flat | Functional form, not a card; shadow would be awkward | |
| Card wrapper on footer area only | TaxTipFields + Create Session footer gets shadow-md; item list stays flat | ✓ |
| You decide | Claude handles based on what looks consistent | |

**User's choice:** Card wrapper on footer area only

---

## Polish Depth & Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix the 4 inconsistencies only | Color, font, headings, shadows — nothing else changes | ✓ |
| Fix inconsistencies + tighten spacing | Also normalize vertical padding/gap patterns across screens | |
| Full deliberate pass | Every screen reviewed for spacing, alignment, visual hierarchy | |

**User's choice:** Fix the 4 inconsistencies, nothing more

---

## Claude's Discretion

None — all gray areas were explicitly decided by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
