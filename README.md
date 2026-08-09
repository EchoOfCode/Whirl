# Whril 🌀

Whril is a gamified study and focus timer that uses on-device vision-based posture detection to help you stay focused. It runs entirely in the browser (no frames or video are sent to any server) and rewards consistent focus with a virtual pet that grows over time.

## Key Features

- Smart posture & presence detection using MediaPipe (runs in a Web Worker)
- Phase-driven Pomodoro flow (IDLE → CALIBRATING → FOCUS → BREAK → READY)
- Virtual pet that levels and changes appearance based on focus time
- Privacy-first: all inference happens locally in the browser
- PWA-ready (via `next-pwa`) and offline-capable using IndexedDB

## Quickstart

Requirements
- Node.js 18+ (recommended)

Install and run (npm):

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Other package managers:

```bash
# yarn
yarn
yarn dev

# pnpm
pnpm install
pnpm dev
```

Build for production

```bash
npm run build
npm start
```

## Project Structure

- `src/app/` — Next.js App Router: pages, layouts (client components where necessary)
  - `worker/` — Web Worker for MediaPipe inference (`detection.worker.ts`)
- `src/components/` — UI components (Camera, Pet, Session components)
- `src/hooks/` — Hooks like `useStore` (Zustand) and the focus loop `useFocusLoop`
- `src/lib/` — Pet logic and helpers

## Development Notes

- Camera permission is required for posture tracking. The app runs fine without a camera but tracking features will be disabled.
- The app uses a Wake Lock to keep the screen awake while a focus session is active; browsers may require a user gesture or deny the request.
- The MediaPipe model is loaded in-browser; initial load may take a moment.

## Testing & Linting

- Lint: `npm run lint` (uses ESLint)
- Build: `npm run build` (Next.js production build)

## Contributing

1. Fork the repo and create a feature branch.
2. Make changes and run `npm run lint` and `npm run build`.
3. Open a PR with a clear description of changes.

If you'd like me to push this repository to GitHub for you, tell me whether to use an existing remote or to create a new repo (provide a name). I can commit and push locally; creating a remote requires credentials or you can add the remote and push.

## License

MIT

---
_If anything specific should be included in the docs (CI, deployment, badges), tell me and I'll add them._
