# ADR-0002 — Multi-page build, not a single-page app

**Status:** accepted · **Date:** 2026-08-29

## Context

The site has five real routes: the home page and four case studies. It is deployed to
GitHub Pages as static files, with no server able to rewrite URLs.

A React SPA on GitHub Pages hits a well-known problem: a deep link like
`/work/cisco/` is a request for a file that does not exist, so Pages serves `404.html`.
The usual workaround is to make `404.html` an SPA shim that redirects into the app.

That workaround collides with something this site actually wants: **a real 404 page**.
One file cannot be both a genuine error page and a redirect shim.

## Decision

Build a **Vite multi-page application**. Every route is its own HTML entry point with
its own mount script, listed in `rollupOptions.input`.

No router dependency. No client-side navigation.

## Consequences

- Deep links resolve as plain static files. Verified: `/work/optum/` returns 200 directly.
- `404.html` stays a genuine error page.
- Each route loads only its own code plus a shared vendor chunk.
- Navigation is a full page load. At this size that is imperceptible and costs nothing.
- **Adding a route requires three coordinated changes**: the HTML entry point, the mount
  script, and the `rollupOptions.input` registration. Miss the third and the page is
  silently absent from the build. This is the main ergonomic cost.
