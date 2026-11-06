// the site's sections, in the order of the top bar, and the pages of each, in the
// order of its side navigation. a page is named by its path in zaentrum/zaentrum's
// docs/ folder. the names are chrome: lowercase.
//
// this file only gives pages their place and their name; the docs decide which pages
// there are. a page it doesn't list goes at the end of its folder's section (FOLDERS),
// under its title, and a folder no section has becomes a section of its own, last in
// the top bar. a page it lists that docs/ no longer has is left out. `npm run build`
// names both, and neither stops it.
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

// the folder whose unlisted pages each section takes; the root folder's go to "run it".
const FOLDERS = { run: '', extend: 'extending', library: 'library', portal: 'portal', chino: 'chino', architecture: 'adr' };

const bySource = new Map(pages.map((p) => [p.source.replace(/^docs\//, ''), p]));
const slug = (route) => route.replace(/^\/|\/$/g, '');

// listed here, gone from docs/
export const gone = SECTIONS.flatMap((s) => s.pages.map(([rel]) => rel)).filter((rel) => !bySource.has(rel));
const sections = SECTIONS.map((s) => ({ ...s, pages: s.pages.filter(([rel]) => bySource.has(rel)) }));

// in docs/, not listed here
const listed = new Set(sections.flatMap((s) => s.pages.map(([rel]) => rel)));
export const unlisted = [...bySource.keys()].filter((rel) => !listed.has(rel)).sort();
for (const rel of unlisted) {
  const folder = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : '';
  const id = Object.keys(FOLDERS).find((key) => FOLDERS[key] === folder) ?? folder;
  let section = sections.find((s) => s.id === id);
  if (!section) {
    section = { id, label: folder.replaceAll('-', ' '), pages: [] };
    sections.push(section);
    FOLDERS[id] = folder;
  }
  if (rel === (folder ? `${folder}/README.md` : 'README.md')) section.pages.unshift([rel, 'overview']);
  else section.pages.push([rel, bySource.get(rel).title.toLowerCase()]);
}

export const topics = sections.filter((s) => s.pages.length).map((section) => {
  const items = section.pages.map(([rel, label]) => ({ label, slug: slug(bySource.get(rel).route) }));
  return { id: section.id, label: section.label, link: '/' + items[0].slug + '/', items };
});
