# Agent guide — nalam.me

Static personal portfolio served from this repo root. No backend, no bundler, no test suite.

## Quick facts

| Item | Value |
|------|-------|
| Live URL | https://www.nalam.me (`CNAME` → `nalam.me`) |
| Hosting | GitHub Pages (`naz-mul.github.io`) |
| Entry point | `index.html` |
| Dev server | `yarn start` → Gulp + Browser-Sync on port 3000 |
| Package manager | Yarn only (`engines.npm` blocks npm) |

## Where to edit what

| Goal | Files |
|------|-------|
| Page content, sections, modals | `index.html` |
| Error pages | `403.html`, `404.html`, `50x.html` |
| Theme colours / LESS tokens | `less/variables.less`, `less/mixins.less`, `less/freelancer.less` |
| Local dev / live reload | `gulpfile.js`, `package.json` |
| Images | `img/` (referenced, may not all be in git) |
| Resume PDF | `docs/naz-resume.pdf` (download link is commented out in `index.html`) |

## Architecture constraints

- **CDN-first styling**: `index.html` loads Bootstrap 3 and Start Bootstrap Freelancer from CDNs, not from `less/`.
- **LESS is not compiled**: Gulp watches `less/*.less` for reload only. Custom LESS has no effect until you add a compile step and link the output CSS.
- **Single-page layout**: Hash nav (`#portfolio`, `#about`) and Bootstrap modals (`#portfolioModal1`–`3`). No router or framework.
- **Analytics**: Google Analytics (`gtag`) and GTM noscript iframe are embedded in `index.html`.

## Safe change patterns

- Prefer minimal diffs; match existing Bootstrap 3 / Freelancer markup.
- New portfolio item: duplicate a `portfolio-item` block + matching `portfolio-modal` at the bottom of `index.html`.
- Keep protocol-relative CDN URLs (`//cdn...`) unless migrating to HTTPS explicitly.
- Do not add a build step or framework unless the user asks.
- Do not commit secrets or change analytics IDs without explicit request.

## Commands

```bash
yarn ci       # clean install (frozen lockfile); postinstall starts dev server
yarn start    # Gulp + Browser-Sync
yarn verify   # verify node_modules matches lockfile
```

## Cursor / VS Code

- Run config: `.vscode/launch.json` (starts dev server, opens browser)
- Tasks: `.vscode/tasks.json`
- Rules: `.cursor/rules/*.mdc`
