# Three-Floor Chess

A vertical chess variant played across three stacked 8×8 boards, delivered as a single
self-contained HTML file. Open `three-floor-chess.html` in a browser — no build step, runs
offline (3D, AI, puzzles all inlined). Online play (PeerJS) and accounts (Supabase or local
fallback) are optional.

**Start here:** [`PROJECT.md`](PROJECT.md) — full handoff: rules, architecture, code map,
engines/AI, backend, testing, findings, and the prioritised backlog.

- `three-floor-chess.html` — the game.
- `index.html` — redirect to the game (so `/` works on a static host).
- `manifest.webmanifest`, `sw.js`, `icons/` — PWA layer: installable on phones,
  works offline once visited. The service worker only registers over http(s);
  opening the file from disk still works unchanged.
- `mobile/` — Capacitor wrapper for native Android/iOS builds (see `mobile/README.md`).
- `tools/serve.ps1` — zero-dependency local dev server:
  `powershell -File tools\serve.ps1` then open http://localhost:8420/
- `PROJECT.md` — project spec / handoff (read this first).
- `SUPABASE-SETUP.md` — optional accounts backend: create project, disable email
  confirmation, run the schema SQL, paste keys into the `SUPABASE_CONFIG` block.
- `design/balance-study.md` — self-play findings (key result: the variant AI is too passive,
  so self-play dead-draws; top backlog item is an initiative term in the variant eval).
- `engine/tf.js` — fast standalone variant engine (puzzle generation/verification).
- `tests/*.js` — Playwright harnesses driving the game via its `window.__game` bridge.
- `images/` — screenshots referenced by `PROJECT.md`.

The original design doc also lives in the linked claude.ai Project ("Game Development").

## Deploy
One static file → any static host (GitHub Pages / Netlify / Cloudflare Pages / Vercel) for a
real `https://` URL. That also makes online invite links work and gives Supabase login a
stable home.
