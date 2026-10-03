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

## Test in Xcode

On a Mac with Xcode installed, run this from the repository root:

```bash
npm install
npm run cap:ios
```

This builds the web app, syncs it into the Capacitor iOS project, and opens the project in Xcode. Select the **App**
scheme and an iOS Simulator, then click **Run**. A development team is not needed to run in the simulator; select your
team under **Signing & Capabilities** to install on a physical iPhone.

The native app uses the deployed Netlify API by default, so simulator tests need an internet connection and use the
deployed service. To point the build at another API, set `VITE_API_BASE_URL` before running the command, for example:
`VITE_API_BASE_URL=https://your-test-api.example npm run cap:ios`.

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

- `DISTRIBUTIONCERTIFICATE`
- `CERTIFICATE_PASSWORD`
- `PROVISIONING_PROFILE_DATA`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_PRIVATE_KEY`
- `APPLE_TEAM_ID`

`DISTRIBUTIONCERTIFICATE` and `PROVISIONING_PROFILE_DATA` must be base64-encoded values of the `.p12` certificate and
`.mobileprovision` profile files.
`APP_STORE_CONNECT_PRIVATE_KEY` can be stored as plain PEM text (multiline or escaped `\n`) or as base64-encoded PEM.
`APPLE_TEAM_ID` must be your Apple Developer Team ID (for example, `ABC1234567`).

#### Preparing the secrets

```bash
base64 -i certificate.p12 | pbcopy                 # DISTRIBUTIONCERTIFICATE (macOS; use `base64 -w0 file | xclip` on Linux)
base64 -i profile.mobileprovision | pbcopy         # PROVISIONING_PROFILE_DATA
gh secret set DISTRIBUTIONCERTIFICATE < <(base64 -i certificate.p12)
gh secret set PROVISIONING_PROFILE_DATA < <(base64 -i profile.mobileprovision)
gh secret set CERTIFICATE_PASSWORD --body 'your-p12-password'
gh secret set APPLE_TEAM_ID --body 'ABC1234567'
gh secret set APP_STORE_CONNECT_KEY_ID --body 'XXXXXXXXXX'
gh secret set APP_STORE_CONNECT_ISSUER_ID --body '00000000-0000-0000-0000-000000000000'
gh secret set APP_STORE_CONNECT_PRIVATE_KEY < AuthKey_XXXXXXXXXX.p8   # or: base64 -i AuthKey_XXXXXXXXXX.p8
gh variable set VITE_API_BASE_URL --body 'https://your-domain.example'   # optional
```

The `.p12` must be exported from Keychain Access **with its private key**. The profile must be an *App Store*
distribution profile for the app's bundle ID and your team.

Workflows: **`iOS Build and Deploy`** (`ios-build-and-deploy.yml`, run from the Actions tab or on push to `main`)
signs, archives, exports and uploads to App Store Connect. **`iOS CI`** (`ios-ci.yml`) builds and tests on a simulator
for pushes and pull requests. On failure, download the `ios-build-artifacts` artifact for `archive.log` / `export.log`.

Troubleshooting:

- `Missing required repository secrets: …` — the named secret is empty or not set in *Settings ▸ Secrets ▸ Actions*.
- `… must contain base64-encoded file contents` — you stored the raw file or a file path instead of base64.
- `Certificate import failed` — wrong `CERTIFICATE_PASSWORD`, or the `.p12` lacks the private key.
- `No valid code signing identities` — the certificate is expired/revoked or is not a Distribution certificate.
- `APP_STORE_CONNECT_PRIVATE_KEY did not produce a valid PEM` — store the `.p8` text (multiline or `\n`-escaped) or its base64.
- Export fails with a team/profile error — check `APPLE_TEAM_ID` matches the profile's Team in the "Verify signing setup" log.

The native apps call the API on the deployed Netlify site. The URL is set in `src/lib/api.js`; override it with
`VITE_API_BASE_URL` at build time if you connect a custom domain.

Both stores require a privacy policy URL — LureRater stores your GPS position, conditions and photos against an
anonymous device ID. Use https://sensational-kulfi-679194.netlify.app/privacy (source: `public/privacy.html`; also
linked from the app's Settings sheet).
