# CONTEXT — nalam.me

Domain vocabulary for Nazmul Alam's professional site. Use these names to distinguish
authored material, a candidate site and the files currently published by GitHub Pages.
Operational paths and commands belong in README and the runbooks.

## Publication language

**Source**: Reviewed public authoring inputs, components and supporting assets from
which a candidate site is generated. Committed source is public even when no reader
route exposes it.

**Staged build**: Disposable generator output awaiting publication validation.
_Avoid_: deployment, live site.

**Public artifact**: The validated, allowlisted set of reader documents and reachable
public resources prepared for a hosting destination. The staged build is not itself
a public artifact.

**Managed root output**: The exact generated files owned by a recorded publication at
the branch root. Other source, documentation and static files beside them remain
outside that ownership.

**Static asset**: A reviewed same-origin image, font or site marker supplied to the
site rather than authored as a reader document.

**Local draft**: Private authoring material kept outside committed public inputs and
excluded from the public artifact. A publication-state label alone does not make a
committed document private.

**Route**: A URL backed by a complete static reader document. Ordinary links connect
routes without requiring a client router.

**Indexable route**: A published route intended for discovery through internal links
and the sitemap. The genuine error document is excluded.
_Avoid_: public route when describing every publicly reachable response.

**Publication projection**: The common eligible view of reviewed records used for
routes, metadata, writing, featured work and discovery.

## Work and writing

**Case study**: A reviewed long-form account of a professional engagement, including
bounded contribution, decisions, trade-offs and outcomes. Existing accounts cover
Cisco, Fidelity, HMH and Optum.
_Avoid_: project as a synonym for every client engagement.

**Featured work entry**: A curated summary of a named project area, independently of
whether a detailed public account exists. The current entries are AI Voice Platform,
Developer Learning Platform and Community Technology.

**Work state**: Whether the underlying work is planned, in progress or delivered.
It is independent of publication readiness.

**Publication state**: Whether an authored record is draft, in review or published.
Publishing a description does not change its work state.

**Knowledge state**: Whether writing is analysis, exploration, research in progress or
a research result. Exploration does not establish a delivered research outcome.

**Experience entry**: A dated professional role or engagement. An entry can exist
without a case study.

**Original writing**: A complete article or technical note owned and published by the
site. Its stable local reading URL is its canonical identity.

**Curated LinkedIn article**: A reviewed local title, synopsis and actual external
reading link. It has no imported article body or local reading mirror.

**Genericised**: Described by public problem shape and reviewed first-person lessons
rather than a client's proprietary system design.

The retired 2014–16 student items remain retired. The new featured work entries do not
restore them. See [the case-study decision](docs/adr/0005-sanitised-case-studies.md).

## Workspace identity

**Developer Workspace**: The selected visual direction: explorer navigation, a README
reading canvas, sequential work summaries and optional personal/context metadata.
It presents ordinary readable web documents.

**Explorer**: Navigation represented through a familiar file/folder vocabulary.
Its entries are ordinary links, including mobile disclosure navigation.

**Context rail**: Optional supporting metadata or contents beside the main document.
The main reading order remains usable when the rail is reduced on small screens.

**Theme preference**: The reader's system, light or dark selection. System follows the
operating system; an explicit choice overrides it.

**Zero third-party requests**: Automatic page resources remain same-origin. Following
an external reading or contact link is distinct from loading a remote embed or SDK
product automatically. See [ADR-0004](docs/adr/0004-no-third-party-requests.md).
