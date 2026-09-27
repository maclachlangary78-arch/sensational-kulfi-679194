const btn = (active, accent = 'cyan') =>
  `text-[11px] px-2 py-1.5 rounded-md font-bold transition-all ${
    active
      ? accent === 'amber'
        ? 'bg-amber-400 text-slate-950 shadow-lg'
        : 'bg-cyan-500 text-slate-950 shadow-lg'
      : accent === 'amber'
        ? 'bg-amber-900/40 text-amber-200 border border-amber-800'
        : 'bg-slate-800 text-slate-300 border border-slate-700'
  }`;

export default function BoatDiagram({ value, onChange, boatType, boatLengthFt }) {
  const Rigger = ({ side }) => (
    <div className="flex flex-col gap-1.5">
      <button type="button" onClick={() => onChange('Long Rigger')} className={btn(value === 'Long Rigger')}>
        {side} LR
      </button>
      <button type="button" onClick={() => onChange('Short Rigger')} className={btn(value === 'Short Rigger')}>
        {side} SR
      </button>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">Trolling Spread Position</p>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Rigger side="Port" />
        <div className="mx-auto w-28 h-40 border-2 border-slate-600 rounded-t-full bg-slate-800/90 flex flex-col justify-between p-2">
          <div className="text-[10px] text-slate-400 font-mono">BOW ↑</div>
          <div className="bg-slate-700/60 rounded-md py-1 px-1 text-[9px] leading-tight text-slate-300 font-bold border border-slate-600">
            {boatType}
            <br />
            {boatLengthFt} ft
          </div>
          <div className="text-[10px] text-slate-400 font-mono">STERN</div>
        </div>
        <Rigger side="Stbd" />
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={() => onChange('Short Corner')} className={btn(value === 'Short Corner')}>
            Short Corner
          </button>
          <button type="button" onClick={() => onChange('Long Corner')} className={btn(value === 'Long Corner')}>
            Long Corner
          </button>
        </div>
        <button type="button" onClick={() => onChange('Shotgun')} className={`w-full ${btn(value === 'Shotgun', 'amber')}`}>
          🎯 Shotgun (Way Back)
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-2">
        Selected: <span className="text-cyan-300 font-bold">{value}</span>
      </p>
    </div>
  );
}
