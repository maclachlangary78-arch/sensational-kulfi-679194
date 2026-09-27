// Commonly trolled game fishing lures, used for the "pick lure → colour → size" steps.
// Saved lure names are built as `<Brand> <Model> - <Colour>` so they can be read back into the picker.
// Sizes are free text like everywhere else; `label` only adds the model's own name for that size.

// Colours seen across most skirted lure makers.
export const SKIRT_COLOURS = [
  'Black/Purple',
  'Black/Red',
  'Blue/White',
  'Blue/Silver',
  'Pink/White',
  'Pink/Silver',
  'Purple/Pink',
  'Green/Yellow (Mahi)',
  'Green/Gold',
  'Lumo',
  'Evil',
  'Red/Black',
  'Brown/Orange',
  'Orange/Yellow',
  'Skipjack',
  'Mackerel',
  'Rainbow',
];

// Hard-bodied minnows and stickbaits come in baitfish patterns rather than skirt colours.
const MINNOW_COLOURS = [
  'Redhead',
  'Pilchard',
  'Mackerel',
  'Bonito',
  'Garfish',
  'Flying Fish',
  'Blue/Silver',
  'Pink/Silver',
  'Purple/Black',
  'Green/Gold',
  'Gold',
  'Black/Purple',
];

const labelled = (list) => list.map(([value, label]) => ({ value, label: label ? `${value} · ${label}` : value }));
const plain = (list) => list.map((value) => ({ value, label: value }));

export const LURE_CATALOG = [
  {
    brand: 'Pakula',
    skirted: true,
    colours: ['Lumo', 'Lumo Illusion', 'Grasshopper Lumo', 'Black Betty', 'Brad J', 'Violeta', 'Evil', 'Paua'],
    // Pakula publishes every lure's length in mm with a size number (e.g. Size 35 Medium 321mm) — sized the same way
    // as the Nomad and Halco minnows. Where Original and Paua/Jet Paua versions differ, each length is listed.
    models: [
      {
        model: "Hailey's Comet",
        sizes: labelled([
          ['182mm', 'X Small · Size 15 · 7.3"'],
          ['235mm', 'Small · Size 25 · 9.5"'],
          ['321mm', 'Medium · Size 35 · 12.7"'],
          ['366mm', 'Large · Size 40 · 14.35"'],
          ['460mm', 'X Large · Size 55 · 18"'],
        ]),
      },
      {
        model: 'Sprocket',
        position: 'Long Rigger',
        sizes: labelled([
          ['180mm', 'Micro · Size 15 · 7.2"'],
          ['229mm', 'Mini · Size 20 · 9"'],
          ['303mm', 'Small · Size 30 · 11.9"'],
          ['310mm', 'Medium · Size 35 · 12.3"'],
          ['371mm', 'Large · Size 40 · 14.6"'],
        ]),
      },
      {
        model: 'Mouse',
        position: 'Short Rigger',
        sizes: labelled([
          ['299mm', 'Original · Size 30 · 11.8"'],
          ['302mm', 'Paua · Size 35 · 11.9"'],
        ]),
      },
      {
        model: 'Cockroach',
        sizes: labelled([
          ['172mm', 'Micro · Size 15 · 6.9"'],
          ['220mm', 'Original · Size 20 · 8.75"'],
          ['222mm', 'Paua · Size 25 · 8.85"'],
        ]),
      },
      {
        model: 'Uzi',
        sizes: labelled([
          ['125mm', 'Micro · Size 04 · 5"'],
          ['143mm', 'Size 10 · 5.5"'],
        ]),
      },
      { model: 'Skippy', sizes: labelled([['105mm', 'Size 04 · 4.1"']]) },
      { model: 'Fluzi', sizes: labelled([['165mm', 'Size 10 · 6.5"']]) },
      { model: 'Mossie', sizes: labelled([['180mm', 'Size 15 · 7"']]) },
      { model: 'Zipper', sizes: labelled([['193mm', 'Size 15 · 7.7"']]) },
      {
        model: 'Phantom',
        sizes: labelled([
          ['240mm', 'Original · Size 20 · 9.55"'],
          ['243mm', 'Paua · Size 25 · 9.65"'],
        ]),
      },
      { model: 'Shaker', sizes: labelled([['295mm', 'Size 35 · 11.7"']]) },
      { model: 'Guru', sizes: labelled([['315mm', 'Size 30 · 12.4"']]) },
      {
        model: 'Rat',
        sizes: labelled([
          ['362mm', 'Original · Size 40 · 14.25"'],
          ['365mm', 'Paua · Size 40 · 14.35"'],
        ]),
      },
      {
        model: 'Shredder',
        sizes: labelled([
          ['182mm', 'X Small · Size 15 · 7.3"'],
          ['235mm', 'Small · Size 25 · 9.5"'],
          ['321mm', 'Medium · Size 35 · 12.7"'],
          ['366mm', 'Large · Size 40 · 14.5"'],
        ]),
      },
      { model: 'Wombat', sizes: labelled([['413mm', 'Size 55 · 16.1"']]) },
      { model: 'Witchdoctor' },
    ],
  },
  {
    brand: 'JB',
    skirted: true,
    colours: ['Lumo', 'Evil', 'Pearl', 'Shell'],
    models: [
      {
        model: 'Dingo',
        sizes: labelled([
          ['6.5"', 'Micro Dingo'],
          ['8"', 'Little Dingo'],
          ['10"', 'Dingo'],
          ['12.5"', 'Big Dingo'],
          ['15"', 'XL Dingo'],
          ['17"', 'XXL Dingo'],
          ['19"', 'XXXL Dingo'],
          ['21"', 'XXXXL Dingo'],
          ['23"', 'Gonzo'],
        ]),
      },
      { model: 'Chopper', sizes: plain(['Medium', 'Mega']) },
      { model: 'Ripper', sizes: labelled([['10"']]) },
      { model: 'Smoking Gun', sizes: labelled([['11"']]) },
      { model: 'Willy Willy' },
      { model: 'Taipan' },
      { model: 'Chook' },
      { model: 'Donger' },
      { model: 'Hummer' },
      { model: 'Rocket' },
    ],
  },
  {
    brand: 'Bonze',
    skirted: true,
    colours: [],
    models: [
      { model: 'Bruiser', sizes: labelled([['7.5"']]) },
      { model: 'Darter' },
      { model: 'Exocet', sizes: labelled([['9.5"']]) },
      { model: 'Rambo', sizes: labelled([['10"']]) },
      { model: 'Trojan' },
      { model: 'Islander' },
      { model: 'Hercules' },
      { model: 'ATM', sizes: labelled([['13"']]) },
      { model: 'Rocket' },
      { model: 'DLB' },
      { model: 'Grimmel' },
      { model: 'Ultimate' },
      { model: 'Sea Creature', sizes: labelled([['15.5"']]) },
      { model: 'Tracker', sizes: labelled([['15.75"']]) },
      { model: 'Behemoth' },
      { model: 'Violator', sizes: labelled([['17"']]) },
      { model: 'Inferno' },
      { model: 'Fireball' },
      { model: 'TKO' },
    ],
  },
  {
    brand: 'Tantrum',
    skirted: true,
    colours: ['Aku/Skipjack'],
    models: [
      { model: 'Plunger', sizes: plain(['Small', 'Medium', 'Large', 'XL']) },
      { model: 'Kaboom', sizes: plain(['Large', 'XL', 'XXL']) },
      { model: 'Bandit', sizes: plain(['Medium', 'XL']) },
      { model: 'Bullet', sizes: plain(['Medium']) },
      { model: 'Tube', sizes: plain(['Medium']) },
      { model: 'AMN', sizes: plain(['Small']) },
    ],
  },
  {
    brand: 'Nomad',
    colours: MINNOW_COLOURS,
    models: [
      { model: 'DTX Minnow', sizes: plain(['110mm', '125mm', '165mm', '200mm', '220mm']) },
      { model: 'DTX Minnow HD', sizes: plain(['180mm', '200mm', '220mm']) },
      { model: 'Madscad', sizes: plain(['150mm', '190mm']) },
      { model: 'Madscad Autotune', sizes: plain(['190mm']) },
      { model: 'Madmacs', sizes: plain(['160mm', '200mm', '240mm']) },
    ],
  },
  {
    brand: 'Halco',
    colours: MINNOW_COLOURS,
    models: [
      { model: 'Laser Pro', sizes: plain(['120mm', '140mm', '160mm', '190mm']) },
      { model: 'Laser Pro DD', sizes: plain(['120mm', '140mm', '160mm', '190mm']) },
      { model: 'Laser Pro XDD Crazy Deep', sizes: plain(['160mm', '190mm', '210mm']) },
      { model: 'Max', sizes: plain(['110mm', '130mm', '190mm']) },
    ],
  },
];

