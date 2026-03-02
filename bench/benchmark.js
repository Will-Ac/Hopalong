import { FORMULA_DEFS } from "../js/formulas.js";

const FORMULA_IDS = [
  "classic_sqrt",
  "sqrt_plus_gamma_x",
  "trig_kick_x",
  "double_root",
  "threeply",
  "quadrup2",
  "ikeda",
  "tinkerbell",
  "gumowski_mira",
  "popcorn",
];

const VARIANTS = [
  { id: "compute_baseline_wrapper", label: "compute: baseline wrapper", runner: runComputeBaselineWrapper },
  { id: "compute_direct_formula", label: "compute: direct formula", runner: runComputeDirectFormula },
  { id: "compute_specialized", label: "compute: specialized scalar", runner: runComputeSpecialized },
  { id: "project_hits_streaming", label: "streaming: project+hits", runner: runProjectAndHitsStreaming },
  { id: "project_draw_putimagedata", label: "full render: putImageData", runner: runProjectAndDrawImageData },
];

const runBtn = document.getElementById("runBtn");
const jsonBtn = document.getElementById("jsonBtn");
const csvBtn = document.getElementById("csvBtn");
const mdBtn = document.getElementById("mdBtn");
const statusEl = document.getElementById("status");
const resultsBody = document.getElementById("resultsBody");
const mdOutput = document.getElementById("mdOutput");
const iterationsInput = document.getElementById("iterationsInput");
const warmupsInput = document.getElementById("warmupsInput");
const runsInput = document.getElementById("runsInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const canvas = document.getElementById("benchmarkCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

let latestRows = [];
let latestMeta = null;

function asVariantStep(formula) {
  return (x, y, a, b, c, d) => formula.step(x, y, { a, b, c, d });
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function stats(timesMs, iterations) {
  const mean = timesMs.reduce((sum, v) => sum + v, 0) / timesMs.length;
  const median = percentile(timesMs, 50);
  const p95 = percentile(timesMs, 95);
  return {
    mean,
    median,
    p95,
    itersPerSec: iterations / (mean / 1000),
  };
}

function seededParams(formula) {
  const d = formula.defaults;
  return { a: d.a, b: d.b, c: d.c, d: d.d };
}

function preBurn(formula, iterations, params) {
  let x = formula.seed?.x ?? 0;
  let y = formula.seed?.y ?? 0;
  for (let i = 0; i < Math.min(300, Math.floor(iterations * 0.00003)); i += 1) {
    [x, y] = formula.step(x, y, params);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
      break;
    }
  }
  return { x, y };
}

function runComputeBaselineWrapper({ formula, iterations }) {
  const step = asVariantStep(formula);
  const params = seededParams(formula);
  let x = formula.seed?.x ?? 0;
  let y = formula.seed?.y ?? 0;

  for (let i = 0; i < iterations; i += 1) {
    [x, y] = step(x, y, params.a, params.b, params.c, params.d);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
    }
  }
  return x + y;
}

function runComputeDirectFormula({ formula, iterations }) {
  const params = seededParams(formula);
  let x = formula.seed?.x ?? 0;
  let y = formula.seed?.y ?? 0;

  for (let i = 0; i < iterations; i += 1) {
    [x, y] = formula.step(x, y, params);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
    }
  }
  return x + y;
}

function runComputeSpecialized({ formula, iterations }) {
  const p = seededParams(formula);
  let x = formula.seed?.x ?? 0;
  let y = formula.seed?.y ?? 0;

  for (let i = 0; i < iterations; i += 1) {
    const [xn, yn] = specializedStep(formula.id, x, y, p);
    x = xn;
    y = yn;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
    }
  }
  return x + y;
}

function runProjectAndHitsStreaming({ formula, iterations, width, height }) {
  const p = seededParams(formula);
  const start = preBurn(formula, iterations, p);
  let x = start.x;
  let y = start.y;
  const minX = -8;
  const maxX = 8;
  const minY = -8;
  const maxY = 8;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const hits = new Uint32Array(width * height);

  for (let i = 0; i < iterations; i += 1) {
    const [xn, yn] = specializedStep(formula.id, x, y, p);
    x = xn;
    y = yn;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
      continue;
    }

    const px = Math.round(((x - minX) / spanX) * (width - 1));
    const py = Math.round(((y - minY) / spanY) * (height - 1));
    if (px < 0 || py < 0 || px >= width || py >= height) continue;
    hits[py * width + px] += 1;
  }

  return hits[0];
}

