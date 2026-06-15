# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Commands

```bash
npm run dev          # Start Electron app with hot reload (renderer + main)
npm run build        # Build all targets (main, preload, renderer) to out/
npm run package      # Package macOS app via electron-builder (DMG + zip)
npm test             # Run all tests (vitest, jsdom environment)
npm run test:watch   # Run tests in watch mode
npx vitest run src/renderer/src/__tests__/DirectoryPicker.test.tsx  # Single test file
```

CLI: `node bin/cmpr.js [left-dir] [right-dir]` — launches Electron app. Use `npm link` to make `cmpr` available globally during development.

## Architecture

**Electron app with three layers** built by `electron-vite`:

- **Main process** (`src/main/`) — Electron window, IPC handlers, file system operations. Scans directories recursively, computes SHA-256 hashes via streaming (`crypto.createReadStream`), runs the pure comparison algorithm, handles copy/move operations. Worker thread support is scaffolded (`scanner.worker.ts`) but scanning currently runs in the main process.

- **Preload** (`src/preload/index.ts`) — Typed `contextBridge` API exposing IPC methods as `window.api`. The `ApiType` is exported for renderer type safety.

- **Renderer** (`src/renderer/`) — React 19 + Zustand + Tailwind CSS v4 (CSS-first config via `@tailwindcss/vite` plugin). Zen aesthetic: neutral palette, `SF Mono` for paths, generous whitespace, no borders, subtle shadows.

**Key data flow:** CLI args → main process `process.argv` → renderer fetches via `getCliArgs()` IPC → sets store paths → user triggers compare → `compareDirectories` IPC → scanner walks + hashes both dirs → `comparator.ts` produces `ComparisonResult` → renderer displays with filters/actions.

## Core Modules

- `src/shared/types.ts` — All shared types (`FileEntry`, `ComparisonEntry`, `ComparisonResult`, `FileStatus`, `ScanProgress`). `FileStatus` includes `'ignored'` for OS junk files (`.DS_Store`, etc.).
- `src/shared/ipc-channels.ts` — IPC channel name constants used by both main and preload.
- `src/main/comparison/comparator.ts` — Pure function `compare()` that takes two `FileEntry[]` arrays and produces `ComparisonResult` with summary stats (identical/different/left-only/right-only counts, structural similarity detection).
- `src/main/comparison/scanner.ts` — Recursive directory walker with SHA-256 streaming hash, progress callback.
- `src/main/file-ops.ts` — `copyFileToDir` and `moveFileToDir` preserving relative path structure. After copy/move, the IPC handler re-hashes only the affected file.
- `src/renderer/src/store.ts` — Zustand store. `getFilteredEntries()` is a standalone selector function (not a store method). Filter `'all'` excludes `'ignored'` entries.

## Conventions

- Tailwind v4 CSS-first configuration — design tokens defined in `app.css` via `@theme`, no `tailwind.config.ts`.
- Window uses `titleBarStyle: 'hiddenInset'` with custom drag region (`.titlebar-drag` class).
- IPC pattern: `ipcMain.handle`/`ipcRenderer.invoke` for request-response; `webContents.send`/`ipcRenderer.on` for streaming progress.
- Drag-and-drop directories supported at the app level (`App.tsx`).
- Tests use vitest + jsdom + `@testing-library/react`. Setup file at `src/renderer/src/test-setup.ts`.
