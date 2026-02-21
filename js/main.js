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
const paramRowEl = document.getElementById("paramRow");
const cameraBtn = document.getElementById("cameraBtn");
const scaleModeBtn = document.getElementById("scaleModeBtn");
const randomModeBtn = document.getElementById("randomModeBtn");
const floatingActionsEl = document.getElementById("floatingActions");
const modePickerEl = document.getElementById("modePicker");
const modePickerRadios = Array.from(modePickerEl?.querySelectorAll('input[name="paramMode"]') || []);

const sliderControls = {
  alpha: { button: document.getElementById("btnAlpha"), label: "a", paramKey: "a", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  beta: { button: document.getElementById("btnBeta"), label: "b", paramKey: "b", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  delta: { button: document.getElementById("btnDelta"), label: "c", paramKey: "c", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  gamma: { button: document.getElementById("btnGamma"), label: "d", paramKey: "d", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  iters: { button: document.getElementById("btnIters"), label: "iter", paramKey: "iters", min: 1000, max: 1000000, sliderStep: 100, stepSize: 100, displayDp: 0 },
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

const HOLD_REPEAT_MS = 70;
const HOLD_ACCEL_START_MS = 2000;
const HOLD_ACCEL_END_MS = 3000;
const HOLD_MAX_MULTIPLIER = 10;
const NAME_MAX_CHARS = 20;
const CAMERA_LONG_PRESS_MS = 550;
const PARAM_LONG_MS = 450;
const PARAM_MOVE_CANCEL_PX = 10;
const PARAM_MODES_STORAGE_KEY = "hopalong.paramModes.v1";
const PARAM_MODE_VALUES = new Set(["fix", "manx", "many", "rand"]);

let cameraPressTimer = null;
let longPressTriggered = false;
let randomModeEnabled = false;
let isApplyingHistoryState = false;
let historyStates = [];
let historyIndex = -1;
let lastRandomToggleAt = 0;
let activeModeParamKey = null;
let paramModes = {};
const paramPressState = {
  pointerId: null,
  sliderKey: null,
  startX: 0,
  startY: 0,
  timer: null,
  longTriggered: false,
};

const HISTORY_LIMIT = 50;

function clampLabel(text, maxChars = NAME_MAX_CHARS) {
  const normalized = String(text ?? "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
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
  formulaBtn.textContent = clampLabel(formula?.name || currentFormulaId);
  cmapBtn.textContent = clampLabel(appData.defaults.cmapName);
}

function updateCurrentPickerSelection() {
  const options = Array.from(pickerList.querySelectorAll(".pickerOption"));
  for (const option of options) {
    const isSelected = option.dataset.value === (activePicker === "formula" ? currentFormulaId : appData.defaults.cmapName);
    option.classList.toggle("is-selected", isSelected);
  }
}

function configureNameBoxWidths() {
  const formulaLengths = appData.formulas.map((formula) => clampLabel(formula.name).length);
  const cmapLengths = appData.colormaps.map((name) => clampLabel(name).length);
  const longest = Math.max(10, ...formulaLengths, ...cmapLengths);
  const widthPx = Math.round(clamp(longest * 8.1 + 16, 124, 210));
  document.documentElement.style.setProperty("--name-box-width", `${widthPx}px`);
}

function layoutFloatingActions() {
  if (!floatingActionsEl || !paramRowEl) {
    return;
  }

  const appRect = canvas.parentElement.getBoundingClientRect();
  const paramRowRect = paramRowEl.getBoundingClientRect();
  const top = clamp(paramRowRect.top - appRect.top, 0, Math.max(0, appRect.height - 48));
  floatingActionsEl.style.top = `${top}px`;
}

function getScaleMode() {
  return appData?.defaults?.scaleMode === "fixed" ? "fixed" : "auto";
}

function syncScaleModeButton() {
  const isFixed = getScaleMode() === "fixed";
  scaleModeBtn.textContent = isFixed ? "F" : "A";
  scaleModeBtn.classList.toggle("is-fixed", isFixed);
  scaleModeBtn.setAttribute("aria-label", isFixed ? "Switch to auto scaling" : "Switch to fixed scaling");
  scaleModeBtn.title = isFixed ? "Fixed scale" : "Auto scale";
}

function syncRandomModeButton() {
  randomModeBtn.textContent = randomModeEnabled ? "RAN" : "FIX";
  randomModeBtn.classList.toggle("is-random", randomModeEnabled);
  randomModeBtn.classList.toggle("is-fixed", !randomModeEnabled);
  randomModeBtn.setAttribute("aria-label", randomModeEnabled ? "Randomise all parameters" : "Keep all parameters fixed");
  randomModeBtn.title = randomModeEnabled ? "Random mode on" : "Random mode off";
}

function getParamMode(paramKey) {
  return PARAM_MODE_VALUES.has(paramModes[paramKey]) ? paramModes[paramKey] : "rand";
}

function isRandomizedParam(paramKey) {
  return getParamMode(paramKey) === "rand";
}

function saveParamModesToStorage() {
  try {
    window.localStorage.setItem(PARAM_MODES_STORAGE_KEY, JSON.stringify(paramModes));
  } catch (error) {
    console.warn("Could not save parameter modes.", error);
  }
}

function syncParamModeVisuals() {
  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    const mode = getParamMode(control.paramKey);
    const item = control.button.closest(".poItem");
    if (!item) {
      continue;
    }

    item.classList.remove("po-mode-fix", "po-mode-rand", "po-mode-manx", "po-mode-many");
    item.classList.add(`po-mode-${mode}`);
    item.dataset.paramMode = mode;
  }
}

function normalizeParamModes() {
  const normalized = {};
  let manxParam = null;
  let manyParam = null;

  for (const control of Object.values(sliderControls)) {
    const key = control.paramKey;
    const mode = PARAM_MODE_VALUES.has(paramModes[key]) ? paramModes[key] : "rand";
    if (mode === "manx") {
      if (!manxParam) {
        manxParam = key;
        normalized[key] = "manx";
      } else {
        normalized[key] = "fix";
      }
      continue;
    }

    if (mode === "many") {
      if (!manyParam) {
        manyParam = key;
        normalized[key] = "many";
      } else {
        normalized[key] = "fix";
      }
      continue;
    }

    normalized[key] = mode;
  }

  paramModes = normalized;
}

function applyParamMode(paramKey, nextMode) {
  if (!PARAM_MODE_VALUES.has(nextMode)) {
    return;
  }

  const currentMode = getParamMode(paramKey);
  if (currentMode === nextMode) {
    return;
  }

  if (nextMode === "manx") {
    const previousManX = Object.entries(paramModes).find(([key, mode]) => mode === "manx" && key !== paramKey)?.[0];
    const previousManY = Object.entries(paramModes).find(([key, mode]) => mode === "many" && key !== paramKey)?.[0];

    if (previousManX) {
      if (previousManY) {
        paramModes[previousManX] = "fix";
      } else {
        paramModes[previousManX] = "many";
      }
    }

    paramModes[paramKey] = "manx";
  } else if (nextMode === "many") {
    const previousManY = Object.entries(paramModes).find(([key, mode]) => mode === "many" && key !== paramKey)?.[0];
    const previousManX = Object.entries(paramModes).find(([key, mode]) => mode === "manx" && key !== paramKey)?.[0];

    if (previousManY) {
      if (previousManX) {
        paramModes[previousManY] = "fix";
      } else {
        paramModes[previousManY] = "manx";
      }
    }

    paramModes[paramKey] = "many";
  } else {
    paramModes[paramKey] = nextMode;
  }

  normalizeParamModes();
  syncParamModeVisuals();
  saveParamModesToStorage();
  commitCurrentStateToHistory();
}

function loadParamModesFromStorage() {
  const fallback = {};
  for (const control of Object.values(sliderControls)) {
    fallback[control.paramKey] = "rand";
  }

  try {
    const raw = window.localStorage.getItem(PARAM_MODES_STORAGE_KEY);
    if (!raw) {
      paramModes = fallback;
      return;
    }

    const parsed = JSON.parse(raw);
    paramModes = { ...fallback };
    for (const key of Object.keys(fallback)) {
      if (PARAM_MODE_VALUES.has(parsed?.[key])) {
        paramModes[key] = parsed[key];
      }
    }
  } catch (error) {
    console.warn("Could not load parameter modes.", error);
    paramModes = fallback;
  }

  normalizeParamModes();
}

function captureCurrentState() {
  return {
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    sliders: { ...appData.defaults.sliders },
    paramModes: { ...paramModes },
    scaleMode: getScaleMode(),
    viewport: {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      cssWidth: Math.round(canvas.getBoundingClientRect().width),
      cssHeight: Math.round(canvas.getBoundingClientRect().height),
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    seeds: { orbitSeed: 0 },
  };
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function commitCurrentStateToHistory() {
  if (!appData || !currentFormulaId || isApplyingHistoryState) {
    return;
  }

  const nextState = captureCurrentState();
  const currentState = historyIndex >= 0 ? historyStates[historyIndex] : null;
  if (currentState && statesEqual(currentState, nextState)) {
    return;
  }

  if (historyIndex < historyStates.length - 1) {
    historyStates = historyStates.slice(0, historyIndex + 1);
  }

  historyStates.push(nextState);
  if (historyStates.length > HISTORY_LIMIT) {
    const overflow = historyStates.length - HISTORY_LIMIT;
    historyStates.splice(0, overflow);
    historyIndex = Math.max(-1, historyIndex - overflow);
  }
  historyIndex = historyStates.length - 1;
}

function applyState(state) {
  if (!state) {
    return;
  }

  isApplyingHistoryState = true;
  currentFormulaId = state.formulaId;
  appData.defaults.cmapName = state.cmapName;
  appData.defaults.sliders = { ...appData.defaults.sliders, ...state.sliders };
  appData.defaults.scaleMode = state.scaleMode === "fixed" ? "fixed" : "auto";
  if (state.paramModes && typeof state.paramModes === "object") {
    paramModes = { ...paramModes, ...state.paramModes };
    normalizeParamModes();
    syncParamModeVisuals();
    saveParamModesToStorage();
  }
  syncScaleModeButton();
  requestDraw();
  isApplyingHistoryState = false;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomizeAllParameters() {
  currentFormulaId = randomChoice(appData.formulas).id;
  appData.defaults.cmapName = randomChoice(appData.colormaps);

  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    if (!isRandomizedParam(control.paramKey)) {
      continue;
    }

    if (sliderKey === "iters") {
      appData.defaults.sliders[sliderKey] = randomInt(control.min, control.max);
      continue;
    }
    appData.defaults.sliders[sliderKey] = Number((Math.random() * (control.max - control.min) + control.min).toFixed(4));
  }

  requestDraw();
  commitCurrentStateToHistory();
}

function isEventInsideInteractiveUi(eventTarget) {
  if (!(eventTarget instanceof Element)) {
    return false;
  }

  return Boolean(eventTarget.closest("button, input, #paramOverlay, #quickSliderOverlay, #pickerOverlay, #modePicker, #debugToggleDock, #floatingActions"));
}

function handleScreenHistoryNavigation(event) {
  if (!randomModeEnabled || !appData || !currentFormulaId) {
    return;
  }

  if (isEventInsideInteractiveUi(event.target)) {
    return;
  }

  if (typeof event.clientX !== "number") {
    return;
  }

  const viewportMidX = window.innerWidth * 0.5;
  const isRightSide = event.clientX >= viewportMidX;

  if (isRightSide) {
    if (historyIndex < historyStates.length - 1) {
      historyIndex += 1;
      applyState(historyStates[historyIndex]);
      showToast(`History ${historyIndex + 1}/${historyStates.length}`);
      return;
    }

    randomizeAllParameters();
    showToast("Randomised all parameters.");
    return;
  }

  if (historyIndex > 0) {
    historyIndex -= 1;
    applyState(historyStates[historyIndex]);
    showToast(`History ${historyIndex + 1}/${historyStates.length}`);
  } else {
    showToast("Already at oldest saved state.");
  }
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
  const targetWidth = clamp(triggerRect.width * 1.8, 180, 310);
  const maxWidth = Math.max(180, viewportWidth - margin * 2);
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
    button.dataset.value = formula.id;

    const row = document.createElement("div");
    row.className = "formulaRow";

    const name = document.createElement("span");
    name.className = "formulaName";
    name.textContent = clampLabel(formula.name);

    const desc = document.createElement("span");
    desc.className = "formulaDesc";
    desc.textContent = formula.desc;

    row.append(name, desc);
    button.append(row);

    button.addEventListener("click", () => {
      currentFormulaId = formula.id;
      updateCurrentPickerSelection();
      requestDraw();
      commitCurrentStateToHistory();
      // Keep picker open so users can live-preview multiple options before closing.
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
    button.dataset.value = cmapName;

    const row = document.createElement("div");
    row.className = "cmapRow";

    const name = document.createElement("span");
    name.textContent = clampLabel(cmapName);

    const bar = document.createElement("div");
    bar.className = "cmapBar";
    bar.style.background = buildColorMapGradient(cmapName);

    row.append(name, bar);
    button.append(row);

    button.addEventListener("click", () => {
      appData.defaults.cmapName = cmapName;
      updateCurrentPickerSelection();
      requestDraw();
      commitCurrentStateToHistory();
      // Keep picker open so users can live-preview multiple options before closing.
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
  commitCurrentStateToHistory();
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

function closeModePicker() {
  activeModeParamKey = null;
  if (!modePickerEl) {
    return;
  }
  modePickerEl.classList.remove("is-open");
  modePickerEl.setAttribute("aria-hidden", "true");
}

function openModePicker(sliderKey, anchorRect) {
  if (!modePickerEl) {
    return;
  }

  activeModeParamKey = sliderControls[sliderKey].paramKey;
  const mode = getParamMode(activeModeParamKey);
  for (const radio of modePickerRadios) {
    radio.checked = radio.value === mode;
  }

  const margin = 6;
  const pickerWidth = Math.round(clamp(anchorRect.width + 10, 150, 200));
  modePickerEl.style.width = `${pickerWidth}px`;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const left = clamp(anchorRect.left + anchorRect.width / 2 - pickerWidth / 2, margin, viewportWidth - pickerWidth - margin);

  modePickerEl.classList.add("is-open");
  modePickerEl.setAttribute("aria-hidden", "false");
  const pickerHeight = modePickerEl.getBoundingClientRect().height || 170;
  const top = clamp(anchorRect.top - pickerHeight - 8, margin, viewportHeight - pickerHeight - margin);
  modePickerEl.style.left = `${left}px`;
  modePickerEl.style.top = `${top}px`;
}

function clearParamLongPressTimer() {
  if (paramPressState.timer) {
    window.clearTimeout(paramPressState.timer);
    paramPressState.timer = null;
  }
}

function onParamPointerDown(event, sliderKey) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  closeModePicker();
  paramPressState.pointerId = event.pointerId;
  paramPressState.sliderKey = sliderKey;
  paramPressState.startX = event.clientX;
  paramPressState.startY = event.clientY;
  paramPressState.longTriggered = false;

  clearParamLongPressTimer();
  paramPressState.timer = window.setTimeout(() => {
    const tile = sliderControls[sliderKey].button.closest(".poItem");
    if (!tile) {
      return;
    }
    paramPressState.longTriggered = true;
    openModePicker(sliderKey, tile.getBoundingClientRect());
  }, PARAM_LONG_MS);
}

function onParamPointerMove(event) {
  if (paramPressState.pointerId !== event.pointerId || paramPressState.longTriggered) {
    return;
  }

  const deltaX = event.clientX - paramPressState.startX;
  const deltaY = event.clientY - paramPressState.startY;
  if (Math.hypot(deltaX, deltaY) > PARAM_MOVE_CANCEL_PX) {
    clearParamLongPressTimer();
  }
}

function onParamPointerEnd(event) {
  if (paramPressState.pointerId !== event.pointerId) {
    return;
  }

  const sliderKey = paramPressState.sliderKey;
  const wasLongPress = paramPressState.longTriggered;
  clearParamLongPressTimer();
  paramPressState.pointerId = null;
  paramPressState.sliderKey = null;
  paramPressState.longTriggered = false;

  if (wasLongPress) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  openQuickSlider(sliderKey);
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
  const originVisible = world.minX <= 0 && world.maxX >= 0 && world.minY <= 0 && world.maxY >= 0;
  const minorXStep = xTicks.step / 2;
  const minorYStep = yTicks.step / 2;
  const showMinorX = ((world.maxX - world.minX) / minorXStep) <= 40;
  const showMinorY = ((world.maxY - world.minY) / minorYStep) <= 40;

  ctx.save();
  const tickFontPx = Math.max(15, Math.round(Math.min(view.width, view.height) * 0.014));
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `${tickFontPx}px system-ui, sans-serif`;

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
    if (originVisible && Math.abs(yValue) <= yTicks.step * 0.5) {
      continue;
    }
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
    ctx.moveTo(xTick, xAxisY - 6);
    ctx.lineTo(xTick, xAxisY + 6);
    ctx.stroke();
    ctx.fillText(formatTickValue(xValue, xTicks.step), xTick + 4, xAxisY - 10);
  }

  for (const yValue of yTicks.values) {
    if (originVisible && Math.abs(yValue) <= yTicks.step * 0.5) {
      continue;
    }
    const yTick = ((yValue - world.minY) / (world.maxY - world.minY)) * view.height;
    ctx.beginPath();
    ctx.moveTo(yAxisX - 6, yTick);
    ctx.lineTo(yAxisX + 6, yTick);
    ctx.stroke();
    ctx.fillText(formatTickValue(yValue, yTicks.step), yAxisX + 9, yTick - 4);
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
  const iterations = iterationSetting;
  const frameMeta = renderFrame({
    ctx,
    canvas,
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations: didResize ? Math.max(10000, Math.round(iterations * 0.6)) : iterations,
    scaleMode: getScaleMode(),
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
  layoutFloatingActions();

}

function formatScreenshotTimestamp(date) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "-",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
  return parts.join("");
}

function buildScreenshotOverlayLines() {
  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  const params = getDerivedParams();
  const iterValue = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  return [
    `${formula?.name || currentFormulaId} · ${appData.defaults.cmapName}`,
    `a ${params.a.toFixed(4)}   b ${params.b.toFixed(4)}   c ${params.c.toFixed(4)}   d ${params.d.toFixed(4)}   iter ${iterValue}`,
  ];
}

function drawScreenshotOverlay(targetCtx, width, height) {
  const lines = buildScreenshotOverlayLines();
  const margin = Math.max(18, Math.round(width * 0.02));
  const lineHeight = Math.max(20, Math.round(height * 0.032));
  const panelHeight = lineHeight * lines.length + margin;

  targetCtx.save();
  targetCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
  targetCtx.fillRect(0, height - panelHeight, width, panelHeight);
  targetCtx.fillStyle = "rgba(255, 255, 255, 0.56)";
  targetCtx.font = `${Math.max(14, Math.round(height * 0.022))}px system-ui, -apple-system, Segoe UI, sans-serif`;
  targetCtx.textBaseline = "bottom";

  lines.forEach((line, index) => {
    const y = height - margin / 2 - lineHeight * (lines.length - 1 - index);
    targetCtx.fillText(line, margin, y);
  });

  targetCtx.restore();
}

async function saveBlobToDevice(blob, filename) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = objectUrl;
  downloadAnchor.download = filename;
  document.body.append(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

async function captureScreenshot(includeOverlay) {
  if (!canvas) {
    return;
  }

  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d", { alpha: false });
  exportCtx.drawImage(canvas, 0, 0);

  if (includeOverlay) {
    drawScreenshotOverlay(exportCtx, exportCanvas.width, exportCanvas.height);
  }

  const blob = await new Promise((resolve) => exportCanvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Screenshot export failed.");
  }

  const filename = `hopalong-${includeOverlay ? "overlay" : "clean"}-${formatScreenshotTimestamp(new Date())}.png`;
  await saveBlobToDevice(blob, filename);
  showToast(includeOverlay ? "Saved screenshot with parameter overlay." : "Saved clean screenshot.");
}

function clearCameraPressState() {
  if (cameraPressTimer) {
    window.clearTimeout(cameraPressTimer);
    cameraPressTimer = null;
  }
}

function beginCameraPress(event) {
  event.preventDefault();
  event.stopPropagation();
  clearCameraPressState();
  longPressTriggered = false;
  cameraBtn.classList.add("is-armed");

  cameraPressTimer = window.setTimeout(async () => {
    longPressTriggered = true;
    try {
      await captureScreenshot(true);
    } catch (error) {
      console.error(error);
      showToast(`Overlay screenshot failed: ${error.message}`);
    }
  }, CAMERA_LONG_PRESS_MS);
}

async function endCameraPress(event) {
  event.preventDefault();
  event.stopPropagation();
  clearCameraPressState();
  cameraBtn.classList.remove("is-armed");

  if (longPressTriggered) {
    longPressTriggered = false;
    return;
  }

  try {
    await captureScreenshot(false);
  } catch (error) {
    console.error(error);
    showToast(`Screenshot failed: ${error.message}`);
  }
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
    const tile = control.button.closest(".poItem");
    if (!tile) {
      continue;
    }

    tile.addEventListener("pointerdown", (event) => onParamPointerDown(event, sliderKey));
    tile.addEventListener("pointermove", onParamPointerMove);
    tile.addEventListener("pointerup", onParamPointerEnd);
    tile.addEventListener("pointercancel", onParamPointerEnd);
    tile.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  if (modePickerEl) {
    modePickerEl.addEventListener("pointerdown", (event) => event.stopPropagation());
    modePickerEl.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
    modePickerEl.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  window.addEventListener("pointerdown", (event) => {
    if (!modePickerEl?.classList.contains("is-open")) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("#modePicker")) {
      return;
    }

    closeModePicker();
  });

  for (const radio of modePickerRadios) {
    radio.addEventListener("change", () => {
      if (!radio.checked || !activeModeParamKey) {
        return;
      }
      applyParamMode(activeModeParamKey, radio.value);
      requestDraw();
      closeModePicker();
    });
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

  if (window.PointerEvent) {
    cameraBtn.addEventListener("pointerdown", beginCameraPress);
    cameraBtn.addEventListener("pointerup", endCameraPress);
    cameraBtn.addEventListener("pointercancel", () => {
      clearCameraPressState();
      cameraBtn.classList.remove("is-armed");
      longPressTriggered = false;
    });
  } else {
    cameraBtn.addEventListener("touchstart", beginCameraPress, { passive: false });
    cameraBtn.addEventListener("touchend", endCameraPress, { passive: false });
    cameraBtn.addEventListener("mousedown", beginCameraPress);
    cameraBtn.addEventListener("mouseup", endCameraPress);
  }
  cameraBtn.addEventListener("contextmenu", (event) => event.preventDefault());

  scaleModeBtn.addEventListener("click", () => {
    appData.defaults.scaleMode = getScaleMode() === "fixed" ? "auto" : "fixed";
    syncScaleModeButton();
    requestDraw();
    commitCurrentStateToHistory();
    showToast(getScaleMode() === "fixed" ? "Fixed scale mode enabled." : "Auto scale mode enabled.");
  });

  const toggleRandomMode = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.type === "click" && Date.now() - lastRandomToggleAt < 350) {
        return;
      }
      if (event.type === "pointerup") {
        lastRandomToggleAt = Date.now();
      }
    }
    randomModeEnabled = !randomModeEnabled;
    syncRandomModeButton();
    showToast(randomModeEnabled ? "RAN mode enabled. Tap right to go forward/randomise, left to go back." : "FIX mode enabled. History tap controls are inactive.");
  };

  randomModeBtn.addEventListener("pointerup", toggleRandomMode);
  randomModeBtn.addEventListener("click", toggleRandomMode);

  window.addEventListener("pointerup", handleScreenHistoryNavigation);

  window.addEventListener(
    "resize",
    () => {
      if (quickSliderOverlay.classList.contains("is-open")) {
        alignQuickSliderAboveBottomBar();
      }
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      if (modePickerEl?.classList.contains("is-open")) {
        closeModePicker();
      }
      layoutFloatingActions();
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
      if (modePickerEl?.classList.contains("is-open")) {
        closeModePicker();
      }
      layoutFloatingActions();
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
      iters: 200000,
    };
  }

  data.defaults.sliders.iters = clamp(data.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max);

  if (data.defaults.scaleMode !== "fixed") {
    data.defaults.scaleMode = "auto";
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
    loadParamModesFromStorage();

    currentFormulaId = resolveInitialFormulaId();
    appData.defaults.cmapName = resolveInitialColorMap();
    configureNameBoxWidths();
    debugOnEl.checked = Boolean(appData.defaults.debug);
    debugOffEl.checked = !debugOnEl.checked;
    syncScaleModeButton();
    syncRandomModeButton();
    syncParamModeVisuals();
    saveParamModesToStorage();

    registerHandlers();
    commitCurrentStateToHistory();
    requestDraw();
    const formula = appData.formulas.find((item) => item.id === currentFormulaId);
    showToast(`Loaded ${formula?.name || currentFormulaId}. Slice 2.1 controls ready.`);
  } catch (error) {
    console.error(error);
    showToast(`Startup failed: ${error.message}`);
  }
}

bootstrap();
