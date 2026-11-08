// copies the docs/ and spec/ folders of zaentrum/zaentrum into the site as its pages:
// docs/ is the documentation (running, extending, the library format, the
// architecture), spec/ the specification of the product's screens (chino, the portal).
//
//   node scripts/sync-docs.mjs                     reads .sources/zaentrum (the deploy
//                                                  workflow checks it out there), or
//                                                  clones it there when it's missing
//   DOCS_SOURCE=~/src/zaentrum node scripts/sync-docs.mjs
//                                                  reads a working copy instead
//
// every page keeps its path: spec/chino/home.md is /spec/chino/home/, and a README.md
// is its folder's page. the first "# heading" becomes the page's title, a link to
// another page (in either folder) becomes that page's address, a link to any other
// file of the repository goes to it on GitHub, and the images are copied next to
// their pages. the folders themselves are never changed: edit them in zaentrum/zaentrum.
//
// writes src/content/docs/{docs,spec}/ (the pages), src/generated/pages.json (each
// page's address and title, for the navigation) and public/docs/sources.json (the
// commit the pages were built from).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'zaentrum/zaentrum';
const BRANCH = 'main';
const SOURCE = resolve(process.env.DOCS_SOURCE ?? join(ROOT, '.sources/zaentrum'));
const CONTENT = join(ROOT, 'src/content/docs');
const TREES = ['docs', 'spec']; // docs/ is required, spec/ is copied when it's there
const IMAGE = /\.(png|svg|jpe?g|gif|webp|avif)$/i;
const GITHUB = `https://github.com/${REPO}`;

if (!existsSync(join(SOURCE, 'docs'))) {
  if (process.env.DOCS_SOURCE) throw new Error(`no docs/ folder in ${SOURCE}`);
  console.log(`cloning ${REPO} into ${relative(ROOT, SOURCE)}`);
  execFileSync('git', ['clone', '--quiet', '--depth=1', '--branch', BRANCH, `${GITHUB}.git`, SOURCE], { stdio: 'inherit' });
}
const git = (...args) => execFileSync('git', ['-C', SOURCE, ...args], { encoding: 'utf8' }).trim();
const trees = TREES.filter((tree) => existsSync(join(SOURCE, tree)));

// spec/chino/home.md -> /spec/chino/home/ ; docs/README.md -> /docs/
const route = (path) => '/' + path.replace(/(^|\/)README\.md$/, '').replace(/\.md$/, '') + '/';
const outPath = (path) => path.replace(/(^|\/)README\.md$/, '$1index.md');

// every file of the copied folders, by its path in the repository
const files = [];
for (const tree of trees) {
  (function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(relative(SOURCE, path).split('\\').join('/'));
    }
  })(join(SOURCE, tree));
}
const known = new Set(files);
const pages = new Set(files.filter((f) => f.endsWith('.md')));

// a link's target, as the site has it.
function rewrite(target, from) {
  if (/^(https?:|mailto:|#)/.test(target)) return target;
  const [path, hash = ''] = target.split(/(?=#)/);
  const resolved = posix.normalize(posix.join(posix.dirname(from), decodeURI(path)));
  if (pages.has(resolved)) return route(resolved) + hash;
  // an image is copied to the same place, so its relative link still holds
  if (IMAGE.test(resolved) && known.has(resolved)) return path.startsWith('.') ? target : './' + target;
  if (!resolved.startsWith('../') && existsSync(join(SOURCE, resolved))) {
    // another file of the repository: README.md, releases.json, e2e/, a drawing's source …
    const kind = statSync(join(SOURCE, resolved)).isDirectory() ? 'tree' : 'blob';
    return `${GITHUB}/${kind}/${BRANCH}/${resolved.replace(/\/$/, '')}${hash}`;
  }
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

function convert(path) {
  const lines = readFileSync(join(SOURCE, path), 'utf8').split('\n');
  let fence = null;
  let title = null;
  const body = [];
  let prose = [];
  const flush = () => { if (prose.length) body.push(rewriteText(prose.join('\n'), path)); prose = []; };
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
  if (title === null) { problems.push(`${path}: no "# heading" for the title`); title = path; }
  const plain = title.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');
  const front = ['---', `title: ${JSON.stringify(plain)}`, `editUrl: ${GITHUB}/edit/${BRANCH}/${path}`, '---', ''];
  return { title: plain, text: front.join('\n') + body.join('\n').replace(/^\n+/, '') };
}

const problems = [];
for (const tree of TREES) rmSync(join(CONTENT, tree), { recursive: true, force: true });
const index = [];
for (const path of files) {
  const dest = join(CONTENT, path.endsWith('.md') ? outPath(path) : path);
  if (path.endsWith('.md')) {
    const { title, text } = convert(path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, text);
    index.push({ source: path, route: route(path), title });
  } else if (IMAGE.test(path)) {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(SOURCE, path), dest);
  }
}

const commit = git('rev-parse', 'HEAD');
const source = { repo: REPO, branch: BRANCH, commit };
// the tree each folder had in the commit (null for a folder the commit doesn't have, as
// in a working copy where it isn't committed yet)
const tree = (name) => { try { return git('rev-parse', `HEAD:${name}`); } catch { return null; } };
for (const name of TREES) source[name] = trees.includes(name) ? tree(name) : null;
mkdirSync(join(ROOT, 'src/generated'), { recursive: true });
writeFileSync(join(ROOT, 'src/generated/pages.json'), JSON.stringify(index, null, 2) + '\n');
mkdirSync(join(ROOT, 'public/docs'), { recursive: true });
writeFileSync(join(ROOT, 'public/docs/sources.json'), JSON.stringify([source], null, 2) + '\n');

console.log(`${index.length} pages and ${files.filter((f) => IMAGE.test(f)).length} images from ${REPO}@${commit.slice(0, 7)} (${trees.join(', ')})`);

// the capability model, resolved by the repository's own scripts/capabilities.py, for the
// map and the fact sheets (src/pages/spec/capabilities/, src/lib/capabilities.mjs). a
// version of the repository whose script can't write it (no --json yet) has no map.
const MODEL = join(ROOT, 'src/generated/capabilities.json');
const SCRIPT = join(SOURCE, 'scripts/capabilities.py');
rmSync(MODEL, { force: true });
if (existsSync(SCRIPT) && readFileSync(SCRIPT, 'utf8').includes("'--json'")) {
  try {
    console.log(execFileSync('python3', [SCRIPT, '--json', MODEL], { encoding: 'utf8' }).trim());
    const { problems: found = [] } = JSON.parse(readFileSync(MODEL, 'utf8'));
    if (found.length) console.warn(`the capability model has ${found.length} problems (scripts/capabilities.py --check names them)`);
  } catch (error) {
    if (error.code === 'ENOENT') console.warn('no python3 here: the site is built without the capability map');
    else problems.push(`scripts/capabilities.py --json failed: ${error.message}`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
