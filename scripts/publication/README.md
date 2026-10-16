# Validated static publication

Astro only generates `dist/site-build`. `prepare-public.mjs` validates that
disposable build and creates a fresh `dist/public` plus the private-to-tooling
`dist/publication-report.json`. Neither building nor preparing publishes files at
the branch root. GitHub Pages still serves the currently committed root output.

Run through Yarn scripts when available, or use these Node 24 commands:

```sh
node --test scripts/publication/publication.test.mjs
node scripts/prepare-public.mjs
node scripts/publish-root.mjs
```

The last command prints a dry-run write/removal plan. It never changes root
output without the explicit `--apply` flag. Root publication, commit/push and live
verification belong to the separately authorized release. The tooling itself
does not run Git, change hosting settings or deploy to Firebase.

## Artifact boundary

The build-only `/publication-manifest.json` supplies the eligible route, metadata
and approved-image contract. It is excluded from the public artifact. The exporter
includes:

- Every eligible real route and the useful non-indexable `404.html`.
- The reachable emitted asset graph, including literal dynamic imports, Vite's
  explicit preload table, island component/renderer URLs, stylesheets and CSS URL
  dependencies. Computed imports fail closed except Astro's generated island
  loader, whose component/renderer URLs are validated from the HTML attributes.
- Only referenced approved image paths and the explicitly named self-hosted font
  files. A copied source font or emitted chunk that is not referenced is omitted.
- Explicit safe `CNAME`, `favicon.ico` and an empty `.nojekyll` marker.
- `/sitemap.xml`, projected from the eligible indexable routes. If Astro emits
  sitemap indexes, their membership must match the same contract; the plugin's
  intermediate sitemap files are omitted from the public artifact.

Source/configuration, drafts, admin paths, tests, workflow/mocks, dependencies,
`docs/resume`, source maps and undeclared HTML are rejected. Unexpected build files
fail closed rather than silently becoming an export candidate. All paths are
bounded relative paths; symlinks and special files are rejected before reads or
writes. The report and Firebase configuration remain outside `dist/public`.

Rendered HTML is parsed with `parse5`. Each route needs its exact title,
description, canonical and Open Graph values, useful expected main text, matching
robots state and ordinary valid links. Local targets/fragments must resolve and
every indexable route must be reachable from the home route. Remote navigation
links may use HTTPS or reviewed mailto destinations; runtime resources must stay
same-origin. `es-module-lexer` and PostCSS inspect emitted imports and CSS; no
browser script is executed during packaging.

Quoted CSS URL payloads are tokenized as strings, so an embedded SVG's internal
`url(#filter)` is not mistaken for another CSS resource. Bounded data-image URLs
are treated as embedded data rather than filesystem paths. Decoded SVGs still
pass the same script/event/embedded-document and remote-resource checks as
approved SVG files; nested embedded images have a validation depth limit.

This static graph does not establish runtime network privacy, hydration behavior,
accessibility or provider behavior. Those require the browser and release checks.
Image/claim review is also separate from a file's eligibility.

## Root ownership and recovery

`legacy-root-inventory.json` names the exact known pre-Astro generated output and
its SHA-256 identities, including the existing uncommitted generated baseline. It
does not claim ownership of every file in `assets/`, `img/`, `fonts/` or the root.
The first publication refuses a changed baseline; review a new inventory
deliberately rather than regenerate one automatically to bypass the check.

After publication, `.publication-inventory.json` atomically records the exact
owned destinations and identities. Subsequent publication verifies these files
before planning any write/removal. It removes only stale previously owned files.
Protected `CNAME`, `.nojekyll` and `favicon.ico` must already match the artifact and
are preserved. Existing identical approved fonts/images remain user-owned. Any
other unowned destination collision stops the entire operation before root
output changes. Source, docs and unrelated assets stay outside ownership.

An applied transaction is retained under
`dist/publication-backups/<transaction>/`, containing all prior owned output,
prior/subsequent inventories and the operation record. A publication error
attempts to restore its prior output and retains that recovery record. Do not
delete these local backup artifacts during the release/recovery window.

After a separately authorized publication, inspect the rollback preview first:

```sh
node scripts/publish-root.mjs --rollback dist/publication-backups/TRANSACTION
```

The explicit `--apply` flag applies that reviewed rollback. Rollback verifies the
saved bytes, current inventory and every current owned file; it refuses to
overwrite edits made after publication or a newer publication. This restores
local owned output; a live GitHub Pages rollback still needs a scoped, authorized
commit/push and live read-back. There is no reset, force push or root mirror-delete.

Fixture tests use isolated temporary mixed roots and exercise publication,
idempotence, stale-owned removal, preservation, rollback and unsafe-input failure.
The `--root`, `--artifact`, `--report` and `--legacy-inventory` flags support those
isolated fixtures; production defaults remain the current repository.

## Future Firebase Hosting

`firebase.json` deliberately selects only `dist/public`, ordinary static routes
and the genuine `404.html`. It has no catch-all rewrite, server adapter, target,
site or remote-project binding. Ignore patterns are secondary defenses; the
validated artifact is the actual public selection boundary.

Synchronize the exact build's enforceable CSP explicitly after the final build:

```sh
node scripts/prepare-public.mjs --write-hosting-csp
```

This local command replaces the initial unfinalized Report-Only policy with a
hash-based enforced policy in `firebase.json`. All emitted inline script bodies
(including the theme/bootstrap snippets), inline style elements and style
attribute values are hashed. `script-src` permits self plus those exact hashes;
script attributes are denied. `style-src-elem` permits self plus exact element
hashes. `style-src-attr 'unsafe-hashes'` permits only the known style values,
including build-time syntax-highlighter colors. The policy never permits blanket
inline script/style execution. Any later build/content change requires another
synchronization. Validate the resulting policy against actual browser behavior
before any future Hosting preview or promotion.

HTML/default responses revalidate, content-hashed emitted assets have immutable
caching, stable fonts/images have bounded caching, sitemap caching is short and
the explicit 404 response is not cached. Firebase matches headers against the
requested path; actual directory/404/cache/CSP behavior still needs provider
preview verification. No remote resources, preview channel or deployment have
been created by these tools. Confirm the intended project/site, domain, routes,
response status/headers, recovery and privacy before a separately requested move.

References: [Firebase Hosting configuration](https://firebase.google.com/docs/hosting/full-config)
and [CSP style attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src-attr).
