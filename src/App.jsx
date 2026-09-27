import { useCallback, useEffect, useRef, useState } from 'react';
import { Anchor, CloudOff, Fish, Loader2, RefreshCw, Settings, Share2, Sparkles, Target, Trophy } from 'lucide-react';
import LogTab from './components/LogTab';
import MyLuresTab from './components/MyLuresTab';
import RanksTab from './components/RanksTab';
import SpreadTab from './components/SpreadTab';
import HooksTab from './components/HooksTab';
import ShareTab from './components/ShareTab';
import SettingsSheet from './components/SettingsSheet';
import { addLure, deleteSpread, flushPendingStrikes, getPendingStrikes, isNetworkError, loadData, saveSpread, updateCache } from './lib/api';
import { fetchTelemetry } from './lib/telemetry';
import { NEW_LURE, addLureToSpread, defaultSpread, restoreSpread, suggestedSpread, unsavedLures } from './lib/spread';
import { useStoredState } from './lib/storage';

const TABS = [
  { id: 'log', label: 'Log', Icon: Target },
  { id: 'lures', label: 'My Lures', Icon: Fish },
  { id: 'rankings', label: 'Ranks', Icon: Trophy },
  { id: 'spread', label: 'Spread', Icon: Sparkles },
  { id: 'hooks', label: 'Hooks', Icon: Anchor },
  { id: 'share', label: 'Share', Icon: Share2 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('log');
  const [settings, setSettings] = useStoredState('lurerater.settings', {
    units: 'metric',
    boatType: 'Express Gamefisher',
    boatLengthFt: 38,
  });
  const [conditions, setConditions] = useStoredState('lurerater.conditions', {
    tempC: null,
    depthM: null,
    tide: 'Ebbing',
    location: '',
    latitude: null,
    longitude: null,
  });

  // Today's spread — the lines set up on the boat — plus which Log view and Quick Log position were last used.
  // Kept on the device so nothing is lost when switching tabs or restarting the app offshore.
  const [spreadState, setSpreadState] = useStoredState('lurerater.spread', () => ({
    slots: defaultSpread(),
    quickPosition: 'Short Rigger',
    logMode: null,
  }));
  const spread = spreadState.slots;
  const setSpread = useCallback(
    (next) => setSpreadState((st) => ({ ...st, slots: typeof next === 'function' ? next(st.slots) : next })),
    [setSpreadState],
  );
  const logMode = spreadState.logMode || (spread.some((s) => s.lureId) ? 'spread' : 'quick');
  const setLogMode = (mode) => setSpreadState((st) => ({ ...st, logMode: mode }));
  const setQuickPosition = (quickPosition) => setSpreadState((st) => ({ ...st, quickPosition }));

  const [lures, setLures] = useState([]);
  const [savedSpreads, setSavedSpreads] = useState([]);
  const [strikes, setStrikes] = useState([]);
  const [pending, setPending] = useState(getPendingStrikes);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [gps, setGps] = useState({ busy: false, status: 'Tap Sync GPS for position & sea temp' });
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const refresh = useCallback(async () => {
    try {
      const sent = await flushPendingStrikes();
      if (sent > 0) notify(`${sent} offline strike${sent === 1 ? '' : 's'} synced`);
      const data = await loadData();
      setLures(data.lures);
      setStrikes(data.strikes);
      setSavedSpreads(data.spreads);
      setOffline(data.offline);
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setPending(getPendingStrikes());
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [refresh]);

  const syncGps = async () => {
    setGps({ busy: true, status: 'Getting GPS fix…' });
    try {
      const t = await fetchTelemetry();
      setConditions((c) => ({ ...c, latitude: t.latitude, longitude: t.longitude, tempC: t.tempC ?? c.tempC }));
      setGps({
        busy: false,
        status: t.tempC != null ? 'Position & sea temp updated' : 'Position updated · sea temp unavailable',
      });
    } catch {
      setGps({ busy: false, status: 'GPS unavailable — check location permission' });
    }
  };

  const addToMyLures = useCallback((lure) => {
    setLures((ls) => {
      const next = ls.some((l) => l.id === lure.id) ? ls.map((l) => (l.id === lure.id ? lure : l)) : [...ls, lure];
      updateCache({ lures: next });
      return next;
    });
  }, []);

  const handleLogged = ({ newLure, ...strike }) => {
    if (strike.pending) setPending(getPendingStrikes());
    else setStrikes((s) => [strike, ...s]);
    // A lure typed in by hand is added to the tackle box on the server — show it straight away.
    if (newLure) addToMyLures(newLure);
  };

  // Any lure typed into a spread line or Quick Log goes into My Lures as soon as it has a name and size,
  // and the line is pointed at the saved lure. Runs when a line is finished, on leaving the Log tab, on
  // saving a spread and when signal returns. Without signal the typed name stays on the line (and a strike
  // logged against it still adds it on the server once it syncs).
  const spreadRef = useRef(spread);
  spreadRef.current = spread;
  const saving = useRef(new Set());
  const saveNewLures = useCallback(async () => {
    const todo = unsavedLures(spreadRef.current).filter((s) => !saving.current.has(s.id));
    let saved = 0;
    for (const slot of todo) {
      saving.current.add(slot.id);
      try {
        const lure = await addLure({
          name: slot.customName.trim(),
          size: slot.lureSize.trim(),
          defaultPosition: slot.position,
          hookType: slot.hookType || null,
          hookSize: slot.hookType ? slot.hookSize : null,
        });
        addToMyLures(lure);
        // Every line running the same typed-in lure now points at the saved one.
        const same = (s) => s.lureId === NEW_LURE && (s.customName || '').trim().toLowerCase() === lure.name.toLowerCase();
        setSpread((ss) => ss.map((s) => (same(s) ? { ...s, lureId: lure.id, customName: '' } : s)));
        saved++;
      } catch (err) {
        if (!isNetworkError(err)) notify(err.message, 'error');
      } finally {
        saving.current.delete(slot.id);
      }
    }
    if (saved > 0) notify(`${saved === 1 ? 'Lure' : `${saved} lures`} added to My Lures`);
  }, [addToMyLures, notify, setSpread]);

  useEffect(() => {
    if (!loading && !offline) saveNewLures();
  }, [loading, offline, saveNewLures]);

  const goToTab = (id) => {
    saveNewLures();
    setActiveTab(id);
  };

  const saveCurrentSpread = async (name) => {
    await saveNewLures();
    const slots = spreadRef.current.filter((s) => s.lureId);
    if (slots.length === 0) {
      notify('Pick a lure for at least one line first', 'error');
      return false;
    }
    try {
      const row = await saveSpread(name, slots);
      setSavedSpreads((list) => {
        const next = [row, ...list.filter((x) => x.id !== row.id)];
        updateCache({ spreads: next });
        return next;
      });
      notify(`Spread saved as "${row.name}"`);
      return true;
    } catch (err) {
      notify(isNetworkError(err) ? 'You need a connection to save a spread — today’s spread is still kept on this phone' : err.message, 'error');
      return false;
    }
  };

  const loadSavedSpread = (saved) => {
    if (spread.some((s) => s.lureId) && !confirm(`Replace your current spread with "${saved.name}"?`)) return;
    setSpread(restoreSpread(saved, lures));
    setLogMode('spread');
    setActiveTab('log');
    notify(`"${saved.name}" loaded — tap Strike on a line when it goes off`);
  };

  const removeSavedSpread = async (saved) => {
    if (!confirm(`Delete the saved spread "${saved.name}"?`)) return;
    try {
      await deleteSpread(saved.id);
      setSavedSpreads((list) => {
        const next = list.filter((x) => x.id !== saved.id);
        updateCache({ spreads: next });
        return next;
      });
    } catch (err) {
      notify(isNetworkError(err) ? 'You need a connection to delete a saved spread' : err.message, 'error');
    }
  };

  const allStrikes = [...pending, ...strikes];
  const shared = { lures, strikes: allStrikes, settings, notify };
  const savedSpreadProps = { savedSpreads, onSaveSpread: saveCurrentSpread, onLoadSpread: loadSavedSpread, onDeleteSpread: removeSavedSpread };

  const loadSuggestedSpread = () => {
    if (spread.some((s) => s.lureId) && !confirm('Replace your current spread with the suggested one?')) return;
    setSpread((ss) => suggestedSpread(lures, allStrikes, conditions, ss));
    setLogMode('spread');
    setActiveTab('log');
    notify('Spread loaded — tap Strike on a line when it goes off');
  };

  const addToSpread = (lure) => {
    setSpread((ss) => addLureToSpread(ss, lure, allStrikes));
    notify(`${lure.name} added to your spread on the ${lure.defaultPosition}`);
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-dvh sm:border-x sm:border-slate-800">
        <header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="" className="w-9 h-9 rounded-xl" />
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">LureRater</h1>
                <p className="text-[11px] text-slate-400">Offshore lure, spread & hook analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSettings((s) => ({ ...s, units: s.units === 'metric' ? 'imperial' : 'metric' }))}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 font-mono font-bold"
              >
                {settings.units === 'metric' ? '°C · m' : '°F · ft'}
              </button>
              <button onClick={() => setShowSettings(true)} aria-label="Settings" className="p-2 text-slate-400 hover:text-slate-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="px-4 py-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-mono truncate flex items-center gap-1.5">
              {offline ? (
                <>
                  <CloudOff className="w-3 h-3 text-amber-400" /> Offline — {pending.length} strike{pending.length === 1 ? '' : 's'} queued
                </>
              ) : (
                gps.status
              )}
            </span>
            <button onClick={syncGps} disabled={gps.busy} className="flex items-center gap-1 text-cyan-400 shrink-0">
              <RefreshCw className={`w-3 h-3 ${gps.busy ? 'animate-spin' : ''}`} /> Sync GPS
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-28">
          {loading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : loadError ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-sm text-red-300">{loadError}</p>
              <button onClick={refresh} className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-cyan-400">
                Try again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'log' && (
                <LogTab
                  {...shared}
                  conditions={conditions}
                  setConditions={setConditions}
                  spread={spread}
                  setSpread={setSpread}
                  mode={logMode}
                  setMode={setLogMode}
                  quickPosition={spreadState.quickPosition}
                  setQuickPosition={setQuickPosition}
                  onSaveNewLures={saveNewLures}
                  onLogged={handleLogged}
                  {...savedSpreadProps}
                />
              )}
              {activeTab === 'lures' && <MyLuresTab {...shared} spread={spread} onAddToSpread={addToSpread} onChange={refresh} />}
              {activeTab === 'rankings' && <RanksTab {...shared} onChange={refresh} />}
              {activeTab === 'spread' && (
                <SpreadTab
                  {...shared}
                  conditions={conditions}
                  spread={spread}
                  onUseSpread={loadSuggestedSpread}
                  onEditSpread={() => {
                    setLogMode('spread');
                    setActiveTab('log');
                  }}
                  {...savedSpreadProps}
                />
              )}
              {activeTab === 'hooks' && <HooksTab {...shared} />}
              {activeTab === 'share' && <ShareTab {...shared} />}
            </>
          )}
        </main>

        <nav className="fixed bottom-0 inset-x-0 z-20 flex justify-center">
          <div className="w-full max-w-md bg-slate-950/95 backdrop-blur border-t border-slate-800 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] grid grid-cols-6 gap-0.5">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => goToTab(id)}
                className={`py-1.5 rounded-lg flex flex-col items-center text-[10px] leading-tight font-medium whitespace-nowrap transition ${
                  activeTab === id ? 'text-cyan-400 bg-slate-900' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-40 max-w-sm w-[calc(100%-2rem)] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {toast.message}
          </div>
        )}

        {showSettings && <SettingsSheet settings={settings} setSettings={setSettings} onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}
