# Architecture

## 1. Overview

Hopalong is a browser-based renderer for Hopalong-style attractors. The app lets the user pick a formula, adjust parameters, render the result to a canvas, add overlay information, and export or share the current view.

High-level flow:

1. User input changes a control, picker, or gesture.
2. `js/main.js` updates grouped state and saved defaults.
3. The renderer builds a new frame on the main canvas.
4. Overlay modules draw interest/manual guidance on top.
5. Export and history modules save, share, or restore the current setup.

In practical terms, `main.js` owns the application lifecycle, while the other modules handle one focused job each.

## 2. Module structure

### `js/main.js`
- Central orchestrator for the whole app.
- Owns app startup, DOM wiring, input handlers, persistence, and render scheduling.
- Groups mutable state into `renderState`, `uiState`, `overlayState`, `exportState`, and `historyStateRef`.
- Calls into renderer, overlays, export, help, history, and panel modules.
- Keeps the overall flow consistent: read defaults, react to UI, request draw, refresh overlays, then save/share state when needed.

### `js/uiPanels.js`
- Handles opening and closing of settings-style panels.
- Manages panel layout beside the picker panel.
- Closes panels when the user taps outside the active panel.
- Keeps panel-specific UI concerns out of `main.js`.

### `js/helpOverlay.js`
- Renders the guided help overlay that points at key controls.
- Computes label placement and connector lines.
- Includes collision-aware placement helpers so labels and arrows stay readable.
- Re-renders when panel layout or viewport position changes.

### `js/renderer.js`
- Implements the rendering pipeline for the attractor image.
- Converts normalized slider settings into formula parameters.
- Iterates the selected attractor formula to generate samples.
- Builds the image, applies colour mapping, and returns view/world metadata for later overlays and exports.
- Also exposes the Lyapunov-based grid classification function reused by the interest overlay worker.

### `js/interestOverlay.js`
- Owns interest overlay state on a secondary canvas.
- Decides when recalculation is needed after relevant state changes instead of recalculating on every small event.
- Builds scan plans and scan keys, owns the overlay cache, and redraws highlighted grid cells over the rendered image.
- Manages the worker lifecycle and only applies results that still match the currently valid request.

### `js/interestOverlayWorker.js`
- Performs the heavy Lyapunov/classification scan for one overlay job.
- Runs off the main thread and does not touch DOM APIs.
- Receives the scan plan, formula parameters, and grid settings from `js/interestOverlay.js`.
- Returns the computed overlay grid result to the main thread.

### `js/exportManager.js`
- Handles image export and sharing.
- Builds clean screenshots, overlay screenshots, and fixed high-resolution outputs.
- Reuses cached render data when possible.
- Adds metadata overlays and QR/share payload support for exported PNGs.

### `js/historyState.js`
- Maintains the history stack for interactive navigation.
- Stores snapshots of app state and supports backward/forward movement.
- Builds share URLs from the current state.
- Restores app state from history entries or shared URL payloads.

### `js/utils.js`
- Holds small shared helpers.
- Currently provides clamp helpers reused across modules.
- Keeps common math utilities in one place.

### `js/colormaps.js`
- Defines built-in colour maps and editable stop sets.
- Samples colours for rendering.
- Stores runtime overrides for user-edited colour stops.
- Normalizes map names and exposes helpers for reading/writing colour stop data.

## 3. State organisation

`main.js` keeps most mutable state in a few grouped objects so the rest of the code can pass focused getters and callbacks into helper modules.

### `renderState`
Contains rendering and view data, including:
- latest render metadata
- render scheduling flags
- render progress UI timing
- render revision/generation counters
- cached rendered frames
- fixed-view pan/zoom state

Read/write use:
- Written mainly by `main.js` during draw scheduling, pan/zoom, and render completion.
- Read by `exportManager`, `interestOverlay`, manual overlay drawing, and history restore logic.

### `uiState`
Contains interface-only state, including:
- active slider/picker/panel tracking
- help overlay controller
- transient tap/hold state
- info popup anchors
- last computed layout metrics
- panel control methods returned from `uiPanels.js`

Read/write use:
- Written mostly by `main.js` event handlers and `uiPanels.js` setup.
- Read by help overlay rendering, picker/panel layout, and input handling.

### `overlayState`
Contains live interaction and overlay-related gesture state, including:
- pointer tracking
- current interaction mode
- two-finger gesture details
- manual modulation flags
- history-tap suppression and tracking

Read/write use:
- Written by pointer and gesture handlers in `main.js`.
- Read when deciding whether to modulate, pan/zoom, show overlays, or delay history actions.

### `exportState`
Contains export subsystem references.
- Currently holds the export manager instance created by `initExportManager()`.

Read/write use:
- Written once during startup wiring in `main.js`.
- Read whenever the app needs screenshot/export behaviour or needs to know whether a high-res export is in progress.