// Flat lookup keyed by the base lure name, e.g. "JB Dingo".
const BY_NAME = new Map(
  LURE_CATALOG.flatMap((b) =>
    b.models.map((m) => [`${b.brand} ${m.model}`, { ...m, brand: b.brand, name: `${b.brand} ${m.model}`, sizes: m.sizes || [] }]),
  ),
);

export const findModel = (base) => BY_NAME.get(base) || null;

// Brand favourites first, then the rest of the usual colours without repeats.
export function coloursFor(brand) {
  const b = LURE_CATALOG.find((x) => x.brand === brand);
  if (!b) return { brand: [], common: SKIRT_COLOURS };
  const common = b.skirted ? SKIRT_COLOURS.filter((c) => !b.colours.includes(c)) : [];
  return { brand: b.colours, common };
}

export const joinName = (base, colour) => (base && colour ? `${base} - ${colour}` : base);

// "JB Dingo - Lumo" → { base: "JB Dingo", colour: "Lumo", model }
export function splitName(name = '') {
  const i = name.lastIndexOf(' - ');
  const base = (i >= 0 ? name.slice(0, i) : name).trim();
  const colour = i >= 0 ? name.slice(i + 3).trim() : '';
  return { base, colour, model: findModel(base) };
}

// Size quick picks for a saved lure — its model's sizes if it came from the catalogue.
export function sizesFor(name) {
  const { model } = splitName(name);
  return model?.sizes.length ? model.sizes.map((s) => s.value) : null;
}
