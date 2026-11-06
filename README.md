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

## When a page is added

A new page in a section's folder belongs to that section straight away, but it
has no place in the side navigation until it's added to `src/nav.mjs`. The build
lists every page that isn't there yet. A new decision record (`docs/adr/0016-…`)
is listed by itself.

## Publishing

The deploy workflow runs on every push here. It also runs every half hour, and
builds when `docs/` in zaentrum/zaentrum has changed since the version in
`sources.lock.json`. "Run workflow" builds at once.
