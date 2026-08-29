# ADR-0003 — Commit build output to the repo root

**Status:** accepted · **Date:** 2026-08-29

## Context

`naz-mul.github.io` is a GitHub **user pages** repository. It serves the default
branch root, and has done so for years with a working custom domain via `CNAME`.

Introducing a build step raises the question of where output goes. The options were a
GitHub Actions workflow publishing to Pages, a `docs/` folder source, or committing
build output to the branch root as before.

## Decision

Keep serving from the **branch root** and **commit the build output**. `build.outDir` is
the repo root; source lives in `src/`.

No Actions workflow. No change to Pages settings. The live domain is never at risk from
a CI misconfiguration.

## Critical constraint

**`emptyOutDir` must remain `false`.**

The out dir *is* the repository. Emptying it would delete `CNAME`, `img/`, `docs/`, and
the entire `src/` tree. `yarn prebuild` clears `assets/` instead, so stale content-hashed
bundles do not accumulate.

Vite prints a warning about `outDir` being a parent of `root` on every build. **That
warning is expected.** Do not "fix" it by enabling `emptyOutDir`.

Related: `publicDir` is `src/public` in dev and `false` in build. In production the out
dir already contains `CNAME`, `favicon.ico` and `img/`, so copying them over themselves
is redundant, and Vite warns when `publicDir` sits inside `outDir`. The cost is that
`src/public/img/` must be kept in sync with `img/`.

## Consequences

- Deploy is `yarn build && git commit && git push`. Nothing else.
- The custom domain cannot be lost by a deploy.
- Commits mix source and generated output, making diffs noisy. Accepted.
- The repo root holds source, config, static assets and build output at once. This is
  the repo's most surprising property; `CONTEXT.md` documents the vocabulary for it.
