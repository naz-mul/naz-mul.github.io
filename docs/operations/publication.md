# Static publication and recovery

Use this runbook for an authorized GitHub Pages release, local output recovery or a
future Firebase Hosting migration. Ordinary implementation and preview stop at a
validated `dist/public` artifact. GitHub Pages still serves the committed branch
root; neither an Astro build nor a local preview changes the live site.

Implementation and preview authorization alone does not authorize root publication,
a commit, a push or a deployment. Obtain the user's release instruction before the
corresponding write.
The tooling never commits, pushes, edits Pages settings, changes DNS or contacts
Firebase. Applying a local root plan and verifying a remote release are separate
operations.

## Build and validate a candidate

1. Preserve the existing dirty source and root-output baseline. Record `git status
   --short`, current HEAD and relevant diffs; retain recoverable copies of any work
   that the release needs. Use the baseline captured for this implementation when
   comparing it; a clean checkout is not assumed.
2. Use the supported Node/Yarn versions, then run `yarn build`. The explicit sequence
   runs Astro/TypeScript, palette and focused behavioral/fixture checks, generates
   `dist/site-build`, validates it into `dist/public`, writes
   `dist/publication-report.json` and synchronizes local `firebase.json` CSP hashes.
3. Review the report and inspect `dist/public`. It must contain the complete eligible
   static routes and same-origin reachable resources, the genuine non-indexable
   `404.html`, `/sitemap.xml` and approved static markers. It must exclude the
   build-only manifest, source/configuration, private material, mocks, source maps,
   tests and dependencies. Build inputs and the report remain outside the artifact.
4. Run `yarn test:e2e` against the artifact, with any separately started preview
   stopped. Review `dist/verification/playwright-report.json` and retained failure
   traces. For manual inspection, `yarn preview` serves only `dist/public` at
   `127.0.0.1:4173`; do not expose the mixed repository root or raw build directory.
5. Inspect desktop/mobile layout against the approved composition, keyboard and
   narrow-screen reading, themes, no-JS HTML, direct legacy links, unknown-route
   status, the network trace and the failed-SDK-load scenario. Record the exact
   checks and limits. Local Chromium results are not complete WCAG or provider parity.

Tailwind source detection is rooted in `src/` by the workspace stylesheet. Keep
generated root output, build folders and local review files outside that scan;
otherwise the same authored source can produce different CSS in a clean checkout.

The static exporter parses HTML, JavaScript imports and CSS resources; it does not
execute page code. Browser request tracing is required to establish automatic
same-origin behavior for the built candidate. A passed build alone does not prove
hydration, keyboard access, Firebase account access or hosting headers.

## Preview root publication

Run the dry-run after the complete candidate and report are stable:

```sh
yarn publish:root
```

The JSON plan names the artifact digest, exact writes/removals and protected paths.
It verifies the artifact bytes against the report before considering the root.
The first publication uses the reviewed
`scripts/publication/legacy-root-inventory.json`; subsequent publications use
`.publication-inventory.json`. Ownership names exact files and SHA-256 identities,
not entire folders. The initial inventory includes the known pre-existing generated
dirty baseline; changing those bytes requires deliberate review of the actual
baseline, not automatic inventory regeneration to force a pass.

`CNAME`, `.nojekyll` and `favicon.ico` must already match and are preserved.
Existing identical approved image/font files remain user-owned. Other unowned
collisions, edited owned files, unsafe paths, symlinks, changed reports or an
unexpected artifact fail before publication. Remove only stale previously owned
output. Source, docs, private authoring and unrelated root assets are outside the
publisher's ownership.

If the dry-run refuses, inspect the named path and the saved source/output baseline.
Resolve the real ownership or content discrepancy, rebuild if necessary and review
a new plan. Preserve later user edits. Avoid broad root copies, directory mirrors,
`git reset --hard`, `git clean` or force pushes as a repair technique.

## Apply only the reviewed release

After explicit release authorization, apply the same candidate:

```sh
yarn publish:root --apply
```

The publisher revalidates identities and acquires a local publication lock before
writing only the planned owned paths. It saves prior bytes/inventories and a
transaction record under `dist/publication-backups/<transaction>/`, then atomically
records the new `.publication-inventory.json`. Keep that transaction directory and
the candidate report through the release/recovery window. `dist/` is disposable
build output in general, but deleting those backups removes this rollback source.

Inspect the resulting exact diff and protected files. Stage only the explicitly
reviewed source, configuration, tests, documentation, inventory and generated paths
for this release; never stage the whole existing dirty tree by default. Preserve
normal signing and branch policy. Use a scoped reviewed commit/push only when the
user has authorized it. Record the commit and actual public artifact identity.

Check `git check-ignore -v` for new generated paths before staging. This machine's
global ignore file currently excludes `assets/` and files named `index.html`, so
ordinary staging can omit new bundles and reader documents. Force-add only the
exact reviewed generated paths from the publication report (and the new ownership
inventory), then compare the staged bytes to that report. Do not disable the global
ignore file or force-add unrelated local files. Existing tracked stale output needs
its explicit deletion staged too. A successful build with missing Git entries does
not constitute a deployable branch-root release.

