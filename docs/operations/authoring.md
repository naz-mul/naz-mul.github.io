# Reviewed authoring

Use this guide when adding original writing, editing publication state, expanding a
featured project or curating an external article. The current content contract is
`src/content/publication.ts`; `src/content/publicationData.ts` projects eligible
records for the static routes, metadata, showcase and writing index.

## Draft locally, publish reviewed material

1. Draft privately in ignored `.private-drafts/`. Keep private previews in ignored
   `.private-preview/`. Neither directory is an Astro collection or public input.
2. Review the complete proposed public text, evidence, assets, links and ownership
   with Nazmul. Dates, research results and outcomes need actual support. Client
   systems stay genericised; approved Cisco contribution remains bounded.
3. Promote only publishable material into the tracked public source. A record is
   eligible only with `publicationState: published`, `visibility: public` and
   `reviewed: true`; its references, links and assets must also pass validation.
4. Build and inspect the validated `dist/public` artifact, including direct routes
   without JavaScript. Publishing source or applying root output follows the
   separate [release procedure](publication.md).

**Committed source is public.** `draft`, `review` or `visibility: private` labels
remove records from discovery but do not make their source secret in this public
repository. Use `git check-ignore -- .private-drafts/example.md` to confirm a local
path is excluded before drafting. Preserve the existing `docs/resume/` exclusion;
private CV contents are never a build input.

## Original Markdown and MDX

Reviewed originals live in `src/content/articles/`. Ordinary prose uses `.md`;
trusted local `.mdx` is available when the article actually needs an embedded
component. Never compile user-submitted or fetched provider content as MDX.
Astro compiles code fences and article prose at build time; readers receive useful
HTML without a client Markdown parser or syntax-highlighter service.

A new original uses this metadata shape (replace the illustrative identity, title
and copy with reviewed content before promotion):

```yaml
---
id: "example-engineering-note"
kind: "technical-note"
title: "Reviewed engineering note"
description: "A reviewed summary of the specific question and analysis."
permalink: "/notes/example-engineering-note/"
publicationState: "published"
visibility: "public"
reviewed: true
source:
  kind: "original"
  evidence:
    - "Reference to the actual public review or source evidence."
knowledgeState: "analysis"
order: 30
links: []
assets: []
references: []
---
```

The body begins after the closing delimiter. Use a substantive introduction and
real heading structure; the reader supplies the title and article metadata.
`kind` can also be `article` or `research-note`. Choose `knowledgeState` from
`analysis`, `exploration`, `research-in-progress` or `research-result` honestly.
The last category needs actual result evidence.

`id` is unique and stable. `permalink` is explicit, independent of the source
filename, and becomes the self-canonical `https://nalam.me/...` URL. Preserve
existing note paths and the complete reviewed titles. Do not rename a published
URL because a source file or article heading changes. An explicit `canonical`,
if supplied, must agree with that URL.

Only add `publishedAt`, `updatedAt` or `sourcePublishedAt` when the respective
calendar date is confirmed. Metadata accepts ISO dates; an update cannot precede
publication. Filesystem times and migration day do not establish an article's
original publication date.

The catch-all Astro route renders eligible collection entries automatically;
ordinary new writing does not need a legacy HTML shell, mount entry, independent
sitemap edit or a second route list. `/writing/` and the homepage consume the
same projection. Static pages or new renderer kinds require a real renderer and
projection record; an empty detail route is not an authoring shortcut.

## Links, assets and references

Record reviewed destinations as `{ label, url, reviewed: true }` in `links` when
metadata needs them. Use actual HTTPS URLs, ordinary valid local/fragment links or
the existing approved email destination. Every referenced public record ID must
exist in the eligible projection. A draft cannot be a public record reference.
The exporter also parses rendered body links and requires local paths/fragments
to resolve.

Approved assets use a same-origin path under `/img/`, `/images/` or `/figures/`,
with meaningful `alt`, optional `caption` and `reviewed: true`. Place their actual
public bytes in `src/public/` under that path. Eligibility checks require a real
file, and the exporter includes only the referenced approved resources. Review
screenshots and diagrams for confidential identifiers as carefully as prose.
Use HTML/SVG for appropriate diagrams; no diagram runtime is a default dependency.

External navigation and runtime resources are different: a reviewed HTTPS reading
link is allowed, while remote fonts, image embeds, analytics, LinkedIn widgets and
automatically loaded remote scripts break the same-origin page boundary.

## Featured engineering work

`src/content/showcase.ts` contains the three user-supplied featured summaries:
AI Voice Platform, Developer Learning Platform and Community Technology. All are
`workState: in-progress`. Their description records are reviewed and public;
this does not claim the work is delivered or that a detailed case study is ready.

A `featured-work` record has its own work state (`planned`, `in-progress` or
`delivered`) and no local permalink. Link only to reviewed, existing destinations.
With no supplied demo, article, diagram or repository URL, show the honest summary
and maturity label without an invented View project action.

A later substantial project account needs reviewed **Problem, Your role,
Architecture, Challenges, Outcome, Technology and Links** material. Do not create a
page of placeholder headings. New project descriptions do not expand the existing
client-specific ownership claims or resurrect the retired student projects.
Existing work readers retain the reviewed evidence classes and official public
context as separate material.

## Curated LinkedIn writing

When an actual article URL and reviewed synopsis are supplied, add an
`external-article` record to the local metadata inputs currently collected through
`showcaseRecords` in `src/content/showcase.ts`. The common projection separates
writing from featured work by `kind`.

Use a unique stable `id`, reviewed title/description, the normal public eligibility
fields and `source: { kind: linkedin, url: <actual article URL>, evidence: [...] }`.
The source URL must be HTTPS on `linkedin.com` or `www.linkedin.com`, with a supported
article/post path. Keep `permalink` absent: the record has an external canonical
identity and no local reading mirror. The writing index renders **Read on LinkedIn**.
There are no actual LinkedIn article entries until reviewed destinations are added.

Store only the approved synopsis and metadata. The current site has no article-body
import, API synchronization, iframe/widget, scrape, token store or automatic request
to LinkedIn. Follow-up distribution or provider integration is separate work.

## Authoring verification

Run `yarn build` to validate schema, references, direct static routes, exact metadata,
public resource graph, sitemap and ordinary local links. Preview with `yarn preview`
and inspect the actual `dist/public` output. `dist/publication-report.json` records
the generated files and their identities; it is excluded from the public artifact.
Then run the relevant built-artifact browser checks (`yarn test:e2e`).

The schema is strict: misspelled fields, duplicate IDs/permalinks/canonicals,
incorrect source semantics, missing public references, unreviewed links/assets and
missing preserved routes fail. Fix the authoring source and rebuild rather than
editing generated HTML or relaxing the publication boundary to bypass a failure.
