import { useState } from 'react';
import { CloudOff, Trash2, Trophy } from 'lucide-react';
import LureThumb from './LureThumb';
import { deleteStrike } from '../lib/api';
import { lureStats } from '../lib/stats';
import { formatTemp } from '../lib/units';

export default function RanksTab({ lures, strikes, settings, onChange, notify }) {
  const [showAll, setShowAll] = useState(false);
  const ranked = lureStats(lures, strikes);
  const lureName = (st) => lures.find((l) => String(l.id) === String(st.lureId))?.name ?? st.lureName ?? 'Deleted lure';

  const removeStrike = async (st) => {
    if (!confirm('Delete this strike?')) return;
    try {
      await deleteStrike(st.id);
      onChange();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const recent = showAll ? strikes : strikes.slice(0, 6);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-amber-400" /> Lure Leaderboard
      </h2>
      <p className="text-xs text-slate-400">Add or remove lures in the My Lures tab.</p>

      <div className="space-y-2.5">
        {ranked.map((lure, idx) => (
          <div key={lure.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="font-mono text-sm font-bold text-slate-500 w-6 text-center">#{idx + 1}</div>
            <LureThumb photoKey={lure.photoKey} alt={lure.name} />
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-100 truncate">{lure.name}</h3>
              <p className="text-[10px] text-cyan-400 font-mono">
                {lure.defaultPosition}
                {lure.size && <span className="text-slate-400"> · {lure.size}</span>}
              </p>
              {lure.hookType && (
                <p className="text-[10px] text-slate-400 truncate">
                  {lure.hookType} ({lure.hookSize})
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400">{lure.total ? `${lure.rate}%` : '—'} landed</div>
              <div className="text-[10px] text-slate-400">
                <span className="text-emerald-400">{lure.landed} landed</span> · <span className="text-red-400">{lure.lost} lost</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-300 mb-2">Strike History</h3>
        {strikes.length === 0 && <p className="text-xs text-slate-500">No strikes logged yet — get a lure in the water!</p>}
        <div className="space-y-2">
          {recent.map((st) => (
            <div key={st.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs flex justify-between items-center gap-2">
              <LureThumb photoKey={st.photoKey} alt="" className="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-200 truncate">
                  {lureName(st)}
                  {st.lureSize && <span className="text-slate-400 font-normal"> · {st.lureSize}</span>}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {[st.position, st.hookType && `${st.hookType} ${st.hookSize}`, st.tide, st.tempC != null && formatTemp(st.tempC, settings.units), st.location].filter(Boolean).join(' • ')}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    st.outcome === 'landed'
                      ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                      : 'bg-red-900/40 text-red-300 border border-red-700/50'
                  }`}
                >
                  {st.outcome.toUpperCase()}
                </span>
                <div className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-end gap-1">
                  {st.pending ? (
                    <>
                      <CloudOff className="w-3 h-3" /> waiting to sync
                    </>
                  ) : (
                    <>
                      {st.strikeDate}
                      <button onClick={() => removeStrike(st)} aria-label="Delete strike" className="text-slate-600 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {strikes.length > 6 && (
          <button onClick={() => setShowAll(!showAll)} className="mt-2 text-xs text-cyan-400 w-full">
            {showAll ? 'Show fewer' : `Show all ${strikes.length} strikes`}
          </button>
        )}
      </div>
    </div>
  );
}
