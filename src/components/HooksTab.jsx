import { Anchor } from 'lucide-react';
import { hookStats } from '../lib/stats';

export default function HooksTab({ strikes }) {
  const hooks = hookStats(strikes);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
        <Anchor className="w-4 h-4 text-amber-400" /> Hook Performance
      </h2>
      <p className="text-xs text-slate-400">Which hook brand and size turns strikes into landed fish on your boat.</p>

      {hooks.length === 0 && <p className="text-xs text-slate-500">Log a strike to start tracking hook performance.</p>}

      <div className="space-y-2.5">
        {hooks.map((hk) => (
          <div key={hk.name} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-200">{hk.type}</h3>
                <p className="text-[10px] font-mono text-cyan-400">Size {hk.size}</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-emerald-400">{hk.rate}%</span>
                <span className="text-[10px] text-slate-400 block">landed</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex gap-0.5">
              <div className="bg-emerald-500 h-full" style={{ width: `${hk.rate}%` }} />
              <div className="bg-red-500 h-full flex-1" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
              <span>
                Landed <strong className="text-emerald-400">{hk.landed}</strong>
              </span>
              <span>
                Lost <strong className="text-red-400">{hk.lost}</strong>
              </span>
              <span>{hk.total} strikes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
