// the site's sections, in the order of the top bar, and the pages of each, in the
// order of its side navigation. a page is named by its path in zaentrum/zaentrum:
// docs/ holds the documentation, spec/ the specification of the product's screens.
// a section's address says which of the two it belongs to, and the top bar shows the
// sections of the one being read. the names are chrome: lowercase.
//
// this file only gives pages their place and their name; the repository decides which
// pages there are. an entry that is an address (it starts with a /) is a page of the
// site itself, such as the capability map (src/pages/spec/capabilities/map.astro) or the
// architecture map (src/pages/spec/architecture/map.astro). a page it doesn't list goes at the end of its folder's section
// (FOLDERS), under its title, and a folder no section has becomes a section of its
// own, last in the top bar. a page it lists that the repository no longer has is left
// out. `npm run build` names both, and neither stops it. a spec/ page is also found
// where it was before spec/ existed, in docs/ (docs/chino/home.md for spec/chino/home.md).
import pages from './generated/pages.json' with { type: 'json' };

const SECTIONS = [
  {
    id: 'run',
    label: 'run it',
    pages: [
      ['docs/README.md', 'overview'],
      ['docs/prerequisites.md', 'prerequisites'],
      ['docs/self-hosting.md', 'self-hosting'],
      ['docs/operator.md', 'operator & cr reference'],
      ['docs/reference-demo.md', 'reference demo'],
      ['docs/updating.md', 'updating'],
      ['docs/updating-the-operator.md', 'updating the operator'],
      ['docs/releases.md', 'releases'],
      ['docs/troubleshooting.md', 'troubleshooting'],
    ],
  },
  {
    id: 'extend',
    label: 'extend it',
    pages: [
      ['docs/extending/README.md', 'overview'],
      ['docs/extending/slots.md', 'ui slots'],
      ['docs/extending/notices.md', 'notices'],
      ['docs/extending/console.md', 'hosted consoles'],
      ['docs/extending/ingest.md', 'catalog ingest'],
      ['docs/extending/extras.md', 'extras'],
      ['docs/extending/holdings.md', 'holdings'],
      ['docs/extending/events.md', 'event bus'],
      ['docs/extending/identity.md', 'addon identity'],
      ['docs/extending/installing.md', 'installing addons'],
      ['docs/extending/charts.md', 'addon charts'],
      ['docs/extending/configuration.md', 'addon configuration'],
      ['docs/extending/cli.md', 'the cli contract (zae)'],
    ],
  },
  {
    id: 'library',
    label: 'library format',
    pages: [
      ['docs/library/README.md', 'overview'],
      ['docs/library/manifest.md', 'manifest.json'],
      ['docs/library/metadata.md', 'metadata.json'],
      ['docs/library/versions.md', 'versions, audio, subtitles & quality'],
      ['docs/library/migrating.md', 'migrating a library'],
      ['docs/library/record.md', 'database first, storage as the record'],
    ],
  },
  {
    id: 'architecture',
    label: 'architecture',
    pages: [
      ['docs/architecture.md', 'how it fits together'],
      ['docs/adr/README.md', 'decision records'],
      // every ADR, by number, named after its file: docs/adr/0013-live-rungs-safety-net.md
      // is "0013 live rungs safety net".
      ...pages
        .map((p) => p.source)
        .filter((path) => /^docs\/adr\/\d{4}-.+\.md$/.test(path))
        .sort()
        .map((path) => [path, path.slice(9, -3).replace(/^(\d{4})-/, '$1 ').replaceAll('-', ' ')]),
    ],
  },
  {
    id: 'spec',
    label: 'overview',
    pages: [['spec/README.md', 'the specification']],
  },
  {
    id: 'capabilities',
    label: 'capabilities',
    pages: [
      ['/spec/capabilities/map/', 'the map'],
      ['spec/capabilities/README.md', 'the model'],
      ['spec/capabilities/expectations.md', 'expectations'],
      ['spec/capabilities/chino.md', 'chino'],
      ['spec/capabilities/portal.md', 'the portal'],
      ['spec/capabilities/catalog.md', 'the catalog and the pipeline'],
      ['spec/capabilities/platform.md', 'the platform'],
      ['spec/capabilities/configuration.md', 'configuration'],
    ],
  },
  {
    id: 'built',
    label: 'architecture',
    pages: [
      ['/spec/architecture/map/', 'the map'],
      ['spec/architecture/README.md', 'the model'],
      ['spec/architecture/components.md', 'components'],
      ['spec/architecture/connections.md', 'connections'],
      ['spec/architecture/decisions.md', 'decisions'],
    ],
  },
  {
    id: 'chino',
    label: 'chino',
    pages: [
      ['spec/chino/README.md', '1 introduction'],
      ['spec/chino/frame.md', '2 the frame'],
      ['spec/chino/start.md', '3 getting started'],
      ['spec/chino/home.md', '4 home'],
      ['spec/chino/browse.md', '5 movies and shows'],
      ['spec/chino/title-actions.md', '6 the title page'],
      ['spec/chino/person.md', '7 people'],
      ['spec/chino/watchlist.md', '8 watchlist and lists'],
      ['spec/chino/search.md', '9 search'],
      ['spec/chino/zap.md', '10 zap'],
      ['spec/chino/playback.md', '11 the player'],
      ['spec/chino/subtitles.md', '12 subtitles'],
      ['spec/chino/downloads.md', '13 downloads and offline'],
      ['spec/chino/casting.md', '14 casting'],
      ['spec/chino/notifications.md', '15 notifications'],
      ['spec/chino/settings.md', '16 settings and account'],
      ['spec/chino/errors.md', '17 when something goes wrong'],
      ['spec/chino/words.md', '18 words'],
    ],
  },
  {
    id: 'portal',
    label: 'portal',
    pages: [
      ['spec/portal/README.md', 'overview'],
      ['spec/portal/home.md', 'home page'],
      ['spec/portal/settings.md', 'settings and setup'],
    ],
  },
];

