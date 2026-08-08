# Three-Floor Chess — mobile (Capacitor)

Native Android/iOS shell around the single-file web game. The web game stays the
single source of truth (`../three-floor-chess.html`); `prepare-www.js` copies it in
as `www/index.html` before every sync.

## Prerequisites

- Node.js LTS (https://nodejs.org) — not yet installed on this machine
- Android: Android Studio (bundles the SDK). iOS: a Mac with Xcode.

## First-time setup

```bash
cd mobile
npm install
npm run prepare-www
npx cap add android   # and/or: npx cap add ios (Mac only)
```

## Every build after a game change

```bash
npm run android   # prepare-www + cap sync + open Android Studio
```

Then run on a device/emulator from Android Studio (or archive for the Play Store).

## Notes

- Online multiplayer (PeerJS) and Supabase accounts work from the native shell —
  it's a real WebView with network access.
- App icons: Android Studio > `Image Asset` from `../icons/icon-512.png`, or use
  `@capacitor/assets` (`npx capacitor-assets generate`) once Node is installed.
