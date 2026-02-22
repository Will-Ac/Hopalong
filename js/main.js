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

const UI_ROOTS = [
  "#paramOverlay",
  "#floatingActions",
  "#quickSliderOverlay",
  "#pickerOverlay",
  "#modePicker",
  "#debugToggleDock",
  "#debugPanel",
];

function isUiTarget(target) {
  if (!(target instanceof Element) || !target.closest) {
    return false;
  }

  return UI_ROOTS.some((selector) => target.closest(selector));
}

function isModalOpen() {
  return Boolean(
    quickSliderOverlay?.classList.contains("is-open")
      || pickerOverlay?.classList.contains("is-open")
      || modePickerEl?.classList.contains("is-open"),
  );
}

const sliderControls = {
  alpha: { button: document.getElementById("btnAlpha"), label: "a", paramKey: "a", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  beta: { button: document.getElementById("btnBeta"), label: "b", paramKey: "b", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  delta: { button: document.getElementById("btnDelta"), label: "c", paramKey: "c", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  gamma: { button: document.getElementById("btnGamma"), label: "d", paramKey: "d", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  iters: { button: document.getElementById("btnIters"), label: "iter", paramKey: "iters", min: 1000, max: 1000000, sliderStep: 100, stepSize: 100, displayDp: 0 },
};

const DEFAULT_PARAM_RANGES = {
  a: [-80, 80],
  b: [-20, 20],
  c: [-20, 20],
  d: [-20, 20],
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
const PARAM_FULL_MODE_OPTIONS = ["rand", "fix", "manx", "many"];
const PARAM_MODE_OPTIONS_BY_KEY = {
  formula: ["rand", "fix"],
  cmap: ["rand", "fix"],
};
const PARAM_MODE_KEYS = ["formula", "cmap", ...Object.values(sliderControls).map((control) => control.paramKey)];
const paramTileTargets = {
  formula: { button: formulaBtn, modeKey: "formula", shortTap: () => openPicker("formula", formulaBtn) },
  cmap: { button: cmapBtn, modeKey: "cmap", shortTap: () => openPicker("cmap", cmapBtn) },
  alpha: { button: sliderControls.alpha.button, modeKey: sliderControls.alpha.paramKey, shortTap: () => openQuickSlider("alpha") },
  beta: { button: sliderControls.beta.button, modeKey: sliderControls.beta.paramKey, shortTap: () => openQuickSlider("beta") },
  delta: { button: sliderControls.delta.button, modeKey: sliderControls.delta.paramKey, shortTap: () => openQuickSlider("delta") },
  gamma: { button: sliderControls.gamma.button, modeKey: sliderControls.gamma.paramKey, shortTap: () => openQuickSlider("gamma") },
  iters: { button: sliderControls.iters.button, modeKey: sliderControls.iters.paramKey, shortTap: () => openQuickSlider("iters") },
};

let cameraPressTimer = null;
let longPressTriggered = false;
let isApplyingHistoryState = false;
let historyStates = [];
let historyIndex = -1;
let activeModeParamKey = null;
let paramModes = {};
const paramPressState = {
  pointerId: null,
  targetKey: null,
  startX: 0,
  startY: 0,
  timer: null,
  longTriggered: false,
};

const HISTORY_LIMIT = 50;
const INTERACTION_STATE = {
  NONE: "none",
  MOD_1: "mod1",
  TWO_ACTIVE: "two_active",
  PAN_MOUSE_RMB: "pan_mouse_rmb",
};
const DPR = window.devicePixelRatio || 1;
const PAN_DEADBAND_PX = 1.5 * DPR;
const ZOOM_DEADBAND_PX = 2.5 * DPR;
const ZOOM_RATIO_MIN = 0.002;
const HISTORY_TAP_MAX_MOVE_PX = 10;
const MODULATION_SENSITIVITY = 80;
const SWIPE_EDGE_PX = 44;
const SWIPE_TRIGGER_PX = 60;
const SWIPE_MAX_TIME_MS = 450;
const SWIPE_MAX_X_DRIFT_PX = 50;

const sliderKeyByParamKey = {
  a: "alpha",
  b: "beta",
  c: "delta",
  d: "gamma",
  iters: "iters",
};

let interactionState = INTERACTION_STATE.NONE;
let activePointers = new Map();
let primaryPointerId = null;
let lastPointerPosition = null;
let twoFingerGesture = null;
let lastTwoDebug = null;
let historyTapTracker = null;
let suppressHistoryTap = false;
let uiHidden = false;
let interactionRouter = null;
let fixedView = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

function setUiHidden(hidden) {
  uiHidden = Boolean(hidden);
  document.body.classList.toggle("ui-hidden", uiHidden);
}

class InteractionRouter {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ownerByPointerId = new Map();
    this.activeOwner = null;
    this.swipeCandidate = null;
  }

  install() {
    document.addEventListener("pointerdown", (event) => this.onPointerDown(event), { capture: true, passive: false });
    document.addEventListener("pointermove", (event) => this.onPointerMove(event), { capture: true, passive: false });
    document.addEventListener("pointerup", (event) => this.onPointerUp(event), { capture: true, passive: false });
    document.addEventListener("pointercancel", (event) => this.onPointerUp(event), { capture: true, passive: false });
  }

  setOwner(pointerId, owner) {
    this.ownerByPointerId.set(pointerId, owner);
    if (!this.activeOwner) {
      this.activeOwner = owner;
    }
  }

  resetOwnerIfIdle() {
    if (this.ownerByPointerId.size === 0) {
      this.activeOwner = null;
      this.swipeCandidate = null;
    }
  }

  shouldTrackSwipe(event) {
    if (isModalOpen() || event.pointerType === "mouse" || this.ownerByPointerId.size > 0) {
      return false;
    }

    return event.clientY >= window.innerHeight - SWIPE_EDGE_PX;
  }

  onPointerDown(event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (isModalOpen()) {
      this.setOwner(event.pointerId, "ui");
      if (modePickerEl?.classList.contains("is-open") && !event.target.closest("#modePicker")) {
        closeModePicker();
      }
      return;
    }

    if (isUiTarget(event.target)) {
      this.setOwner(event.pointerId, "ui");
      return;
    }

    this.setOwner(event.pointerId, "canvas");

    if (this.shouldTrackSwipe(event)) {
      this.swipeCandidate = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: performance.now(),
      };
      return;
    }

    onCanvasPointerDown(event);
  }

  onPointerMove(event) {
    const owner = this.ownerByPointerId.get(event.pointerId);
    if (owner !== "canvas") {
      return;
    }

    if (this.swipeCandidate?.pointerId === event.pointerId) {
      const elapsedMs = performance.now() - this.swipeCandidate.startedAt;
      const deltaY = event.clientY - this.swipeCandidate.startY;
      const driftX = Math.abs(event.clientX - this.swipeCandidate.startX);

      if (elapsedMs > SWIPE_MAX_TIME_MS || driftX > SWIPE_MAX_X_DRIFT_PX) {
        this.swipeCandidate = null;
        onCanvasPointerDown(event);
        onCanvasPointerMove(event);
        return;
      }

      if (!uiHidden && deltaY <= -SWIPE_TRIGGER_PX) {
        setUiHidden(true);
        this.swipeCandidate = null;
        return;
      }

      if (uiHidden && deltaY >= SWIPE_TRIGGER_PX) {
        setUiHidden(false);
        this.swipeCandidate = null;
        return;
      }

      return;
    }

    onCanvasPointerMove(event);
  }

  onPointerUp(event) {
    const owner = this.ownerByPointerId.get(event.pointerId);
    if (owner === "canvas") {
      if (this.swipeCandidate?.pointerId !== event.pointerId) {
        handleScreenHistoryNavigation(event);
        onCanvasPointerUp(event);
      }
      if (historyTapTracker?.pointerId === event.pointerId) {
        historyTapTracker = null;
      }
    }

    this.ownerByPointerId.delete(event.pointerId);
    if (this.swipeCandidate?.pointerId === event.pointerId) {
      this.swipeCandidate = null;
    }
    this.resetOwnerIfIdle();
  }
}

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

function isAutoScale() {
  return getScaleMode() === "auto";
}

function setScaleModeFixed(reason = "manual pan/zoom") {
  if (!appData || !isAutoScale()) {
    return;
  }

  appData.defaults.scaleMode = "fixed";
  syncScaleModeButton();
  commitCurrentStateToHistory();
  showToast(`Scale: Fixed (${reason})`);
}

function syncScaleModeButton() {
  const isFixed = getScaleMode() === "fixed";
  scaleModeBtn.textContent = isFixed ? "F" : "A";
  scaleModeBtn.classList.toggle("is-fixed", isFixed);
  scaleModeBtn.setAttribute("aria-label", isFixed ? "Switch to auto scaling" : "Switch to fixed scaling");
  scaleModeBtn.title = isFixed ? "Fixed scale" : "Auto scale";
}

function syncRandomModeButton() {
  const globalMode = getGlobalRandomFixMixState();
  randomModeBtn.textContent = globalMode.toUpperCase();
  randomModeBtn.classList.toggle("is-random", globalMode === "ran");
  randomModeBtn.classList.toggle("is-fixed", globalMode === "fix");
  randomModeBtn.classList.toggle("is-mixed", globalMode === "mix");
  randomModeBtn.setAttribute("aria-label", globalMode === "ran" ? "All parameter modes set to random" : globalMode === "fix" ? "All parameter modes set to fixed" : "Mixed parameter modes");
  randomModeBtn.title = globalMode === "ran" ? "All random" : globalMode === "fix" ? "All fixed" : "Mixed parameter modes";
}

function getGlobalRandomFixMixState() {
  const modes = PARAM_MODE_KEYS.map((key) => getParamMode(key));
  const allRandom = modes.every((mode) => mode === "rand");
  if (allRandom) {
    return "ran";
  }

  const allFixed = modes.every((mode) => mode === "fix");
  if (allFixed) {
    return "fix";
  }

  return "mix";
}

function hasAnyRandomizedModes() {
  return PARAM_MODE_KEYS.some((key) => getParamMode(key) === "rand");
}

function applyAllParamModes(nextMode) {
  if (!PARAM_MODE_VALUES.has(nextMode)) {
    return;
  }

  for (const key of PARAM_MODE_KEYS) {
    if (getAllowedModesForParam(key).includes(nextMode)) {
      paramModes[key] = nextMode;
    }
  }

  normalizeParamModes();
  syncParamModeVisuals();
  saveParamModesToStorage();
  syncRandomModeButton();
  requestDraw();
  commitCurrentStateToHistory();
}

function getParamMode(paramKey) {
  return PARAM_MODE_VALUES.has(paramModes[paramKey]) ? paramModes[paramKey] : "rand";
}

function getAllowedModesForParam(paramKey) {
  return PARAM_MODE_OPTIONS_BY_KEY[paramKey] || PARAM_FULL_MODE_OPTIONS;
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
  for (const target of Object.values(paramTileTargets)) {
    const mode = getParamMode(target.modeKey);
    const item = target.button.closest(".poItem");
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

  for (const key of PARAM_MODE_KEYS) {
    let mode = PARAM_MODE_VALUES.has(paramModes[key]) ? paramModes[key] : "rand";
    const allowedModes = getAllowedModesForParam(key);
    if (!allowedModes.includes(mode)) {
      mode = mode === "rand" ? "rand" : "fix";
    }

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
  if (!PARAM_MODE_VALUES.has(nextMode) || !getAllowedModesForParam(paramKey).includes(nextMode)) {
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
  syncRandomModeButton();
  commitCurrentStateToHistory();
}

function loadParamModesFromStorage() {
  const fallback = {};
  for (const key of PARAM_MODE_KEYS) {
    fallback[key] = "rand";
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
    fixedView: { ...fixedView },
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
  if (state.fixedView && typeof state.fixedView === "object") {
    fixedView = {
      offsetX: Number.isFinite(state.fixedView.offsetX) ? state.fixedView.offsetX : 0,
      offsetY: Number.isFinite(state.fixedView.offsetY) ? state.fixedView.offsetY : 0,
      zoom: Number.isFinite(state.fixedView.zoom) ? clamp(state.fixedView.zoom, 0.15, 25) : 1,
    };
  }
  if (state.paramModes && typeof state.paramModes === "object") {
    paramModes = { ...paramModes, ...state.paramModes };
    normalizeParamModes();
    syncParamModeVisuals();
    saveParamModesToStorage();
    syncRandomModeButton();
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
  if (isRandomizedParam("formula")) {
    currentFormulaId = randomChoice(appData.formulas).id;
  }

  if (isRandomizedParam("cmap")) {
    appData.defaults.cmapName = randomChoice(appData.colormaps);
  }

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
  return isUiTarget(eventTarget);
}

function handleScreenHistoryNavigation(event) {
  if (!hasAnyRandomizedModes() || !appData || !currentFormulaId || suppressHistoryTap) {
    return;
  }

  if (!historyTapTracker || event.pointerId !== historyTapTracker.pointerId || !historyTapTracker.validTap) {
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

function getCanvasPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / Math.max(rect.width, 1);
  const scaleY = canvas.height / Math.max(rect.height, 1);
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    scaleX,
    scaleY,
  };
}

function getManualAxisTargets() {
  let manX = null;
  let manY = null;

  for (const [paramKey, mode] of Object.entries(paramModes)) {
    if (mode === "manx") {
      manX = sliderKeyByParamKey[paramKey] || null;
    }
    if (mode === "many") {
      manY = sliderKeyByParamKey[paramKey] || null;
    }
  }

  return { manX, manY };
}

function applyManualModulation(deltaX, deltaY) {
  const { manX, manY } = getManualAxisTargets();
  if (!manX && !manY) {
    return;
  }

  if (manX) {
    const control = sliderControls[manX];
    appData.defaults.sliders[manX] = clamp(
      appData.defaults.sliders[manX] + deltaX * MODULATION_SENSITIVITY * control.stepSize,
      control.min,
      control.max,
    );
  }

  if (manY) {
    const control = sliderControls[manY];
    appData.defaults.sliders[manY] = clamp(
      appData.defaults.sliders[manY] - deltaY * MODULATION_SENSITIVITY * control.stepSize,
      control.min,
      control.max,
    );
  }

  requestDraw();
}

function applyPanDelta(deltaX, deltaY) {
  fixedView.offsetX += deltaX;
  fixedView.offsetY += deltaY;
  requestDraw();
}

function applyZoomAtPoint(zoomFactor, anchorX, anchorY) {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    return;
  }

  const prevZoom = fixedView.zoom;
  const nextZoom = clamp(prevZoom * zoomFactor, 0.15, 25);
  const ratio = nextZoom / prevZoom;
  if (!Number.isFinite(ratio) || ratio === 1) {
    return;
  }

  const viewCenterX = canvas.width * 0.5;
  const viewCenterY = canvas.height * 0.5;
  const centerX = viewCenterX + fixedView.offsetX;
  const centerY = viewCenterY + fixedView.offsetY;
  const nextCenterX = anchorX - (anchorX - centerX) * ratio;
  const nextCenterY = anchorY - (anchorY - centerY) * ratio;

  fixedView.zoom = nextZoom;
  fixedView.offsetX = nextCenterX - viewCenterX;
  fixedView.offsetY = nextCenterY - viewCenterY;
  requestDraw();
}

function updateHistoryTapTrackerFromMove(event) {
  if (!historyTapTracker || event.pointerId !== historyTapTracker.pointerId || !historyTapTracker.validTap) {
    return;
  }

  const moved = Math.hypot(event.clientX - historyTapTracker.startX, event.clientY - historyTapTracker.startY);
  if (moved > HISTORY_TAP_MAX_MOVE_PX) {
    historyTapTracker.validTap = false;
  }
}

function getLockedTwoPointers() {
  if (!twoFingerGesture) {
    return null;
  }

  const ptrA = activePointers.get(twoFingerGesture.idA);
  const ptrB = activePointers.get(twoFingerGesture.idB);
  if (ptrA && ptrB) {
    return [ptrA, ptrB];
  }

  if (activePointers.size < 2) {
    return null;
  }

  const [fallbackA, fallbackB] = Array.from(activePointers.values());
  initializeTwoFingerGesture(fallbackA.pointerId, fallbackB.pointerId);
  return [fallbackA, fallbackB];
}

function initializeTwoFingerGesture(pointerIdA, pointerIdB) {
  const ptrA = activePointers.get(pointerIdA);
  const ptrB = activePointers.get(pointerIdB);
  if (!ptrA || !ptrB) {
    twoFingerGesture = null;
    lastTwoDebug = null;
    return;
  }

  const posA = getCanvasPointerPosition(ptrA);
  const posB = getCanvasPointerPosition(ptrB);
  const lastD = Math.hypot(posB.x - posA.x, posB.y - posA.y);
  const lastMX = (posA.x + posB.x) * 0.5;
  const lastMY = (posA.y + posB.y) * 0.5;

  twoFingerGesture = {
    idA: pointerIdA,
    idB: pointerIdB,
    lastD,
    lastMX,
    lastMY,
  };
  interactionState = INTERACTION_STATE.TWO_ACTIVE;
  suppressHistoryTap = true;
}

function clearTwoFingerGesture() {
  twoFingerGesture = null;
  lastTwoDebug = null;
}

function onCanvasPointerDown(event) {
  if (!appData) {
    return;
  }

  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }

  if (event.pointerType === "mouse" && event.button === 2) {
    event.preventDefault();
  }

  if (event.target === canvas) {
    canvas.setPointerCapture(event.pointerId);
  }
  activePointers.set(event.pointerId, {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
  });

  historyTapTracker = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    validTap: true,
  };

  if (event.pointerType === "mouse" && event.button === 2) {
    setScaleModeFixed("manual pan/zoom");
    interactionState = INTERACTION_STATE.PAN_MOUSE_RMB;
    primaryPointerId = event.pointerId;
    const pos = getCanvasPointerPosition(event);
    lastPointerPosition = { x: pos.x, y: pos.y };
    suppressHistoryTap = true;
    requestDraw();
    return;
  }

  if (activePointers.size === 1) {
    interactionState = INTERACTION_STATE.MOD_1;
    primaryPointerId = event.pointerId;
    const pos = getCanvasPointerPosition(event);
    lastPointerPosition = { x: pos.x, y: pos.y };
    requestDraw();
    return;
  }

  if (activePointers.size === 2) {
    const pointers = Array.from(activePointers.values());
    initializeTwoFingerGesture(pointers[0].pointerId, pointers[1].pointerId);
    requestDraw();
  }
}

function onCanvasPointerMove(event) {
  if (!activePointers.has(event.pointerId)) {
    return;
  }

  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }

  updateHistoryTapTrackerFromMove(event);
  const pointerRecord = activePointers.get(event.pointerId);
  pointerRecord.clientX = event.clientX;
  pointerRecord.clientY = event.clientY;

  if (interactionState === INTERACTION_STATE.MOD_1 && event.pointerId === primaryPointerId) {
    const pos = getCanvasPointerPosition(event);
    if (!lastPointerPosition) {
      lastPointerPosition = { x: pos.x, y: pos.y };
      return;
    }
    applyManualModulation(pos.x - lastPointerPosition.x, pos.y - lastPointerPosition.y);
    lastPointerPosition = { x: pos.x, y: pos.y };
    return;
  }

  if (interactionState === INTERACTION_STATE.PAN_MOUSE_RMB && event.pointerId === primaryPointerId) {
    const pos = getCanvasPointerPosition(event);
    if (!lastPointerPosition) {
      lastPointerPosition = { x: pos.x, y: pos.y };
      return;
    }
    applyPanDelta(pos.x - lastPointerPosition.x, pos.y - lastPointerPosition.y);
    lastPointerPosition = { x: pos.x, y: pos.y };
    return;
  }

  if (activePointers.size < 2 || interactionState !== INTERACTION_STATE.TWO_ACTIVE) {
    return;
  }

  const pointers = getLockedTwoPointers();
  if (!pointers || !twoFingerGesture) {
    return;
  }

  const posA = getCanvasPointerPosition(pointers[0]);
  const posB = getCanvasPointerPosition(pointers[1]);
  const midpoint = {
    x: (posA.x + posB.x) * 0.5,
    y: (posA.y + posB.y) * 0.5,
  };
  const distance = Math.hypot(posB.x - posA.x, posB.y - posA.y);
  const dxm = midpoint.x - twoFingerGesture.lastMX;
  const dym = midpoint.y - twoFingerGesture.lastMY;
  const dd = distance - twoFingerGesture.lastD;
  const ratioStep = twoFingerGesture.lastD > 0 ? distance / twoFingerGesture.lastD : 1;
  const panMagnitude = Math.hypot(dxm, dym);
  const zoomRatioDelta = Math.abs(ratioStep - 1);
  const shouldPan = panMagnitude > PAN_DEADBAND_PX;
  const shouldZoom = Math.abs(dd) > ZOOM_DEADBAND_PX || zoomRatioDelta > ZOOM_RATIO_MIN;

  lastTwoDebug = {
    state: interactionState,
    dxm,
    dym,
    dd,
    ratioStep,
    viewZoom: fixedView.zoom,
  };

  let appliedGesture = false;

  if (shouldZoom && Number.isFinite(ratioStep) && ratioStep > 0) {
    applyZoomAtPoint(ratioStep, midpoint.x, midpoint.y);
    appliedGesture = true;
  }

  if (shouldPan) {
    applyPanDelta(dxm, dym);
    appliedGesture = true;
  }

  if (appliedGesture) {
    setScaleModeFixed("manual pan/zoom");
  }

  twoFingerGesture.lastD = distance;
  twoFingerGesture.lastMX = midpoint.x;
  twoFingerGesture.lastMY = midpoint.y;
}

function clearPointerState(pointerId) {
  if (!activePointers.has(pointerId)) {
    return;
  }

  activePointers.delete(pointerId);

  if (activePointers.size === 0) {
    interactionState = INTERACTION_STATE.NONE;
    primaryPointerId = null;
    lastPointerPosition = null;
    clearTwoFingerGesture();
    requestDraw();
    return;
  }

  if (activePointers.size === 1) {
    const remaining = Array.from(activePointers.values())[0];
    clearTwoFingerGesture();
    primaryPointerId = remaining.pointerId;
    interactionState = INTERACTION_STATE.MOD_1;
    const pos = getCanvasPointerPosition(remaining);
    lastPointerPosition = { x: pos.x, y: pos.y };
    requestDraw();
    return;
  }

  if (activePointers.size >= 2) {
    const pointers = Array.from(activePointers.values());
    initializeTwoFingerGesture(pointers[0].pointerId, pointers[1].pointerId);
    requestDraw();
  }
}

function onCanvasPointerUp(event) {
  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }
  historyTapTracker = historyTapTracker?.pointerId === event.pointerId ? historyTapTracker : null;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  clearPointerState(event.pointerId);
  window.setTimeout(() => {
    suppressHistoryTap = false;
  }, 0);
}

function onCanvasWheel(event) {
  event.preventDefault();
  setScaleModeFixed("manual pan/zoom");
  const pos = getCanvasPointerPosition(event);
  const zoomFactor = Math.exp(-event.deltaY * 0.0025);
  applyZoomAtPoint(zoomFactor, pos.x, pos.y);
  suppressHistoryTap = true;
  window.setTimeout(() => {
    suppressHistoryTap = false;
  }, 0);
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

function applySliderValue(nextValue, { commitHistory = true } = {}) {
  if (!activeSliderKey) {
    return;
  }

  const control = sliderControls[activeSliderKey];
  const value = clamp(nextValue, control.min, control.max);
  appData.defaults.sliders[activeSliderKey] = value;
  qsRange.value = value;
  updateQuickSliderReadout();
  requestDraw();
  if (commitHistory) {
    commitCurrentStateToHistory();
  }
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

function syncModePickerChoices(paramKey) {
  const allowedModes = getAllowedModesForParam(paramKey);
  for (const radio of modePickerRadios) {
    const optionLabel = radio.closest("label");
    const visible = allowedModes.includes(radio.value);
    radio.disabled = !visible;
    if (optionLabel) {
      optionLabel.style.display = visible ? "" : "none";
    }
  }
}

function closeModePicker() {
  activeModeParamKey = null;
  if (!modePickerEl) {
    return;
  }
  modePickerEl.classList.remove("is-open");
  modePickerEl.setAttribute("aria-hidden", "true");
}

function openModePicker(targetKey, anchorRect) {
  if (!modePickerEl) {
    return;
  }

  const target = paramTileTargets[targetKey];
  if (!target) {
    return;
  }

  activeModeParamKey = target.modeKey;
  syncModePickerChoices(activeModeParamKey);

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

function onParamPointerDown(event, targetKey) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  closeModePicker();
  paramPressState.pointerId = event.pointerId;
  paramPressState.targetKey = targetKey;
  paramPressState.startX = event.clientX;
  paramPressState.startY = event.clientY;
  paramPressState.longTriggered = false;

  clearParamLongPressTimer();
  paramPressState.timer = window.setTimeout(() => {
    const tile = paramTileTargets[targetKey]?.button.closest(".poItem");
    if (!tile) {
      return;
    }
    paramPressState.longTriggered = true;
    openModePicker(targetKey, tile.getBoundingClientRect());
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

  const targetKey = paramPressState.targetKey;
  const wasLongPress = paramPressState.longTriggered;
  clearParamLongPressTimer();
  paramPressState.pointerId = null;
  paramPressState.targetKey = null;
  paramPressState.longTriggered = false;

  if (wasLongPress) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  paramTileTargets[targetKey]?.shortTap();
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

function getControlForSlider(sliderKey) {
  return sliderKey ? sliderControls[sliderKey] || null : null;
}

function getRangeForControl(control) {
  if (!control || control.paramKey === "iters") {
    return null;
  }

  const formulaRanges = getCurrentFormulaRange() || DEFAULT_PARAM_RANGES;
  return formulaRanges[control.paramKey] || DEFAULT_PARAM_RANGES[control.paramKey] || null;
}

function getAxisPixelForZero(range, spanPx, fallbackPx) {
  if (!range || range.length < 2) {
    return fallbackPx;
  }

  return axisScreenPosition(range[0], range[1], spanPx);
}

function getParamPixel(value, range, spanPx, fallbackPx) {
  if (!range || range.length < 2 || range[1] === range[0]) {
    return fallbackPx;
  }

  return ((value - range[0]) / (range[1] - range[0])) * spanPx;
}

function getAxisPixelForZeroVertical(range, spanPx, fallbackPx) {
  if (!range || range.length < 2) {
    return fallbackPx;
  }

  const [minValue, maxValue] = range;
  if (minValue <= 0 && maxValue >= 0) {
    return ((maxValue - 0) / (maxValue - minValue)) * spanPx;
  }

  return Math.abs(minValue) <= Math.abs(maxValue) ? spanPx : 0;
}

function getParamPixelVertical(value, range, spanPx, fallbackPx) {
  if (!range || range.length < 2 || range[1] === range[0]) {
    return fallbackPx;
  }

  return ((range[1] - value) / (range[1] - range[0])) * spanPx;
}

function shouldShowManualOverlay() {
  if (interactionState !== INTERACTION_STATE.MOD_1 || activePointers.size === 0) {
    return false;
  }

  return !historyTapTracker?.validTap;
}

function drawManualParamOverlay(meta) {
  if (!meta || !shouldShowManualOverlay()) {
    return;
  }

  const { manX, manY } = getManualAxisTargets();
  const manXControl = getControlForSlider(manX);
  const manYControl = getControlForSlider(manY);
  const manXRange = getRangeForControl(manXControl);
  const manYRange = getRangeForControl(manYControl);
  const manualParams = getDerivedParams();
  const hasManualAxis = Boolean(manXControl || manYControl);

  if (!hasManualAxis) {
    return;
  }

  const { view } = meta;
  const centerX = view.width * 0.5;
  const centerY = view.height * 0.5;
  const paramAxisX = manXRange ? getAxisPixelForZero(manXRange, view.width, centerX) : centerX;
  const paramAxisY = manYRange ? getAxisPixelForZeroVertical(manYRange, view.height, centerY) : centerY;
  const paramXValue = manXControl ? manualParams[manXControl.paramKey] : null;
  const paramYValue = manYControl ? manualParams[manYControl.paramKey] : null;
  const paramX = manXRange ? getParamPixel(paramXValue, manXRange, view.width, centerX) : centerX;
  const paramY = manYRange ? getParamPixelVertical(paramYValue, manYRange, view.height, centerY) : centerY;
  const crosshairSize = 28;
  const labelGap = 12;
  const axisNameFontPx = Math.max(12, Math.round(Math.min(view.width, view.height) * 0.017));

  ctx.save();
  ctx.strokeStyle = "rgba(255,64,64,0.95)";
  ctx.fillStyle = "rgba(255,92,92,0.96)";
  ctx.lineWidth = 1;

  if (manYControl) {
    ctx.beginPath();
    ctx.moveTo(0, paramAxisY);
    ctx.lineTo(view.width, paramAxisY);
    ctx.stroke();
  }

  if (manXControl) {
    ctx.beginPath();
    ctx.moveTo(paramAxisX, 0);
    ctx.lineTo(paramAxisX, view.height);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(paramX - crosshairSize, paramY);
  ctx.lineTo(paramX + crosshairSize, paramY);
  ctx.moveTo(paramX, paramY - crosshairSize);
  ctx.lineTo(paramX, paramY + crosshairSize);
  ctx.stroke();

  ctx.font = `${axisNameFontPx}px system-ui, sans-serif`;
  if (manYControl) {
    ctx.fillText(manYControl.label, view.width - axisNameFontPx * 1.2, Math.max(axisNameFontPx + 4, paramAxisY - labelGap));
  }
  if (manXControl) {
    ctx.fillText(manXControl.label, Math.min(view.width - axisNameFontPx * 1.5, paramAxisX + labelGap), axisNameFontPx + 4);
  }

  ctx.restore();
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
    `gesture state: ${interactionState}`,
    `2f dxm/dym/dd: ${lastTwoDebug ? `${lastTwoDebug.dxm.toFixed(2)} / ${lastTwoDebug.dym.toFixed(2)} / ${lastTwoDebug.dd.toFixed(2)}` : "-"}`,
    `2f ratioStep/zoom: ${lastTwoDebug ? `${lastTwoDebug.ratioStep.toFixed(4)} / ${lastTwoDebug.viewZoom.toFixed(4)}` : "-"}`,
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
    fixedView,
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
  drawManualParamOverlay(lastRenderMeta);
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

  for (const [targetKey, target] of Object.entries(paramTileTargets)) {
    const tile = target.button.closest(".poItem");
    if (!tile) {
      continue;
    }

    tile.addEventListener("pointerdown", (event) => onParamPointerDown(event, targetKey));
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
    applySliderValue(Number.parseFloat(qsRange.value), { commitHistory: false });
  });
  qsRange.addEventListener("change", () => {
    commitCurrentStateToHistory();
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
    }
    const nextMode = getGlobalRandomFixMixState() === "ran" ? "fix" : "rand";
    applyAllParamModes(nextMode);
    showToast(nextMode === "rand" ? "RAN mode enabled. Tap right to go forward/randomise, left to go back." : "FIX mode enabled. History tap controls are inactive.");
  };

  randomModeBtn.addEventListener("click", toggleRandomMode);

  canvas.style.touchAction = "none";
  canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  interactionRouter = new InteractionRouter(canvas);
  interactionRouter.install();

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
