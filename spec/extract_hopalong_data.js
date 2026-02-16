#!/usr/bin/env node
/**
 * Extracts formulas, ranges, and colormap names from a hopalong single-file HTML.
 * Usage: node extract_hopalong_data.js hopalongv124.html > hopalong_data.json
 */
const fs = require("fs");

const file = process.argv[2];
if (!file) { console.error("Usage: node extract_hopalong_data.js <file.html>"); process.exit(1); }
const txt = fs.readFileSync(file, "utf8");

function pick(re) {
  const m = txt.match(re);
  return m ? m[1] : null;
}

const rangesText = pick(/const\s+FORMULA_RANGES_RAW\s*=\s*(\{[\s\S]*?\});/);
let ranges = {};
if (rangesText) {
  ranges = JSON.parse(rangesText);
}

const formulas = [];
const reFormula = /\{\s*id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"\s*,\s*desc:\s*"([^"]*)"/g;
let m;
while ((m = reFormula.exec(txt))) {
  formulas.push({ id: m[1], name: m[2], desc: m[3] });
}

const cmBlock = pick(/const\s+ColorMaps\s*=\s*\{([\s\S]*?)\n\s*\};/);
const colormaps = [];
if (cmBlock) {
  const reCM = /"([^"]+)"\s*:\s*\(t\)\s*=>/g;
  while ((m = reCM.exec(cmBlock))) colormaps.push(m[1]);
}

const out = {
  version_source: file,
  formulas,
  formula_ranges_raw: ranges,
  colormaps,
  parameter_keys: ["formula","cmap","a","b","c","d","orbits","iters","burn","rangeR","initR"],
  state_values: ["rand","fix","manx","many"]
};

process.stdout.write(JSON.stringify(out, null, 2));
