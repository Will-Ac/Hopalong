import { sampleColorMap } from "./colormaps.js";
import { renderFrame, getParamsForFormula } from "./renderer.js";

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const canvas = document.getElementById("c");
const statusEl = document.getElementById("status");
const formulaBtn = document.getElementById("formulaBtn");
const cmapBtn = document.getElementById("cmapBtn");

const quickSlider = document.getElementById("quickSlider");
const qsLabel = document.getElementById("qsLabel");
const qsValue = document.getElementById("qsValue");
const qsRange = document.getElementById("qsRange");
const qsMinus = document.getElementById("qsMinus");
const qsPlus = document.getElementById("qsPlus");
const qsClose = document.getElementById("qsClose");

const pickerOverlay = document.getElementById("pickerOverlay");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const pickerTitle = document.getElementById("pickerTitle");
const pickerClose = document.getElementById("pickerClose");
const pickerList = document.getElementById("pickerList");
const pickerPanel = document.getElementById("pickerPanel");

const sliderControls = {
  alpha: { button: document.getElementById("btnAlpha"), label: "a", paramKey: "a" },
  beta: { button: document.getElementById("btnBeta"), label: "b", paramKey: "b" },
  delta: { button: document.getElementById("btnDelta"), label: "c", paramKey: "c" },
  gamma: { button: document.getElementById("btnGamma"), label: "d", paramKey: "d" },
};

const ctx = canvas.getContext("2d", { alpha: false });
let appData = null;
let currentFormulaId = null;
let activeSliderKey = null;
let activePicker = null;
let activePickerTrigger = null;
let holdTimer = null;
let holdInterval = null;

function setStatus(message) {
  statusEl.textContent = message;
}

function installGlobalZoomBlockers() {
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("dblclick", (event) => event.preventDefault(), { passive: false });
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

function resolveInitialFormulaId() {
  const ids = new Set(appData.formulas.map((formula) => formula.id));
  return ids.has(appData.defaults.formulaId) ? appData.defaults.formulaId : appData.formulas[0].id;
}

function resolveInitialColorMap() {
  const names = new Set(appData.colormaps || []);
  return names.has(appData.defaults.cmapName) ? appData.defaults.cmapName : appData.colormaps[0];
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

function getActiveActualValue() {
  if (!activeSliderKey) {
    return null;
  }
  const params = getDerivedParams();
  const control = sliderControls[activeSliderKey];
  return params[control.paramKey];
}

function refreshParamButtons() {
  const params = getDerivedParams();
  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    control.button.textContent = params[control.paramKey].toFixed(3);
  }

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  formulaBtn.textContent = formula?.name || currentFormulaId;
  cmapBtn.textContent = appData.defaults.cmapName;
}

function closeQuickSlider() {
  activeSliderKey = null;
  quickSlider.classList.remove("is-open");
  quickSlider.setAttribute("aria-hidden", "true");
}

function closePicker() {
  activePicker = null;
  activePickerTrigger = null;
  pickerOverlay.classList.remove("is-open");
  pickerOverlay.setAttribute("aria-hidden", "true");
}

function alignQuickSlider() {
  const firstTile = document.querySelector("#paramRow .poItem");
  if (!firstTile) {
    return;
  }

  const appRect = canvas.parentElement.getBoundingClientRect();
  const tileRect = firstTile.getBoundingClientRect();
  const bottomOffset = Math.max(0, appRect.bottom - tileRect.top);
  quickSlider.style.bottom = `${bottomOffset}px`;
}

function layoutPickerPanel() {
  if (!activePickerTrigger) {
    return;
  }

  const triggerRect = activePickerTrigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const margin = 12;
  const targetWidth = clamp(triggerRect.width * 3, 270, 480);
  const maxWidth = Math.max(270, viewportWidth - margin * 2);
  const width = Math.min(targetWidth, maxWidth);
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const left = clamp(triggerCenter - width / 2, margin, viewportWidth - margin - width);

  pickerPanel.style.width = `${width}px`;
  pickerPanel.style.left = `${left}px`;
  pickerPanel.style.transform = "none";
}

function renderFormulaPicker() {
  pickerTitle.textContent = "Select formula";
  pickerList.innerHTML = "";

  for (const formula of appData.formulas) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pickerOption";
    if (formula.id === currentFormulaId) {
      button.classList.add("is-selected");
    }

    const row = document.createElement("div");
    row.className = "formulaRow";

    const name = document.createElement("span");
    name.className = "formulaName";
    name.textContent = formula.name;

    const desc = document.createElement("span");
    desc.className = "formulaDesc";
    desc.textContent = formula.desc;

    row.append(name, desc);
    button.append(row);

    button.addEventListener("click", () => {
      currentFormulaId = formula.id;
      closePicker();
      draw();
    });

    pickerList.append(button);
  }
}