function runProjectAndDrawImageData({ formula, iterations, width, height }) {
  canvas.width = width;
  canvas.height = height;
  const image = ctx.createImageData(width, height);
  const pixels = image.data;
  const p = seededParams(formula);
  const start = preBurn(formula, iterations, p);

  let x = start.x;
  let y = start.y;
  const minX = -8;
  const maxX = 8;
  const minY = -8;
  const maxY = 8;
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 2;
    pixels[i + 1] = 4;
    pixels[i + 2] = 9;
    pixels[i + 3] = 255;
  }

  for (let i = 0; i < iterations; i += 1) {
    const [xn, yn] = specializedStep(formula.id, x, y, p);
    x = xn;
    y = yn;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = 0;
      y = 0;
      continue;
    }

    const px = Math.round(((x - minX) / spanX) * (width - 1));
    const py = Math.round(((y - minY) / spanY) * (height - 1));
    if (px < 0 || py < 0 || px >= width || py >= height) continue;

    const idx = (py * width + px) * 4;
    const t = i / Math.max(1, iterations - 1);
    pixels[idx] = Math.floor(255 * t);
    pixels[idx + 1] = Math.floor(255 * (1 - t));
    pixels[idx + 2] = 200;
    pixels[idx + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  return pixels[0];
}

function specializedStep(id, x, y, p) {
  switch (id) {
    case "classic_sqrt": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)), p.a - x];
    }
    case "sqrt_plus_gamma_x": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * x, p.a - x];
    }
    case "trig_kick_x": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * Math.sin(x), p.a - x];
    }
    case "double_root": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const r1 = Math.sqrt(Math.abs(p.b * x - p.d));
      const r2 = Math.sqrt(Math.abs(p.b * y - p.d));
      return [y - s * (r1 + p.c * r2), p.a - x];
    }
    case "threeply": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const t = Math.sin(x) * Math.cos(p.b) + p.c - x * Math.sin(p.a + p.b + p.c);
      return [y - s * Math.abs(t), p.a - x];
    }
    case "quadrup2": {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const ln1 = Math.log(Math.abs(p.b * x - p.d) + 1e-12);
      const ln2 = Math.log(Math.abs(p.d * x - p.b) + 1e-12);
      const k = Math.sin(ln1) * Math.atan(ln2 * ln2);
      return [y - s * k, p.a - x];
    }
    case "ikeda": {
      const r2 = x * x + y * y;
      const t = p.c - p.d / (1 + r2);
      const ct = Math.cos(t);
      const st = Math.sin(t);
      return [p.a + p.b * (x * ct - y * st), p.b * (x * st + y * ct)];
    }
    case "tinkerbell":
      return [x * x - y * y + p.a * x + p.b * y, 2 * x * y + p.c * x + p.d * y];
    case "gumowski_mira": {
      const f = (u) => p.c * u + (2 * (1 - p.c) * u * u) / (1 + u * u);
      const x1 = y + p.a * (1 - p.b * y * y) * y + f(x);
      return [x1, -x + p.d * f(x1)];
    }
    case "popcorn": {
      const safeTan = (v) => {
        const t = Math.tan(v);
        return Number.isFinite(t) ? Math.max(-10, Math.min(10, t)) : 0;
      };
      return [x - p.a * Math.sin(y + safeTan(3 * y)) + p.c, y - p.b * Math.sin(x + safeTan(3 * x)) + p.d];
    }
    default:
      return [x, y];
  }
}

async function runSingle({ formula, variant, iterations, width, height, warmups, runs }) {
  for (let i = 0; i < warmups; i += 1) {
    variant.runner({ formula, iterations, width, height });
  }

  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    variant.runner({ formula, iterations, width, height });
    samples.push(performance.now() - t0);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return stats(samples, iterations);
}

