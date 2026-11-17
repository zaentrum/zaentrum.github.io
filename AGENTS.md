# zaentrum.github.io

The site of zaentrum, built with Astro and Starlight and published to GitHub Pages: the
product page at `/`, the documentation at `/docs/` and the specification at `/spec/`, with
the capability map, the architecture map and a fact sheet for each capability and
component. The pages are not written here: they are the `docs/` and `spec/` folders of
zaentrum/zaentrum, which `scripts/sync-docs.mjs` copies in at build time. This repository
holds the site around them: the product page (`src/pages/index.astro`), the sections and
the order of their pages (`src/nav.mjs`), the maps (`src/pages/spec/`, `src/lib/`) and the
look (`src/styles/`, `src/components/`).
How a change is proposed and what a pull request has to pass is in the
[guide to contributing](https://github.com/zaentrum/.github/blob/main/CONTRIBUTING.md);
what may be built is in [building from the specification](https://github.com/zaentrum/zaentrum/blob/main/AGENTS.md).

## Build

```sh
npm ci
npm run build      # npm run sync, then astro build -> dist/
```

It needs Node 22.23.4 or later (Astro's requirement; the workflows use 24), `git`, and
`python3` for the maps. `npm run sync` reads zaentrum/zaentrum from `.sources/zaentrum`,
cloning its main there (depth 1) when it is missing, or from the working copy `DOCS_SOURCE`
names: `DOCS_SOURCE=../zaentrum npm run build`. It copies the pages and their images into
`src/content/docs/`, writes `src/generated/` and `public/docs/sources.json`, and runs that
checkout's `scripts/capabilities.py --json` for the maps; without `python3` it warns, and
the pages that read that model are left out: the capability, architecture and goal
maps and the fact sheets. Git ignores all of it. `sources.lock.json` names the commit
of zaentrum/zaentrum that is live; `deploy.yml` writes it after each deploy.

## Test

The build is the test. The sync stops at a link that points at nothing, a page without a
`# heading`, or a failing `scripts/capabilities.py --json`; `astro build` stops at a link or
a `#heading` that leads nowhere on the site (starlight-links-validator, which leaves out `/`
and `/schemas/**`). `.github/workflows/build.yml` runs the build on every pull request and
publishes nothing; `.github/workflows/deploy.yml` builds and publishes on a push to main, every half hour when `docs/` or `spec/` of zaentrum/zaentrum
changed since `sources.lock.json`, and by hand ("Run workflow"), with zaentrum/zaentrum
checked out in `.sources/zaentrum`:

```sh
npm ci --no-audit --no-fund
npm run build
```

zaentrum/zaentrum's `docs-check` workflow runs the same build on each change to its
`docs/`, `spec/` or `scripts/`: this repository's main, with `DOCS_SOURCE` set to its own
checkout.

## Run it

```sh
npm ci
npm run dev        # the sync, then http://localhost:4321/docs/
```

The site needs no server and no account. Its pages come from the checkout the sync makes,
or from `DOCS_SOURCE`, which shows a change to the docs before it is pushed.

## What the tests leave unchecked

- Nothing opens the site in a browser: the product page, the maps' lenses and filters, the
  fact sheets, the theme and the drawn diagrams are looked at by hand.
- A link to another site is not followed.
- Without `python3` the sync leaves the maps and the fact sheets out with a warning, not
  an error.
