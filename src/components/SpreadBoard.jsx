import { useState } from 'react';
import { Pencil, Plus, RotateCcw, Sparkles, Target, Trash2 } from 'lucide-react';
import { HookPicker, LurePicker } from './RigFields';
import SavedSpreads from './SavedSpreads';
import { POSITIONS } from '../lib/constants';
import { NEW_LURE, defaultSpread, emptySlot, lastRig, slotName, suggestedSpread } from '../lib/spread';

const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';
const today = () => new Date().toLocaleDateString('en-CA');

function SlotCard({ slot, lures, strikes, onUpdate, onRemove, onStrike, onSaveNewLures }) {
  const lure = lures.find((l) => String(l.id) === String(slot.lureId));
  const name = slotName(slot, lures);
  const [editing, setEditing] = useState(false);
  const d = today();
  const hitsToday = lure
    ? strikes.filter((s) => s.strikeDate === d && String(s.lureId) === String(lure.id) && s.position === slot.position).length
    : 0;

  const selectLure = (id) => {
    const picked = lures.find((l) => String(l.id) === String(id));
    onUpdate({ lureId: id, ...(picked ? lastRig(picked, slot.position, strikes) : {}) });
  };

  const selectPosition = (position) => {
    const size = lure && lastRig(lure, position, strikes).lureSize;
    onUpdate({ position, ...(size ? { lureSize: size } : {}) });
  };

  if (editing) {
    return (
      <div className="bg-slate-950 border border-cyan-800/60 rounded-xl p-3 space-y-2.5">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Position on the boat</label>
          <select value={slot.position} onChange={(e) => selectPosition(e.target.value)} className={field}>
            {POSITIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <LurePicker
          lures={lures}
          lureId={lure ? String(lure.id) : slot.lureId === NEW_LURE ? NEW_LURE : ''}
          customName={slot.customName}
          onSelect={selectLure}
          onSaveNew={onSaveNewLures}
          lureSize={slot.lureSize}
          onCustomName={(customName) => onUpdate({ customName })}
          onLureSize={(lureSize) => onUpdate({ lureSize })}
        />
        <HookPicker hookType={slot.hookType} hookSize={slot.hookSize} onChange={(h) => onUpdate(h)} />
        <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
          <button type="button" onClick={onRemove} className="px-3 py-2 rounded-lg bg-slate-800 text-red-300 text-xs font-semibold flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Remove line
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              onSaveNewLures();
            }}
            className="py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
      <button type="button" onClick={() => setEditing(true)} className="flex-1 min-w-0 text-left">
        <span className="text-[10px] font-mono uppercase text-cyan-400 flex items-center gap-1.5">
          {slot.position}
          {hitsToday > 0 && <span className="text-amber-300 normal-case">· {hitsToday} today</span>}
        </span>
        {name ? (
          <>
            <span className="text-xs font-bold text-slate-100 block truncate">
              {name}
              {slot.lureSize ? (
                <span className="text-slate-400 font-normal"> · {slot.lureSize}</span>
              ) : (
                <span className="text-amber-300 font-normal"> · size needed</span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              {slot.hookType ? `${slot.hookType} (${slot.hookSize})` : 'No hook set'}
              <Pencil className="w-3 h-3 text-slate-600 shrink-0" />
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Choose a lure for this line
          </span>
        )}
      </button>
      {/* Size is required on every strike, so a line without one opens for editing first. */}
      {name && (
        <button
          type="button"
          onClick={slot.lureSize ? onStrike : () => setEditing(true)}
          className="shrink-0 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-lg shadow-cyan-500/20"
        >
          <Target className="w-4 h-4" /> Strike
        </button>
      )}
    </div>
  );
}

export default function SpreadBoard({ lures, strikes, conditions, slots, setSlots, onStrike, onSaveNewLures, ...saved }) {
  const update = (id, patch) => setSlots((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const hasLures = slots.some((s) => s.lureId);

  const autoFill = () => {
    if (hasLures && !confirm('Replace your current spread with the suggested one?')) return;
    setSlots((ss) => suggestedSpread(lures, strikes, conditions, ss));
  };

  const clear = () => {
    if (confirm('Clear every line in your spread?')) setSlots(defaultSpread());
  };

  const usedPositions = new Set(slots.map((s) => s.position));
  const nextPosition = POSITIONS.find((p) => !usedPositions.has(p)) || 'Short Rigger';

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-400">
        Set up the lures you're running before you head out, then tap <strong className="text-cyan-300">Strike</strong> on a line when it goes off.
        Tap a line any time to swap the lure, size, position or hook.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={autoFill}
          disabled={lures.length === 0}
          className="py-2 rounded-lg bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" /> Auto-fill spread
        </button>
        <button
          type="button"
          onClick={clear}
          className="py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear spread
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            lures={lures}
            strikes={strikes}
            onUpdate={(patch) => update(slot.id, patch)}
            onRemove={() => setSlots((ss) => ss.filter((s) => s.id !== slot.id))}
            onStrike={() => onStrike(slot)}
            onSaveNewLures={onSaveNewLures}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSlots((ss) => [...ss, emptySlot(nextPosition)])}
        className="w-full py-2 rounded-lg border border-dashed border-slate-700 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add a line
      </button>

      <SavedSpreads lures={lures} slots={slots} {...saved} />
    </div>
  );
}
