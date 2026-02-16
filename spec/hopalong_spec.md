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
- Canvas element: `#c` (full-screen drawing surface). fileciteturn1file16

### 2.2 Bottom parameter overlay (always visible)
Container: `#paramOverlay` (single-row, flex layout). fileciteturn1file19

Each parameter tile (`.poItem`) contains:
- A *state selector* (`select.poState[data-state="<key>"]`) with values: `fix | manx | many | rand`. fileciteturn1file2
- A body with label + value button (for numeric params) or select (for formula/cmap). fileciteturn1file16

Tools area (`.poTools`):
- Toggle-all button `#poToggleAll` that toggles all parameter states between Rand and Fix.
  - Border/outline reflects the **last** action performed.
  - Button label shows what will happen **on next press** ("Rand all" / "Fix all"). fileciteturn1file13
- Snapshot button `#poSnap` for saving PNG (can be hidden in some responsive layouts). fileciteturn1file4

### 2.3 Help
- Help open button: `#helpBtn` ("?"). fileciteturn1file6
- Help modal overlay: `#helpOverlay` with close button `#helpCloseX` ("✕"). fileciteturn1file12
- Must not close by tapping outside; close only by X. fileciteturn1file0
- While help is open, suppress iOS zoom gestures:
  - `gesturestart` preventDefault
  - `dblclick` preventDefault
  - extra `touchend` double-tap suppression. fileciteturn1file0

### 2.4 Quick slider + state picker popovers
- Quick slider panel: `#quickSlider` with `#qsRange`, `#qsLabel`, `#qsValue`, `#qsClose`. fileciteturn1file4
- State picker panel: `#statePicker` with radios for `rand|fix|many|manx`. fileciteturn1file6

### 2.5 Menu (long-press)
A larger settings menu exists (`#menu`) with sliders, outputs, and per-parameter randomize flags (`.randFlag` checkboxes) and Apply/Close controls. fileciteturn1file9

## 3) Parameters & modes

### 3.1 Parameter keys
Numeric parameters:
- `a`, `b`, `c`, `d` (rendered as α/β/δ/γ in some UI areas; note v124 maps: alpha→a, beta→b, delta→c, gamma→d). fileciteturn1file9
- `orbits` (N), `iters`
- `burn` (burn-in)
- `rangeR` (range r)
- `initR` (initial range)

Discrete parameters:
- `formula` (select)
- `cmap` (select)

### 3.2 Per-parameter state (Rand/Fix/ManX/ManY)
State is chosen from each `.poState` selector in the bottom overlay. fileciteturn1file2

Rules:
- If a parameter is `rand`, the next render step randomizes that parameter value.
- If `fix`, hold steady unless user adjusts value.
- If `manx` or `many`, the parameter is driven by gesture modulation (see 4.2).
- System must enforce: **at most one** parameter assigned to ManX, and at most one to ManY. (v124 behavior implements discovery of the assigned keys during drag.) fileciteturn1file3

### 3.3 Interaction sub-modes
`PAN / MOD / ALL` affect how gestures act:
- PAN: gestures pan/zoom the view only.
- MOD: gestures modulate ManX/ManY only.
- ALL: gestures can pan and pinch-zoom; two-finger drag pans unless pinch threshold exceeded. fileciteturn1file15

## 4) Input model

### 4.1 Tap navigation
When not in menu, and no gesture movement:
- Short tap left half: history back (previous frame).
- Short tap right half: history forward or new render. fileciteturn1file8

### 4.2 Drag & pinch
Pointer-tracked gestures (`pointerdown/move/up`):
- 1 finger drag:
  - If ManX/ManY assigned and not in menu: modulate assigned parameters using absolute screen X/Y. fileciteturn1file3
  - Otherwise: pan (desktop can use Space modifier for pan).
- 2 finger:
  - Pinch zoom around midpoint, continuously updating baseline. fileciteturn1file15
  - In ALL mode, near-constant distance => midpoint drag pans. fileciteturn1file15
- Wheel zoom on desktop (`wheel` event) zooms about cursor point. fileciteturn1file8

## 5) Rendering & history

Key behaviors:
- Uses seeded RNG per frame for deterministic history re-renders (mulberry32 + newSeed). fileciteturn1file8
- Maintains a history stack for stepping back/forward (tap left/right). fileciteturn1file8
- During gesture modulation, it can render a lower-quality preview and then commit a final full-quality render on release. fileciteturn1file8
- A user-facing preview quality (`previewScale`) is exposed in help panel and persisted in localStorage. fileciteturn1file18

## 6) Snapshot export (PNG)

`#poSnap` / `#topSnap` triggers canvas export.
Requirements:
- Try `canvas.toBlob` first; if blob exists, prefer Web Share (`navigator.canShare` / `navigator.share`) on iOS.
- Fallback: create object URL + `<a download>` click; if iOS ignores download, navigate same tab so user can save.
- Fallback of last resort: `canvas.toDataURL('image/png')`. fileciteturn1file17

## 7) Persistence

Persist (localStorage):
- previewScale: `hopalong_previewScale`
- per-parameter states / values (v124 has `persistAllStates()` called on state change). fileciteturn1file13
- install hint dismissal preference (see `#installHint`). fileciteturn1file6

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

- Help: `?` opens; only X closes; while open, double-tap zoom is blocked. fileciteturn1file0
- Toggle-all: label shows next action; border shows last action; height matches other param boxes. fileciteturn1file1
- Tap left/right history works only when not dragging and menu closed. fileciteturn1file8
- 2-finger ALL-mode pan vs pinch threshold behaves as specified. fileciteturn1file15
- Snapshot works on iOS Safari (share-sheet or downloadable PNG). fileciteturn1file17
