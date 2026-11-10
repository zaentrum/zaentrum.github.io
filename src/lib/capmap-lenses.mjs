// what the capability map colours its tiles by, for the page as it is built and for
// the browser when someone switches: one rule for both, so the tiles, their labels
// and the legend can't tell different stories. a tile holds its capability's values
// as data attributes (see src/pages/spec/capabilities/map.astro); a lens reads them.
export const FACES = [
  ['all', 'where it is meant'],
  ['apps', 'the four apps'],
  ['web', 'Web'],
  ['phone', 'Phone'],
  ['androidtv', 'Android TV'],
  ['samsung', 'Samsung TV'],
  ['portal', 'Portal'],
  ['catalog', 'Catalog console'],
  ['cli', 'CLI'],
  ['resource', 'Resource'],
];

export const LENSES = [
  {
    key: 'built',
    label: 'built',
    classes: [
      ['built', 'built', 'success'],
      ['partial', 'partial', 'warning'],
      ['no', 'not there', 'error'],
      ['unknown', 'not checked', 'info'],
      ['none', 'not meant for it', 'none'],
    ],
    of: (d, face) => d[face],
  },
  {
    key: 'spec',
    label: 'specified',
    classes: [
      ['chapter', 'in a chapter', 'success'],
      ['docs', 'only in the docs', 'warning'],
      ['nowhere', 'nowhere', 'error'],
    ],
    of: (d) => d.spec,
    lab: (d) => d.labSpec,
  },
  {
    // a requirement is one of the specification's numbered changes; open until it is built
    key: 'changes',
    label: 'requirements',
    classes: [
      ['many', '3 or more open', 'info-strong'],
      ['few', '1 or 2 open', 'info'],
      ['zero', 'none open', 'neutral'],
    ],
    of: (d) => (+d.open === 0 ? 'zero' : +d.open < 3 ? 'few' : 'many'),
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
    // what people expect of a media server (spec/capabilities/expectations.csv): a
    // capability nothing serves is in the model because an expectation or a change names it
    key: 'expected',
    label: 'expected',
    classes: [
      ['absent', 'nothing serves it yet', 'error'],
      ['named', 'an expectation names it', 'info'],
      ['none', 'no expectation names it', 'neutral'],
    ],
    of: (d) => d.expected,
    lab: (d) => d.labExpected,
  },
];

export const lensByKey = Object.fromEntries(LENSES.map((l) => [l.key, l]));

// a tile's class, tone and label under a lens (for built, on one face)
export function classify(d, lensKey, face) {
  const lens = lensByKey[lensKey] ?? LENSES[0];
  const cls = lens.of(d, face);
  const [, name, tone] = lens.classes.find(([key]) => key === cls) ?? [cls, cls, 'neutral'];
  return { cls, tone, label: lens.lab ? lens.lab(d) : name };
}
