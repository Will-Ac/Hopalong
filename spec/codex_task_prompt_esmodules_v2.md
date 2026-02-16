# Codex task prompt (preferred: ES modules, no build)

Goal: Ground-up rewrite of Hopalong v124 as a clean, modular ES-module codebase that runs directly on GitHub Pages (no bundler, no TypeScript).

Authoritative inputs:
- `spec/hopalong_spec.md` (UI, interactions, behaviors)
- `spec/hopalong_data.json` (formula metadata + ranges + colormaps)
- `spec/acceptance_tests.md` (manual acceptance checklist)

Deliverables (exact output structure):
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

Key constraints:
- Preserve visible behavior from the spec: gestures, help modal rules, toggle-all semantics, snapshot behavior, seeded history.
- Must work on iPad Safari.
- Do not copy legacy code from `hopalongv124.html`; implement from the spec + data only.

Implementation rules:
- Use ES module syntax (`export` / `import`) with explicit `.js` extensions.
- Load `data/hopalong_data.json` in `main.js` using `fetch("./data/hopalong_data.json")`.
- `index.html` must load `./js/main.js` via `<script type="module" src="./js/main.js"></script>`.

Development plan (vertical slices):
1) Slice 1: Canvas + load JSON + render one frame + formula selector works.
2) Slice 2: Bottom bar tiles show values; tapping a value opens a slider; changes trigger re-render.
3) Slice 3: Per-param modes (rand/fix/manx/many) + uniqueness of ManX/ManY + toggle-all button.
4) Slice 4: Gestures (pan/zoom/modulation) per spec modes PAN/MOD/ALL.
5) Slice 5: Help modal (only X closes) + zoom suppression while open.
6) Slice 6: Snapshot export with iOS-safe fallbacks.

Acceptance:
- After each slice, run through `spec/acceptance_tests.md` and fix any mismatch immediately.