After the authorized push, verify the served [nalam.me](https://nalam.me) release:
open `/`, `/writing/`, `/experience/`, all preserved work/note paths and a deliberately
unknown path directly. Check real HTTP status, useful no-JS content, metadata,
canonical host, sitemap, static resources and browser requests against the candidate.
Distinguish a local root replacement, Git push and verified live release; a successful
push alone is not read-back evidence. GitHub Pages does not inherit `firebase.json`
headers or its CSP/cache policy.

## Restore owned output

For a successful applied transaction, preview its guarded rollback:

```sh
node scripts/publish-root.mjs --rollback dist/publication-backups/TRANSACTION
```

Review the planned writes/removals, then apply only after recovery authorization:

```sh
node scripts/publish-root.mjs --rollback dist/publication-backups/TRANSACTION --apply
```

The saved transaction must belong to this root and match the current publication
inventory and owned-file identities. Rollback verifies the saved bytes and refuses
to overwrite post-publication edits or a newer publication. It restores prior owned
output and inventory, removes only output introduced by that transaction and leaves
unrelated files alone. A publication failure attempts immediate local restoration;
if recovery itself fails, preserve its reported transaction path and inspect the
partial state before any further writes.

This restores local files. A live rollback additionally requires a scoped authorized
commit/push and the same live read-back. Retain a copy of the transaction outside
routine cleanup until that verification completes; restore it to the expected local
backup path if recovery is later needed. The retained incumbent Vite source/build
can assist a deliberately reviewed recovery, but `legacy:build`, `clean` and
`sync:static` write root output directly and must not replace the guarded procedure
casually. Preserve its `emptyOutDir: false`; never empty the repository root.

`yarn test:publication` exercises apply, idempotence, stale-owned removal, protected
preservation, identity conflicts and rollback in disposable mixed-root fixtures.
These tests are the safe walkthrough; they do not apply a real root release.
The tool-level contract and flags are documented in
[scripts/publication/README.md](../../scripts/publication/README.md).

## Future Firebase Hosting

`firebase.json` selects **only `dist/public`**, with real static routes and no catch-all
rewrite. It has no active project/site/target binding. The supplied `nalam-aa058`
Web app identity is used only by the bundled `firebase/app` browser initializer;
it is not evidence of deployment rights, host settings or active service products.
No Hosting move is performed by this implementation.

For a separately requested migration:

1. Rebuild/revalidate the exact candidate, including its current enforced CSP hashes.
   `yarn prepare:public` synchronizes those hashes into local `firebase.json` without
   deploying. Review the resulting config diff and keep it paired with that artifact.
2. Verify the actual intended Firebase account, project and Hosting site before any
   upload. Keep the classic static Hosting boundary; no SSR adapter, database, auth,
   analytics or other product is implied.
3. Treat every preview channel as public. Upload only the validated public artifact,
   never source, private drafts, a CV or workflow material. Obtain the corresponding
   remote-action authorization before creating a preview or release.
4. Read back actual provider routes, directory behavior, redirects, canonical URLs,
   sitemap, unknown-path HTTP 404, cache headers and CSP. Check exact inline-script,
   style-element and syntax-highlighter style-attribute hashes against real browser
   behavior. An ordinary local preview does not enforce this provider configuration.
5. Verify matching precedence using initial request paths: HTML/default responses
   revalidate, hashed emitted assets are immutable, stable resources have bounded
   caching, sitemap caching is short and the genuine error response is not cached.
6. Confirm a recoverable prior release and document promotion/rollback. Keep the
   existing GitHub Pages host and DNS until a separately authorized cutover.

Any build or content change can change CSP hashes. Do not reuse an older header
policy with a new artifact or treat configured headers as evidence they were served.
See the [official Hosting configuration](https://firebase.google.com/docs/hosting/full-config)
and the [Firebase browser boundary](../../src/lib/firebase/README.md).

## Toolchain notes

The installed baseline is Node 24.16.0 / Yarn 4.17.0. Exact direct pins and current
commands are in `package.json`; the lockfile is the resolved dependency contract.
Yarn 4 requires required lifecycle stages to be chained explicitly in `build`.

The released `@astrojs/astro2tsx@0.1.3` manifest omits `@emnapi/runtime`, which its
wasm runtime needs; `@astrojs/language-server@2.17.2` omits TypeScript peer forwarding.
Narrow `.yarnrc.yml` `packageExtensions` repair those exact releases. Remove them only
after a lockfile upgrade verifies upstream declarations, checker import, peer
requirements, `yarn check` and the full build. TypeScript stays on compatible 5.9.3.
Firebase's umbrella dependency currently produces missing `@firebase/app-types`
peer warnings in four unused compatibility packages; the imported app path is
satisfied. The [Firebase boundary](../../src/lib/firebase/README.md) records this
qualification rather than hiding it with unrelated package extensions.

If the normal global Yarn cache is unwritable in this sandbox, use a task-local
writable cache without changing the user's global settings:

```sh
YARN_ENABLE_GLOBAL_CACHE=false YARN_CACHE_FOLDER=/private/tmp/nalam-yarn-cache YARN_GLOBAL_FOLDER=/private/tmp/nalam-yarn-global yarn install
```

Use read-only diff/status and artifact identity checks throughout recovery. No
rollback requires destructive Git history changes or removal of unrelated work.