function fmtNumber(v, digits = 2) {
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function renderTable(rows) {
  resultsBody.innerHTML = "";
  for (const row of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.formula}</td><td>${row.variant}</td><td>${row.iterations.toLocaleString()}</td><td>${fmtNumber(row.meanMs)}</td><td>${fmtNumber(row.medianMs)}</td><td>${fmtNumber(row.p95Ms)}</td><td>${fmtNumber(row.itersPerSec, 0)}</td><td>${fmtNumber(row.speedupVsBaseline, 2)}x</td>`;
    resultsBody.appendChild(tr);
  }
}

function toMarkdown(rows) {
  const header = "| Formula | Variant | Iterations | Mean ms | Median ms | P95 ms | Iter/s | Speedup vs Baseline |";
  const sep = "|---|---|---:|---:|---:|---:|---:|---:|";
  const lines = rows.map((r) => `| ${r.formula} | ${r.variant} | ${r.iterations} | ${fmtNumber(r.meanMs)} | ${fmtNumber(r.medianMs)} | ${fmtNumber(r.p95Ms)} | ${fmtNumber(r.itersPerSec, 0)} | ${fmtNumber(r.speedupVsBaseline, 2)}x |`);
  return [header, sep, ...lines].join("\n");
}

function toCsv(rows) {
  const header = ["formula", "variant", "iterations", "mean_ms", "median_ms", "p95_ms", "iters_per_sec", "speedup_vs_baseline"];
  const lines = rows.map((r) => [r.formula, r.variant, r.iterations, r.meanMs.toFixed(4), r.medianMs.toFixed(4), r.p95Ms.toFixed(4), r.itersPerSec.toFixed(2), r.speedupVsBaseline.toFixed(4)].join(","));
  return [header.join(","), ...lines].join("\n");
}

function toJsonPayload(rows, meta) {
  return {
    benchmark: {
      generatedAt: new Date().toISOString(),
      app: "Hopalong Offline Render Benchmark",
      config: meta,
      formulas: FORMULA_IDS,
      variants: VARIANTS.map((v) => ({ id: v.id, label: v.label })),
      results: rows,
    },
  };
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function runAll() {
  runBtn.disabled = true;
  jsonBtn.disabled = true;
  csvBtn.disabled = true;
  mdBtn.disabled = true;
  latestRows = [];

  const iterations = Math.max(1_000, Number(iterationsInput.value) || 10_000_000);
  const warmups = Math.max(0, Number(warmupsInput.value) || 1);
  const runs = Math.max(1, Number(runsInput.value) || 3);
  const width = Math.max(64, Number(widthInput.value) || 1280);
  const height = Math.max(64, Number(heightInput.value) || 720);
  latestMeta = { iterations, warmups, runs, width, height };

  const formulas = FORMULA_IDS.map((id) => FORMULA_DEFS.find((f) => f.id === id)).filter(Boolean);
  const total = formulas.length * VARIANTS.length;
  let done = 0;

  for (const formula of formulas) {
    const baseline = await runSingle({ formula, variant: VARIANTS[0], iterations, width, height, warmups, runs });
    latestRows.push({
      formula: formula.id,
      variant: VARIANTS[0].id,
      iterations,
      meanMs: baseline.mean,
      medianMs: baseline.median,
      p95Ms: baseline.p95,
      itersPerSec: baseline.itersPerSec,
      speedupVsBaseline: 1,
    });

    done += 1;
    statusEl.textContent = `Progress ${done}/${total}: ${formula.id} / ${VARIANTS[0].id}`;
    renderTable(latestRows);

    for (let i = 1; i < VARIANTS.length; i += 1) {
      const variant = VARIANTS[i];
      const s = await runSingle({ formula, variant, iterations, width, height, warmups, runs });
      latestRows.push({
        formula: formula.id,
        variant: variant.id,
        iterations,
        meanMs: s.mean,
        medianMs: s.median,
        p95Ms: s.p95,
        itersPerSec: s.itersPerSec,
        speedupVsBaseline: baseline.mean / Math.max(0.0001, s.mean),
      });
      done += 1;
      statusEl.textContent = `Progress ${done}/${total}: ${formula.id} / ${variant.id}`;
      renderTable(latestRows);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  const markdown = toMarkdown(latestRows);
  mdOutput.textContent = markdown;
  console.table(latestRows);
  statusEl.textContent = `Done. ${latestRows.length} rows generated.`;
  jsonBtn.disabled = false;
  csvBtn.disabled = false;
  mdBtn.disabled = false;
  runBtn.disabled = false;
}

runBtn.addEventListener("click", () => {
  runAll().catch((error) => {
    console.error(error);
    statusEl.textContent = `Error: ${error?.message || error}`;
    runBtn.disabled = false;
  });
});

jsonBtn.addEventListener("click", () => {
  const payload = toJsonPayload(latestRows, latestMeta);
  download("benchmark-results.json", JSON.stringify(payload, null, 2), "application/json");
});
csvBtn.addEventListener("click", () => download("benchmark-results.csv", toCsv(latestRows), "text/csv"));
mdBtn.addEventListener("click", () => download("benchmark-results.md", toMarkdown(latestRows), "text/markdown"));
