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
const quickSliderEl = document.getElementById("quickSlider");
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
const paramOverlayEl = document.getElementById("paramOverlay");
const cameraBtn = document.getElementById("cameraBtn");

const sliderControls = {
  alpha: { button: document.getElementById("btnAlpha"), label: "a", paramKey: "a", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  beta: { button: document.getElementById("btnBeta"), label: "b", paramKey: "b", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  delta: { button: document.getElementById("btnDelta"), label: "c", paramKey: "c", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  gamma: { button: document.getElementById("btnGamma"), label: "d", paramKey: "d", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  iters: { button: document.getElementById("btnIters"), label: "iter", paramKey: "iters", min: 1000, max: 240000, sliderStep: 100, stepSize: 100, displayDp: 0 },
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
let cameraPressTimer = null;
let longPressConsumed = false;

const HOLD_REPEAT_MS = 70;
const HOLD_ACCEL_START_MS = 2000;
const HOLD_ACCEL_END_MS = 3000;
const HOLD_MAX_MULTIPLIER = 10;
const CAMERA_LONG_PRESS_MS = 550;

function getScreenshotFileName(withOverlay) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `hopalong-${withOverlay ? "overlay" : "clean"}-${stamp}.png`;
}

function buildOverlaySummary() {
  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  const params = getDerivedParams();
  return [
    `formula: ${formula?.name || currentFormulaId}`,
    `cmap: ${appData.defaults.cmapName}`,
    `a=${params.a.toFixed(4)}`,
    `b=${params.b.toFixed(4)}`,
    `c=${params.c.toFixed(4)}`,
    `d=${params.d.toFixed(4)}`,
    `iter=${Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max))}`,
  ];
}

function blobFromCanvas(sourceCanvas) {
  return new Promise((resolve, reject) => {
    sourceCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not encode screenshot."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

async function saveImageBlob(blob, fileName) {
  const shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof File !== "undefined";
  if (shareSupported) {
    const file = new File([blob], fileName, { type: "image/png" });
    const canShareFile = typeof navigator.canShare === "function" ? navigator.canShare({ files: [file] }) : true;
    if (canShareFile) {
      await navigator.share({
        files: [file],
        title: "Hopalong screenshot",
        text: "Screenshot from Hopalong",
      });
      return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function createOverlayScreenshotCanvas() {
  const shotCanvas = createCleanScreenshotCanvas();
  const shotCtx = shotCanvas.getContext("2d", { alpha: false });

  const lines = buildOverlaySummary();
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const padX = Math.round(16 * dpr);
  const padY = Math.round(12 * dpr);
  const lineHeight = Math.round(18 * dpr);
  const blockHeight = padY * 2 + lines.length * lineHeight;
  const panelY = shotCanvas.height - blockHeight;

  shotCtx.fillStyle = "rgba(6, 8, 12, 0.72)";
  shotCtx.fillRect(0, panelY, shotCanvas.width, blockHeight);
  shotCtx.font = `${Math.round(14 * dpr)}px system-ui, -apple-system, sans-serif`;
  shotCtx.fillStyle = "rgba(245, 248, 255, 0.96)";
  shotCtx.textBaseline = "top";

  for (const [lineIndex, lineText] of lines.entries()) {
    shotCtx.fillText(lineText, padX, panelY + padY + lineIndex * lineHeight);
  }

  return shotCanvas;
}

function createCleanScreenshotCanvas() {
  const shotCanvas = document.createElement("canvas");
  shotCanvas.width = canvas.width;
  shotCanvas.height = canvas.height;
  const shotCtx = shotCanvas.getContext("2d", { alpha: false });
  const iterationSetting = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));

  renderFrame({
    ctx: shotCtx,
    canvas: shotCanvas,
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations: iterationSetting,
  });

  return shotCanvas;
}

async function captureScreenshot({ withOverlay }) {
  if (!appData) {
    return;
  }

  try {
    const outputCanvas = withOverlay ? createOverlayScreenshotCanvas() : createCleanScreenshotCanvas();
    const blob = await blobFromCanvas(outputCanvas);
    await saveImageBlob(blob, getScreenshotFileName(withOverlay));
    showToast(withOverlay ? "Screenshot with parameter overlay saved." : "Clean screenshot saved.");
  } catch (error) {
    if (error?.name === "AbortError") {
      showToast("Screenshot share cancelled.");
      return;
    }
    console.error(error);
    showToast(`Screenshot failed: ${error?.message || "unknown error"}`);
  }
}

function clearCameraPressTimer() {
  if (cameraPressTimer) {
    window.clearTimeout(cameraPressTimer);
    cameraPressTimer = null;
  }
}

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

  return getControlValue(activeSliderKey);
}

function getControlValue(sliderKey) {
  const control = sliderControls[sliderKey];
  if (control.paramKey === "iters") {
    return appData.defaults.sliders.iters;
  }

  const params = getDerivedParams();
  return params[control.paramKey];
}

function formatControlValue(control, value) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(control.displayDp ?? 4);
}

function refreshParamButtons() {
  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    control.button.textContent = formatControlValue(control, getControlValue(sliderKey));
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

function alignQuickSliderAboveBottomBar() {
  if (!paramOverlayEl || !quickSliderEl) {
    return;
  }

  const overlayRect = paramOverlayEl.getBoundingClientRect();
  const overlayHeight = Math.max(0, window.innerHeight - overlayRect.top);
  quickSliderEl.style.bottom = `${overlayHeight + 6}px`;
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
  const margin = 6;
  const targetWidth = clamp(triggerRect.width * 3.6, 300, 620);
  const maxWidth = Math.max(300, viewportWidth - margin * 2);
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
  qsValue.textContent = formatControlValue(control, actualValue);
}

function applySliderValue(nextValue) {
  if (!activeSliderKey) {
    return;
  }

  const control = sliderControls[activeSliderKey];
  const value = clamp(nextValue, control.min, control.max);
  appData.defaults.sliders[activeSliderKey] = value;
  qsRange.value = value;
  updateQuickSliderReadout();
  requestDraw();
}

function openQuickSlider(sliderKey) {
  activeSliderKey = sliderKey;
  quickSliderOverlay.classList.add("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "false");
  alignQuickSliderAboveBottomBar();

  const control = sliderControls[sliderKey];
  qsRange.min = String(control.min);
  qsRange.max = String(control.max);
  qsRange.step = String(control.sliderStep);
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

  const control = sliderControls[activeSliderKey];
  applySliderValue(appData.defaults.sliders[activeSliderKey] + direction * control.stepSize);
}

function getHoldStepSize(holdElapsedMs) {
  if (!activeSliderKey) {
    return 0;
  }

  const baseStep = sliderControls[activeSliderKey].stepSize;
  if (holdElapsedMs < HOLD_ACCEL_START_MS) {
    return baseStep;
  }

  if (holdElapsedMs >= HOLD_ACCEL_END_MS) {
    return baseStep * HOLD_MAX_MULTIPLIER;
  }

  const accelProgress = (holdElapsedMs - HOLD_ACCEL_START_MS) / (HOLD_ACCEL_END_MS - HOLD_ACCEL_START_MS);
  const growth = Math.pow(HOLD_MAX_MULTIPLIER, accelProgress);
  return baseStep * growth;
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

function getNiceTickStep(span, targetTicks) {
  const roughStep = span / Math.max(1, targetTicks);
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(roughStep, Number.EPSILON)));
  const residual = roughStep / magnitude;

  if (residual <= 1) {
    return magnitude;
  }
  if (residual <= 2) {
    return 2 * magnitude;
  }
  if (residual <= 2.5) {
    return 2.5 * magnitude;
  }
  if (residual <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

function buildTickValues(min, max, spanPx) {
  const span = Math.max(max - min, Number.EPSILON);
  const targetTicks = clamp(Math.round(spanPx / 65), 10, 20);
  const step = getNiceTickStep(span, targetTicks);
  const start = Math.ceil(min / step) * step;
  const values = [];

  for (let value = start; value <= max + step * 0.5; value += step) {
    const rounded = Number.parseFloat(value.toFixed(12));
    values.push(rounded);
  }

  return { step, values };
}

function formatTickValue(value, step) {
  let decimals = 0;
  while (decimals < 6 && Math.abs(Math.round(step * 10 ** decimals) - step * 10 ** decimals) > 1e-8) {
    decimals += 1;
  }

  const clamped = Number.parseFloat(value.toFixed(decimals));
  return clamped.toFixed(decimals);
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
  const xTicks = buildTickValues(world.minX, world.maxX, view.width);
  const yTicks = buildTickValues(world.minY, world.maxY, view.height);
  const minorXStep = xTicks.step / 2;
  const minorYStep = yTicks.step / 2;
  const showMinorX = ((world.maxX - world.minX) / minorXStep) <= 40;
  const showMinorY = ((world.maxY - world.minY) / minorYStep) <= 40;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "12px system-ui, sans-serif";

  if (showMinorX || showMinorY) {
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (showMinorX) {
      const start = Math.ceil(world.minX / minorXStep) * minorXStep;
      for (let value = start; value <= world.maxX + minorXStep * 0.5; value += minorXStep) {
        const px = ((value - world.minX) / (world.maxX - world.minX)) * view.width;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, view.height);
      }
    }

    if (showMinorY) {
      const start = Math.ceil(world.minY / minorYStep) * minorYStep;
      for (let value = start; value <= world.maxY + minorYStep * 0.5; value += minorYStep) {
        const py = ((value - world.minY) / (world.maxY - world.minY)) * view.height;
        ctx.moveTo(0, py);
        ctx.lineTo(view.width, py);
      }
    }

    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const xValue of xTicks.values) {
    const xTick = ((xValue - world.minX) / (world.maxX - world.minX)) * view.width;
    ctx.moveTo(xTick, 0);
    ctx.lineTo(xTick, view.height);
  }
  for (const yValue of yTicks.values) {
    const yTick = ((yValue - world.minY) / (world.maxY - world.minY)) * view.height;
    ctx.moveTo(0, yTick);
    ctx.lineTo(view.width, yTick);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, xAxisY);
  ctx.lineTo(view.width, xAxisY);
  ctx.moveTo(yAxisX, 0);
  ctx.lineTo(yAxisX, view.height);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1;
  for (const xValue of xTicks.values) {
    const xTick = ((xValue - world.minX) / (world.maxX - world.minX)) * view.width;
    ctx.beginPath();
    ctx.moveTo(xTick, xAxisY - 5);
    ctx.lineTo(xTick, xAxisY + 5);
    ctx.stroke();
    ctx.fillText(formatTickValue(xValue, xTicks.step), xTick + 3, xAxisY - 8);
  }

  for (const yValue of yTicks.values) {
    const yTick = ((yValue - world.minY) / (world.maxY - world.minY)) * view.height;
    ctx.beginPath();
    ctx.moveTo(yAxisX - 5, yTick);
    ctx.lineTo(yAxisX + 5, yTick);
    ctx.stroke();
    ctx.fillText(formatTickValue(yValue, yTicks.step), yAxisX + 7, yTick - 3);
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
  const iterationSetting = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  const iterations = didResize ? Math.min(iterationSetting, 100000) : iterationSetting;
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

  const onCameraPressStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCameraPressTimer();
    longPressConsumed = false;
    cameraBtn.classList.add("is-pressed");

    cameraPressTimer = window.setTimeout(() => {
      longPressConsumed = true;
      cameraBtn.classList.remove("is-pressed");
      captureScreenshot({ withOverlay: true });
    }, CAMERA_LONG_PRESS_MS);
  };

  const onCameraPressEnd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCameraPressTimer();
    cameraBtn.classList.remove("is-pressed");

    if (!longPressConsumed) {
      captureScreenshot({ withOverlay: false });
    }
  };

  const onCameraPressCancel = (event) => {
    event.preventDefault();
    clearCameraPressTimer();
    cameraBtn.classList.remove("is-pressed");
    longPressConsumed = false;
  };

  if (window.PointerEvent) {
    cameraBtn.addEventListener("pointerdown", onCameraPressStart);
    cameraBtn.addEventListener("pointerup", onCameraPressEnd);
    cameraBtn.addEventListener("pointercancel", onCameraPressCancel);
    cameraBtn.addEventListener("pointerleave", onCameraPressCancel);
  } else {
    cameraBtn.addEventListener("touchstart", onCameraPressStart, { passive: false });
    cameraBtn.addEventListener("touchend", onCameraPressEnd, { passive: false });
    cameraBtn.addEventListener("touchcancel", onCameraPressCancel, { passive: false });
    cameraBtn.addEventListener("mousedown", onCameraPressStart);
    cameraBtn.addEventListener("mouseup", onCameraPressEnd);
    cameraBtn.addEventListener("mouseleave", onCameraPressCancel);
  }

  cameraBtn.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener(
    "resize",
    () => {
      if (quickSliderOverlay.classList.contains("is-open")) {
        alignQuickSliderAboveBottomBar();
      }
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
      if (quickSliderOverlay.classList.contains("is-open")) {
        alignQuickSliderAboveBottomBar();
      }
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

  if (typeof data.defaults.sliders?.iters !== "number") {
    data.defaults.sliders = {
      ...(data.defaults.sliders || {}),
      iters: 8000,
    };
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
