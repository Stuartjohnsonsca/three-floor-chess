# Store release checklist

Goal: Three-Floor Chess on the Google Play Store and Apple App Store.
CI (`.github/workflows/build-mobile.yml`) already builds both platforms on every push.

## Where things stand

- [x] Android debug APK built by CI (sideloadable on any Android phone)
- [x] iOS app compiles on CI's macOS runner (unsigned, simulator target)
- [ ] Google Play Console account — **owner action, $25 one-time**
- [ ] Apple Developer Program account — **owner action, $99/year**
- [ ] Android release signing (upload keystore + Play App Signing)
- [ ] iOS release signing (certificates + provisioning profile in CI)
- [ ] Store listings (screenshots, descriptions, privacy policy URL, content rating)
- [ ] Play internal-testing track upload → production
- [ ] TestFlight upload → App Store review

## TestFlight — exact path (CI is ready; builds pin Xcode 26+)

Owner steps, in order:

1. **Enroll**: https://developer.apple.com/programs/enroll/ — Apple ID with 2FA,
   $99/year, identity verification can take up to 48 h.
2. **Register the bundle ID**: developer.apple.com/account → Certificates, IDs &
   Profiles → Identifiers → + → App ID → `com.threefloorchess.app` (no special
   capabilities needed).
3. **Create the app record**: App Store Connect → Apps → + New App → iOS,
   name "Three-Floor Chess", the bundle ID above, any SKU (e.g. `tfc-001`).
4. **Make an API key**: App Store Connect → Users and Access → Integrations →
   App Store Connect API → Team Keys → Generate (role: App Manager).
   Save the **Key ID**, the **Issuer ID**, and download the **.p8** file
   (downloadable exactly once).
5. **Add four repo secrets** (GitHub → repo → Settings → Secrets and variables →
   Actions → New repository secret), or hand the four values to Claude to set
   via `gh secret set`:
   - `APPLE_TEAM_ID` — 10-char Team ID (Membership page)
   - `ASC_KEY_ID` — from step 4
   - `ASC_ISSUER_ID` — from step 4
   - `ASC_KEY_P8` — the .p8 file base64-encoded
     (`base64 -i AuthKey_XXXX.p8` on Mac, `[Convert]::ToBase64String([IO.File]::ReadAllBytes('AuthKey_XXXX.p8'))` on Windows)
6. **Run the workflow**: Actions tab → **TestFlight** → Run workflow (pick the
   marketing version, default 1.0.0). It archives with automatic cloud signing
   and uploads straight to App Store Connect.
7. **Distribute**: after ~5–15 min of Apple-side processing, App Store Connect →
   your app → TestFlight tab → add yourself/friends as **internal testers**
   (up to 100, instant). Testers install Apple's TestFlight app on their
   iPhone, accept the email invite, and install the game. External testers
   (up to 10 000, public link) need a one-time short Beta App Review first.

Export compliance is pre-answered in the build (standard HTTPS/WebRTC crypto
only → exempt), so uploads go straight to "Ready to Test".

## Owner actions (only you can do these)

1. **Google Play Console** — https://play.google.com/console/signup
   Sign in with a Google account, pay the $25 one-time fee, complete identity
   verification (can take a day or two).
2. **Apple Developer Program** — https://developer.apple.com/programs/enroll/
   Needs an Apple ID with two-factor auth; $99/year; identity verification can
   take up to 48h.

Once either account exists, say so and the corresponding signing + upload
pipeline gets wired into CI (secrets go into GitHub repo secrets, never the repo).

## Notes

- The app IDs are set in `capacitor.config.json`: `com.threefloorchess.app`.
  If you'd rather use a domain you own for the ID, change it BEFORE first store
  upload — it's permanent once published.
- Both stores require a privacy policy URL for apps with accounts/multiplayer.
  A simple page in the repo (published via GitHub Pages) satisfies this.
- Sideload today: GitHub → Actions → latest "Build mobile apps" run →
  download `three-floor-chess-debug-apk`, open it on an Android phone
  (allow "install from unknown sources").
