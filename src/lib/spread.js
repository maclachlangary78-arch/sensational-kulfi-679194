import { POSITIONS } from './constants';
import { buildSpread } from './stats';
import { newId } from './id';

// A spread is the list of lines set up on the boat for the day. Each line (slot) holds a position,
// a lure (or a typed-in name not yet in the tackle box), its size, and an optional hook.
// It lives on the device so it survives app restarts offshore without signal.
export const NEW_LURE = '__new';

export const emptySlot = (position = 'Shotgun') => ({
  id: newId(),
  position,
  lureId: '',
  customName: '',
  lureSize: '',
  hookType: '',
  hookSize: '9/0',
});

export const defaultSpread = () => POSITIONS.map((p) => emptySlot(p));

// What was last run for this lure in this position (so a 6" Dingo on the shotgun and a 10" on the
// short corner are each remembered), falling back to the lure's own defaults.
export function lastRig(lure, position, strikes) {
  const last = lure && strikes.find((s) => String(s.lureId) === String(lure.id) && s.position === position);
  if (last) return { lureSize: last.lureSize || lure.size || '', hookType: last.hookType || '', hookSize: last.hookSize || '9/0' };
  return { lureSize: lure?.size || '', hookType: lure?.hookType || '', hookSize: lure?.hookSize || '9/0' };
}

// Turns the Spread Builder's suggestion into a ready-to-fish spread. Any size and hook the angler already
// set for that lure on their current spread wins (same position first, then any line running it), so
// loading a suggestion never throws away what's actually rigged on the boat.
export function suggestedSpread(lures, strikes, conditions, current = []) {
  return buildSpread(lures, strikes, conditions).map(({ position, lure, size }) => {
    if (!lure) return emptySlot(position);
    const rig = lastRig(lure, position, strikes);
    const sameLure = current.filter((s) => String(s.lureId) === String(lure.id) && s.lureSize?.trim());
    const set = sameLure.find((s) => s.position === position) || sameLure[0];
    const kept = set ? { lureSize: set.lureSize, hookType: set.hookType, hookSize: set.hookSize } : {};
    return { ...emptySlot(position), lureId: lure.id, ...rig, lureSize: size || rig.lureSize, ...kept };
  });
}

// Puts a lure into its usual position: fills that slot if it's empty, otherwise adds a new line.
export function addLureToSpread(slots, lure, strikes) {
  const filled = { lureId: lure.id, customName: '', ...lastRig(lure, lure.defaultPosition, strikes) };
  const i = slots.findIndex((s) => s.position === lure.defaultPosition && !s.lureId);
  if (i >= 0) return slots.map((s, j) => (j === i ? { ...s, ...filled } : s));
  return [...slots, { ...emptySlot(lure.defaultPosition), ...filled }];
}

// A line's lure name — a saved lure, or one typed in that isn't in My Lures yet.
export function slotName(slot, lures) {
  const lure = lures.find((l) => String(l.id) === String(slot.lureId));
  return lure?.name || (slot.lureId === NEW_LURE ? (slot.customName || '').trim() : '');
}

// Lines holding a typed-in lure with a name and size — ready to be added to My Lures.
export const unsavedLures = (slots) =>
  slots.filter((s) => s.lureId === NEW_LURE && (s.customName || '').trim() && (s.lureSize || '').trim());

// Turns a saved spread back into lines for today. Lures deleted since are left for the angler to re-pick.
export function restoreSpread(saved, lures) {
  return saved.slots.map((s) => {
    const known = s.lureId && lures.some((l) => String(l.id) === String(s.lureId));
    return {
      ...emptySlot(s.position),
      lureId: known ? s.lureId : s.customName ? NEW_LURE : '',
      customName: known ? '' : s.customName || '',
      lureSize: s.lureSize || '',
      hookType: s.hookType || '',
      hookSize: s.hookSize || '9/0',
    };
  });
}
