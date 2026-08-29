# ADR-0005 — Sanitised case studies as the evidence

**Status:** accepted · **Date:** 2026-08-29

## Context

The site needs to show evidence of senior engineering ability. The obvious forms were
unavailable:

- Since 2016, essentially none of the work is publicly showable — it is internal systems
  at Cisco, Fidelity, HMH, Optum and Fexco.
- The public GitHub trail ends in 2021, and its newest non-fork repositories are college
  projects.
- The old site's three "projects" (Sitar Player, SupremeBot, Datagram FTP) were student
  work from 2014–2016. Showing them as current evidence actively misrepresented the
  career.

## Decision

**Sanitised case studies** are the spine of the site. Four engagements — Cisco, Fidelity,
HMH, Optum — each described as problem, constraints, approach, trade-offs and outcome.

Clients are **named**; their systems are **genericised**. Naming is safe: every client
already appears on the CV and LinkedIn. Describing internal architecture is not.

The 2014–16 projects are **retired entirely**, not restyled.

## Rules

- **No invented metrics.** Every figure traces to the CV (7s→2s at WP Engine,
  5min→1.5min at Fexco). A new number must be confirmed before publishing.
- No internal architecture, proprietary identifiers, or unpublished metrics.
- The **trade-offs section is the point**. It is what distinguishes a case study from a
  job description: name the alternative that was rejected and why.
- Text is first-person and makes claims on the owner's behalf. It requires his review
  before publishing, and the drafts carry a notice in `src/content/site.ts` saying so.

## Consequences

- The site demonstrates judgement rather than listing technologies.
- Case studies age slowly — a trade-off stays interesting after the stack changes.
- They cannot be verified by a reader, which is inherent to non-public work.
- The Cisco study is necessarily the thinnest on specifics: the work is current and no
  publishable latency figure was available. It describes the problem domain rather than
  claiming outcomes.
