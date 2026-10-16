# ADR-0008 — Local prerendering from one route manifest

**Status:** Vite-specific mechanism superseded by [ADR-0009](0009-astro-staged-publication.md) on 2026-10-15 · **Date:** 2026-09-03
**Supersedes:** [ADR-0006](0006-client-rendered-html.md)

## 2026-10-15 amendment

Astro's static generation and the common reviewed publication projection replace
the Vite client-plus-local-SSR sequence below. Complete meaningful HTML, ordinary
links, one eligibility/metadata/discovery contract, preserved public URLs and a
genuine non-indexable 404 remain required. The legacy route records are adapted for
compatibility instead of becoming a second current route list. Output is staged
and validated before any separately authorized root publication.

## Context

ADR-0006 accepted client-rendered HTML as a temporary limitation. The expanded site now
has a home route, four work routes, an experience route, and technical notes. Maintaining
Vite inputs, mount scripts, metadata, navigation, and discoverability as separate lists
would let a route build successfully while remaining empty to non-JavaScript clients,
missing from the sitemap, or orphaned from internal links.

The hosting constraints have not changed: GitHub Pages serves committed files from the
repository root, there is no production server, `404.html` must remain a genuine error
document, and the site must make no runtime third-party requests.

## Decision

Use one typed route/content manifest as the contract for every real HTML route. A route
registration owns its URL path, source HTML input, client entry script, render identity,
metadata, navigation registration, indexability, and prerender expectation.

Keep Vite's multi-page client build and add a second local SSR bundle that uses React's
existing server API. After Vite emits the real HTML files, the local prerender step
serializes repository-authored React trees into each route's `#root`, validates the
result, and writes `sitemap.xml` from indexable manifest records. Production clients
hydrate the prerendered tree; development and any empty shell use `createRoot`.

The build rejects:

- duplicate paths, inputs, entry scripts, or canonical URLs;
- missing route inputs, client entries, metadata, renderers, or prerender expectations;
- drift between published work/note content and manifest registrations;
- missing generated metadata, empty output roots, incomplete prose, or orphaned
  crawlable routes.

`404.html` is registered and prerendered so it remains a useful error document, but it
is marked `noindex`, omitted from navigation, and excluded from the sitemap.

## Consequences

- Served route HTML contains meaningful prose and ordinary internal links before
  JavaScript runs.
- Route metadata, Vite inputs, hydration entries, navigation, and sitemap membership
  change through one contract.
- The build has two Vite phases: the preserved client MPA build and a temporary local
  SSR bundle used only to prerender output.
- `build.outDir` remains the repository root with `emptyOutDir: false`; asset cleaning
  and static-font synchronization remain explicit.
- There is no production rendering service, runtime fetch, router, or new dependency.
- No social image metadata is added: the site has no dedicated same-origin social card
  whose dimensions and route semantics support a defensible cross-route contract.

## Alternatives rejected

- **Continue client-only rendering:** leaves prose and internal links unavailable to
  clients that do not execute JavaScript.
- **Adopt a runtime or hosted prerender service:** conflicts with static GitHub Pages
  delivery and adds an external operational dependency.
- **Maintain separate route lists:** preserves the drift that the route contract is
  intended to make build-failing.
- **Replace the MPA with client-side routing:** would weaken real deep links and collide
  with the genuine 404 architecture recorded in ADR-0002.
