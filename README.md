# FORGE — personal gym app

Personal training log. Runs as an installable, fully-offline **PWA** on iPhone; all data lives on the device (localStorage + IndexedDB). Built with Expo / React Native, exported for web.

## What it does

- **Workout**: build routines (exercises, target sets/reps/weights), plan a weekly schedule, create custom exercises with demo videos
- **Logger**: live timer, rest countdown (+30s / skip), steppers *and* tap-to-type weights/reps, add/remove exercises and sets mid-workout, "last time" hints, survives app kills (session is persisted), minimise & resume
- **History**: real calendar with month navigation, workout log with detail view, est. 1RM trend per exercise (Epley), personal records
- **Home**: today's planned routine, current streak, weekly volume, recent activity
- **Profile**: name, kg/lbs, light/dark, default rest timer, JSON backup export/restore

## Development (on the PC)

```powershell
npm install
npm run web        # dev server in the browser
npm start          # Expo Go on the phone (same Wi-Fi)
```

## Build & deploy the PWA

```powershell
npm run build      # expo export -p web + generates dist/sw.js (offline precache)
```

Deployment target is **GitHub Pages** at `https://<user>.github.io/forge/` (the `/forge` base path is set via `expo.experiments.baseUrl` in [app.json](app.json)):

```powershell
npm run deploy     # builds, then pushes dist/ to the gh-pages branch (incl. .nojekyll)
```

(First time: create the GitHub repo named `forge`, add it as `origin`, and in repo Settings → Pages choose the `gh-pages` branch.)

## Install on iPhone

1. Open the GitHub Pages URL in **Safari**.
2. Share button → **Add to Home Screen**.
3. Open FORGE from the home screen — fullscreen, offline, no PC needed.

Updates: run `npm run build`, push `gh-pages` again; the phone picks the new version up on the next launch with internet (twice — the service worker updates in the background, new version shows the launch after).

⚠️ Data lives in Safari's storage for this app. Export a backup (Profile → Export) now and then. Demo videos are device-local and not part of the backup.
