import { renderFrame, getParamsForFormula } from "./renderer.js";

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const canvas = document.getElementById("c");
const statusEl = document.getElementById("status");
const formulaSelect = document.getElementById("formulaSelect");
const ctx = canvas.getContext("2d", { alpha: false });

let appData = null;
let currentFormulaId = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }

  return false;
}

function populateFormulaSelect(formulas) {
  formulaSelect.innerHTML = "";
  for (const formula of formulas) {
    const option = document.createElement("option");
    option.value = formula.id;
    option.textContent = formula.name;
    formulaSelect.append(option);
  }
}

function resolveInitialFormulaId() {
  const ids = new Set(appData.formulas.map((formula) => formula.id));
  const preferred = appData.defaults.formulaId;
  if (ids.has(preferred)) {
    return preferred;
  }

  return appData.formulas[0].id;
}

function getCurrentFormulaRange() {
  return appData.formula_ranges_raw[currentFormulaId] || null;
}

function draw() {
  if (!appData || !currentFormulaId) {
    return;
  }

  const didResize = resizeCanvas();

  renderFrame({
    ctx,
    canvas,
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName || appData.colormaps[0],
    params: getParamsForFormula({
      rangesForFormula: getCurrentFormulaRange(),
      sliderDefaults: appData.defaults.sliders,
    }),
    iterations: didResize ? 100000 : 120000,
  });

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  setStatus(`Loaded ${formula?.name || currentFormulaId}. Slice 1 ready.`);
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json();
}

async function loadData() {
  const [data, defaults] = await Promise.all([fetchJson(DATA_PATH), fetchJson(DEFAULTS_PATH)]);
  data.defaults = defaults;

  if (!Array.isArray(data.formulas) || data.formulas.length === 0) {
    throw new Error("Data file has no formulas. Expected at least one formula option.");
  }

  return data;
}

async function bootstrap() {
  try {
    appData = await loadData();
    populateFormulaSelect(appData.formulas);

    currentFormulaId = resolveInitialFormulaId();
    formulaSelect.value = currentFormulaId;

    formulaSelect.addEventListener("change", () => {
      currentFormulaId = formulaSelect.value;
      draw();
    });

    window.addEventListener("resize", draw, { passive: true });
    window.addEventListener("orientationchange", draw, { passive: true });

    draw();
  } catch (error) {
    console.error(error);
    setStatus(`Startup failed: ${error.message}`);
  }
}

bootstrap();
