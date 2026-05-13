# Шашлык — Business Management App

Vite + React + Tailwind PWA for managing a small shashlik business. Russian UI, Tajikistani Somoni currency, fully offline.

## Quick start

```bash
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build in dist/
```

## Deploy to Vercel via GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/shashlik-app.git
git push -u origin main
```

Then at [vercel.com/new](https://vercel.com/new) → Import the repo → Deploy. Vercel auto-detects Vite. No build settings needed.

## Project structure

```
shashlik-app/
├── public/              # PWA assets (manifest, sw, icons) — copied as-is to dist/
├── src/
│   ├── main.jsx         # entry + service worker registration
│   ├── App.jsx          # router setup
│   ├── index.css        # Tailwind + custom component classes
│   ├── lib/
│   │   ├── store.js     # localStorage state via useSyncExternalStore
│   │   └── utils.js     # formatters, plurals, calcs, demo data
│   ├── components/
│   │   ├── Layout.jsx   # app shell, header, bottom nav
│   │   └── ui.jsx       # Modal, Toast, Confirm, FAB, Badge, Empty, Stat
│   └── pages/           # one file per route
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

## Client install (on Android)

1. Open the deployed URL in Chrome
2. Tap **⋮** → **Add to home screen**
3. Works fully offline from then on; data lives in localStorage on the device

## Updating

```bash
git push    # Vercel auto-deploys
```

Bump `CACHE_NAME` in `public/sw.js` (e.g. `'shashlik-v1'` → `'shashlik-v2'`) when releasing changes so users get fresh code instead of cached.

## Data & backups

All data is local. Tell the client to use **Настройки → Экспорт** weekly to save a JSON backup. **Импорт** restores it.
