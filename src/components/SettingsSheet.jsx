import { X } from 'lucide-react';
import { BOAT_TYPES } from '../lib/constants';
import { API_BASE } from '../lib/api';

export default function SettingsSheet({ settings, setSettings, onClose }) {
  const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';
  const update = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Units</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['metric', 'Metric (°C, m)'],
              ['imperial', 'Imperial (°F, ft/fth)'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => update({ units: id })}
                className={`py-2 rounded-lg text-xs font-bold ${settings.units === id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Boat type</label>
          <select value={settings.boatType} onChange={(e) => update({ boatType: e.target.value })} className={field}>
            {BOAT_TYPES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Boat length (ft)</label>
          <input
            type="number"
            inputMode="numeric"
            min="10"
            max="120"
            value={settings.boatLengthFt}
            onChange={(e) => update({ boatLengthFt: Number(e.target.value) || 0 })}
            className={field}
          />
        </div>

        <p className="text-[11px] text-slate-500">
          Your lures and strikes are linked to this device and sync automatically when you have signal.
        </p>

        <a
          href={`${API_BASE}/privacy`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-cyan-400 underline"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
