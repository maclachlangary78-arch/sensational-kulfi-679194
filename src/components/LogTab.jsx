import { useEffect, useState } from 'react';
import { Anchor, Camera, Check, ChevronDown, Loader2, MapPin, Target, X, Zap } from 'lucide-react';
import BoatDiagram from './BoatDiagram';
import SpreadBoard from './SpreadBoard';
import StrikeSheet from './StrikeSheet';
import { HookPicker, LurePicker } from './RigFields';
import { TIDES } from '../lib/constants';
import { logStrike } from '../lib/api';
import { resizePhoto } from '../lib/photo';
import { NEW_LURE, emptySlot, lastRig, slotName } from '../lib/spread';
import { cToF, fToC, ftToM, mToFt, formatDepth, formatTemp } from '../lib/units';

const today = () => new Date().toLocaleDateString('en-CA');
const round1 = (n) => Math.round(n * 10) / 10;
const field = 'w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500';

// Number input that edits a display-unit string but stores a metric value, so typing
// "22." isn't reformatted mid-keystroke. Re-syncs when the value changes elsewhere (e.g. GPS sync);
// callers remount it with key={units} when the unit system changes.
function UnitNumberInput({ value, toDisplay, fromDisplay, onValue, ...inputProps }) {
  const format = (v) => (v == null ? '' : String(toDisplay(v)));
  const [text, setText] = useState(format(value));
  useEffect(() => {
    const parsed = text === '' ? null : fromDisplay(Number(text));
    if (value == null ? parsed != null : parsed == null || Math.abs(parsed - value) > 0.01) setText(format(value));
  }, [value]);
  return (
    <input
      {...inputProps}
      type="number"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onValue(e.target.value === '' || Number.isNaN(n) ? null : fromDisplay(n));
      }}
    />
  );
}

