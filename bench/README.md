# Offline Benchmark Harness

This benchmark page is designed to run from **GitHub Pages** (no local dev setup required).

## What it measures
For each of 10 formulas (simple to complex), it benchmarks:

1. `compute_baseline_wrapper` - baseline wrapper call shape.
2. `compute_direct_formula` - direct formula function call.
3. `compute_specialized` - scalar-specialized step switch.
4. `project_hits_streaming` - compute + projection + hit accumulation.
5. `project_draw_putimagedata` - full compute + projection + pixel buffer + `putImageData`.

Default target is 10,000,000 iterations per test.

## Run it from GitHub Pages (recommended)
1. Push your branch to GitHub and merge into your Pages branch (usually `main`).
2. In your repository, open **Settings → Pages**.
3. Set source to your deploy branch (usually `main`) and folder to **`/ (root)`**.
4. Wait until GitHub says Pages is deployed.
5. Open this URL pattern:
   - `https://<your-github-username>.github.io/<your-repo-name>/bench/`

Example:
- `https://jane-doe.github.io/Hopalong/bench/`

## How to run (simple)
1. Open the benchmark page URL.
2. Leave defaults (or set your own values).
3. Click **Run Benchmark**.
4. Wait for status to show **Done**.
5. Click **Download JSON**.
6. Upload `benchmark-results.json` to Codex and ask for optimization recommendations.

## Output files
After a run, you can download:

- `benchmark-results.json` (best for Codex analysis)
- `benchmark-results.csv`
- `benchmark-results.md`

## How to read results
- **Lower ms = faster**.
- **Higher Iter/s = faster**.
- **Speedup vs Baseline > 1.0x** means that variant is faster than baseline for that formula.
