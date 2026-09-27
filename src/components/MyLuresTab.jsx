import { useState } from 'react';
import { Check, Fish, Plus, Search, Trash2 } from 'lucide-react';
import LureThumb from './LureThumb';
import { CatalogPicker, HookPicker } from './RigFields';
import { POSITIONS } from '../lib/constants';
import { addLure, deleteLure, uploadPhoto } from '../lib/api';
import { lureStats } from '../lib/stats';

const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';
const blank = { name: '', defaultPosition: 'Short Corner', size: '', hookSize: '9/0', hookType: '' };

// The angler's tackle box — add lures as they buy them, then drop them straight into the spread.
export default function MyLuresTab({ lures, strikes, spread, onAddToSpread, onChange, notify }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(blank);
  const [query, setQuery] = useState('');
  const withStats = lureStats(lures, strikes).sort((a, b) => a.name.localeCompare(b.name));
  const q = query.trim().toLowerCase();
  const shown = q ? withStats.filter((l) => l.name.toLowerCase().includes(q)) : withStats;
  const inSpread = new Set(spread.map((s) => String(s.lureId)));

  const submitLure = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Pick or type a lure first', 'error');
    if (!form.size.trim()) return notify('Choose the lure size', 'error');
    try {
      // A photo used to identify the lure becomes its thumbnail.
      const { photo, ...lure } = form;
      const photoKey = photo ? await uploadPhoto(photo.blob) : null;
      await addLure({ ...lure, photoKey, hookSize: form.hookType ? form.hookSize : null });
      setForm({ ...lure, name: '', size: '' });
      setAdding(false);
      notify('Lure added to My Lures');
      onChange();
    } catch (err) {
      notify(err.status ? err.message : 'You need a connection to add lures', 'error');
    }
  };

  const removeLure = async (lure) => {
    const note = lure.total ? ` Its ${lure.total} logged strike${lure.total === 1 ? '' : 's'} will also be deleted.` : '';
    if (!confirm(`Remove ${lure.name}?${note}`)) return;
    try {
      await deleteLure(lure.id);
      onChange();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Fish className="w-4 h-4 text-cyan-400" /> My Lures
          <span className="text-slate-500 font-mono normal-case">({lures.length})</span>
        </h2>
        <button onClick={() => setAdding(!adding)} className="text-xs text-cyan-400 flex items-center gap-1 font-semibold">
          <Plus className="w-3.5 h-3.5" /> Add lure
        </button>
      </div>

      {adding && (
        <form onSubmit={submitLure} className="bg-slate-950 border border-cyan-800/50 rounded-xl p-3 space-y-2.5">
          <CatalogPicker
            name={form.name}
            size={form.size}
            onChange={(p) => setForm((f) => ({ ...f, ...p }))}
          />
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Usual position</label>
            <select value={form.defaultPosition} onChange={(e) => setForm({ ...form, defaultPosition: e.target.value })} className={field}>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <HookPicker hookType={form.hookType} hookSize={form.hookSize} onChange={(h) => setForm({ ...form, ...h })} />
          <button type="submit" className="w-full py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg">
            Save Lure
          </button>
        </form>
      )}

      {lures.length > 6 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input type="search" placeholder="Search my lures" value={query} onChange={(e) => setQuery(e.target.value)} className={`${field} pl-8`} />
        </div>
      )}

      {lures.length === 0 && <p className="text-xs text-slate-500">No lures yet — add the ones in your tackle box.</p>}

      <div className="space-y-2">
        {shown.map((lure) => {
          const added = inSpread.has(String(lure.id));
          return (
            <div key={lure.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <LureThumb photoKey={lure.photoKey} alt={lure.name} />
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-100 truncate">{lure.name}</h3>
                <p className="text-[10px] text-cyan-400 font-mono">
                  {lure.defaultPosition}
                  {lure.size && <span className="text-slate-400"> · {lure.size}</span>}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {lure.hookType ? `${lure.hookType} (${lure.hookSize})` : 'No hook set'}
                  {lure.total > 0 && ` · ${lure.total} strikes, ${lure.rate}% landed`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {added ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> In spread
                  </span>
                ) : (
                  <button
                    onClick={() => onAddToSpread(lure)}
                    className="text-[11px] px-2 py-1 rounded-md bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Spread
                  </button>
                )}
                <button onClick={() => removeLure(lure)} aria-label={`Remove ${lure.name}`} className="text-slate-600 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
