# zaentrum.github.io

The site at <https://zaentrum.github.io>: the product page at `/`, the docs at
[`/docs/`](https://zaentrum.github.io/docs/).

The docs aren't written here. They're the `docs/` folder of
[zaentrum/zaentrum](https://github.com/zaentrum/zaentrum/tree/main/docs), and
every page has an "edit this page" link that leads there. This repository holds
the site around them: the product page, the sections and their order, and the
look.

| What | Where |
|---|---|
| The product page | [`src/pages/index.astro`](src/pages/index.astro), with `public/nalet.css` and `public/site.css` |
| The sections and the order of their pages | [`src/nav.mjs`](src/nav.mjs) |
| How a docs page becomes a site page | [`scripts/sync-docs.mjs`](scripts/sync-docs.mjs) |
| The capability map and a fact sheet for each capability | [`src/pages/spec/capabilities/`](src/pages/spec/capabilities/), [`src/components/capabilities/`](src/components/capabilities/), [`src/lib/capabilities.mjs`](src/lib/capabilities.mjs) |
| The architecture map and a fact sheet for each component | [`src/pages/spec/architecture/`](src/pages/spec/architecture/), [`src/components/architecture/`](src/components/architecture/), [`src/lib/archmap-lenses.mjs`](src/lib/archmap-lenses.mjs) |
| The look: the nalet design system's tokens on [Starlight](https://starlight.astro.build) | [`src/styles/`](src/styles/), [`src/components/`](src/components/) |
| The old address of the product page, `/zaentrum/`, sent on to `/` | [`astro.config.mjs`](astro.config.mjs) (`redirects`) |
| Publishing | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) |
| The docs version that is live | [`sources.lock.json`](sources.lock.json) |

## Run it locally

```sh
npm ci
npm run dev          # copies the docs in, then http://localhost:4321/docs/
npm run build        # the whole site in dist/, every internal link checked
```

`npm run sync` clones zaentrum/zaentrum into `.sources/zaentrum` the first time.
To build from a working copy instead, name it:
`DOCS_SOURCE=../zaentrum npm run build`.

## How a docs page becomes a site page

- `docs/chino/playback.md` is `/docs/chino/playback/`. A folder's `README.md` is
  the folder's own page: `docs/chino/README.md` is `/docs/chino/`.
- The page's first `# heading` is its title.
- A link to another docs page goes to that page on the site. A link to any other
  file of the repository goes to the file on GitHub.
- Images are copied next to their pages.
- A ` ```mermaid ` block is drawn as a diagram.

The build fails when a link leads nowhere, including a `#heading` that doesn't
exist. The live site then stays as it was.

## The capability map

`spec/capabilities/` of zaentrum/zaentrum is a model: CSV files, checked against
the code by its `scripts/capabilities.py`. The sync has that program write the
model, resolved, to `src/generated/capabilities.json` (`--json`), so it needs
`python3`; without it the site is built without the map. From the model the site
builds:

- `/spec/capabilities/map/`: a lane for each part, a cluster for each area, a tile
  for each capability, coloured by a lens (built, specified, requirements,
  settings), filtered by whom it is for and by words. The view is in the address.
  A tile opens the capability's fact sheet beside the map.
- `/spec/capabilities/<part>/<key>/`: the fact sheet. Where each app and console
  has it, its requirements (the specification's numbered changes that name it,
  with today and the target), the sections that specify it (each one shown
  folded, as its chapter has it), the screens and interfaces that serve it (each a
  link to its line on GitHub, at the commit the inventory was listed from), and
  its settings.

The structure comes from the JSON; the words come from the copied pages, so a
change's row and a section read as they do on their own pages.

The same JSON holds the architecture (`spec/architecture/`): the components, their
connections and the decision records. From it the site builds:

- `/spec/architecture/map/`: a lane for each layer, a tile for each component,
  coloured by a lens (status, capabilities, requirements, settings, decisions,
  findings). Pointing at a tile draws its connections, solid to what it reaches,
  dashed from what reaches it. A tile opens the component's fact sheet.
- `/spec/architecture/<key>/`: the fact sheet. What it runs as and where it is
  reached, its connections both ways (each with the places in the code that make
  it), the capabilities it serves and the requirements open on them, what it
  offers in the code, its settings, its decisions and what the model finds.

A capability's fact sheet names the components that build it and its decisions.

## When a page is added, moved or removed

`src/nav.mjs` gives pages their place and their name; the docs decide which
pages there are.

- A page `src/nav.mjs` doesn't list goes at the end of its folder's section,
  under its title. A new folder becomes a section of its own, last in the top bar.
- A page `src/nav.mjs` lists that `docs/` no longer has is left out.
- A new decision record (`docs/adr/0016-…`) is listed by itself, in order.

The build names every such page, and none of them stops it. What stops it is a
link that leads nowhere, or a page without a `# heading`.

zaentrum/zaentrum's `docs-check` runs the same build for every change to
`docs/`, so a break shows on the commit that made it.

## Publishing

The deploy workflow runs on every push here. It also runs every half hour, and
builds when `docs/` in zaentrum/zaentrum has changed since the version in
`sources.lock.json`. "Run workflow" builds at once.
