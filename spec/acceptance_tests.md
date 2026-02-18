# Acceptance tests (manual)

Use this as a tight punch-list while Codex iterates.

## Help modal
- Tap `?` opens help.
- Tap outside does nothing (must stay open).
- Tap `X` closes.

## Global zoom suppression
- Double-tap anywhere on page does not zoom (canvas or controls).
- Pinch gesture does not zoom the page.
- Ctrl+wheel (desktop trackpad/browser zoom gesture) does not zoom page content.
- Long-pressing on labels/buttons does not select text anywhere in the app.

## Bottom bar
- Each parameter tile shows its name + current value/selection, with numeric values shown to 4 decimal places.
- Each tile has a mode selector (Rand/Fix/ManX/ManY).
- Assigning ManX to a new parameter clears prior ManX assignment (same for ManY).
- Colormap tile shows colormap name only (no always-visible preview strip).
- Opening colormap picker shows name plus preview strip in each option row, using fixed widths for name and preview columns.
- Formula picker popup rows show short name and full formula description side-by-side, using fixed widths for both columns.
- Formula and colormap picker popups use black background and compact width (not full-screen).

## Quick slider
- Tapping a numeric parameter opens slider popover, and tapping `X` always dismisses it.
- Slider is full-width horizontal panel above the bottom bar with panel bottom aligned to top of parameter tiles.
- Slider panel does not overlap parameter tiles.
- Parameter name and value are centered above slider track in `name = value` format.
- Slider has minus and plus buttons for very fine incremental control (0.0001 slider units), and press-and-hold continuously steps values on touch and pointer devices.
- Moving slider or using +/- updates actual-value readout (not %) to 4 decimal places and redraws frame immediately.
- Parameter tiles use `a/b/c/d` labels only (no Greek letters).

## Toggle-all
- Press once: all modes become Rand OR Fix (depending on current last-action).
- Button border indicates last action performed.
- Button text indicates next action if pressed again.
- Button height matches parameter tiles.

## Gestures
- Tap left half: previous history frame.
- Tap right half: next/new frame.
- 1-finger drag pans when in PAN mode.
- 1-finger drag modulates ManX/ManY when in MOD mode and assigned.
- 2-finger pinch zooms around midpoint.
- In ALL mode, 2-finger midpoint drag pans when pinch distance change is under threshold.

## Snapshot
- Save PNG creates a file (or share sheet) on iOS Safari.
- Saved image contains the canvas only (no overlays).
