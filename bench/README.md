# Offline Benchmark Harness

This folder provides an offline browser benchmark to compare render speed strategies.

## What it measures
For each of 10 formulas (from simple to complex), it benchmarks these variants:

1. `compute_baseline_wrapper` - baseline wrapper call shape (matches app style).
2. `compute_direct_formula` - direct formula function call.
3. `compute_specialized` - scalar-specialized step switch.
4. `project_hits_streaming` - compute + projection + hit accumulation.
5. `project_draw_putimagedata` - full compute + projection + pixel buffer + `putImageData`.

Each test can run at 10,000,000 iterations with configurable warmup and measured repeats.

## Run locally/offline
From the repository root:

```bash
python3 -m http.server 8080
```

Then open:

- `http://127.0.0.1:8080/bench/`

No internet access is required after local files are served.

## Output
After completion, results are shown in:

- On-page table
- Browser console via `console.table`
- Downloadable JSON (`benchmark-results.json`) for Codex upload/analysis
- Downloadable CSV (`benchmark-results.csv`)
- Downloadable Markdown table (`benchmark-results.md`)

## How to interpret
- **Lower ms is faster.**
- **Higher Iter/s is faster.**
- **Speedup vs Baseline** > `1.0x` means improvement over the baseline wrapper for the same formula.

Use the highest repeat counts your machine can tolerate for stable, decision-quality data.
