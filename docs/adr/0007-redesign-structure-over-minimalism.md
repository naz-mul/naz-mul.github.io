# ADR-0007 — Redesign: structure over minimalism

**Status:** amended by the selected Developer Workspace on 2026-10-15 · **Date:** 2026-08-29
**Amends:** the visual direction recorded in the original rebuild

## 2026-10-15 amendment

The owner rejected the subsequent Engineering Publication exploration as too
academic, requested a coder's haven, supplied Trace Developer as a reference and
selected Developer Workspace. The current structure is explorer navigation, a
continuous README canvas, sequential in-progress work summaries and an optional
personal/context rail. Mobile uses normal disclosed navigation and one reading
column; articles keep a quieter technical prose setting.

Geist Sans now carries headings and prose; Geist Mono carries code and metadata.
The blue/green workspace palette, focus and syntax-highlight colors are measured by
the current contrast/gamut checker. Self-hosted fonts, system/light/dark themes and
reduced motion remain constraints. The incumbent Newsreader/texture stylesheet is
retained outside the Astro dependency graph. The earlier exact palette, sharp-corner
and decorative devices below are historical, not instructions to restyle the
selected composition. [ADR-0009](0009-astro-staged-publication.md) records the new
generation architecture; this visual amendment does not claim a live release.

## Context

The first build was described by its owner as "too plain and lifeless", and that was
fair. It was centred text in a `max-w-3xl` column, one small round photo, uniform
section spacing, a single muted accent, and no visual interest beyond font size.

Two causes, both identifiable after actually researching the field:

1. **It was the shadcn default look.** Neutral palette, `0.5rem` radius on everything,
   default type sizes, muted indigo accent, 1px card borders. That combination is a
   recognisable fingerprint of an untuned component library.
2. **Restraint was doing no work.** A single centred column has no structural interest
   to begin with, so "restrained editorial" removed the little that remained. Deliberate
   restraint and an unstyled document look identical unless something else carries the
   design.

A third finding shaped the palette: a cream/warm background with a serif face has
recently become shorthand for generic AI-generated design. The original direction was
drifting straight into it.

## Decision

Redesign around **structure** rather than minimalism, keeping the content and stack.

**Move every default that reads as untuned:**

| Default | Now |
|---|---|
| `--radius: 0.5rem` | `--radius: 0` — sharp throughout |
| slate/zinc neutrals | faintly cool neutrals; explicitly not warm cream |
| muted indigo accent | teal, `oklch(0.529 0.088 205)` light / `oklch(0.80 0.11 200)` dark |
| default Inter | three self-hosted faces, each with one job |

**Add structure the single column lacked:**

- A **10rem left rail** at ≥1024px carrying mono section numbers and labels. This is the
  main fix — it varies horizontal placement instead of stacking everything centred.
- **Large scale contrast** — display type to 5.5rem against 1rem body.
- **Texture and depth** — a grain overlay, a masked hairline grid field behind heroes,
  sunken panels for the trade-offs section of each case study.
- **Mono as a structural device** — `.label` for every heading, metadata key, tag and
  date. It is the site's most recognisable element and it reads as engineering.
- A **spec block** under each hero, standing where a product screenshot would go on a
  site whose work could be shown.

## Typography

Self-hosted variable woff2, ~171 KB total, served same-origin — the zero-third-party
rule (ADR-0004) is unchanged, which is why these are files in the repo and not a Google
Fonts link.

- **Newsreader** — display and long-form prose
- **Geist Sans** — UI
- **Geist Mono** — labels, metadata, numbers

## Colour is verified, not eyeballed

The first pass at this palette had three real defects, caught by measurement rather than
by eye: the mono labels failed WCAG AA in both themes (3.48:1 and 3.65:1), the accent
failed against sunken panels, and **the light accent was outside the sRGB gamut** — it
would have clipped to an unpredictable colour on any non-P3 display.

`scripts/check-contrast.py` (`yarn check:contrast`) now parses the CSS directly and
asserts WCAG AA for every foreground/surface pair plus sRGB containment for every token,
in both themes. The light accent's chroma sits exactly at the sRGB maximum for its
lightness and hue; raising it clips rather than saturates.

## Consequences

- The page reads as a designed document rather than an unstyled one.
- The rail collapses below 1024px, so the mobile layout is a plain stack — the labels
  still carry it, but the structural device is desktop-only.
- The dark palette is declared twice (media query and `.dark` class) and must be kept in
  sync; plain CSS offers no way to share the block.
- 171 KB of fonts is real weight on a text site. Accepted: they are the single largest
  contributor to the design not looking generic.

## Deliberately rejected

- **Drop caps** (`initial-letter`) — no Firefox support. Small-caps openers instead.
- **Hanging punctuation** — Safari-only, ~16% global support.
- **Scroll-driven animation** — decorative here, and a live risk under reduced-motion.
- **Warm cream + serif** — the current generic-AI signature.
