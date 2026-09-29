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

1. **Prepare the existing iOS project on your Mac:**
   ```bash
   git clone https://github.com/maclachlangary78-arch/sensational-kulfi-679194.git
   cd sensational-kulfi-679194
   npm ci
   npm run cap:ios
   ```
   
   Install Node.js 22 and Git on the Mac first. `npm run cap:ios` builds the web app, syncs Capacitor, and opens the
   checked-in iOS project in Xcode. Do not run `npx cap add ios`; the native iOS project is already included.
2. **Run and test in Xcode.** Select the `App` scheme and an iPhone simulator, then click **Run**. On a physical
   iPhone, connect and trust the device, then allow location and photo access when prompted. Permission descriptions
   and the app icon are already configured in the iOS project.
3. **Configure signing.** Select the `App` target → **Signing & Capabilities** → enable **Automatically manage
   signing** and choose your Apple Developer team. The current bundle ID is `com.lurerater.app`; it must be unique
   and registered to your team for App Store distribution. If you change it, update `appId` in
   `capacitor.config.json`, run `npm run cap:sync`, and confirm the resulting bundle ID in Xcode.
4. **Archive and upload.** Select **Any iOS Device (arm64)** as the destination, then choose **Product ▸ Archive**.
   In Organizer, validate the archive and distribute it to App Store Connect. You need an Apple Developer account
   and App Store Connect access. Complete the app's privacy details and provide a publicly accessible privacy policy
   URL before submitting for review.

After web app changes, run `npm run cap:ios` again to rebuild and sync the iOS app. If you later set up Android,
generate its native project with `npx cap add android` on a machine with the Android development tools installed.

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
`APP_STORE_CONNECT_PRIVATE_KEY` can be stored as plain PEM text (multiline or escaped `\n`) or as base64-encoded PEM.
`APPLE_TEAM_ID` must be your Apple Developer Team ID (for example, `ABC1234567`).

The native apps call the API on the deployed Netlify site. The URL is set in `src/lib/api.js`; override it with
`VITE_API_BASE_URL` at build time if you connect a custom domain.

Both stores require a privacy policy URL — LureRater stores your GPS position, conditions and photos against an
anonymous device ID.
