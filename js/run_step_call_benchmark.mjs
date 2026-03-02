import { benchmarkStepCallOverhead } from "./renderer.js";
import { FORMULA_DEFAULT_PRESETS, FORMULA_DEFAULT_SEEDS } from "./formulas.js";
import { writeFileSync } from "node:fs";

const iterationsArg = Number(process.argv[2]);
const outputPath = process.argv[3] || "./data/step_call_overhead_benchmark.json";
const iterations = Number.isFinite(iterationsArg) && iterationsArg > 0 ? Math.floor(iterationsArg) : 1_000_000;

const results = benchmarkStepCallOverhead({
  iterations,
  paramsByFormulaId: FORMULA_DEFAULT_PRESETS,
  seedByFormulaId: FORMULA_DEFAULT_SEEDS,
});

const payload = {
  benchmarkType: "step_call_overhead_ab",
  iterations,
  generatedAt: new Date().toISOString(),
  results,
};

writeFileSync(outputPath, JSON.stringify(payload, null, 2));

const top = [...results]
  .sort((a, b) => b.deltaPct - a.deltaPct)
  .slice(0, 5)
  .map((row) => `${row.formulaId}: ${row.deltaPct.toFixed(2)}%`)
  .join("\n");

console.log(`Saved ${results.length} formulas to ${outputPath}`);
console.log(`Iterations per formula: ${iterations}`);
console.log("Top 5 speedups (B vs A):");
console.log(top);
