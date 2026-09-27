import { useState } from 'react';
import { Bookmark, Loader2, Save, Trash2 } from 'lucide-react';
import { slotName } from '../lib/spread';

const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';

// Save today's spread under a name and load saved spreads back onto the boat on another day.
export default function SavedSpreads({ lures, slots, savedSpreads, onSaveSpread, onLoadSpread, onDeleteSpread }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const hasLures = slots.some((s) => s.lureId);

  const save = async (e) => {
    e.preventDefault();
    const trimmed = name.trim() || `Spread ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    if (savedSpreads.some((x) => x.name.toLowerCase() === trimmed.toLowerCase()) && !confirm(`Replace the saved spread "${trimmed}"?`)) return;
    setBusy(true);
    const ok = await onSaveSpread(trimmed);
    setBusy(false);
    if (ok) setName('');
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
        <Bookmark className="w-3.5 h-3.5 text-cyan-400" /> Saved spreads
      </h3>

      <form onSubmit={save} className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="text"
          maxLength={60}
          placeholder="Name, e.g. Shelf marlin"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />
        <button
          type="submit"
          disabled={busy || !hasLures}
          className="px-3 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save spread
        </button>
      </form>
      <p className="text-[10px] text-slate-500">Today’s spread is always kept on this phone — save it to load again another day.</p>

      {savedSpreads.length > 0 && (
        <div className="space-y-1.5">
          {savedSpreads.map((saved) => {
            const names = saved.slots.map((s) => slotName(s, lures) || s.customName).filter(Boolean);
            return (
              <div key={saved.id} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-100 block truncate">{saved.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {saved.slots.length} line{saved.slots.length === 1 ? '' : 's'}
                    {names.length > 0 && ` · ${[...new Set(names)].join(', ')}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onLoadSpread(saved)}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-md bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 font-bold"
                >
                  Load
                </button>
                <button type="button" onClick={() => onDeleteSpread(saved)} aria-label={`Delete ${saved.name}`} className="shrink-0 text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
