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

## Bottom bar
- Each parameter tile shows its name + current value/selection.
- Each tile has a mode selector (Rand/Fix/ManX/ManY).
- Assigning ManX to a new parameter clears prior ManX assignment (same for ManY).
- Colormap tile shows colormap name only (no always-visible preview strip).
- Opening colormap picker shows name plus preview strip in each option row.
- Formula picker popup rows show short name and full formula description side-by-side.
- Formula and colormap picker popups use black background.

## Quick slider
- Tapping a numeric parameter opens slider popover.
- Slider is full-width horizontal panel above the bottom bar.
- Slider panel does not overlap parameter tiles.
- Parameter name and value are shown above slider track.
- Slider has minus and plus buttons for fine incremental control.
- Moving slider or using +/- updates value readout and redraws frame immediately.

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
