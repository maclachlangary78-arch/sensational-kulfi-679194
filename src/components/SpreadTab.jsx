import { Anchor, Pencil, Sparkles } from 'lucide-react';
import SavedSpreads from './SavedSpreads';
import { slotName, suggestedSpread } from '../lib/spread';
import { buildSpread } from '../lib/stats';
import { formatDepth, formatTemp } from '../lib/units';

export default function SpreadTab({ lures, strikes, conditions, settings, spread: current = [], onUseSpread, onEditSpread, ...saved }) {
  // Show the size each line will actually load with — including sizes already set on today's spread.
  const loaded = suggestedSpread(lures, strikes, conditions, current);
  const spread = buildSpread(lures, strikes, conditions).map((s, i) => ({ ...s, size: loaded[i]?.lureSize || s.size }));

  const lines = current.filter((s) => slotName(s, lures));

  return (
    <div className="space-y-4">
      {/* Today's spread — the same lines set up in Log → My Spread or picked in Quick Log. */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-cyan-400" /> Today’s spread
          </h2>
          <button onClick={onEditSpread} className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="text-[11px] text-slate-500">No lures set yet — pick them in the Log tab, load a saved spread, or use the suggestion below.</p>
        ) : (
          <div className="space-y-1">
            {lines.map((s) => (
              <div key={s.id} className="flex items-baseline gap-2 text-xs">
                <span className="text-[10px] font-mono uppercase text-cyan-400 w-24 shrink-0">{s.position}</span>
                <span className="text-slate-100 font-semibold truncate">
                  {slotName(s, lures)}
                  {s.lureSize && <span className="text-slate-400 font-normal"> · {s.lureSize}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SavedSpreads lures={lures} slots={current} {...saved} />

      <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-3 rounded-xl border border-cyan-800/50">
        <div className="flex items-center gap-2 text-cyan-300 mb-1">
          <Sparkles className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wide">Spread Builder</h2>
        </div>
        <p className="text-[11px] text-slate-300">
          Suggested pattern for {formatTemp(conditions.tempC, settings.units)}, {conditions.tide},{' '}
          {formatDepth(conditions.depthM, settings.units)} — ranked from your own strike history. Strikes in the same position,
          similar water temp and the same tide count for more.
        </p>
      </div>

      <div className="space-y-2">
        {spread.map(({ position, lure, size, rate, evidence }) => (
          <div key={position} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase text-cyan-400 block">{position}</span>
              {lure ? (
                <>
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {lure.name}
                    {size && <span className="text-slate-400 font-normal"> · {size}</span>}
                  </span>
                  {lure.hookType && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Rig: {lure.hookType} ({lure.hookSize})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-slate-500">Add more lures to fill this spot</span>
              )}
            </div>
            {lure && (
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-emerald-400">{rate}% score</span>
                <span className="text-[10px] text-slate-500 block">
                  {evidence > 0 ? `${evidence} strike${evidence === 1 ? '' : 's'} here` : 'Your usual spot'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {spread.some((s) => s.lure) && (
        <button
          onClick={onUseSpread}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-sm"
        >
          <Anchor className="w-4 h-4" /> Use this spread
        </button>
      )}

      {strikes.length < 10 && (
        <p className="text-[11px] text-slate-500 text-center">
          Suggestions sharpen as you log more strikes. Until then they lean on each lure’s usual position.
        </p>
      )}
    </div>
  );
}
