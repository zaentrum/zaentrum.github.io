// copies the docs/ folder of zaentrum/zaentrum into the site as its pages.
//
//   node scripts/sync-docs.mjs                     reads .sources/zaentrum (the deploy
//                                                  workflow checks it out there), or
//                                                  clones it there when it's missing
//   DOCS_SOURCE=~/src/zaentrum node scripts/sync-docs.mjs
//                                                  reads a working copy instead
//
// every page keeps its path: docs/chino/playback.md is /docs/chino/playback/, and a
// README.md is its folder's page. the first "# heading" becomes the page's title, a
// link to another page becomes that page's address, a link to any other file of the
// repository goes to it on GitHub, and the images are copied next to their pages.
// the docs themselves are never changed: edit them in zaentrum/zaentrum.
//
// writes src/content/docs/docs/ (the pages), src/generated/pages.json (each page's
// address and title, for the navigation) and public/docs/sources.json (the commit
// the pages were built from).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'zaentrum/zaentrum';
const BRANCH = 'main';
const SOURCE = resolve(process.env.DOCS_SOURCE ?? join(ROOT, '.sources/zaentrum'));
const OUT = join(ROOT, 'src/content/docs/docs');
const IMAGE = /\.(png|svg|jpe?g|gif|webp|avif)$/i;
const GITHUB = `https://github.com/${REPO}`;

if (!existsSync(join(SOURCE, 'docs'))) {
  if (process.env.DOCS_SOURCE) throw new Error(`no docs/ folder in ${SOURCE}`);
  console.log(`cloning ${REPO} into ${relative(ROOT, SOURCE)}`);
  execFileSync('git', ['clone', '--quiet', '--depth=1', '--branch', BRANCH, `${GITHUB}.git`, SOURCE], { stdio: 'inherit' });
}
const DOCS = join(SOURCE, 'docs');
const git = (...args) => execFileSync('git', ['-C', SOURCE, ...args], { encoding: 'utf8' }).trim();

// docs/chino/playback.md -> /docs/chino/playback/ ; docs/chino/README.md -> /docs/chino/
const route = (rel) => '/' + posix.join('docs', rel.replace(/(^|\/)README\.md$/, '').replace(/\.md$/, '')) + '/';
const outPath = (rel) => rel.replace(/(^|\/)README\.md$/, '$1index.md');

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(relative(DOCS, path).split('\\').join('/'));
  }
})(DOCS);
const pages = new Set(files.filter((f) => f.endsWith('.md')));

// a link's target, as the site has it.
function rewrite(target, from) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  const [path, hash = ''] = target.split(/(?=#)/);
  const resolved = posix.normalize(posix.join(posix.dirname(from), decodeURI(path)));
  if (pages.has(resolved)) return route(resolved) + hash;
  if (resolved.startsWith('../')) {
    // somewhere else in the repository: README.md, releases.json, e2e/ ...
    const inRepo = posix.normalize(posix.join('docs', resolved));
    const kind = existsSync(join(SOURCE, inRepo)) && statSync(join(SOURCE, inRepo)).isDirectory() ? 'tree' : 'blob';
    return `${GITHUB}/${kind}/${BRANCH}/${inRepo.replace(/\/$/, '')}${hash}`;
  }
  if (IMAGE.test(resolved) && files.includes(resolved)) return path.startsWith('.') ? target : './' + target;
  if (files.includes(resolved)) return `${GITHUB}/blob/${BRANCH}/docs/${resolved}${hash}`;
  problems.push(`${from}: "${target}" points at nothing`);
  return target;
}

// [text](target) and ![alt](target), outside code. a link text may hold one level of [brackets].
const LINK = /(!?\[(?:[^[\]]|\[[^\]]*\])*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g;
function rewriteText(text, from) {
  // a link inside a `code span` is text: find the spans (a run of backticks up to the
  // next run of the same length), and leave every link that starts in one alone.
  const runs = [...text.matchAll(/`+/g)].map((m) => [m.index, m[0].length]);
  const spans = [];
  for (let i = 0; i < runs.length; i++) {
    const close = runs.findIndex(([, length], j) => j > i && length === runs[i][1]);
    if (close === -1) continue;
    spans.push([runs[i][0], runs[close][0]]);
    i = close;
  }
  const inCode = (at) => spans.some(([start, end]) => at > start && at < end);
  return text.replace(LINK, (link, open, target, close, at) =>
    inCode(at) ? link : open + rewrite(target, from) + close,
  );
}

function convert(rel) {
  const lines = readFileSync(join(DOCS, rel), 'utf8').split('\n');
  let fence = null;
  let title = null;
  const body = [];
  let prose = [];
  const flush = () => { if (prose.length) body.push(rewriteText(prose.join('\n'), rel)); prose = []; };
  for (const line of lines) {
    const mark = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      body.push(line);
      if (mark && line.trim().startsWith(fence) && line.trim().replace(/[`~]/g, '') === '') fence = null;
      continue;
    }
    if (mark) { flush(); fence = mark[1]; body.push(line); continue; }
    if (title === null && /^# /.test(line)) { title = line.slice(2).trim(); continue; }
    prose.push(line);
  }
  flush();
  if (title === null) { problems.push(`${rel}: no "# heading" for the title`); title = rel; }
  const plain = title.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');
  const front = ['---', `title: ${JSON.stringify(plain)}`, `editUrl: ${GITHUB}/edit/${BRANCH}/docs/${rel}`, '---', ''];
  return { title: plain, text: front.join('\n') + body.join('\n').replace(/^\n+/, '') };
}

const problems = [];
rmSync(OUT, { recursive: true, force: true });
const index = [];
for (const rel of files) {
  const dest = join(OUT, rel.endsWith('.md') ? outPath(rel) : rel);
  if (rel.endsWith('.md')) {
    const { title, text } = convert(rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
    index.push({ source: `docs/${rel}`, route: route(rel), title });
  } else if (IMAGE.test(rel)) {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(DOCS, rel), dest);
  }
}

const commit = git('rev-parse', 'HEAD');
const docsTree = git('rev-parse', 'HEAD:docs');
mkdirSync(join(ROOT, 'src/generated'), { recursive: true });
writeFileSync(join(ROOT, 'src/generated/pages.json'), JSON.stringify(index, null, 2) + '\n');
mkdirSync(join(ROOT, 'public/docs'), { recursive: true });
writeFileSync(
  join(ROOT, 'public/docs/sources.json'),
  JSON.stringify([{ repo: REPO, branch: BRANCH, commit, docs: docsTree }], null, 2) + '\n',
);

console.log(`${index.length} pages and ${files.filter((f) => IMAGE.test(f)).length} images from ${REPO}@${commit.slice(0, 7)}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
