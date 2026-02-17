# Acceptance tests (manual)

Use this as a tight punch-list while Codex iterates.

## Help modal
- Tap `?` opens help.
- Tap outside does nothing (must stay open).
- Tap `X` closes.
- While open: pinch zoom / double-tap zoom does nothing.

## Bottom bar
- Each parameter tile shows its name + current value/selection.
- Each tile has a mode selector (Rand/Fix/ManX/ManY).
- Assigning ManX to a new parameter clears prior ManX assignment (same for ManY).

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