### `historyStateRef`
Contains history-related shared references, including:
- render cache entries tied to history states
- temporary shared-parameter overrides loaded from URL state
- formula id tied to those shared parameters

Read/write use:
- Written by history commit/restore flows in `main.js` and `historyState.js` callbacks.
- Read during restore, share loading, and cache reuse.

## 4. Data flow

### Render loop
1. A control change, gesture, resize, or restore action calls `requestDraw()`.
2. `main.js` marks the frame dirty and schedules one draw pass.
3. The draw pass gathers formula, parameter, colour, seed, and view data.
4. `renderer.renderFrame()` generates the attractor image and returns metadata.
5. `main.js` updates render caches and metadata.
6. Overlay canvases are redrawn using the latest render metadata.

### Parameter changes
1. User changes a slider, quick slider, picker, or parameter mode.
2. `main.js` updates `appData.defaults` and related grouped state.
3. Defaults are persisted to storage when appropriate.
4. A new draw is requested.
5. The resulting state may also be committed to history.

### Overlay recalculation
Main thread flow:
1. After a render or relevant setting change, `main.js` asks the interest overlay module to recalculate.
2. `interestOverlay.js` detects invalidation, builds the scan plan, and derives the `scanKey`.
3. If a new calculation is required, `interestOverlay.js` starts or reuses the worker and sends a job payload containing the `jobId`, `scanKey`, and calculation inputs.
4. The main thread receives the worker result.
5. The result is applied only if both the `jobId` and `scanKey` still match the current valid request.
6. The cached result is then drawn on the overlay canvas.

Worker flow:
1. `js/interestOverlayWorker.js` receives one job payload.
2. The worker runs the full Lyapunov/classification scan off the main thread.
3. The worker returns the computed overlay grid result to `interestOverlay.js`.

Stale-result protection:
- Worker results are ignored unless both the `jobId` and `scanKey` still match.

Cancellation model:
- The worker is terminated only when a newer required scan invalidates the current in-flight scan.
- Pointer movement or other UI interaction that does not invalidate the scan does not cancel the job.

Manual overlay drawing is still handled separately in `main.js`, but both overlays use the latest render metadata.

### Export flow
1. The user requests a clean, overlay, 4K, or 8K capture.
2. `main.js` delegates to `exportManager`.
3. `exportManager` reads current render/view state through getters passed at startup.
4. It reuses cached render data or renders to an export-sized canvas when needed.
5. The manager saves or shares a PNG, optionally with metadata overlay content.

### History / URL update
1. `main.js` captures the current logical state after important user actions.
2. `historyState.js` pushes it onto the bounded history stack.
3. When sharing, `historyState.js` serializes formula, colour map, params, iterations, and view into the URL hash.
4. On startup, the app checks for a shared hash and applies it before the first render.
5. Moving backward or forward restores the saved state through `applyState()` callbacks supplied by `main.js`.

## 5. Startup sequence

1. Load bundled defaults from `data/defaults.json` and clone them into app state.
2. Read formula metadata, ranges, presets, seeds, and UI equations from `js/formulas.js`.
3. Read available colour maps from `js/colormaps.js`.
4. Normalize defaults, ranges, colour settings, interaction settings, and iteration limits.
5. Load local storage overrides on top of the bundled defaults.
6. Apply theme-related defaults such as background colour and dialog transparency.
7. Initialize module instances for history, export, interest overlay, UI panels, and help overlay.
8. Attach event handlers for buttons, pointers, keyboard input, resize, and panel interactions.
9. Resolve initial formula and colour map.
10. Apply shared URL state if a `#s=` payload is present.
11. Commit the initial state to history.
12. Request the first render.
13. Show a startup toast once the app is ready.


## Module dependency map

- `js/main.js` is the central orchestrator.
- `main.js` initializes and coordinates:
  - `js/uiPanels.js`
  - `js/helpOverlay.js`
  - `js/renderer.js`
  - `js/interestOverlay.js`
  - `js/interestOverlayWorker.js` (indirectly, via `js/interestOverlay.js`)
  - `js/exportManager.js`
  - `js/historyState.js`
- `js/utils.js` provides shared helper functions.
- `js/colormaps.js` provides colour map definitions and editable colour-stop data.
- Other modules should not import `main.js` directly.
- Most cross-module interaction should flow through `main.js` so state changes stay in one place.

## Runtime source of truth

- `js/formulas.js` is the formula source of truth shipped with the app.
- `js/colormaps.js` is the colormap source of truth shipped with the app.
- `data/defaults.json` contains bundled user-default values only.
- The application no longer depends on `hopalong_data.json`.
- Docs and spec-style files are for humans only; they are not runtime inputs.
- The version badge is only a visible build/version check for reviewers and testers. It sits at the top-left of the UI.
- A query-string cache buster such as `?v=XYZ` can force a fresh browser fetch, but it does not change app logic.