function renderColorMapPicker() {
  pickerTitle.textContent = "Select color map";
  pickerList.innerHTML = "";

  for (const cmapName of appData.colormaps) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pickerOption";
    if (cmapName === appData.defaults.cmapName) {
      button.classList.add("is-selected");
    }

    const row = document.createElement("div");
    row.className = "cmapRow";

    const name = document.createElement("span");
    name.textContent = cmapName;

    const bar = document.createElement("div");
    bar.className = "cmapBar";
    bar.style.background = buildColorMapGradient(cmapName);

    row.append(name, bar);
    button.append(row);

    button.addEventListener("click", () => {
      appData.defaults.cmapName = cmapName;
      closePicker();
      draw();
    });

    pickerList.append(button);
  }
}

function openPicker(kind, triggerEl) {
  activePicker = kind;
  activePickerTrigger = triggerEl;
  pickerOverlay.classList.add("is-open");
  pickerOverlay.setAttribute("aria-hidden", "false");

  if (kind === "formula") {
    renderFormulaPicker();
  } else {
    renderColorMapPicker();
  }

  layoutPickerPanel();
}

function updateQuickSliderReadout() {
  if (!activeSliderKey) {
    return;
  }
  const control = sliderControls[activeSliderKey];
  const actualValue = getActiveActualValue();
  qsLabel.textContent = control.label;
  qsValue.textContent = actualValue === null ? "--" : actualValue.toFixed(3);
}

function applySliderValue(nextValue) {
  if (!activeSliderKey) {
    return;
  }

  const value = clamp(nextValue, 0, 100);
  appData.defaults.sliders[activeSliderKey] = value;
  qsRange.value = value;
  updateQuickSliderReadout();
  draw();
}

function openQuickSlider(sliderKey) {
  activeSliderKey = sliderKey;
  quickSlider.classList.add("is-open");
  quickSlider.setAttribute("aria-hidden", "false");
  alignQuickSlider();

  qsRange.value = appData.defaults.sliders[sliderKey];
  updateQuickSliderReadout();
}

function clearStepHold() {
  if (holdTimer) {
    window.clearTimeout(holdTimer);
    holdTimer = null;
  }
  if (holdInterval) {
    window.clearInterval(holdInterval);
    holdInterval = null;
  }
}

function stepActiveSlider(direction) {
  if (!activeSliderKey) {
    return;
  }
  applySliderValue(appData.defaults.sliders[activeSliderKey] + direction * 0.001);
}

function setupStepHold(button, direction) {
  const startHold = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearStepHold();
    stepActiveSlider(direction);
    holdTimer = window.setTimeout(() => {
      holdInterval = window.setInterval(() => {
        stepActiveSlider(direction);
      }, 70);
    }, 250);
  };

  const stopHold = () => {
    clearStepHold();
  };

  if (window.PointerEvent) {
    button.addEventListener("pointerdown", startHold);
    button.addEventListener("pointerup", stopHold);
    button.addEventListener("pointercancel", stopHold);
    button.addEventListener("pointerleave", stopHold);
  } else {
    button.addEventListener("touchstart", startHold, { passive: false });
    button.addEventListener("touchend", stopHold, { passive: false });
    button.addEventListener("touchcancel", stopHold, { passive: false });
    button.addEventListener("mousedown", startHold);
    button.addEventListener("mouseup", stopHold);
    button.addEventListener("mouseleave", stopHold);
  }

  button.addEventListener("contextmenu", (event) => event.preventDefault());
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
  updateQuickSliderReadout();

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  setStatus(`Loaded ${formula?.name || currentFormulaId}. Slice 2.1 controls ready.`);
}

function registerHandlers() {
  formulaBtn.addEventListener("click", () => openPicker("formula", formulaBtn));
  cmapBtn.addEventListener("click", () => openPicker("cmap", cmapBtn));
  pickerClose.addEventListener("click", closePicker);
  pickerBackdrop.addEventListener("click", closePicker);

  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    control.button.addEventListener("click", () => openQuickSlider(sliderKey));
  }

  const closeSliderFromUi = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeQuickSlider();
  };
  qsClose.addEventListener("click", closeSliderFromUi);
  qsClose.addEventListener("pointerup", closeSliderFromUi);
  qsClose.addEventListener("touchend", closeSliderFromUi, { passive: false });

  qsRange.addEventListener("input", () => {
    applySliderValue(Number.parseFloat(qsRange.value));
  });

  setupStepHold(qsMinus, -1);
  setupStepHold(qsPlus, 1);

  window.addEventListener(
    "resize",
    () => {
      if (quickSlider.classList.contains("is-open")) {
        alignQuickSlider();
      }
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      draw();
    },
    { passive: true },
  );
  window.addEventListener(
    "orientationchange",
    () => {
      if (quickSlider.classList.contains("is-open")) {
        alignQuickSlider();
      }
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      draw();
    },
    { passive: true },
  );
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

    currentFormulaId = resolveInitialFormulaId();
    appData.defaults.cmapName = resolveInitialColorMap();

    registerHandlers();
    draw();
  } catch (error) {
    console.error(error);
    setStatus(`Startup failed: ${error.message}`);
  }
}

bootstrap();
