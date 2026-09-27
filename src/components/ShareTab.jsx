import { useState } from 'react';
import { Share as NativeShare } from '@capacitor/share';
import { Share2 } from 'lucide-react';
import { tripReport } from '../lib/stats';
import { formatDepth, formatTemp } from '../lib/units';

const PERIODS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: '7 days', days: 7 },
  { id: 'season', label: '90 days', days: 90 },
  { id: 'all', label: 'All time', days: null },
];

export default function ShareTab({ lures, strikes, settings, notify }) {
  const [period, setPeriod] = useState('today');
  const { days } = PERIODS.find((p) => p.id === period);
  const since = days ? new Date(Date.now() - (days - 1) * 86400000).toLocaleDateString('en-CA') : null;
  const inRange = since ? strikes.filter((s) => s.strikeDate >= since) : strikes;
  const r = tripReport(lures, inRange);
  const label = PERIODS.find((p) => p.id === period).label;

  const rows = [
    ['Top lure', r.topLure, 'text-cyan-300'],
    ['Hot position', r.hotPosition, 'text-amber-300'],
    ['Best hook rig', r.bestHook, 'text-emerald-300'],
    [
      'Avg conditions',
      r.avgTempC != null || r.avgDepthM != null
        ? `${formatTemp(r.avgTempC, settings.units)} | ${formatDepth(r.avgDepthM, settings.units)}`
        : null,
      'text-slate-200',
    ],
  ];

  const share = async () => {
    const text = [
      `🎣 LureRater report (${label}) — ${settings.boatType}, ${settings.boatLengthFt}ft`,
      `${r.total} strikes · ${r.landed} landed · ${r.lost} lost`,
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    ].join('\n');
    try {
      if ((await NativeShare.canShare()).value) {
        await NativeShare.share({ title: 'LureRater report', text });
      } else {
        await navigator.clipboard.writeText(text);
        notify('Report copied to clipboard');
      }
    } catch (err) {
      // Closing the share sheet rejects too — only report real failures.
      if (!/cancel|abort/i.test(err?.message || '')) notify('Could not share this report', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
        <Share2 className="w-4 h-4 text-cyan-400" /> Trip Report
      </h2>

      <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`py-1.5 rounded-lg text-[11px] font-semibold ${period === p.id ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-4 rounded-2xl border-2 border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div>
            <span className="text-xs font-extrabold text-cyan-400 tracking-wider">LURERATER REPORT</span>
            <p className="text-[10px] text-slate-400">
              {settings.boatType} • {settings.boatLengthFt}ft
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{label}</span>
        </div>

        <div className="text-center py-2">
          <div className="text-2xl font-black text-slate-100">
            {r.total} STRIKE{r.total === 1 ? '' : 'S'}
          </div>
          <div className="text-xs text-emerald-400 font-bold">
            {r.landed} LANDED / {r.lost} LOST
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
          {rows.map(([k, v, color]) => (
            <div key={k} className="flex justify-between gap-3 text-slate-300">
              <span className="shrink-0">{k}</span>
              <strong className={`${color} text-right`}>{v || '—'}</strong>
            </div>
          ))}
        </div>

        <button
          onClick={share}
          disabled={r.total === 0}
          className="w-full py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" /> Share Report
        </button>
      </div>
    </div>
  );
}
