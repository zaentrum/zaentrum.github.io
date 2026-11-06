// the site's sections, in the order of the top bar, and the pages of each, in the
// order of its side navigation. a page is named by its path in zaentrum/zaentrum's
// docs/ folder. the names are chrome: lowercase.
//
// a page in a section's folder that isn't listed here still belongs to that section
// (see FOLDERS): it builds and can be linked, but has no place in the side navigation
// until it is listed. `npm run build` names every such page.
import pages from './generated/pages.json' with { type: 'json' };

const SECTIONS = [
  {
    id: 'run',
    label: 'run it',
    pages: [
      ['README.md', 'overview'],
      ['prerequisites.md', 'prerequisites'],
      ['self-hosting.md', 'self-hosting'],
      ['operator.md', 'operator & cr reference'],
      ['reference-demo.md', 'reference demo'],
      ['updating.md', 'updating'],
      ['updating-the-operator.md', 'updating the operator'],
      ['releases.md', 'releases'],
      ['troubleshooting.md', 'troubleshooting'],
    ],
  },
  {
    id: 'extend',
    label: 'extend it',
    pages: [
      ['extending/README.md', 'overview'],
      ['extending/slots.md', 'ui slots'],
      ['extending/notices.md', 'notices'],
      ['extending/console.md', 'hosted consoles'],
      ['extending/ingest.md', 'catalog ingest'],
      ['extending/extras.md', 'extras'],
      ['extending/holdings.md', 'holdings'],
      ['extending/events.md', 'event bus'],
      ['extending/identity.md', 'addon identity'],
      ['extending/installing.md', 'installing addons'],
      ['extending/charts.md', 'addon charts'],
      ['extending/configuration.md', 'addon configuration'],
      ['extending/cli.md', 'the cli contract (zae)'],
    ],
  },
  {
    id: 'library',
    label: 'library format',
    pages: [
      ['library/README.md', 'overview'],
      ['library/manifest.md', 'manifest.json'],
      ['library/metadata.md', 'metadata.json'],
      ['library/versions.md', 'versions, audio, subtitles & quality'],
      ['library/migrating.md', 'migrating a library'],
      ['library/record.md', 'database first, storage as the record'],
    ],
  },
  {
    id: 'portal',
    label: 'portal',
    pages: [
      ['portal/README.md', 'overview'],
      ['portal/home.md', 'home page'],
      ['portal/settings.md', 'settings and setup'],
    ],
  },
  {
    id: 'chino',
    label: 'chino',
    pages: [
      ['chino/README.md', 'overview'],
      ['chino/title-actions.md', 'title actions'],
      ['chino/playback.md', 'playback'],
      ['chino/subtitles.md', 'subtitles'],
      ['chino/downloads.md', 'downloads and offline'],
      ['chino/casting.md', 'casting'],
      ['chino/words.md', 'words'],
    ],
  },
  {
    id: 'architecture',
    label: 'architecture',
    pages: [
      ['architecture.md', 'how it fits together'],
      ['adr/README.md', 'decision records'],
      // every ADR, by number, named after its file: adr/0013-live-rungs-safety-net.md
      // is "0013 live rungs safety net".
      ...pages
        .map((p) => p.source.replace(/^docs\//, ''))
        .filter((rel) => /^adr\/\d{4}-.+\.md$/.test(rel))
        .sort()
        .map((rel) => [rel, rel.slice(4, -3).replace(/^(\d{4})-/, '$1 ').replaceAll('-', ' ')]),
    ],
  },
];

// the folder each section's unlisted pages come from; the root folder's are "run it".
const FOLDERS = { extend: 'extending', library: 'library', portal: 'portal', chino: 'chino', architecture: 'adr' };

const bySource = new Map(pages.map((p) => [p.source.replace(/^docs\//, ''), p]));
const slug = (route) => route.replace(/^\/|\/$/g, '');

export const topics = SECTIONS.map((section) => {
  const items = section.pages.map(([rel, label]) => {
    const page = bySource.get(rel);
    if (!page) throw new Error(`src/nav.mjs lists docs/${rel}, which zaentrum/zaentrum doesn't have`);
    return { label, slug: slug(page.route) };
  });
  return { id: section.id, label: section.label, link: '/' + items[0].slug + '/', items };
});

export const topicFolders = Object.fromEntries(
  Object.entries(FOLDERS).map(([id, folder]) => [id, [`/docs/${folder}/**`]]),
);

const listed = new Set(SECTIONS.flatMap((s) => s.pages.map(([rel]) => rel)));
export const unlisted = pages.map((p) => p.source.replace(/^docs\//, '')).filter((rel) => !listed.has(rel));
