// the capability model of zaentrum/zaentrum (spec/capabilities/), for the map and the
// fact sheets (src/pages/spec/capabilities/). scripts/sync-docs.mjs has its
// scripts/capabilities.py write it, resolved, to src/generated/capabilities.json: the
// structure comes from there. the words come from the pages sync-docs copied in
// (src/content/docs/), whose links already lead to the site's own addresses, so a
// change's row and a section of a chapter read here as they read on their pages.
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { remarkMermaid } from './remark-mermaid.mjs';

const ROOT = process.cwd();
const MODEL = join(ROOT, 'src/generated/capabilities.json');
const CONTENT = join(ROOT, 'src/content/docs');
const GITHUB = 'https://github.com/zaentrum';

// every picture the copied pages hold, by its path, for a section shown on a fact
// sheet: its relative link would lead nowhere from the fact sheet's address.
const PICTURES = import.meta.glob('/src/content/docs/**/*.{png,jpg,jpeg,gif,webp,avif}', { eager: true, import: 'default' });

let model;
export function load() {
  if (model === undefined) model = existsSync(MODEL) ? index(JSON.parse(readFileSync(MODEL, 'utf8'))) : null;
  return model;
}

function index(m) {
  m.areaByKey = new Map(m.areas.map((a) => [a.key, a]));
  m.partByKey = new Map(m.parts.map((p) => [p.key, p]));
  m.capByKey = new Map(m.capabilities.map((c) => [c.key, c]));
  m.settingByKey = new Map(m.settings.map((s) => [s.key, s]));
  m.changeByNumber = new Map(m.changes.map((ch) => [ch.number, ch]));
  m.apps = m.faces.filter((f) => f.app);
  for (const c of m.capabilities) {
    c.part = m.areaByKey.get(c.area).part;
    c.url = `/spec/capabilities/${c.part}/${c.key}/`;
    c.apps = appsStatus(c, m.apps);
    c.all = appsStatus(c, m.faces);
    c.specified = c.spec.some((r) => r.kind === 'chapter') ? 'chapter' : c.spec.length ? 'docs' : 'nowhere';
    const own = c.settings.map((k) => m.settingByKey.get(k)).filter(Boolean);
    c.fixed = own.filter((s) => s.where === 'code').length;
    c.config = !own.length ? 'none' : c.fixed ? 'fixed' : 'set';
  }
  return m;
}

// several apps or faces as one: built where every one meant to have it has it, no where
// none has it, not meant where none is meant to have it, partial otherwise.
function appsStatus(c, apps) {
  const meant = apps.map((a) => c.status[a.key]).filter((s) => s !== '—');
  if (!meant.length) return '—';
  for (const s of ['built', 'no', '?']) if (meant.every((x) => x === s)) return s;
  return 'partial';
}

// the status values, as the map and the fact sheets name and colour them
export const STATUS = {
  built: { name: 'built', tone: 'success' },
  partial: { name: 'partial', tone: 'warning' },
  no: { name: 'not there', tone: 'error' },
  '—': { name: 'not meant for it', tone: 'none' },
  '?': { name: 'not checked', tone: 'info' },
};
export const statusAttr = (s) => ({ built: 'built', partial: 'partial', no: 'no', '—': 'none', '?': 'unknown' })[s];

export const WHO = {
  person: 'for a person watching',
  admin: 'for an admin',
  operator: 'for the operator',
  addon: "for an addon's service",
  system: 'done by the platform itself',
};

// a setting: who changes it today, where, and the proposals (as configuration.md has them)
export const SET_WHO = { operator: 'the operator', admin: 'an admin', person: 'a person', nobody: 'nobody' };
export const SET_WHERE = {
  resource: "the operator's resource",
  env: "a service's environment",
  catalog: "the catalog's settings",
  registry: "the portal's registry",
  app: "an app's settings",
  code: 'fixed in the code',
};
export const PROPOSAL = {
  keep: 'stays where it is',
  setting: 'becomes a setting an admin changes in the portal',
  shared: 'one value the server gives every app, instead of one in each',
  person: "becomes a person's preference",
  constant: 'stays fixed in the code, on purpose',
};

// the app or console a screen is in, by its repository
export const SCREEN_FACE = {
  'chino-web': 'web', 'chino-mobile': 'phone', 'chino-androidtv': 'androidtv', 'chino-tizen': 'samsung',
  'zaentrum-portal': 'portal', 'katalog-manager-ui': 'catalog',
};

// a copied page's title, by its path in zaentrum/zaentrum
const PAGES = join(ROOT, 'src/generated/pages.json');
let titles;
export function pageTitle(file) {
  titles ??= new Map(existsSync(PAGES) ? JSON.parse(readFileSync(PAGES, 'utf8')).map((p) => [p.source, p.title]) : []);
  return titles.get(file) ?? file;
}

