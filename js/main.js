import { sampleColorMap } from "./colormaps.js";
import { renderFrame, getParamsForFormula } from "./renderer.js";

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const appEl = document.getElementById("app");
const canvas = document.getElementById("c");
const statusEl = document.getElementById("status");
const formulaSelect = document.getElementById("formulaSelect");
const cmapSelect = document.getElementById("cmapSelect");
const cmapPreviewName = document.getElementById("cmapPreviewName");
const cmapPreviewBar = document.getElementById("cmapPreviewBar");
const ctx = canvas.getContext("2d", { alpha: false });

const quickSlider = document.getElementById("quickSlider");
const qsLabel = document.getElementById("qsLabel");
const qsValue = document.getElementById("qsValue");
const qsRange = document.getElementById("qsRange");
const qsClose = document.getElementById("qsClose");

const sliderButtons = {
  alpha: document.getElementById("btnAlpha"),
  beta: document.getElementById("btnBeta"),
  gamma: document.getElementById("btnGamma"),
  delta: document.getElementById("btnDelta"),
};

const sliderLabelMap = {
  alpha: "α / a",
  beta: "β / b",
  gamma: "γ / d",
  delta: "δ / c",
};

let appData = null;
let currentFormulaId = null;
let activeSliderKey = null;
let activeSliderButton = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function installGlobalZoomBlockers() {
  document.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "dblclick",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd < 350) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCurrentFormulaRange() {
  return appData.formula_ranges_raw[currentFormulaId] || null;
}

function getDerivedParams() {
  return getParamsForFormula({
    rangesForFormula: getCurrentFormulaRange(),
    sliderDefaults: appData.defaults.sliders,
  });
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

function populateColorMapSelect(colormaps) {
  cmapSelect.innerHTML = "";
  for (const cmapName of colormaps) {
    const option = document.createElement("option");
    option.value = cmapName;
    option.textContent = cmapName;
    cmapSelect.append(option);
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

function resolveInitialColorMap() {
  const names = new Set(appData.colormaps || []);
  if (names.has(appData.defaults.cmapName)) {
    return appData.defaults.cmapName;
  }

  return appData.colormaps[0];
}

function formatSliderButton(normalized, actual) {
  return `${normalized.toFixed(1)}% (${actual.toFixed(2)})`;
}

function buildColorMapGradient(cmapName) {
  const stops = [];
  const count = 9;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const [r, g, b] = sampleColorMap(cmapName, t);
    stops.push(`rgb(${r}, ${g}, ${b}) ${Math.round(t * 100)}%`);
  }

  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function refreshColorMapPreview() {
  const name = appData.defaults.cmapName;
  cmapPreviewName.textContent = name;
  cmapPreviewBar.style.background = buildColorMapGradient(name);
}

function refreshParamButtons() {
  const params = getDerivedParams();
  sliderButtons.alpha.textContent = formatSliderButton(appData.defaults.sliders.alpha, params.a);
  sliderButtons.beta.textContent = formatSliderButton(appData.defaults.sliders.beta, params.b);
  sliderButtons.gamma.textContent = formatSliderButton(appData.defaults.sliders.gamma, params.d);
  sliderButtons.delta.textContent = formatSliderButton(appData.defaults.sliders.delta, params.c);
}

function positionQuickSlider(anchorButton) {
  if (!anchorButton || !quickSlider.classList.contains("is-open")) {
    return;
  }

  const appRect = appEl.getBoundingClientRect();
  const buttonRect = anchorButton.getBoundingClientRect();

  quickSlider.style.width = `${Math.round(buttonRect.width)}px`;

  const sliderHeight = quickSlider.offsetHeight;
  const horizontalInset = 10;
  const verticalGap = 8;

  let left = buttonRect.left - appRect.left;
  left = clamp(left, horizontalInset, appRect.width - buttonRect.width - horizontalInset);

  let top = buttonRect.top - appRect.top - sliderHeight - verticalGap;
  if (top < horizontalInset) {
    top = buttonRect.bottom - appRect.top + verticalGap;
  }

  quickSlider.style.left = `${Math.round(left)}px`;
  quickSlider.style.top = `${Math.round(top)}px`;
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
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations: didResize ? 100000 : 120000,
  });

  refreshParamButtons();
  refreshColorMapPreview();

  if (activeSliderButton) {
    positionQuickSlider(activeSliderButton);
  }

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  setStatus(`Loaded ${formula?.name || currentFormulaId}. Slice 2 sliders ready.`);
}

function openQuickSlider(sliderKey) {
  activeSliderKey = sliderKey;
  activeSliderButton = sliderButtons[sliderKey];

  quickSlider.classList.add("is-open");
  quickSlider.setAttribute("aria-hidden", "false");

  const currentValue = appData.defaults.sliders[sliderKey];
  qsRange.value = currentValue;
  qsLabel.textContent = `${sliderLabelMap[sliderKey]}`;
  qsValue.textContent = `${currentValue.toFixed(1)}%`;

  requestAnimationFrame(() => {
    positionQuickSlider(activeSliderButton);
  });
}

function closeQuickSlider() {
  activeSliderKey = null;
  activeSliderButton = null;
  quickSlider.classList.remove("is-open");
  quickSlider.setAttribute("aria-hidden", "true");
  quickSlider.style.left = "";
  quickSlider.style.top = "";
  quickSlider.style.width = "";
}

function registerSliderButtonHandlers() {
  for (const [sliderKey, button] of Object.entries(sliderButtons)) {
    button.addEventListener("click", () => {
      openQuickSlider(sliderKey);
    });
  }

  qsRange.addEventListener("input", () => {
    if (!activeSliderKey) {
      return;
    }

    const value = clamp(Number.parseFloat(qsRange.value), 0, 100);
    appData.defaults.sliders[activeSliderKey] = value;
    qsValue.textContent = `${value.toFixed(1)}%`;
    draw();
  });

  qsClose.addEventListener("click", closeQuickSlider);
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

  if (!Array.isArray(data.colormaps) || data.colormaps.length === 0) {
    throw new Error("Data file has no colormaps. Expected at least one colormap option.");
  }

  return data;
}

async function bootstrap() {
  try {
    installGlobalZoomBlockers();
    appData = await loadData();

    populateFormulaSelect(appData.formulas);
    populateColorMapSelect(appData.colormaps);

    currentFormulaId = resolveInitialFormulaId();
    appData.defaults.cmapName = resolveInitialColorMap();

    formulaSelect.value = currentFormulaId;
    cmapSelect.value = appData.defaults.cmapName;

    formulaSelect.addEventListener("change", () => {
      currentFormulaId = formulaSelect.value;
      draw();
    });

    cmapSelect.addEventListener("change", () => {
      appData.defaults.cmapName = cmapSelect.value;
      draw();
    });

    registerSliderButtonHandlers();

    window.addEventListener("resize", draw, { passive: true });
    window.addEventListener("orientationchange", draw, { passive: true });

    draw();
  } catch (error) {
    console.error(error);
    setStatus(`Startup failed: ${error.message}`);
  }
}

bootstrap();
