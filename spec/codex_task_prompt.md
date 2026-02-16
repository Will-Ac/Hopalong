# Codex task prompt (starter)

Goal: Ground-up rewrite of Hopalong v124 as clean modular TypeScript, then bundle to a single `index.html` + `bundle.js` for static hosting.

Inputs (must treat as authoritative):
- `hopalong_spec.md` (UI, interactions, behaviors)
- `hopalong_data.json` (formula metadata + ranges + colormaps)

Constraints:
- Must preserve visible behavior: gestures, help modal, toggle-all semantics, snapshot behavior, seeded history.
- Must run smoothly on iPad Safari (pointer events, no reliance on hover).

Deliverables:
1) A small repo structure with modules (core/render/ui/input/persistence/export).
2) `npm test` (or equivalent) with at least:
   - unit tests for RNG, range widening/clamp, and ManX/ManY uniqueness rule.
3) A minimal `index.html` that matches the v124 UI layout (bottom bar, help modal, quick slider).
4) A `build` output that can be copied into a GitHub Pages folder.

Start with a vertical slice:
- Implement formula selection + render loop + bottom bar value display.
- Then implement state modes + ManX/ManY modulation.
- Then implement help modal + zoom suppression.
- Then implement snapshot export + iOS fallbacks.
