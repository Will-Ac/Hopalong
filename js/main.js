import { ColorMapNames, sampleColorMap } from "./colormaps.js";
import { renderFrame, getParamsForFormula } from "./renderer.js";

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const canvas = document.getElementById("c");
const toastEl = document.getElementById("toast");
const formulaBtn = document.getElementById("formulaBtn");
const cmapBtn = document.getElementById("cmapBtn");
const debugOnEl = document.getElementById("debugOn");
const debugOffEl = document.getElementById("debugOff");
const debugInfoEl = document.getElementById("debugInfo");
const debugPanelEl = document.getElementById("debugPanel");

const quickSliderOverlay = document.getElementById("quickSliderOverlay");
const quickSliderBackdrop = document.getElementById("quickSliderBackdrop");
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
let holdInterval = null;
let lastRenderMeta = null;
let lastDrawTimestamp = 0;
let fpsEstimate = 0;
let drawScheduled = false;
let drawDirty = false;
let toastTimer = null;

const MICRO_STEP = 0.0001;
const HOLD_REPEAT_MS = 70;
const HOLD_ACCEL_START_MS = 2000;
const HOLD_ACCEL_END_MS = 3000;
const HOLD_MAX_MULTIPLIER = 10;

function requestDraw() {
  drawDirty = true;
  if (drawScheduled) {
    return;
  }

  drawScheduled = true;
  window.requestAnimationFrame(() => {
    drawScheduled = false;
    if (!drawDirty) {
      return;
    }

    drawDirty = false;
    draw();
  });
}

function showToast(message) {
  if (!toastEl) {
    return;
  }

  window.clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");

  toastTimer = window.setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, 5000);
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
    control.button.textContent = params[control.paramKey].toFixed(4);
  }

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  formulaBtn.textContent = formula?.name || currentFormulaId;
  cmapBtn.textContent = appData.defaults.cmapName;
}