// the folder whose unlisted pages each section takes
const FOLDERS = {
  run: ['docs'], extend: ['docs/extending'], library: ['docs/library'], architecture: ['docs/adr'],
  spec: ['spec'], capabilities: ['spec/capabilities'], built: ['spec/architecture'], chino: ['spec/chino', 'docs/chino'], portal: ['spec/portal', 'docs/portal'],
};

const bySource = new Map(pages.map((p) => [p.source, p]));
const isAddress = (path) => path.startsWith('/');
// where a listed page is: its own path, or for a page in a spec/ folder (spec/chino/…)
// its place in docs/ before the move
const before = (path) => (/^spec\/[^/]+\//.test(path) ? path.replace(/^spec\//, 'docs/') : null);
const where = (path) => (isAddress(path) || bySource.has(path) ? path : bySource.has(before(path)) ? before(path) : null);
const slug = (route) => route.replace(/^\/|\/$/g, '');

// listed here, gone from the repository
export const gone = SECTIONS.flatMap((s) => s.pages.map(([path]) => path)).filter((path) => !where(path));
const sections = SECTIONS.map((s) => ({ ...s, pages: s.pages.filter(([path]) => where(path)).map(([path, label]) => [where(path), label]) }));

// in the repository, not listed here
const listed = new Set(sections.flatMap((s) => s.pages.map(([path]) => path)));
export const unlisted = [...bySource.keys()].filter((path) => !listed.has(path)).sort();
for (const path of unlisted) {
  const parts = path.split('/');
  const folder = parts.length > 2 ? parts.slice(0, 2).join('/') : parts[0];
  const id = Object.keys(FOLDERS).find((key) => FOLDERS[key].includes(folder)) ?? folder.replaceAll('/', '-');
  let section = sections.find((s) => s.id === id);
  if (!section) {
    section = { id, label: folder.split('/').pop().replaceAll('-', ' '), pages: [] };
    sections.push(section);
    FOLDERS[id] = [folder];
  }
  if (path === `${folder}/README.md`) section.pages.unshift([path, 'overview']);
  else section.pages.push([path, bySource.get(path).title.toLowerCase()]);
}

export const topics = sections.filter((s) => s.pages.length).map((section) => {
  const items = section.pages.map(([path, label]) => (isAddress(path) ? { label, link: path } : { label, slug: slug(bySource.get(path).route) }));
  return { id: section.id, label: section.label, link: items[0].link ?? '/' + items[0].slug + '/', items };
});

// the old address of every spec/ page that has moved out of docs/, for the redirects
export const moved = pages
  .filter((p) => p.source.startsWith('spec/'))
  .map((p) => ['/docs/' + p.route.slice('/spec/'.length), p.route])
  .filter(([from]) => !pages.some((p) => p.route === from));
