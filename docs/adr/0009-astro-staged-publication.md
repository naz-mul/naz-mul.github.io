# ADR-0009 — Astro documents with staged publication

**Status:** accepted for the local implementation · **Date:** 2026-10-15
**Supersedes:** the Vite choice in [ADR-0001](0001-vite-react-shadcn.md) and the
Vite-specific route/prerender mechanisms in [ADR-0002](0002-multi-page-not-spa.md)
and [ADR-0008](0008-local-prerendered-route-manifest.md).
**Amends:** [ADR-0003](0003-build-output-at-repo-root.md) generation/publication
separation. The static route, meaningful HTML, genuine 404, privacy and reviewed
claim constraints remain accepted.

## Context and decision

The owner selected Developer Workspace after rejecting the earlier academic
presentation, then explicitly chose **Astro static output + React islands** for
engineering work and original technical writing. The incumbent Vite/React build
already produced useful static HTML, real deep links and consistent metadata;
Astro is an authoring and composition decision, not a repair for missing SEO.

Use Astro for static reader documents and Markdown/MDX collections, retaining
React for actual interaction such as the theme control. Ordinary Markdown is the
prose default; trusted local MDX is available for substantive embedded components.
Keep Tailwind v4, local assets and justified existing primitives. The workspace
appearance uses normal HTML/CSS rather than a terminal/editor runtime.

One strict publication projection derives eligible route metadata, discovery,
writing and featured work from reviewed records. It adapts the legacy route and
career evidence instead of recreating independent URL lists. Work state,
publication state and knowledge state are separate. Preserve all eight established
indexable paths, add `/writing/`, and keep a useful non-indexable `/404.html`.
The build-only manifest is a validation contract, excluded from the public artifact.

Generate into disposable `dist/site-build`, then construct a fresh allowlisted
`dist/public`. The exporter validates meaningful HTML, exact metadata, ordinary
links/fragments, route reachability, sitemap membership and the reachable
same-origin resource graph. It rejects unapproved source/configuration, drafts,
source maps, unknown documents and unsafe filesystem paths. Metadata filtering
alone is not a private/public file boundary.

GitHub Pages continues to serve committed branch-root output. A separate dry-run
publisher verifies exact owned files and identities; explicitly applying a reviewed
plan copies only those destinations and removes only stale previously owned
output. It preserves protected markers and unrelated work, saves transactional
prior output and provides guarded rollback. Source generation never empties or
mirror-deletes the repository root. A build, a local root publication, a commit/push
and a verified live release remain separate operations.

## Preserved boundaries

- Committed authoring source is public. Private drafting remains local/ignored and
  outside collection and artifact inputs; `docs/resume/` stays excluded.
- Original writing is self-canonical on nalam.me. Curated LinkedIn records contain
  reviewed metadata and explicit external reading links, without imported bodies,
  local mirrors, automatic provider requests or token storage.
- The three new featured areas remain **In progress**. Reviewed summaries can be
  public without invented detailed outcomes or links. Existing client case studies
  retain their contribution/evidence limits; principal/architect remain goals.
- The supplied modular `firebase/app` is bundled and initialized through a guarded
  browser-only lifecycle. Reading never awaits it. No Firebase product or remote
  deployment follows from app initialization. Runtime same-origin behavior requires
  actual built-page request evidence.
- `firebase.json` prepares future classic Hosting from `dist/public` only, with no
  SPA catch-all or active project/site binding. Actual provider routing, 404,
  cache/header/CSP behavior and a host cutover remain future verified work.
- Zero third-party automatic requests, self-hosted typography, CSS system/light/dark
  behavior, contrast/gamut checks and honest reviewed claims remain constraints.

## Alternatives and consequences

Keeping the existing Vite/React route manifest would preserve familiar tooling and
static delivery but require additional local Markdown/MDX authoring machinery.
Next.js static export would suit a preference for React/App Router throughout; no
server feature is required for the approved portfolio. The owner selected Astro's
content collections and small interactive islands instead.

The migration introduces collection/schema tooling and explicit artifact validation,
with more packaging checks than a direct root build. That cost protects the mixed
public repository and supports future static Hosting without moving providers now.
Existing Vite source/configuration remains recoverable, with its load-bearing
`emptyOutDir: false`; its direct root-writing scripts are outside normal builds.

The selected composition and implementation do not establish a live release.
[Authoring](../operations/authoring.md) and [publication/recovery](../operations/publication.md)
record current procedures. Exact package pins, scoped checker-manifest repairs and
verification commands belong to the toolchain/runbook rather than a second ADR
version registry.
