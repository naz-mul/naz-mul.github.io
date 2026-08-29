# Agent guide — nalam.me

Personal site of Nazmul Alam. Static, built with Vite + React + shadcn/ui, deployed to
GitHub Pages from the repo root.

**Start here:** `CONTEXT.md` for vocabulary (this repo has two things that both look
like "the site"), then `docs/adr/` for why the architecture is the way it is. `README.md`
has the diagrams.

## Quick facts

| Item | Value |
|------|-------|
| Live URL | https://nalam.me (apex; `CNAME` → `nalam.me`) |
| Hosting | GitHub Pages, **user pages** repo (`naz-mul/naz-mul.github.io`), served from the branch root |
| Source | `src/` (Vite root) |
| Build output | **committed at the repo root** — `index.html`, `404.html`, `work/*/`, `assets/` |
| Package manager | Yarn 4 only (`engines.npm` blocks npm) |
| Dev server | `yarn dev` → Vite on port 3000 |

## Architecture

- **Multi-page, not a SPA.** Every route is a real HTML entry point listed in
  `vite.config.ts` under `rollupOptions.input`. Deep links resolve as static files, so
  the `404.html` SPA-redirect hack is not needed — and `404.html` stays a genuine error
  page.
- **`build.outDir` is the repo root** with **`emptyOutDir: false`**. This is deliberate
  and load-bearing: emptying the out dir would delete `CNAME`, `img/`, `docs/` and the
  entire source tree. Vite prints a warning about this on every build; it is expected.
  `yarn build` chains `yarn clean` (clears `assets/`) and `yarn sync:static` (copies the
  self-hosted fonts to `fonts/`) explicitly. **Yarn 4 does not auto-run `pre`/`post`
  scripts** for custom lifecycle names, so these must stay inside `build` — a `prebuild`
  hook silently never runs, which previously left 54 stale bundles in `assets/` and would
  have shipped a site whose fonts 404.
- **`publicDir` is dev-only.** In production the out dir *is* the repo root, where
  `CNAME`, `favicon.ico` and `img/` already live. `src/public/` mirrors them so the dev
  server resolves the same absolute paths.
- **Zero third-party requests.** No analytics, no CDN, no remote fonts. Typefaces are
  **self-hosted** in `src/public/fonts/` and served from the same origin. Keep it that
  way; it is a deliberate constraint, not an oversight.
- **Three typefaces, three jobs.** Newsreader (display + long-form prose), Geist Sans
  (UI), Geist Mono (labels, metadata, numbers). All variable woff2, ~171 KB total.
- **Theming is tri-state** — light / dark / **system by default**. System is implemented
  in CSS, not JavaScript: no class on `<html>` means follow the OS, so it reacts
  instantly and works with JS disabled. `.light` / `.dark` are explicit overrides.
  Tokens are Tailwind v4 CSS-first (`@theme`) in `src/styles/globals.css` — there is no
  `tailwind.config.js`.
- **Palette values are load-bearing.** Every foreground clears WCAG AA against its
  surface and every colour is inside sRGB. `yarn check:contrast` proves it — run it
  after touching any colour.

## Where to edit what

| Goal | Files |
|------|-------|
| **All copy, work history, case studies** | `src/content/site.ts` — single source of truth |
| Page layout / sections | `src/components/Home.tsx`, `src/components/CaseStudyPage.tsx` |
| Header, footer, section shell | `src/components/Layout.tsx` |
| Colours, typography, prose styles | `src/styles/globals.css` |
| Typeface files | `src/public/fonts/*.woff2` (self-hosted, mirrored to `fonts/` on build) |
| shadcn primitives | `src/components/ui/` — regenerate with `yarn dlx shadcn@latest add <name>` |
| Page metadata, canonical, JSON-LD | the per-page `src/**/*.html` files |
| Adding a route | new `src/<path>/index.html` + `src/entries/<name>.tsx`, then register it in `rollupOptions.input` |

## Content rules

These are decisions with reasoning recorded in `docs/adr/`; do not quietly reverse them.

- **Never publish anything from `docs/resume/`.** It is gitignored because the site
  serves from the repo root — committing it would publish the CV, phone number included.
- Case studies name clients but **genericise their systems**. No internal architecture,
  no proprietary identifiers, no unpublishable metrics.
- **Do not invent metrics.** Numbers currently on the site (7s→2s, 5min→1.5min) come
  from the CV. Anything new needs to be confirmed.
- Voice is direct and specific, first person. No emoji, no "passionate developer", no
  skill-percentage bars, no tech-logo walls.
- The term "vibe coding" is deliberately absent.

Full reasoning: [ADR-0005](docs/adr/0005-sanitised-case-studies.md) and
[ADR-0004](docs/adr/0004-no-third-party-requests.md).

## Commands

```bash
yarn dev        # Vite dev server on :3000
yarn build      # clean, sync fonts, typecheck, then build to the repo root
yarn preview    # serve the built output on :4173
yarn typecheck  # tsc --noEmit
yarn check:contrast  # WCAG AA + sRGB gamut check on the palette
yarn verify     # typecheck + contrast
```

## Cursor / VS Code

- Run config: `.vscode/launch.json`, `.claude/launch.json`
- Tasks: `.vscode/tasks.json`
- Rules: `.cursor/rules/*.mdc` — `project-overview` (always on), plus `dev-tooling`,
  `pages-and-routing`, `styling` and `content` scoped by glob

## Agent skills

### Issue tracker

Issues live as GitHub issues in `naz-mul/naz-mul.github.io`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, using the default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
