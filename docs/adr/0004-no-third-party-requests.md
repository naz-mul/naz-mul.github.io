# ADR-0004 — Zero third-party requests

**Status:** accepted · **Date:** 2026-08-29

## Context

The old site loaded Bootstrap, Font Awesome, font-mfizz, jQuery and Google Fonts from
CDNs, and ran both Google Analytics (`gtag`) and Google Tag Manager. It also linked a
`/manifest.json` that did not exist, 404ing on every page load.

Analytics on a personal site answers a question nobody was asking. Nobody was reading
the dashboard, and the data collected was visitors' — not the owner's.

## Decision

The site makes **no requests to any other origin**. Specifically:

- No analytics. GA4 and GTM both removed.
- No CDN. Everything is bundled and self-served.
- No webfonts. Typography is system stacks — the serif display face resolves to New York
  on Apple platforms, Georgia elsewhere.
- No PWA manifest or icons.

## Consequences

- No cookie or consent banner is needed, because there is nothing to consent to.
- Nothing to break when a CDN changes a URL or an analytics snippet is deprecated.
- Faster and more private by construction.
- **No visitor data at all.** Deliberate. If a question ever genuinely needs answering,
  revisit this ADR rather than quietly adding a script.
- Typography is constrained to what ships with operating systems. Adding a face means
  self-hosting it — a Google Fonts `<link>` would break this decision.

## Verification

Part of the release check: the network panel on the built output must show only
same-origin requests, and the output must grep clean for `gtag`, `googletagmanager`,
`bootstrap`, `jquery`, `manifest.json` and CDN hosts.
