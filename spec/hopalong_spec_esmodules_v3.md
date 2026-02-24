# Hopalong v124 — rewrite spec pack (2026-02-16)

This pack is intended to be handed to Codex as the source-of-truth for a clean rewrite of `hopalongv124.html`.

## 1) Scope

Single-page web app that:
- Renders Hopalong-style attractors to a `<canvas>` and supports pan/zoom.
- Provides a compact bottom parameter bar with per-parameter mode selection and quick value sliders.
- Supports gesture-driven modulation (ManX/ManY) and history stepping (tap left/right).
- Saves the canvas as PNG with iOS/Safari-friendly fallbacks.
- Provides a modal Help overlay opened by `?` and closed only by `X`.
- Suppresses page zoom gestures globally (double-tap, pinch gesturestart, ctrl+wheel) so the app never zooms the page.

## 1.1) Implementation note: ES modules

This rewrite should be implemented as ES modules (multiple `.js` files) loaded from `index.html` using:

```html
<script type="module" src="./js/main.js"></script>
```

## 2) Public UI surface

### 2.1 Canvas
- Canvas element: `#c` (full-screen drawing surface). 

### 2.2 Bottom parameter overlay (always visible)
Container: `#paramOverlay` (single-row, flex layout). 

Each parameter tile (`.poItem`) contains:
- A *state selector* (`select.poState[data-state="<key>"]`) with values: `fix | manx | many | rand`. 
- A body with label + value button (for numeric params) or select (for formula/cmap). 

Tools area (`.poTools`):
- Toggle-all button `#poToggleAll` that toggles all parameter states between Rand and Fix.
  - Border/outline reflects the **last** action performed.
  - Button label shows what will happen **on next press** ("Rand all" / "Fix all"). 
- Snapshot button `#poSnap` for saving PNG (can be hidden in some responsive layouts). 

### 2.3 Help
- Help open button: `#helpBtn` ("?"). 
- Help modal overlay: `#helpOverlay` with close button `#helpCloseX` ("✕"). 
- Must not close by tapping outside; close only by X. 
- Global zoom suppression (applies whether help is open or closed):
  - viewport set to `maximum-scale=1, user-scalable=no`
  - `gesturestart` preventDefault
  - `dblclick` preventDefault
  - `touchend` double-tap suppression
  - prevent ctrl+wheel page zoom on desktop trackpads.
- Global app text selection is disabled across all page elements (canvas, overlays, controls, labels, and buttons) so long-press/tap does not trigger text selection on touch devices.

### 2.4 Quick slider + state picker popovers
- Quick slider panel: `#quickSlider` with `#qsRange`, centered inline readout `#qsLabel = #qsValue`, functional close button `#qsClose`, and step buttons `#qsMinus` / `#qsPlus`.
- Slice 2 behavior: opening a numeric parameter shows a **full-width horizontal slider panel** above the bottom bar, with the slider panel bottom edge aligned to the top edge of parameter tiles (must not overlap parameter tiles).
- Parameter name + value readout must be centered above the slider control so finger contact does not obscure the key readout.
- Slider readout and bottom parameter tiles must display actual derived `a/b/c/d` values (not normalized %), formatted to 4 decimal places.
- Tapping +/- changes by a very fine increment (0.0001 slider units, i.e. 10% of the prior 0.001 step); press-and-hold on +/- must continuously step values until release on touch and pointer devices.
- State picker panel: `#statePicker` with radios for `rand|fix|many|manx`. 

### 2.5 Menu (long-press)
A larger settings menu exists (`#menu`) with sliders, outputs, and per-parameter randomize flags (`.randFlag` checkboxes) and Apply/Close controls. 

## 3) Parameters & modes

### 3.1 Parameter keys
Numeric parameters:
- `a`, `b`, `c`, `d` (UI labels and readouts use `a/b/c/d` only; no Greek letter labels).
- `iters`
- `burn` (burn-in)

Discrete parameters:
- `formula` (select)
- `cmap` (select)

Colormap UI requirement:
- Bottom bar shows only selected colormap name.
- Colormap preview strip/gradient is shown in the **open colormap picker popup** (to the right of colormap name), not always visible in the bottom bar; colormap-name column and preview strip use fixed, reduced widths so popup rows stay visually aligned and fit cleanly within the popup panel.

Formula picker UI requirement:
- Formula picker popup rows must show short formula name plus full formula expression/description to its right, with fixed-width, reduced name and details columns so popup rows stay visually aligned and details text stays inside the popup panel.
- Formula and colormap pickers use black popup background for high contrast and open at compact width (about 3x trigger/tile width, not full-screen).

### 3.2 Per-parameter state (Rand/Fix/ManX/ManY)
State is chosen from each `.poState` selector in the bottom overlay. 

Rules:
- If a parameter is `rand`, the next render step randomizes that parameter value.
- If `fix`, hold steady unless user adjusts value.
- If `manx` or `many`, the parameter is driven by gesture modulation (see 4.2).
- System must enforce: **at most one** parameter assigned to ManX, and at most one to ManY. (v124 behavior implements discovery of the assigned keys during drag.) 


## 4) Input model

### 4.1 Tap navigation
When not in menu, and no gesture movement:
- Short tap left half: history back (previous frame).
- Short tap right half: history forward or new render. 

