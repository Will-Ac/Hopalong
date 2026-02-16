# Hopalong v124 — rewrite spec pack (2026-02-16)

This pack is intended to be handed to Codex as the source-of-truth for a clean rewrite of `hopalongv124.html`.

## 1) Scope

Single-page web app that:
- Renders Hopalong-style attractors to a `<canvas>` and supports pan/zoom.
- Provides a compact bottom parameter bar with per-parameter mode selection and quick value sliders.
- Supports gesture-driven modulation (ManX/ManY) and history stepping (tap left/right).
- Saves the canvas as PNG with iOS/Safari-friendly fallbacks.
- Provides a modal Help overlay opened by `?` and closed only by `X`, with zoom suppression while open.

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
- While help is open, suppress iOS zoom gestures:
  - `gesturestart` preventDefault
  - `dblclick` preventDefault
  - extra `touchend` double-tap suppression.

### 2.4 Quick slider + state picker popovers
- Quick slider panel: `#quickSlider` with `#qsRange`, `#qsLabel`, `#qsValue`, `#qsClose`.
- State picker panel: `#statePicker` with radios for `rand|fix|many|manx`.

### 2.5 Menu (long-press)
A larger settings menu exists (`#menu`) with sliders, outputs, and per-parameter randomize flags (`.randFlag` checkboxes) and Apply/Close controls.

## 3) Parameters & modes

### 3.1 Parameter keys
Numeric parameters:
- `a`, `b`, `c`, `d` (rendered as α/β/δ/γ in some UI areas; note v124 maps: alpha→a, beta→b, delta→c, gamma→d).
- `orbits` (N), `iters`
- `burn` (burn-in)
- `rangeR` (range r)
- `initR` (initial range)

Discrete parameters:
- `formula` (select)
- `cmap` (select)

### 3.2 Per-parameter state (Rand/Fix/ManX/ManY)
State is chosen from each `.poState` selector in the bottom overlay.

Rules:
- If a parameter is `rand`, the next render step randomizes that parameter value.
- If `fix`, hold steady unless user adjusts value.
- If `manx` or `many`, the parameter is driven by gesture modulation (see 4.2).
- System must enforce: **at most one** parameter assigned to ManX, and at most one to ManY. (v124 behavior implements discovery of the assigned keys during drag.)

### 3.3 Interaction sub-modes
`PAN / MOD / ALL` affect how gestures act:
- PAN: gestures pan/zoom the view only.
- MOD: gestures modulate ManX/ManY only.
- ALL: gestures can pan and pinch-zoom; two-finger drag pans unless pinch threshold exceeded.

## 4) Input model

### 4.1 Tap navigation
When not in menu, and no gesture movement:
- Short tap left half: history back (previous frame).
- Short tap right half: history forward or new render.

### 4.2 Drag & pinch
Pointer-tracked gestures (`pointerdown/move/up`):
- 1 finger drag:
  - If ManX/ManY assigned and not in menu: modulate assigned parameters using absolute screen X/Y.
  - Otherwise: pan (desktop can use Space modifier for pan).
- 2 finger:
  - Pinch zoom around midpoint, continuously updating baseline.
  - In ALL mode, near-constant distance => midpoint drag pans.
- Wheel zoom on desktop (`wheel` event) zooms about cursor point.

## 5) Rendering & history

Key behaviors:
- Uses seeded RNG per frame for deterministic history re-renders (mulberry32 + newSeed).
- Maintains a history stack for stepping back/forward (tap left/right).
- During gesture modulation, it can render a lower-quality preview and then commit a final full-quality render on release.
- A user-facing preview quality (`previewScale`) is exposed in help panel and persisted in localStorage.

## 6) Snapshot export (PNG)

`#poSnap` / `#topSnap` triggers canvas export.
Requirements:
- Try `canvas.toBlob` first; if blob exists, prefer Web Share (`navigator.canShare` / `navigator.share`) on iOS.
- Fallback: create object URL + `<a download>` click; if iOS ignores download, navigate same tab so user can save.
- Fallback of last resort: `canvas.toDataURL('image/png')`.

## 7) Persistence

Persist (localStorage):
- previewScale: `hopalong_previewScale`
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
- Always include file extensions in imports (e.g. `import { render } from "./renderer.js";`).
- Must be served over HTTP(S) (GitHub Pages is fine); `file://` won’t reliably allow module imports.

**Optional later upgrade (not required):**
- Convert to TypeScript + bundler once behavior is stable.


## 10) Test checklist (acceptance)

- Help: `?` opens; only X closes; while open, double-tap zoom is blocked.
- Toggle-all: label shows next action; border shows last action; height matches other param boxes.
- Tap left/right history works only when not dragging and menu closed.
- 2-finger ALL-mode pan vs pinch threshold behaves as specified.
- Snapshot works on iOS Safari (share-sheet or downloadable PNG).