// spec/chino/home.md -> /spec/chino/home/ ; docs/README.md -> /docs/ (as sync-docs.mjs)
export const route = (file) => '/' + file.replace(/(^|\/)README\.md$/, '').replace(/\.md$/, '') + '/';
export const refLink = (ref) => route(ref.file) + (ref.anchor ? '#' + ref.anchor : '');
// the anchor a heading gets (as scripts/capabilities.py and the site have it)
export const slug = (text) => text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replaceAll(' ', '-');

export function partLink(m, partKey, areaName) {
  const page = m.partByKey.get(partKey).page;
  return route(page) + (areaName ? '#' + slug(areaName) : '');
}

// where in a repository a row of the inventory is, at the commit it was listed from
export function codeLink(m, row) {
  const [path, line] = row.where.split(/:(?=\d+$)/);
  const commit = m.sources[row.repo] ?? 'main';
  return `${GITHUB}/${row.repo}/blob/${commit}/${path}${line ? '#L' + line : ''}`;
}

// ------------------------------------------------------------- the pages' words
const pages = new Map();
function page(file) {
  if (!pages.has(file)) {
    const path = join(CONTENT, file.replace(/(^|\/)README\.md$/, '$1index.md'));
    const text = existsSync(path) ? readFileSync(path, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '') : null;
    pages.set(file, text);
  }
  return pages.get(file);
}

// the lines outside ``` fences, each with whether it is a heading
function lines(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const mark = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (mark && line.trim().startsWith(fence) && line.trim().replace(/[`~]/g, '') === '') fence = null;
      return { line, level: 0 };
    }
    if (mark) { fence = mark[1]; return { line, level: 0 }; }
    const h = line.match(/^(#{1,6})\s+(.*?)\s*$/);
    return { line, level: h ? h[1].length : 0, heading: h ? h[2] : null };
  });
}

// a section of a page, without its heading: up to the next heading as high as its own
export function section(ref) {
  const text = ref.heading && ref.level > 1 ? page(ref.file) : null;
  if (!text) return null;
  const all = lines(text);
  const at = all.findIndex((l) => l.level === ref.level && l.heading === ref.heading);
  if (at === -1) return null;
  const end = all.findIndex((l, i) => i > at && l.level && l.level <= ref.level);
  return all.slice(at + 1, end === -1 ? undefined : end).map((l) => l.line).join('\n').trim();
}

// a change's row, cell by cell, as its page has it
export function changeRow(ch) {
  const text = page(ch.file);
  if (!text) return null;
  const at = text.split('\n').find((l) => new RegExp(`^\\|\\s*${ch.number.replace('.', '\\.')}\\s*\\|`).test(l));
  if (!at) return null;
  return at.trim().split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim().replaceAll('\\|', '|'));
}

// ------------------------------------------------------------- markdown
let processor;
async function md(text) {
  processor ??= await createMarkdownProcessor({ remarkPlugins: [remarkMermaid], smartypants: false, syntaxHighlight: false });
  return (await processor.render(text)).code;
}

// a link to a heading of the page itself must still lead there from a fact sheet, and a
// picture beside the page is the site's copy of it: shown at half its size, as on its page.
function anchored(text, file) {
  const dir = posix.dirname('/src/content/docs/' + file.replace(/(^|\/)README\.md$/, '$1index.md'));
  return text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (all, alt, target) => {
      const picture = PICTURES[posix.normalize(posix.join(dir, decodeURI(target)))];
      if (!picture) return all;
      const esc = alt.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
      return `<img src="${picture.src}" alt="${esc}" width="${picture.width}" height="${picture.height}" loading="lazy" decoding="async">`;
    })
    .replace(/\]\(#([^)]+)\)/g, (_, anchor) => `](${route(file)}#${anchor})`);
}

const cache = new Map();
// a section as HTML: its headings keep their level, without ids of their own (the
// fact sheet has its own, and a section may be on it twice)
export async function sectionHtml(ref) {
  const key = ref.file + '#' + ref.heading;
  if (!cache.has(key)) {
    const text = section(ref);
    cache.set(key, text ? (await md(anchored(text, ref.file))).replace(/\s(id)="[^"]*"/g, '') : null);
  }
  return cache.get(key);
}

// one cell of a table: its words, without the paragraph around them
export async function inlineHtml(text, file) {
  if (!text) return '';
  return (await md(anchored(text, file))).trim().replace(/^<p>([\s\S]*)<\/p>$/, '$1');
}
