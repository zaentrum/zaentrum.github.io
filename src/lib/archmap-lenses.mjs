// what the architecture map colours its tiles by, for the page as it is built and for
// the browser when someone switches: one rule for both, as src/lib/capmap-lenses.mjs is
// for the capability map. a tile holds its component's values as data attributes (see
// src/pages/spec/architecture/map.astro); a lens reads them.
export const LENSES = [
  {
    key: 'status',
    label: 'status',
    classes: [
      ['runs', 'runs', 'success'],
      ['ships', 'ships', 'info'],
      ['idle', 'idle', 'warning'],
      ['outside', 'outside', 'neutral'],
      ['demo', 'the demo\'s', 'neutral'],
      ['beside', 'beside', 'neutral'],
      ['later', 'later', 'none'],
      ['retired', 'retired', 'none'],
    ],
    of: (d) => d.status,
    lab: (d) => d.kind,
  },
  {
    key: 'serves',
    label: 'capabilities',
    classes: [
      ['many', '20 or more', 'info-strong'],
      ['some', '1 to 19', 'info'],
      ['none', 'none', 'neutral'],
    ],
    of: (d) => (+d.caps >= 20 ? 'many' : +d.caps > 0 ? 'some' : 'none'),
    lab: (d) => (+d.caps ? `${d.caps} ${+d.caps === 1 ? 'capability' : 'capabilities'}` : 'no capability'),
  },
  {
    // a requirement is one of the specification's numbered changes, on a capability the
    // component serves; open until it is built
    key: 'changes',
    label: 'requirements',
    classes: [
      ['many', '10 or more open', 'info-strong'],
      ['few', '1 to 9 open', 'info'],
      ['zero', 'none open', 'neutral'],
    ],
    of: (d) => (+d.open >= 10 ? 'many' : +d.open > 0 ? 'few' : 'zero'),
    lab: (d) => (+d.changes === 0 ? 'no requirement' : `${d.open} of ${d.changes} open`),
  },
  {
    key: 'config',
    label: 'settings',
    classes: [
      ['fixed', 'a value fixed in the code', 'warning'],
      ['set', 'every value set somewhere', 'success'],
      ['none', 'no setting', 'neutral'],
    ],
    of: (d) => d.config,
    lab: (d) => d.labConfig,
  },
  {
    key: 'decided',
    label: 'decisions',
    classes: [
      ['decided', 'governed by a decision', 'info'],
      ['none', 'by none', 'neutral'],
    ],
    of: (d) => (+d.adrs ? 'decided' : 'none'),
    lab: (d) => (+d.adrs ? d.labAdrs : 'no decision'),
  },
  {
    key: 'found',
    label: 'findings',
    classes: [
      ['found', 'a finding', 'warning'],
      ['none', 'none', 'neutral'],
    ],
    of: (d) => (+d.found ? 'found' : 'none'),
    lab: (d) => (+d.found ? `${d.found} ${+d.found === 1 ? 'finding' : 'findings'}` : 'no finding'),
  },
];

export const lensByKey = Object.fromEntries(LENSES.map((l) => [l.key, l]));

// a tile's class, tone and label under a lens
export function classify(d, lensKey) {
  const lens = lensByKey[lensKey] ?? LENSES[0];
  const cls = lens.of(d);
  const [, name, tone] = lens.classes.find(([key]) => key === cls) ?? [cls, cls, 'neutral'];
  return { cls, tone, label: lens.lab ? lens.lab(d) : name };
}
