# Hopalong v124 — rewrite spec pack (2026-02-16)

This pack is intended to be handed to Codex as the source-of-truth for a clean rewrite of `hopalongv124.html`.

## 1) Scope

Single-page web app that:
- Renders Hopalong-style attractors to a `<canvas>` and supports pan/zoom.
- Provides a compact bottom parameter bar with per-parameter mode selection and quick value sliders.
- Supports gesture-driven modulation (ManX/ManY) and history stepping (tap left/right).
- Saves the canvas as PNG with iOS/Safari-friendly fallbacks.
- Provides a modal Help overlay opened by `?` and closed only by `X`, with zoom suppression while open.

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
- Iteration quick slider includes play/stop button `#qsIterPlay`:
  - Default mode is stop (manual iterations from slider value).
  - Press play to auto-advance iterations in +1,000,000 steps.
  - In play mode, iteration count is allowed to exceed the manual slider max and continues up to 10,000,000,000 before auto-stopping.
  - While auto-play is running, live on-screen preview rendering is capped for responsiveness so the stop button remains responsive; full requested iterations are still used for screenshot export.
  - While playing, slider input is suppressed and current iteration value is shown centered over the slider track.
- State picker panel: `#statePicker` with radios for `rand|fix|many|manx`.

### 2.5 Menu (long-press)
A larger settings menu exists (`#menu`) with sliders, outputs, and per-parameter randomize flags (`.randFlag` checkboxes) and Apply/Close controls.

## 3) Parameters & modes

### 3.1 Parameter keys
Numeric parameters:
- `a`, `b`, `c`, `d` (rendered as a/b/c/d in some UI areas; note v124 maps: alpha→a, beta→b, delta→c, gamma→d).
- `iters`
- `burn` (burn-in)

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

### 4.3 Keyboard modulation (new)
- Arrow keys provide an additional way to drive assigned ManX/ManY parameters.
  - Left/Right adjust ManX negative/positive.
  - Up/Down adjust ManY positive/negative.
- Hold-to-accelerate profile:
  - 0-3s: 1x
  - 3-6s: 2x
  - 6-9s: 4x
  - 9s+: 8x
- On speed tier changes, show toast feedback in the format `+a adjustment 4X` or `-b adjustment 8X`.

## 5) Rendering & history

Key behaviors:
- Uses seeded RNG per frame for deterministic history re-renders (mulberry32 + newSeed).
- Maintains a history stack for stepping back/forward (tap left/right).
- During gesture modulation, it can render a lower-quality preview and then commit a final full-quality render on release.

## 6) Snapshot export (PNG)

`#poSnap` / `#topSnap` triggers canvas export.
Requirements:
- Show toast progress feedback while preparing the screenshot in the format `saving screenshot Ns remaining`, updating once per second with an estimated countdown.
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

## 9) Rewrite architecture (recommended)

Split into modules (even if bundled later):
- `core/formulas.ts`: formula step functions + metadata.
- `core/ranges.ts`: FORMULA_RANGES + helpers (±10% widening & clamp).
- `core/rng.ts`: mulberry32 + seeding.
- `render/renderer.ts`: iteration loop, burn-in, orbit control, draw-to-canvas, colormap sampling.
- `ui/state.ts`: parameter values, per-param mode, validation (unique ManX/ManY).
- `ui/components.ts`: bottom bar, quick slider, state picker, help modal.
- `input/gestures.ts`: pointer tracking, pan/zoom, modulation mapping.
- `persistence/storage.ts`: localStorage keys, load/save, schema versioning.
- `export/snapshot.ts`: PNG export with iOS fallbacks.

## 10) Test checklist (acceptance)

- Help: `?` opens; only X closes; while open, double-tap zoom is blocked.
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

## 12) Interest overlay (new)

- Add optional "interest map" scanning tied to the currently assigned ManX/ManY modulation plane.
- When enabled and at least one parameter is assigned to ManX/ManY, scan a configurable grid of parameter samples and classify each cell as `low`, `medium`, or `high` interest.
- Keep the overlay visible after scan completion; do not rescan unless non-plane inputs change (formula, seeds, non-modulated params, scan config).
- Cell classification must be evaluated in normalized auto-scale space (per-cell sampled world bounds mapped to [0..1] occupancy bins) so metrics align with auto-scaled behavior.
- Classification uses feature gates:
  - Low: escape/divergence, very sparse occupancy, or strong line-like dominance.
  - Medium: non-low cells that show closed-loop recurrence/path-diversity evidence.
  - High: non-low cells without the medium loop signature.
- Combined weighted scoring is removed from scan classification (legacy weight sliders may remain temporarily for backward-compatibility UI wiring).
- Draw a translucent grayscale grid overlay on top of the rendered image; during Phase 1/2 the draw path can map categories to temporary numeric intensity for compatibility.
- Add settings in the General tab for:
  - Grid size
  - Interest threshold
  - Scan iterations per cell
  - Overlay enable/disable toggle
