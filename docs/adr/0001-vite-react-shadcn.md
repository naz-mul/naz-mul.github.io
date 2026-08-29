# ADR-0001 — Rebuild on Vite + React + shadcn/ui

**Status:** accepted · **Date:** 2026-08-29
**Supersedes:** the Start Bootstrap Freelancer / Gulp / LESS stack (2017–2026)

## Context

The site was a 2017-era Start Bootstrap "Freelancer" template: Bootstrap 3 and jQuery
from CDN, LESS sources that were never compiled, and a Gulp + Browser-Sync dev server.
Its content described a Java/Spring developer whose newest project was dated December
2016 — roughly a decade behind the actual career.

A content refresh alone was not enough: the template's visual language (star dividers,
skill icon walls, emoji register) actively worked against presenting an experienced
engineer.

## Decision

Rebuild on **Vite + React 19 + Tailwind v4 + shadcn/ui**, with TypeScript in strict mode.

Remove entirely: Bootstrap, jQuery, the `less/` directory (never compiled), `gulpfile.js`,
`403.html` and `50x.html` (GitHub Pages only ever serves `404.html`), and the PWA manifest
link plus its twelve orphaned icons.

## Alternatives considered

**Astro with React islands** was recommended. The content is text-only with no
interactivity beyond a theme toggle, so a static generator would ship near-zero JS and
put the prose in the HTML, where crawlers and no-JS clients can see it. React ships a
runtime to render static prose.

This was raised explicitly during planning and **declined in favour of React**, which the
owner uses daily and wants to keep sharp. That is a legitimate reason; it is recorded
here so the trade-off is not rediscovered as a bug.

## Consequences

- Familiar stack; shadcn primitives are generated rather than hand-written.
- Roughly 67 kB gzipped of JS to render text. Mitigated by the multi-page build
  ([ADR-0002](0002-multi-page-not-spa.md)), which keeps each route's payload small.
- Content is not in the served HTML — see [ADR-0006](0006-client-rendered-html.md).