function closeQuickSlider() {
  activeSliderKey = null;
  quickSliderOverlay.classList.remove("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "true");
}

function closePicker() {
  activePicker = null;
  activePickerTrigger = null;
  pickerOverlay.classList.remove("is-open");
  pickerOverlay.setAttribute("aria-hidden", "true");
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
      requestDraw();
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
      requestDraw();
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
  qsValue.textContent = actualValue === null ? "--" : actualValue.toFixed(4);
}

function applySliderValue(nextValue) {
  if (!activeSliderKey) {
    return;
  }

  const value = clamp(nextValue, 0, 100);
  appData.defaults.sliders[activeSliderKey] = value;
  qsRange.value = value;
  updateQuickSliderReadout();
  requestDraw();
}

function openQuickSlider(sliderKey) {
  activeSliderKey = sliderKey;
  quickSliderOverlay.classList.add("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "false");

  qsRange.value = appData.defaults.sliders[sliderKey];
  updateQuickSliderReadout();
}

function clearStepHold() {
  if (holdInterval) {
    window.clearInterval(holdInterval);
    holdInterval = null;
  }
}

function stepActiveSlider(direction) {
  if (!activeSliderKey) {
    return;
  }

  applySliderValue(appData.defaults.sliders[activeSliderKey] + direction * MICRO_STEP);
}

function getHoldStepSize(holdElapsedMs) {
  if (holdElapsedMs < HOLD_ACCEL_START_MS) {
    return MICRO_STEP;
  }

  if (holdElapsedMs >= HOLD_ACCEL_END_MS) {
    return MICRO_STEP * HOLD_MAX_MULTIPLIER;
  }

  const accelProgress = (holdElapsedMs - HOLD_ACCEL_START_MS) / (HOLD_ACCEL_END_MS - HOLD_ACCEL_START_MS);
  const growth = Math.pow(HOLD_MAX_MULTIPLIER, accelProgress);
  return MICRO_STEP * growth;
}

function stepActiveSliderBy(direction, stepSize) {
  if (!activeSliderKey) {
    return;
  }

  applySliderValue(appData.defaults.sliders[activeSliderKey] + direction * stepSize);
}

function setupStepHold(button, direction) {
  const startHold = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearStepHold();

    const holdStartMs = performance.now();
    stepActiveSlider(direction);

    holdInterval = window.setInterval(() => {
      const holdElapsedMs = performance.now() - holdStartMs;
      const holdStepSize = getHoldStepSize(holdElapsedMs);
      stepActiveSliderBy(direction, holdStepSize);
    }, HOLD_REPEAT_MS);
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

function axisScreenPosition(worldMin, worldMax, spanPx) {
  if (worldMin <= 0 && worldMax >= 0) {
    return ((0 - worldMin) / (worldMax - worldMin)) * spanPx;
  }

  return Math.abs(worldMin) <= Math.abs(worldMax) ? 0 : spanPx;
}

function drawDebugOverlay(meta) {
  if (!appData.defaults.debug || !meta) {
    debugInfoEl.textContent = "Debug off";
    debugPanelEl.classList.add("is-hidden");
    return;
  }

  debugPanelEl.classList.remove("is-hidden");

  const { view, world } = meta;
  const xAxisY = axisScreenPosition(world.minY, world.maxY, view.height);
  const yAxisX = axisScreenPosition(world.minX, world.maxX, view.width);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1;
  ctx.font = "12px system-ui, sans-serif";

  ctx.beginPath();
  ctx.moveTo(0, xAxisY);
  ctx.lineTo(view.width, xAxisY);
  ctx.moveTo(yAxisX, 0);
  ctx.lineTo(yAxisX, view.height);
  ctx.stroke();

  const tickCount = 10;
  for (let index = 0; index < tickCount; index += 1) {
    const t = index / (tickCount - 1);

    const xTick = t * view.width;
    const xValue = world.minX + t * (world.maxX - world.minX);
    ctx.beginPath();
    ctx.moveTo(xTick, xAxisY - 5);
    ctx.lineTo(xTick, xAxisY + 5);
    ctx.stroke();
    ctx.fillText(xValue.toFixed(3), xTick + 3, xAxisY - 8);

    const yTick = t * view.height;
    const yValue = world.minY + t * (world.maxY - world.minY);
    ctx.beginPath();
    ctx.moveTo(yAxisX - 5, yTick);
    ctx.lineTo(yAxisX + 5, yTick);
    ctx.stroke();
    ctx.fillText(yValue.toFixed(3), yAxisX + 7, yTick - 3);
  }

  ctx.restore();

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  const params = getDerivedParams();
  const centerX = (world.minX + world.maxX) / 2;
  const centerY = (world.minY + world.maxY) / 2;

  debugInfoEl.textContent = [
    `formula: ${formula?.name || currentFormulaId}`,
    `a: ${params.a.toFixed(6)}`,
    `b: ${params.b.toFixed(6)}`,
    `c: ${params.c.toFixed(6)}`,
    `d: ${params.d.toFixed(6)}`,
    `iterations: ${meta.iterations}`,
    "seeds/orbits: 1",
    `x range: ${world.minX.toFixed(3)} to ${world.maxX.toFixed(3)}`,
    `y range: ${world.minY.toFixed(3)} to ${world.maxY.toFixed(3)}`,
    `range centre: (${centerX.toFixed(3)}, ${centerY.toFixed(3)})`,
    `fps: ${fpsEstimate.toFixed(1)}`,
  ].join("\n");
}

function draw() {
  if (!appData || !currentFormulaId) {
    return;
  }

  const startedAt = performance.now();
  const didResize = resizeCanvas();
  const iterations = didResize ? 100000 : 120000;
  const frameMeta = renderFrame({
    ctx,
    canvas,
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations,
  });

  const now = performance.now();
  const delta = lastDrawTimestamp > 0 ? now - lastDrawTimestamp : 0;
  if (delta > 0) {
    const instantFps = 1000 / delta;
    fpsEstimate = fpsEstimate === 0 ? instantFps : fpsEstimate * 0.85 + instantFps * 0.15;
  }
  lastDrawTimestamp = now;

  lastRenderMeta = {
    ...frameMeta,
    iterations,
    renderMs: now - startedAt,
  };

  drawDebugOverlay(lastRenderMeta);
  refreshParamButtons();
  updateQuickSliderReadout();

}

function registerHandlers() {
  formulaBtn.addEventListener("click", () => openPicker("formula", formulaBtn));
  cmapBtn.addEventListener("click", () => openPicker("cmap", cmapBtn));
  pickerClose.addEventListener("click", closePicker);
  pickerBackdrop.addEventListener("click", closePicker);
  debugOnEl.addEventListener("change", () => {
    appData.defaults.debug = debugOnEl.checked;
    requestDraw();
  });
  debugOffEl.addEventListener("change", () => {
    appData.defaults.debug = debugOnEl.checked;
    requestDraw();
  });

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
  quickSliderBackdrop.addEventListener("click", () => {
    closeQuickSlider();
  });

  qsRange.addEventListener("input", () => {
    applySliderValue(Number.parseFloat(qsRange.value));
  });

  setupStepHold(qsMinus, -1);
  setupStepHold(qsPlus, 1);

  window.addEventListener(
    "resize",
    () => {
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      requestDraw();
    },
    { passive: true },
  );
  window.addEventListener(
    "orientationchange",
    () => {
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      requestDraw();
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
  if (typeof data.defaults.debug !== "boolean") {
    data.defaults.debug = false;
  }

  if (!Array.isArray(data.formulas) || data.formulas.length === 0) {
    throw new Error("Data file has no formulas. Expected at least one formula option.");
  }

  const configuredColormaps = Array.isArray(data.colormaps) ? data.colormaps : [];
  const validConfigured = configuredColormaps.filter((name) => ColorMapNames.includes(name));
  const missingFromConfig = ColorMapNames.filter((name) => !validConfigured.includes(name));
  data.colormaps = [...validConfigured, ...missingFromConfig];

  if (data.colormaps.length === 0) {
    throw new Error("No valid colormaps found. Expected at least one colormap option.");
  }

  return data;
}

async function bootstrap() {
  try {
    installGlobalZoomBlockers();
    appData = await loadData();

    currentFormulaId = resolveInitialFormulaId();
    appData.defaults.cmapName = resolveInitialColorMap();
    debugOnEl.checked = Boolean(appData.defaults.debug);
    debugOffEl.checked = !debugOnEl.checked;

    registerHandlers();
    requestDraw();
    const formula = appData.formulas.find((item) => item.id === currentFormulaId);
    showToast(`Loaded ${formula?.name || currentFormulaId}. Slice 2.1 controls ready.`);
  } catch (error) {
    console.error(error);
    showToast(`Startup failed: ${error.message}`);
  }
}

bootstrap();
