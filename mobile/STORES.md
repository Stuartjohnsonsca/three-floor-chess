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
