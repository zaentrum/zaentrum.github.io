// what the goal map colours its tiles by, for the page as it is built and for the
// browser when someone switches: one rule for both, as src/lib/capmap-lenses.mjs is for
// the capability map. a tile is a group of capabilities (an area) under the goal it is
// for; it holds its values as data attributes (see src/pages/spec/goals/map.astro).
export const LENSES = [
  {
    // how much of the group is there, over every app and face meant to have each
    // capability: finished, all there and some of it unfinished, some of it missing, or
    // none of it there
    key: 'built',
    label: 'built',
    classes: [
      ['built', 'all of it built', 'success'],
      ['there', 'all there, some unfinished', 'info'],
      ['gaps', 'some of it not there', 'warning'],
      ['no', 'none of it there', 'error'],
      ['unknown', 'not checked', 'neutral'],
    ],
    of: (d) => d.built,
    lab: (d) => d.labBuilt,
  },
  {
    // a capability nothing serves: no app or face has it, and nothing in the code is its
    key: 'gaps',
    label: 'gaps',
    classes: [
      ['absent', 'holds what nothing serves', 'error'],
      ['none', 'all of it is served', 'neutral'],
    ],
    of: (d) => d.gaps,
    lab: (d) => d.labGaps,
  },
  {
    // how deep the group is modelled: in a chapter, named and served, or only a heading
    key: 'depth',
    label: 'specified',
    classes: [
      ['deep', 'deep: every capability in a chapter', 'success'],
      ['working', 'working: named and served', 'info'],
      ['stub', 'a stub: a heading only', 'none'],
    ],
    of: (d) => d.depth,
    lab: (d) => d.labDepth,
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