### 4.2 Drag & pinch
Pointer-tracked gestures (`pointerdown/move/up`):

- 1 finger drag:
  - If a parameter is assigned to `ManX` and/or `ManY` (see 3.2), map absolute screen X/Y to those parameter values and re-render a preview.
  - Otherwise, pan the view.

- 2 fingers:
  - Pinch zoom around the midpoint.
  - Two-finger drag pans using the midpoint.

- Desktop:
  - Mouse wheel zooms about cursor point (`wheel` event).

## 5) Rendering & history

Key behaviors:
- Uses seeded RNG per frame for deterministic history re-renders (mulberry32 + newSeed). 
- Maintains a history stack for stepping back/forward (tap left/right). 
- During gesture modulation, it can render a lower-quality preview and then commit a final full-quality render on release. 

## 6) Snapshot export (PNG)

`#poSnap` / `#topSnap` triggers canvas export.
Requirements:
- Try `canvas.toBlob` first; if blob exists, prefer Web Share (`navigator.canShare` / `navigator.share`) on iOS.
- Fallback: create object URL + `<a download>` click; if iOS ignores download, navigate same tab so user can save.
- Fallback of last resort: `canvas.toDataURL('image/png')`. 

## 7) Persistence

Persist (localStorage):
- per-parameter states / values (v124 has `persistAllStates()` called on state change). 
- install hint dismissal preference (see `#installHint`). 

## 8) Data assets

See `hopalong_data.json` for:
- Formula catalog (id/name/desc)
- Per-formula parameter ranges (a,b,c,d)
- Colormap names

## 9) Rewrite architecture (preferred: ES modules, no build)

**Preferred delivery (for iPad + GitHub Pages):**
- Plain JavaScript ES modules (multiple `.js` files) loaded by `index.html` with `<script type="module">`.
- No bundler, no transpiler, no Node build step required.

Recommended repo layout:

```
hopalong-rewrite/
├── index.html
├── data/
│   └── hopalong_data.json
└── js/
    ├── main.js
    ├── formulas.js
    ├── renderer.js
    ├── colormaps.js
    ├── state.js
    ├── gestures.js
    ├── ui.js
    └── snapshot.js
```

**Module responsibilities:**
- `js/formulas.js`: formula step functions + metadata lookup (pure math, no DOM).
- `js/renderer.js`: iteration loop, burn-in, orbit control, draw-to-canvas, colormap sampling (canvas only).
- `js/state.js`: parameter values, per-param mode, validation (unique ManX/ManY), history stack.
- `js/gestures.js`: pointer tracking, pan/zoom, modulation mapping.
- `js/ui.js`: bottom bar, quick slider, state picker, help modal (DOM only).
- `js/snapshot.js`: PNG export + iOS/Safari fallbacks.
- `js/main.js`: bootstraps the app; loads `data/hopalong_data.json` via `fetch()`, wires state↔UI↔renderer↔gestures.

**Notes:**
- Colormap definitions are part of the app’s visual identity. Do not invent them; implement them exactly as in `colormaps_v124.js` (renamed to `js/colormaps.js`).

- Always include file extensions in imports (e.g. `import { render } from "./renderer.js";`).
- Must be served over HTTP(S) (GitHub Pages is fine); `file://` won’t reliably allow module imports.

**Optional later upgrade (not required):**
- Convert to TypeScript + bundler once behavior is stable.


## 10) Test checklist (acceptance)

- Help: `?` opens; only X closes.
- Global zoom lock: double-tap and pinch must not zoom page anywhere (canvas or UI).
- UI text is not selectable anywhere in the app.
- Slice 2 quick slider opens as full-width horizontal panel above bottom bar and does not overlap parameter tiles.
- Quick slider includes a visible dismiss `X` button and it closes the slider when tapped.
- Quick slider includes +/- step buttons for fine incremental control, with press-and-hold continuous stepping.
- Quick slider shows centered inline parameter readout (`name = value`) above the slider control.
- Parameter tiles and quick slider readout display actual values (not %) with 4 decimal places.
- Colormap bottom tile shows name only; colormap picker popup shows name + visible color-range preview strip.
- Formula picker popup rows show short name plus full formula description to the right.
- Formula and colormap picker popups have black background and compact width (about 3x trigger width, not full-screen). 
- Toggle-all: label shows next action; border shows last action; height matches other param boxes. 
- Tap left/right history works only when not dragging and menu closed. 
- 2-finger ALL-mode pan vs pinch threshold behaves as specified. 
- Snapshot works on iOS Safari (share-sheet or downloadable PNG).

## 11) Debug overlay (new)

- A top-right debug panel includes a `Debug` radio toggle (`Off` / `On`).
- When debug is `On`, draw screen-space X and Y axes tied to world `x=0` and `y=0`.
  - If `x=0` or `y=0` are outside the visible world range, clamp that axis to the nearest screen edge for that axis.
- Render exactly 10 tick markers per axis with numeric labels formatted to 3 decimal places.
- Show debug readout lines under the toggle for:
  - selected formula
  - `a`, `b`, `c`, `d` values to 6 decimal places
  - iterations
  - seeds
  - visible x range and y range
  - center point of the visible range
  - FPS
- When debug is `Off`, hide axes/ticks/readout details and show a short `Debug off` message.
