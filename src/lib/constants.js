export const POSITIONS = ['Short Corner', 'Long Corner', 'Short Rigger', 'Long Rigger', 'Shotgun'];
export const TIDES = ['High Tide', 'Low Tide', 'Flooding', 'Ebbing', 'Slack Water'];
export const BOAT_TYPES = ['Flybridge Battlewagon', 'Express Gamefisher', 'Center Console', 'Walkaround', 'Trailerboat / Runabout'];
export const HOOK_SIZES = ['1/0', '2/0', '3/0', '4/0', '5/0', '6/0', '7/0', '8/0', '9/0', '10/0', '11/0', '12/0', '13/0', '14/0'];

// Pakula sizes Dojo hooks by gape in mm (e.g. a "Light 25"), matched to the lure's head diameter.
// The /0 figures are Pakula's rough equivalents, shown only as a guide.
const dojo = (list) => list.map(([value, approx]) => ({ value, label: `${value} (≈${approx})` }));
const PAKULA_LIGHT = dojo([['15', '3/0'], ['19', '5/0'], ['20', '6/0'], ['25', '7/0–8/0'], ['30', '9/0'], ['35', '10/0'], ['40', '11/0–12/0']]);
const PAKULA_X = PAKULA_LIGHT.filter((s) => Number(s.value) >= 25);
const PAKULA_XX = ['45', '50', '55', '60'].map((value) => ({ value, label: value }));
const OUGHT = HOOK_SIZES.map((value) => ({ value, label: value }));

// Commonly used game fishing hooks for skirted lures. `size` is the default picked with the hook.
export const HOOKS = [
  { type: 'Pakula Dojo Light', sizes: PAKULA_LIGHT, size: '25' },
  { type: 'Pakula Dojo X Strong', sizes: PAKULA_X, size: '30' },
  { type: 'Pakula Dojo XX Strong', sizes: PAKULA_XX, size: '45' },
  { type: 'Mustad 7691S Southern & Tuna', sizes: OUGHT, size: '9/0' },
  { type: 'Mustad 7732 Southern & Tuna (Stainless)', sizes: OUGHT, size: '9/0' },
  { type: 'Owner Jobu', sizes: OUGHT, size: '9/0' },
  { type: 'BKK Kajiki Light', sizes: OUGHT, size: '8/0' },
  { type: 'BKK Kajiki HD', sizes: OUGHT, size: '10/0' },
  { type: 'BKK Kajiki HD Open Gap', sizes: OUGHT, size: '10/0' },
  { type: 'Tantrum x Fudo Heavy Tackle', sizes: OUGHT, size: '10/0' },
  { type: 'Fudo Super Ocean Southern Tuna', sizes: OUGHT, size: '9/0' },
  { type: 'Fudo Super Ocean Kona Cut', sizes: OUGHT, size: '9/0' },
  { type: 'Quick Rig Southern & Tuna', sizes: OUGHT, size: '9/0' },
  { type: 'Quick Rig Dr J', sizes: OUGHT, size: '9/0' },
];
export const HOOK_TYPES = HOOKS.map((h) => h.type);

// Size choices for a hook type; older saved types (e.g. "Pakula Dojo") fall back to the /0 sizes.
export function hookSizesFor(type) {
  const hook = HOOKS.find((h) => h.type === type);
  if (hook) return hook.sizes;
  return /pakula/i.test(type || '') ? [...PAKULA_LIGHT, ...PAKULA_XX] : OUGHT;
}

export function defaultHookSize(type, current) {
  const sizes = hookSizesFor(type);
  if (sizes.some((s) => s.value === current)) return current;
  return HOOKS.find((h) => h.type === type)?.size || sizes[0].value;
}

// Quick picks for lure size — any other size can be typed in.
export const LURE_SIZES = ['6"', '7"', '8"', '9"', '10"', '11"', '12"', '13"', '14"', '16"'];
