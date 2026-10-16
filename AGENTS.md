# Agent guide — nalam.me

Personal site of Nazmul Alam. The current source uses **Astro static output, React
islands, Tailwind v4 and selected shadcn primitives**. GitHub Pages still serves the
committed branch-root files; a local build prepares a new artifact without replacing
them.

**Start here:** `CONTEXT.md` for vocabulary; `README.md` for the current architecture
and commands. For architectural changes, read [ADR-0009](docs/adr/0009-astro-staged-publication.md)
and the relevant earlier ADR. Preserve the existing dirty work.

## Build and publication boundaries

- **Yarn 4 only; Node 24.16.0.** Exact versions and scripts live in `package.json`,
  `.node-version` and `yarn.lock`. Use the supported Node 24 line.
- **Astro generates `dist/site-build`; validation exports `dist/public`.** `yarn build`
  runs explicit checks, the static build and public preparation. It also synchronizes
  that artifact's CSP hashes into local `firebase.json`. It does not publish root files,
  commit, push, deploy or change Firebase resources.
- **The repository root is a publication destination, never Astro's output directory.**
  It contains source, documentation, static assets and the incumbent generated site.
  `yarn publish:root` previews a guarded ownership-based plan. Applying root changes
  and any commit/push require the user's release authorization; follow
  [the publication runbook](docs/operations/publication.md).
- **Preserve the incumbent Vite recovery path.** Its configuration still needs
  `emptyOutDir: false`. `legacy:build`, `clean` and `sync:static` can change root output;
  they are recovery tools, not ordinary Astro build steps. Never empty or mirror-delete
  the repository root.
- **Ordinary static navigation.** Every eligible route is useful HTML before JavaScript;
  `/404.html` is a genuine non-indexable error document. There is no SPA catch-all or
  client router.
- **One publication projection.** `getPublication()` in `src/content/publicationData.ts`
  supplies routes, metadata, writing, showcase and build-only export. A raw build and
  `/publication-manifest.json` are tooling inputs, not the deployable site. Preview only
  `dist/public` with `yarn preview`.

## Editing map

| Goal | Files |
|------|-------|
| Identity, reviewed career and client contributions | `src/content/site.ts` |
| Experience route introduction | `src/content/routePages.ts` |
| Original technical writing | `src/content/articles/*.md` or trusted local `*.mdx` |
| Featured work / curated external metadata | `src/content/showcase.ts` |
| Publication eligibility, validation and canonical rules | `src/content/publication.ts`, `src/content.config.ts` |
| Legacy URL compatibility and reviewed metadata | `src/content/routes.ts` |
| Static route generation / reading | `src/pages/`, `src/components/reading/` |
| Homepage / shared shell / explorer / theme island | `src/pages/index.astro`, `src/components/workspace/` |
| Workspace and reading styles | `src/styles/workspace.css`, `src/styles/reading.css` |
| Incumbent Vite typography/tokens (outside the Astro dependency graph) | `src/styles/globals.css` |
| Public-asset source | `src/public/` |
| Firebase browser app | `src/lib/firebase/`, `src/components/FirebaseBootstrap.astro` |
| Export / root publication / rollback | `scripts/publication/`, `scripts/prepare-public.mjs`, `scripts/publish-root.mjs` |

For **new writing, publication state, project details or LinkedIn entries**, follow
[the authoring guide](docs/operations/authoring.md). For **release, recovery, ownership
conflicts or future Firebase Hosting**, follow [the publication runbook](docs/operations/publication.md).

## Preserved product constraints

- **Reviewed public content only.** Committed source in this public repository is public
  even if its record is marked draft. Keep private authoring in ignored
  `.private-drafts/`; `.private-preview/`, `dist/` and `docs/resume/` remain excluded.
  Never publish or use private CV contents as an artifact input.
- **Claims stay bounded.** Name clients but genericise their systems. Preserve reviewed
  ownership, evidence labels and confirmed metrics. The three new featured areas are
  **In progress**; do not create delivered outcomes, empty detail routes or invented
  demo/repository links. Principal/architect are goals, not current titles.
- **Original writing is site-owned; LinkedIn is curated metadata.** Use actual reviewed
  external article URLs and the explicit Read on LinkedIn label. No import, scrape,
  embed, token storage or automatic provider request is part of the current site.
- **Zero third-party runtime requests.** Bundle local assets and self-host fonts.
  Firebase imports only `firebase/app`; public reading never waits for initialization.
  Products, analytics and remote deployment need a concrete separately requested feature.
- **System/light/dark.** Classless HTML follows the OS in CSS; `.light` and `.dark`
  override. Preserve the guarded pre-paint bootstrap and both dark-token declarations.
- **Developer Workspace.** Use the explorer, README canvas, sequential project rows
  and optional context rail. Geist Sans carries headings/prose; Geist Mono carries
  labels/code. The prior serif-led design is historical. Consult the current `DESIGN.md`
  when present before changing the visual system.
- **Contrast and gamut are measured.** Run `yarn check:contrast` after changing colors;
  retain keyboard focus, reduced motion and usable narrow-screen reading.

## Verification

`yarn build` is the normal complete local build. `yarn check` runs Astro diagnostics
and TypeScript. `yarn verify` adds contrast/gamut and focused unit/fixture checks.
After preparing the artifact, `yarn test:e2e` exercises `dist/public`; stop a separately
running preview first. See [browser-suite scope](tests/e2e/README.md) for evidence and
limits. Browser results and the publication report stay under ignored `dist/`.

Yarn 4 does not automatically run custom `pre`/`post` hooks. Keep required stages
explicitly chained in the main scripts. The two scoped checker `packageExtensions`
in `.yarnrc.yml` repair released manifests; remove them only after verifying the
upstream fixes. Unused Firebase compatibility-package peer warnings are documented
in [the Firebase boundary](src/lib/firebase/README.md).

## Repository agents

- **Issues and native dependencies:** [issue tracker guide](docs/agents/issue-tracker.md).
- **Triage roles:** [triage labels](docs/agents/triage-labels.md).
- **Vocabulary and ADRs:** [domain guide](docs/agents/domain.md).