// Conditions shared by every strike logged — collapsed to one line so the spread stays in view.
function ConditionsCard({ conditions, setConditions, strikeDate, setStrikeDate, units }) {
  const [open, setOpen] = useState(false);
  const metric = units === 'metric';
  const tempConv = metric ? [round1, (v) => v] : [(c) => round1(cToF(c)), fToC];
  const depthConv = metric ? [Math.round, (v) => v] : [(m) => Math.round(mToFt(m)), ftToM];
  const summary = [
    conditions.tempC != null && formatTemp(conditions.tempC, units),
    conditions.depthM != null && formatDepth(conditions.depthM, units),
    conditions.tide,
    strikeDate === today() ? 'Today' : strikeDate,
    conditions.location,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex justify-between items-center gap-2 text-left">
        <span className="min-w-0">
          <span className="text-xs text-slate-400 block">Conditions</span>
          <span className="text-[11px] text-slate-200 font-mono block truncate">{summary}</span>
        </span>
        <span className="text-[11px] text-cyan-400 flex items-center gap-0.5 shrink-0">
          {open ? 'Done' : 'Edit'} <ChevronDown className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <>
          {conditions.latitude != null && (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {conditions.latitude}, {conditions.longitude}
            </span>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Water temp ({metric ? '°C' : '°F'}) · {formatTemp(conditions.tempC, units)}
              </label>
              <UnitNumberInput
                key={units}
                inputMode="decimal"
                step="0.1"
                value={conditions.tempC}
                toDisplay={tempConv[0]}
                fromDisplay={tempConv[1]}
                onValue={(tempC) => setConditions((c) => ({ ...c, tempC }))}
                className={field}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Depth ({metric ? 'm' : 'ft'}) · {formatDepth(conditions.depthM, units)}
              </label>
              <UnitNumberInput
                key={units}
                inputMode="numeric"
                value={conditions.depthM}
                toDisplay={depthConv[0]}
                fromDisplay={depthConv[1]}
                onValue={(depthM) => setConditions((c) => ({ ...c, depthM }))}
                className={field}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tide</label>
              <select value={conditions.tide} onChange={(e) => setConditions((c) => ({ ...c, tide: e.target.value }))} className={field}>
                {TIDES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date</label>
              <input type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Location name</label>
            <input
              type="text"
              placeholder="e.g. Canyons Drop-Off"
              value={conditions.location}
              onChange={(e) => setConditions((c) => ({ ...c, location: e.target.value }))}
              className={field}
            />
          </div>
        </>
      )}
    </div>
  );
}

// The simple one-off form for people who don't want to set up their whole spread. It edits the same
// lines as My Spread: picking a lure for a position here puts it on that line of the spread, so it's
// remembered between tabs and restarts and shows up in My Spread, the Spread tab and saved spreads.
function QuickLog({ lures, strikes, settings, spread, setSpread, position, setPosition, onSend, onSaveNewLures, notify }) {
  const [outcome, setOutcome] = useState('landed');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const line = spread.find((s) => s.position === position) || emptySlot(position);
  const lureId = line.lureId;

  const updateLine = (patch) =>
    setSpread((ss) => {
      const i = ss.findIndex((s) => s.position === position);
      if (i < 0) return [...ss, { ...line, ...patch }];
      return ss.map((s, j) => (j === i ? { ...s, ...patch } : s));
    });

  const selectLure = (id) => {
    // Fill in what this lure last ran in this position.
    const lure = lures.find((l) => String(l.id) === String(id));
    updateLine({ lureId: id, ...(lure ? lastRig(lure, position, strikes) : {}) });
  };

  const selectPosition = (p) => {
    // A typed-in lure is finished once the angler moves on to another line.
    onSaveNewLures();
    setPosition(p);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await resizePhoto(file));
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const strike = await onSend({ ...line, outcome }, photo);
    setSaving(false);
    if (!strike) return;
    setPhoto(null);
    // A typed-in lure is now in My Lures — point the line at it.
    if (strike.newLure) updateLine({ lureId: strike.newLure.id, customName: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BoatDiagram value={position} onChange={selectPosition} boatType={settings.boatType} boatLengthFt={settings.boatLengthFt} />

      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-1">
          <Anchor className="w-3.5 h-3.5 text-amber-400" /> Lure on the <span className="text-cyan-300">{position}</span>
        </p>
        <LurePicker
          key={position}
          lures={lures}
          lureId={String(lureId)}
          customName={line.customName || ''}
          lureSize={line.lureSize || ''}
          onSelect={selectLure}
          onSaveNew={onSaveNewLures}
          onCustomName={(customName) => updateLine({ customName })}
          onLureSize={(lureSize) => updateLine({ lureSize })}
        />
        <HookPicker key={`hook-${position}`} hookType={line.hookType || ''} hookSize={line.hookSize || '9/0'} onChange={(h) => updateLine(h)} />
      </div>

      <div className="border-2 border-dashed border-slate-700/80 rounded-xl p-3 text-center bg-slate-950/40">
        {photo ? (
          <div className="relative inline-block">
            <img src={photo.dataUrl} alt="Strike photo" className="h-28 mx-auto rounded-lg object-cover" />
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
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-1">
            <Camera className="w-6 h-6 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">Snap or choose a photo (optional)</span>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1">Outcome</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOutcome('landed')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              outcome === 'landed' ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Check className="w-4 h-4" /> Landed / Tagged
          </button>
          <button
            type="button"
            onClick={() => setOutcome('lost')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              outcome === 'lost' ? 'bg-red-500 text-slate-950 ring-2 ring-red-400' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <X className="w-4 h-4" /> Lost / Pulled Hook
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Log Strike
      </button>
    </form>
  );
}

export default function LogTab({
  lures,
  strikes,
  settings,
  conditions,
  setConditions,
  spread,
  setSpread,
  mode,
  setMode,
  quickPosition,
  setQuickPosition,
  onSaveNewLures,
  onLogged,
  notify,
  ...saved
}) {
  const [strikeDate, setStrikeDate] = useState(today());
  const [striking, setStriking] = useState(null);

  const findLure = (id) => lures.find((l) => String(l.id) === String(id));
  const lineName = (line) => slotName(line, lures);

  // Saves a strike for a line (a spread slot or the quick form). Returns the saved strike, or null on failure.
  const sendStrike = async ({ lureId, customName, position, outcome, lureSize, hookType, hookSize }, photo) => {
    const lure = findLure(lureId);
    const name = lureId === NEW_LURE ? (customName || '').trim() : lure?.name;
    if (!name) {
      notify(lureId === NEW_LURE ? 'Type the lure name' : 'Pick a lure first', 'error');
      return null;
    }
    if (!(lureSize || '').trim()) {
      notify(`Choose the lure size for ${name}`, 'error');
      return null;
    }
    try {
      const { strike, queued } = await logStrike(
        {
          ...(lure ? { lureId: lure.id } : { lureName: name }),
          position,
          outcome,
          strikeDate,
          location: conditions.location,
          latitude: conditions.latitude,
          longitude: conditions.longitude,
          tempC: conditions.tempC,
          depthM: conditions.depthM,
          tide: conditions.tide,
          lureSize: lureSize.trim(),
          hookType: hookType || null,
          hookSize: hookType ? hookSize : null,
        },
        photo?.blob,
        photo?.dataUrl,
      );
      onLogged(strike);
      notify(
        queued
          ? `No signal — ${outcome} strike saved on this phone and will sync later`
          : `${outcome === 'landed' ? 'Landed' : 'Lost'} strike logged for ${name}`,
      );
      return strike;
    } catch (err) {
      notify(err.message, 'error');
      return null;
    }
  };

  const strikeLine = async (outcome, photo) => {
    const strike = await sendStrike({ ...striking, outcome }, photo);
    // A typed-in lure is now in My Lures — point the line at it so later strikes use it directly.
    if (strike?.newLure) {
      setSpread((ss) => ss.map((s) => (s.id === striking.id ? { ...s, lureId: strike.newLure.id, customName: '' } : s)));
    }
    return Boolean(strike);
  };

  const tab = (id, Icon, label) => (
    <button
      type="button"
      onClick={() => {
        onSaveNewLures();
        setMode(id);
      }}
      className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
        mode === id ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
        <Target className="w-4 h-4 text-cyan-400" /> Record Strike
      </h2>

      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
        {tab('spread', Anchor, 'My Spread')}
        {tab('quick', Zap, 'Quick Log')}
      </div>

      <ConditionsCard
        conditions={conditions}
        setConditions={setConditions}
        strikeDate={strikeDate}
        setStrikeDate={setStrikeDate}
        units={settings.units}
      />

      {mode === 'spread' ? (
        <SpreadBoard
          lures={lures}
          strikes={strikes}
          conditions={conditions}
          slots={spread}
          setSlots={setSpread}
          onStrike={setStriking}
          onSaveNewLures={onSaveNewLures}
          {...saved}
        />
      ) : (
        <QuickLog
          lures={lures}
          strikes={strikes}
          settings={settings}
          spread={spread}
          setSpread={setSpread}
          position={quickPosition}
          setPosition={setQuickPosition}
          onSend={sendStrike}
          onSaveNewLures={onSaveNewLures}
          notify={notify}
        />
      )}

      {striking && (
        <StrikeSheet
          title={striking.position}
          detail={[lineName(striking), striking.lureSize].filter(Boolean).join(' · ')}
          onClose={() => setStriking(null)}
          onSubmit={strikeLine}
          notify={notify}
        />
      )}
    </div>
  );
}
