// Copies the web game into mobile/www for Capacitor.
// The game is a single self-contained HTML file, so "building" is a copy.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(__dirname, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

fs.copyFileSync(path.join(root, 'three-floor-chess.html'), path.join(www, 'index.html'));
fs.copyFileSync(path.join(root, 'manifest.webmanifest'), path.join(www, 'manifest.webmanifest'));
fs.cpSync(path.join(root, 'icons'), path.join(www, 'icons'), { recursive: true });
// Note: sw.js is intentionally NOT copied — Capacitor ships assets locally,
// so a service worker adds nothing inside the native shell.

console.log('www/ prepared: game copied as index.html');
