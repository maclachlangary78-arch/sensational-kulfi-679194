import { useState } from 'react';
import { Camera, Check, Loader2, X } from 'lucide-react';
import { resizePhoto } from '../lib/photo';

// Bottom sheet for logging a strike on a line that's already set up in the spread.
export default function StrikeSheet({ title, detail, onClose, onSubmit, notify }) {
  const [outcome, setOutcome] = useState('landed');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await resizePhoto(file));
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const submit = async () => {
    setSaving(true);
    const ok = await onSubmit(outcome, photo);
    setSaving(false);
    if (ok) onClose();
  };

  const choice = (id, active, Icon, label) => (
    <button
      type="button"
      onClick={() => setOutcome(id)}
      className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
        outcome === id ? active : 'bg-slate-800 text-slate-400 border border-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-4 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase text-cyan-400">Strike on the {title}</p>
            <h2 className="text-sm font-bold text-slate-100 truncate">{detail}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {choice('landed', 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400', Check, 'Landed / Tagged')}
          {choice('lost', 'bg-red-500 text-slate-950 ring-2 ring-red-400', X, 'Lost / Pulled Hook')}
        </div>

        {photo ? (
          <div className="relative w-fit mx-auto">
            <img src={photo.dataUrl} alt="Strike photo" className="h-24 rounded-lg object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setPhoto(null)}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-700/80 rounded-xl text-xs text-slate-300">
            <Camera className="w-4 h-4 text-slate-400" /> Add a photo (optional)
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
        )}

        <button
          onClick={submit}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-slate-950 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Log Strike
        </button>
      </div>
    </div>
  );
}
