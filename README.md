# LureRater

LureRater is an offshore trolling logbook for big-game anglers. Log every strike with the lure, spread position
(corners, riggers, shotgun), hook rig, outcome (landed or lost), GPS position and ocean conditions. LureRater then
ranks your lures and hooks by how often they actually land fish, builds a suggested 5-lure spread for the current
conditions from your own history, and produces a shareable trip report.

It runs as a website/installable web app on Netlify and is set up to be packaged with **Capacitor** as a native
iOS app (App Store) and Android app (Google Play) from the same code.

## Tech stack

- **React 19 + Vite + Tailwind CSS 4** — the app UI (`src/`)
- **Netlify Functions** — the API (`netlify/functions/`)
- **Netlify Database (Postgres) + Drizzle ORM** — lures and strikes (`db/`)
- **Netlify Blobs** — strike/lure photos
- **Capacitor 8** — native iOS/Android shell, GPS and native share sheet
- **Open-Meteo Marine API** — free live sea-surface temperature for your GPS position

## Run locally

```bash
npm install
netlify dev
```

`netlify dev` runs Vite plus the functions, database and blobs emulation. Open the URL it prints.

## Publishing to the App Store and Google Play

You need a Mac with Xcode for iOS, Android Studio for Android, an Apple Developer account ($99/yr) and a Google
Play Console account ($25 one-off). These steps can't be done on an iPhone alone.

1. **Build the web app and add the native projects (one time):**
   ```bash
   npm install
   npm run build
   npx cap add ios
   npx cap add android
   ```
2. **Generate app icons and splash screens** from `assets/icon-only.png` (1024×1024):
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#020617' --splashBackgroundColor '#020617'
   ```
3. **Add permission messages.** In `ios/App/App/Info.plist` add:
   - `NSLocationWhenInUseUsageDescription` — "LureRater records where each strike happens and looks up sea temperature."
   - `NSCameraUsageDescription` — "LureRater lets you photograph your lure or catch."
   - `NSPhotoLibraryUsageDescription` — "LureRater lets you attach photos of your lure or catch."

   In `android/app/src/main/AndroidManifest.xml` add `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` and
   `CAMERA` permissions.
4. **Sync after every code change:** `npm run cap:sync`
5. **Open, sign and upload:**
   - iOS: `npx cap open ios` → set your Team under *Signing & Capabilities* → *Product ▸ Archive* → upload to App Store Connect.
   - Android: `npx cap open android` → *Build ▸ Generate Signed App Bundle* → upload the `.aab` to Play Console.

### GitHub Actions iOS upload

Use the **`iOS Build and Deploy`** workflow in the repository Actions tab for App Store uploads.

Required repository secrets:

- `CERTIFICATE_DATA`
- `CERTIFICATE_PASSWORD`
- `PROVISIONING_PROFILE_DATA`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`
- `APPLE_TEAM_ID`

`CERTIFICATE_DATA` and `PROVISIONING_PROFILE_DATA` must be base64-encoded values of the `.p12` certificate and
`.mobileprovision` profile files.

The native apps call the API on the deployed Netlify site. The URL is set in `src/lib/api.js`; override it with
`VITE_API_BASE_URL` at build time if you connect a custom domain.

Both stores require a privacy policy URL — LureRater stores your GPS position, conditions and photos against an
anonymous device ID.
