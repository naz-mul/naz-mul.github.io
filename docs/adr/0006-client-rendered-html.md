# ADR-0006 — Client-rendered HTML (known limitation)

**Status:** accepted, with a known remedy · **Date:** 2026-08-29

## Context

Following [ADR-0001](0001-vite-react-shadcn.md), pages are React applications mounted at
runtime. The served HTML is a shell:

```html
<div id="root"></div>
<script type="module" src="/assets/home-*.js"></script>
```

All prose — the bio, every case study — lives in the JavaScript bundle, not the HTML.

This is the concrete form of the cost flagged when Astro was declined. It was not fully
articulated at the time, so it is recorded here explicitly.

## What still works

Metadata is static in every entry point:

- `<title>` and `<meta name="description">`
- `og:` tags — link previews and social cards render correctly
- `Person` JSON-LD on the home page
- Canonical URLs

Google executes JavaScript, so indexing works.

## What does not

- A client that does not run JS sees an empty page.
- Crawlers that do not execute JS see only the metadata.
- First contentful paint waits for the bundle.

## Decision

**Accept for now.** The metadata carries the cases that matter most in practice — search
indexing and link previews — and the site is small enough that the paint delay is
negligible.

## The remedy, when it is wanted

Prerender each route to static HTML at build time with `react-dom/server`, keeping React
for hydration. Roughly 30 lines in the build config; no change to the stack, the
components, or the content file. It would put every word of the prose into the served
HTML while leaving the theme toggle working.

Revisit this ADR when acting on it.
