# AGENTS.md — LureRater

## What this is
A mobile-first offshore trolling logbook (React + Vite SPA) deployed on Netlify, packaged for the App Store and
Google Play with Capacitor (`capacitor.config.json`, `webDir: dist`). The same bundle runs on web and native.

## Layout
- `src/App.jsx` — app shell: header, GPS sync, bottom tab bar, toast, data loading/offline state.
- `src/components/` — one file per tab (`LogTab`, `MyLuresTab`, `RanksTab`, `SpreadTab`, `HooksTab`, `ShareTab`) plus
  `BoatDiagram`, `LureThumb`, `SettingsSheet`, `SpreadBoard` (day's spread set-up), `SavedSpreads` (save/load named
  spreads), `StrikeSheet`, and `RigFields` (shared lure/size/optional-hook pickers).
- `src/lib/spread.js` — spread slots (lines on the boat), auto-fill from the Spread Builder, last-used rig lookup.
- `src/lib/catalog.js` — built-in lure catalogue (Pakula, JB, Bonze, Tantrum, Nomad, Halco) with colours and sizes for
  the lure → colour → size picker. Names are saved as `Brand Model - Colour` and parsed back with `splitName`.
  Pakula, Nomad and Halco sizes are the maker's published lengths in mm (Pakula labels add the size number and inches).
- `src/lib/storage.js` — `useStoredState` (localStorage-backed React state); `src/lib/id.js` — UUID with a fallback.
- `src/lib/api.js` — all API calls, anonymous device ID, local cache, and the offline strike queue.
- `src/lib/stats.js` — pure analytics (lure/hook rankings, spread builder, trip report).
- `src/lib/telemetry.js` — GPS via `@capacitor/geolocation` + Open-Meteo marine SST.
- `src/lib/units.js` — metric/imperial helpers. **All data is stored metric (°C, metres)**; conversion is display/input only.
- `netlify/functions/` — `lures.ts`, `strikes.ts`, `spreads.ts`, `photos.ts` (routes `/api/lures`, `/api/strikes`,
  `/api/spreads`, `/api/photos/:key`), and `identify-lure.ts` (`/api/identify-lure`, AI lure ID from a photo).
- `netlify/lib/http.ts` — shared CORS/JSON helpers (kept outside `functions/` so it isn't deployed as a function).
- `db/schema.ts` — Drizzle schema; migrations in `netlify/database/migrations/` (generate with
  `npx drizzle-kit generate --name <verb_description>`; never hand-edit or apply them).
- `assets/icon-only.png` — 1024px source icon for `@capacitor/assets`; `public/icons/` holds web/PWA sizes.

## Non-obvious decisions
- **No accounts.** Every row carries `device_id`, a UUID created in localStorage and sent as `X-Device-Id`.
  The API scopes every query by it. A new device gets 5 starter lures seeded on its first `GET /api/lures`.
- **CORS is open** because native builds load from `capacitor://localhost` and call the Netlify site cross-origin.
  `API_BASE` in `src/lib/api.js` is empty on web and the deployed URL on native.
- **Offline-first logging.** If a strike POST fails with a network error it is queued in localStorage (photo as a
  data URL) and flushed on the next load / `online` event. Server-rejected items are dropped.
- **Aggregates are computed, not stored** — strike counts and rates are derived from the strikes table.
- Photos are resized client-side to ≤1024px JPEG before upload; the photos store only ever holds `image/jpeg`.
- **The day's spread lives on the device** (localStorage `lurerater.spread`), not the database — it's working state
  that must survive restarts offshore. Strikes logged from a spread line carry that line's position, size and hook.
  The same key also stores the Log view (`logMode`) and Quick Log position so they survive tab switches.
- **Quick Log edits the spread.** It shows and writes the spread line for the selected position, so a lure picked in
  Quick Log appears in My Spread, the Spread tab and saved spreads. Named saved spreads live in the `spreads` table.
- **Typed-in lures go straight to My Lures.** `saveNewLures` in `App.jsx` posts any line with a typed name + size
  (on Done, changing Quick Log position/view, leaving the Log tab, saving a spread, coming online) and repoints the
  line at the saved lure. `POST /api/lures` reuses a same-named lure (case-insensitive) instead of duplicating it.
- **Lure size is required** (new lures, and every strike); it's free text (e.g. `10"`), not converted by units.
  The API only enforces it on `POST /api/lures` so queued offline strikes from older builds aren't dropped.
- Hooks are optional everywhere. `HOOKS` in `src/lib/constants.js` gives each hook type its own sizes: Pakula Dojo
  hooks use gape sizes (e.g. "Pakula Dojo Light" size `25`), the rest use `9/0`-style sizes.
- **AI lure ID.** `CatalogPicker` has an "Identify from a photo" button. The resized JPEG goes to `/api/identify-lure`,
  which sends it with the built-in catalogue to Claude (`claude-sonnet-5`) through Netlify AI Gateway (no API key).
  The reply is snapped to catalogue names/colours/sizes where they match and only fills fields the model could tell;
  the angler checks/fills the rest. In My Lures that photo becomes the new lure's thumbnail. Needs a connection.
- Depth and tide are manual inputs; only position and sea temperature are auto-filled.
- Port/starboard rigger buttons map to the same `Long Rigger`/`Short Rigger` position value.

## Conventions
- Plain JSX on the frontend, TypeScript in functions/db. Tailwind utility classes; dark slate + cyan palette.
- Keep form inputs ≥16px on touch devices (handled in `src/index.css`) to avoid iOS zoom.
