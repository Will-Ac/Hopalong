import { ColorMapNames, sampleColorMap, getColorMapStops, setColorMapStops, getColorMapStopOverrides, setColorMapStopOverrides } from "./colormaps.js";
import { renderFrame, getParamsForFormula, classifyInterestGridLyapunov, isRenderCancelledError } from "./renderer.js";
import {
  FORMULA_METADATA,
  FORMULA_RANGES_RAW,
  FORMULA_DEFAULT_PRESETS,
  FORMULA_DEFAULT_SEEDS,
  FORMULA_UI_EQUATIONS,
} from "./formulas.js";
import { createHelpOverlay } from "./helpOverlay.js";
import { clamp } from "./utils.js";
import { initUIPanels } from "./uiPanels.js";
import { initInterestOverlay } from "./interestOverlay.js";
import { initExportManager } from "./exportManager.js";
import { initHistoryState } from "./historyState.js";

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const canvas = document.getElementById("c");
const interestOverlayCanvas = document.getElementById("interestOverlayCanvas");
const manualOverlayCanvas = document.getElementById("manualOverlayCanvas");
const toastEl = document.getElementById("toast");
const formulaBtn = document.getElementById("formulaBtn");
const cmapBtn = document.getElementById("cmapBtn");
const debugInfoEl = document.getElementById("debugInfo");
const debugPanelEl = document.getElementById("debugPanel");
const rangesEditorToggleEl = document.getElementById("rangesEditorToggle");
const overlayToggleBtn = document.getElementById("overlayToggleBtn");
const helpBtn = document.getElementById("helpBtn");
const rangesEditorPanelEl = document.getElementById("rangesEditorPanel");
const formulaSettingsPanelEl = document.getElementById("formulaSettingsPanel");
const formulaSettingsCloseEl = document.getElementById("formulaSettingsClose");
const formulaSettingsCloseBottomEl = document.getElementById("formulaSettingsCloseBottom");
const rangesFormulaLineXEl = document.getElementById("rangesFormulaLineX");
const rangesFormulaLineYEl = document.getElementById("rangesFormulaLineY");
const rangesFormulaNameEl = document.getElementById("rangesFormulaName");
const rangesEditorWarningEl = document.getElementById("rangesEditorWarning");
const formulaSettingsApplyEl = document.getElementById("formulaSettingsApply");
const formulaSettingsResetEl = document.getElementById("formulaSettingsReset");
const detailStartupIterationsRangeEl = document.getElementById("detailStartupIterationsRange");
const detailStartupIterationsFormattedEl = document.getElementById("detailStartupIterationsFormatted");
const detailMaxRandomItersRangeEl = document.getElementById("detailMaxRandomItersRange");
const detailMaxRandomItersFormattedEl = document.getElementById("detailMaxRandomItersFormatted");
const detailIterationAbsoluteMaxRangeEl = document.getElementById("detailIterationAbsoluteMaxRange");
const detailIterationAbsoluteMaxFormattedEl = document.getElementById("detailIterationAbsoluteMaxFormatted");
const detailHistoryCacheSizeRangeEl = document.getElementById("detailHistoryCacheSizeRange");
const detailHistoryCacheSizeFormattedEl = document.getElementById("detailHistoryCacheSizeFormatted");
const detailBurnRangeEl = document.getElementById("detailBurnRange");
const detailBurnFormattedEl = document.getElementById("detailBurnFormatted");
const detailOverlayAlphaRangeEl = document.getElementById("detailOverlayAlphaRange");
const detailOverlayAlphaFormattedEl = document.getElementById("detailOverlayAlphaFormatted");
const holdSpeedRangeEl = document.getElementById("holdSpeedRange");
const holdSpeedValueEl = document.getElementById("holdSpeedValue");
const holdRepeatMsRangeEl = document.getElementById("holdRepeatMsRange");
const holdRepeatMsValueEl = document.getElementById("holdRepeatMsValue");
const holdAccelStartMsRangeEl = document.getElementById("holdAccelStartMsRange");
const holdAccelStartMsValueEl = document.getElementById("holdAccelStartMsValue");
const holdAccelEndMsRangeEl = document.getElementById("holdAccelEndMsRange");
const holdAccelEndMsValueEl = document.getElementById("holdAccelEndMsValue");
const touchZoomDeadbandRangeEl = document.getElementById("touchZoomDeadbandRange");
const touchZoomDeadbandValueEl = document.getElementById("touchZoomDeadbandValue");
const touchZoomRatioMinRangeEl = document.getElementById("touchZoomRatioMinRange");
const touchZoomRatioMinValueEl = document.getElementById("touchZoomRatioMinValue");
const detailDebugToggleEl = document.getElementById("detailDebugToggle");
const detailInterestOverlayToggleEl = document.getElementById("detailInterestOverlayToggle");
const detailInterestOverlayOpacityRangeEl = document.getElementById("detailInterestOverlayOpacityRange");
const detailInterestOverlayOpacityFormattedEl = document.getElementById("detailInterestOverlayOpacityFormatted");
const detailInterestGridSizeRangeEl = document.getElementById("detailInterestGridSizeRange");
const detailInterestGridSizeFormattedEl = document.getElementById("detailInterestGridSizeFormatted");
const detailInterestScanIterationsRangeEl = document.getElementById("detailInterestScanIterationsRange");
const detailInterestScanIterationsFormattedEl = document.getElementById("detailInterestScanIterationsFormatted");
const detailInterestLyapunovEnabledToggleEl = document.getElementById("detailInterestLyapunovEnabledToggle");
const detailInterestLyapunovMinExponentRangeEl = document.getElementById("detailInterestLyapunovMinExponentRange");
const detailInterestLyapunovMinExponentFormattedEl = document.getElementById("detailInterestLyapunovMinExponentFormatted");
const detailInterestLyapunovDelta0RangeEl = document.getElementById("detailInterestLyapunovDelta0Range");
const detailInterestLyapunovDelta0FormattedEl = document.getElementById("detailInterestLyapunovDelta0Formatted");
const detailInterestLyapunovRescaleToggleEl = document.getElementById("detailInterestLyapunovRescaleToggle");
const detailInterestLyapunovMaxDistanceRangeEl = document.getElementById("detailInterestLyapunovMaxDistanceRange");
const detailInterestLyapunovMaxDistanceFormattedEl = document.getElementById("detailInterestLyapunovMaxDistanceFormatted");
const detailColorModeSelectEl = document.getElementById("detailColorModeSelect");
const detailLogStrengthRangeEl = document.getElementById("detailLogStrengthRange");
const detailLogStrengthFormattedEl = document.getElementById("detailLogStrengthFormatted");
const detailDensityGammaRangeEl = document.getElementById("detailDensityGammaRange");
const detailDensityGammaFormattedEl = document.getElementById("detailDensityGammaFormatted");
const detailHybridBlendRangeEl = document.getElementById("detailHybridBlendRange");
const detailHybridBlendFormattedEl = document.getElementById("detailHybridBlendFormatted");
const detailBackgroundColorEl = document.getElementById("detailBackgroundColor");
const detailBackgroundColorValueEl = document.getElementById("detailBackgroundColorValue");
const colorSettingsPanelEl = document.getElementById("colorSettingsPanel");
const colorSettingsCloseEl = document.getElementById("colorSettingsClose");
const modeSettingsPanelEl = document.getElementById("modeSettingsPanel");
const colorSettingsNameEl = document.getElementById("colorSettingsName");
const colorSettingsPreviewEl = document.getElementById("colorSettingsPreview");
const colorStopsListEl = document.getElementById("colorStopsList");
const addColorStopBtnEl = document.getElementById("addColorStopBtn");
const resetColorStopsBtnEl = document.getElementById("resetColorStopsBtn");
const backgroundSettingsSectionEl = document.getElementById("backgroundSettingsSection");
const modeSettingsSectionEls = Array.from(document.querySelectorAll("#modeSettingsSection, .modeSettingsSection"));
const settingsInfoTextEl = document.getElementById("settingsInfoText");
const settingsInfoPopupEl = document.getElementById("settingsInfoPopup");
const infoMaxRandomItersEl = document.getElementById("infoMaxRandomIters");
const infoBurnEl = document.getElementById("infoBurn");
const infoDebugEl = document.getElementById("infoDebug");
const infoColorModeEl = document.getElementById("infoColorMode");
const infoLogStrengthEl = document.getElementById("infoLogStrength");
const infoDensityGammaEl = document.getElementById("infoDensityGamma");
const infoHybridBlendEl = document.getElementById("infoHybridBlend");
const detailSeedXInputEl = document.getElementById("detailSeedXInput");
const detailSeedYInputEl = document.getElementById("detailSeedYInput");
const extraFormulaParamsEl = document.getElementById("extraFormulaParams");

const rangeInputMap = {
  a: { min: document.getElementById("rangeAmin"), value: document.getElementById("rangeAdefault"), max: document.getElementById("rangeAmax") },
  b: { min: document.getElementById("rangeBmin"), value: document.getElementById("rangeBdefault"), max: document.getElementById("rangeBmax") },
  c: { min: document.getElementById("rangeCmin"), value: document.getElementById("rangeCdefault"), max: document.getElementById("rangeCmax") },
  d: { min: document.getElementById("rangeDmin"), value: document.getElementById("rangeDdefault"), max: document.getElementById("rangeDmax") },
};

const quickSliderOverlay = document.getElementById("quickSliderOverlay");
const quickSliderBackdrop = document.getElementById("quickSliderBackdrop");
const quickSliderEl = document.getElementById("quickSlider");
const qsLabel = document.getElementById("qsLabel");
const qsValue = document.getElementById("qsValue");
const qsRange = document.getElementById("qsRange");
const qsMinus = document.getElementById("qsMinus");
const qsPlus = document.getElementById("qsPlus");
const qsClose = document.getElementById("qsClose");
const qsTop = document.querySelector(".qsTop");

const pickerOverlay = document.getElementById("pickerOverlay");
const pickerBackdrop = document.getElementById("pickerBackdrop");
const pickerTopControls = document.getElementById("pickerTopControls");
const pickerList = document.getElementById("pickerList");
const pickerPanel = document.getElementById("pickerPanel");
const paramOverlayEl = document.getElementById("paramOverlay");
const paramRowEl = document.getElementById("paramRow");
const bottomBarEl = document.querySelector(".bottomBar");
const topRightActionsEl = document.getElementById("topRightActions");
const cameraBtn = document.getElementById("cameraBtn");
const screenshotMenuOverlayEl = document.getElementById("screenshotMenuOverlay");
const screenshotMenuBackdropEl = document.getElementById("screenshotMenuBackdrop");
const screenshotMenuCloseEl = document.getElementById("screenshotMenuClose");
const screenshotMenuCleanEl = document.getElementById("screenshotMenuClean");
const screenshotMenuOverlayOptionEl = document.getElementById("screenshotMenuOverlayOption");
const screenshotMenu4kEl = document.getElementById("screenshotMenu4k");
const screenshotMenu8kEl = document.getElementById("screenshotMenu8k");
const screenshotMenuShareRetryEl = document.getElementById("screenshotMenuShareRetry");
const screenshotMenuShareRetryHintEl = document.getElementById("screenshotMenuShareRetryHint");
const scaleModeBtn = document.getElementById("scaleModeBtn");
const randomModeBtn = document.getElementById("randomModeBtn");
const randomModeTile = document.getElementById("randomModeTile");

const ITERATION_FALLBACK_ABSOLUTE_MAX = 1000000000;
const ITERATION_FALLBACK_STARTUP_DEFAULT = 500000;
const ITERATION_FALLBACK_RANDOM_MAX = 500000;
const HISTORY_CACHE_SIZE_DEFAULT = 6;
const HISTORY_CACHE_SIZE_MIN = 1;
const HISTORY_CACHE_SIZE_MAX = 20;
const ITERATION_MIN = 1000;

const sliderControls = {
  a: { button: document.getElementById("btnAlpha"), label: "a", paramKey: "a", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  b: { button: document.getElementById("btnBeta"), label: "b", paramKey: "b", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  c: { button: document.getElementById("btnDelta"), label: "c", paramKey: "c", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  d: { button: document.getElementById("btnGamma"), label: "d", paramKey: "d", min: 0, max: 100, sliderStep: 0.1, stepSize: 0.0001, displayDp: 4 },
  iters: { button: document.getElementById("btnIters"), label: "iter", paramKey: "iters", min: ITERATION_MIN, max: ITERATION_FALLBACK_ABSOLUTE_MAX, sliderStep: 100, stepSize: 100, displayDp: 0 },
  burn: { button: null, label: "Burn", paramKey: "burn", min: 0, max: 5000, sliderStep: 1, stepSize: 1, displayDp: 0 },
};

const DEFAULT_PARAM_RANGES = {
  a: [-80, 80],
  b: [-20, 20],
  c: [-20, 20],
  d: [-20, 20],
};

const RENDER_COLOR_MODES = {
  ITERATION_ORDER: "iteration_order",
  HIT_DENSITY_LINEAR: "hit_density_linear",
  HIT_DENSITY_LOG: "hit_density_log",
  HIT_DENSITY_GAMMA: "hit_density_gamma",
  HIT_DENSITY_PERCENTILE: "hit_density_percentile",
  HYBRID_DENSITY_AGE: "hybrid_density_age",
};

const RENDER_COLOR_MODE_SET = new Set(Object.values(RENDER_COLOR_MODES));

const INTEREST_GRID_SIZE_MIN = 8;
const INTEREST_GRID_SIZE_MAX = 256;
const INTEREST_SCAN_ITERATIONS_MIN = 100;
const INTEREST_SCAN_ITERATIONS_MAX = 5000;
const INTEREST_OVERLAY_OPACITY_MIN = 0.05;
const INTEREST_OVERLAY_OPACITY_MAX = 0.8;
const INTEREST_OVERLAY_OPACITY_DEFAULT = 0.2;
const PAN_ZOOM_SETTLE_MS = 200;
const INTEREST_LYAPUNOV_MIN_EXPONENT_MIN = -1;
const INTEREST_LYAPUNOV_MIN_EXPONENT_MAX = 1;
const INTEREST_LYAPUNOV_DELTA0_MIN = 1e-7;
const INTEREST_LYAPUNOV_DELTA0_MAX = 1e-3;
const INTEREST_LYAPUNOV_MAX_DISTANCE_MIN = 1e-3;
const INTEREST_LYAPUNOV_MAX_DISTANCE_MAX = 1e6;

function normalizeInterestGridSize(rawValue) {
  return Math.round(clamp(Number(rawValue), INTEREST_GRID_SIZE_MIN, INTEREST_GRID_SIZE_MAX));
}

function normalizeInterestOverlayOpacity(rawValue) {
  return clamp(Number(rawValue), INTEREST_OVERLAY_OPACITY_MIN, INTEREST_OVERLAY_OPACITY_MAX);
}

function normalizeIterationValue(rawValue, fallbackValue, min = ITERATION_MIN, max = ITERATION_FALLBACK_ABSOLUTE_MAX) {
  const numeric = Number(rawValue);
  const safeFallback = Number.isFinite(Number(fallbackValue)) ? Number(fallbackValue) : min;
  return Math.round(clamp(Number.isFinite(numeric) ? numeric : safeFallback, min, max));
}

function getIterationAbsoluteMax(defaults = appData?.defaults) {
  return normalizeIterationValue(defaults?.iterationAbsoluteMax, ITERATION_FALLBACK_ABSOLUTE_MAX, ITERATION_MIN, ITERATION_FALLBACK_ABSOLUTE_MAX);
}

function getIterationStartupDefault(defaults = appData?.defaults) {
  const absoluteMax = getIterationAbsoluteMax(defaults);
  const legacyValue = defaults?.launchIterationCap;
  const rawValue = defaults?.iterationStartupDefault ?? legacyValue;
  return normalizeIterationValue(rawValue, ITERATION_FALLBACK_STARTUP_DEFAULT, ITERATION_MIN, absoluteMax);
}

function getRandomIterationCap(defaults = appData?.defaults) {
  const absoluteMax = getIterationAbsoluteMax(defaults);
  return normalizeIterationValue(defaults?.maxRandomIters, ITERATION_FALLBACK_RANDOM_MAX, ITERATION_MIN, absoluteMax);
}

function getHistoryCacheSize(defaults = appData?.defaults) {
  return Math.round(clamp(Number(defaults?.historyCacheSize), HISTORY_CACHE_SIZE_MIN, HISTORY_CACHE_SIZE_MAX)) || HISTORY_CACHE_SIZE_DEFAULT;
}

function normalizeIterationSettings(defaults = appData?.defaults) {
  if (!defaults) {
    return {
      iterationAbsoluteMax: ITERATION_FALLBACK_ABSOLUTE_MAX,
      iterationStartupDefault: ITERATION_FALLBACK_STARTUP_DEFAULT,
      maxRandomIters: ITERATION_FALLBACK_RANDOM_MAX,
      historyCacheSize: HISTORY_CACHE_SIZE_DEFAULT,
      currentIterations: ITERATION_FALLBACK_STARTUP_DEFAULT,
    };
  }

  const iterationAbsoluteMax = getIterationAbsoluteMax(defaults);
  defaults.iterationAbsoluteMax = iterationAbsoluteMax;
  defaults.iterationStartupDefault = getIterationStartupDefault(defaults);
  defaults.maxRandomIters = getRandomIterationCap(defaults);
  defaults.historyCacheSize = getHistoryCacheSize(defaults);
  delete defaults.launchIterationCap;
  delete defaults.panZoomIterationCap;
  defaults.sliders = defaults.sliders || {};

  const iterationsRaw = defaults.sliders.iters;
  const hasStoredIterations = Number.isFinite(Number(iterationsRaw));
  defaults.sliders.iters = hasStoredIterations
    ? normalizeIterationValue(iterationsRaw, defaults.iterationStartupDefault, ITERATION_MIN, iterationAbsoluteMax)
    : defaults.iterationStartupDefault;

  sliderControls.iters.max = iterationAbsoluteMax;

  return {
    iterationAbsoluteMax,
    iterationStartupDefault: defaults.iterationStartupDefault,
    maxRandomIters: defaults.maxRandomIters,
    historyCacheSize: defaults.historyCacheSize,
    currentIterations: defaults.sliders.iters,
  };
}

const ctx = canvas.getContext("2d", { alpha: false });
const interestOverlayCtx = interestOverlayCanvas?.getContext("2d");
const manualOverlayCtx = manualOverlayCanvas?.getContext("2d");
let appData = null;
let currentFormulaId = null;
const uiState = {
  activeSliderKey: null,
  activePicker: null,
  activeColorSettingsMap: null,
  activePickerTrigger: null,
  activeInfoAnchorEl: null,
  activeInfoPanelEl: null,
  holdInterval: null,
  toastTimer: null,
  lastComputedUiMetrics: { fontSize: null, tileSize: null },
  lastSizingViewport: { width: 0, height: 0 },
  lastQuickSliderTopTapAt: 0,
  helpOverlayController: null,
  openRangesEditor: undefined,
  closeRangesEditor: undefined,
  openFormulaSettingsPanel: undefined,
  closeFormulaSettingsPanel: undefined,
  openColorSettingsPanel: undefined,
  closeColorSettingsPanel: undefined,
  openModeSettingsPanel: undefined,
  closeModeSettingsPanel: undefined,
  closeDismissablePanelsForTarget: undefined,
  layoutFormulaSettingsPanel: undefined,
  layoutColorSettingsPanel: undefined,
  layoutModeSettingsPanel: undefined,
  isPanelOpen: undefined,
  getActiveColourPanelSettings: undefined,
};
const renderState = {
  lastRenderMeta: null,
  lastFullRenderMeta: null,
  lastDrawTimestamp: 0,
  fpsEstimate: 0,
  wasManualOverlayActive: false,
  drawScheduled: false,
  drawDirty: false,
  drawInProgress: false,
  panZoomInteractionActive: false,
  panZoomSettleTimer: null,
  singleTouchModulationStartDrawTimer: null,
  renderProgressHideTimer: null,
  renderProgressVisible: false,
  renderProgressStartedAt: 0,
  renderProgressShownThisDraw: false,
  renderRevision: 0,
  renderGeneration: 0,
  currentRenderCache: null,
  activePanZoomCacheEntry: null,
  fixedView: {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  },
};

const HOLD_REPEAT_MS_DEFAULT = 60;
const HOLD_REPEAT_MS_MIN = 20;
const HOLD_REPEAT_MS_MAX = 300;
const HOLD_ACCEL_START_MS_DEFAULT = 350;
const HOLD_ACCEL_START_MS_MIN = 0;
const HOLD_ACCEL_START_MS_MAX = 5000;
const HOLD_ACCEL_END_MS_DEFAULT = 1400;
const HOLD_ACCEL_END_MS_MIN = 100;
const HOLD_ACCEL_END_MS_MAX = 8000;
const HOLD_MAX_MULTIPLIER = 30;
const HOLD_SPEED_SCALE_MIN = 0.25;
const HOLD_SPEED_SCALE_MAX = 50;
const NAME_MAX_CHARS = 20;
const LANDSCAPE_HINT_STORAGE_KEY = "hopalong.landscapeHintShown.v1";
const PARAM_MOVE_CANCEL_PX = 10;
const PARAM_SWIPE_TRIGGER_PX = 20;
const DOUBLE_TAP_MS = 320;
const PARAM_LONG_PRESS_MS = 550;
const PARAM_MODES_STORAGE_KEY = "hopalong.paramModes.v1";
const APP_DEFAULTS_STORAGE_KEY = "hopalong.defaults.v2";
const PARAM_LOCK_STATES = new Set(["fix", "rand"]);
const PARAM_MOD_AXES = new Set(["none", "manX", "manY"]);
const PARAM_MODE_KEYS = ["formula", "cmap", "a", "b", "c", "d", "iters"];
const MOD_AXIS_ELIGIBLE_KEYS = new Set(["a", "b", "c", "d"]);
const paramTileTargets = {
  formula: { button: formulaBtn, modeKey: "formula", shortTap: () => openPicker("formula", formulaBtn) },
  cmap: { button: cmapBtn, modeKey: "cmap", shortTap: () => openPicker("cmap", cmapBtn) },
  a: { button: sliderControls.a.button, modeKey: sliderControls.a.paramKey, shortTap: () => openQuickSlider("a") },
  b: { button: sliderControls.b.button, modeKey: sliderControls.b.paramKey, shortTap: () => openQuickSlider("b") },
  c: { button: sliderControls.c.button, modeKey: sliderControls.c.paramKey, shortTap: () => openQuickSlider("c") },
  d: { button: sliderControls.d.button, modeKey: sliderControls.d.paramKey, shortTap: () => openQuickSlider("d") },
  iters: { button: sliderControls.iters.button, modeKey: sliderControls.iters.paramKey, shortTap: () => openQuickSlider("iters") },
};

const exportState = {
  exportManager: null,
};
const historyStateRef = {
  historyRenderCache: new Map(),
  sharedParamsOverride: null,
  sharedParamsFormulaId: null,
};
let paramModes = {};
Object.assign(uiState, {
  lastParamTap: { targetKey: null, timestamp: 0 },
  pendingTileTapTimer: null,
  randomAllNextMode: "rand",
  keyHold: { code: null, axis: null, direction: 0, sliderKey: null, interval: null, startMs: 0 },
  isKeyboardManualModulating: false,
});
const paramPressState = {
  pointerId: null,
  targetKey: null,
  startX: 0,
  startY: 0,
  timer: null,
  longTriggered: false,
  moved: false,
};

const HISTORY_LIMIT = 50;
const OVERLAY_TEXT_COLOR = "#7f7f7f";
const QR_QUIET_ZONE_MODULES = 4;
const INTERACTION_STATE = {
  NONE: "none",
  MOD_1: "mod1",
  TWO_ACTIVE: "two_active",
  PAN_MOUSE_RMB: "pan_mouse_rmb",
};
const DPR = window.devicePixelRatio || 1;
const PAN_DEADBAND_PX = 1.5 * DPR;
const TOUCH_ZOOM_DEADBAND_PX_DEFAULT = 2.5;
const TOUCH_ZOOM_DEADBAND_PX_MIN = 0;
const TOUCH_ZOOM_DEADBAND_PX_MAX = 40;
const TOUCH_ZOOM_RATIO_MIN_DEFAULT = 0.002;
const TOUCH_ZOOM_RATIO_MIN_MIN = 0;
const TOUCH_ZOOM_RATIO_MIN_MAX = 0.12;
const SINGLE_TOUCH_MODULATION_START_DRAW_DELAY_MS = 24;
const HISTORY_TAP_MAX_MOVE_PX = 10;
const MODULATION_SENSITIVITY = 80;

const LEGACY_SLIDER_KEY_MAP = {
  alpha: "a",
  beta: "b",
  delta: "c",
  gamma: "d",
};

function migrateLegacySliderKeys(sliders) {
  const next = { ...(sliders || {}) };
  for (const [legacyKey, currentKey] of Object.entries(LEGACY_SLIDER_KEY_MAP)) {
    if (!Number.isFinite(next[currentKey]) && Number.isFinite(next[legacyKey])) {
      next[currentKey] = Number(next[legacyKey]);
    }
    delete next[legacyKey];
  }
  return next;
}

const sliderKeyByParamKey = {
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  iters: "iters",
  burn: "burn",
};

const RANGE_KEYS = ["a", "b", "c", "d"];

let builtInFormulaRanges = {};
let rangesEditorFormulaId = null;

const overlayState = {
  interactionState: INTERACTION_STATE.NONE,
  activePointers: new Map(),
  primaryPointerId: null,
  lastPointerPosition: null,
  isManualModulating: false,
  twoFingerGesture: null,
  lastTwoDebug: null,
  historyTapTracker: null,
  suppressHistoryTap: false,
};

function clampLabel(text, maxChars = NAME_MAX_CHARS) {
  const normalized = String(text ?? "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function invalidatePendingRenders() {
  renderState.renderGeneration += 1;
  return renderState.renderGeneration;
}

function isRenderGenerationCurrent(generation) {
  return generation === renderState.renderGeneration;
}

function requestDraw({ invalidate = true } = {}) {
  if (appData) {
    refreshParamButtons();
    updateQuickSliderReadout();
    syncDetailedSettingsControls();
  }

  if (invalidate) {
    invalidatePendingRenders();
  }
  renderState.drawDirty = true;
  if (exportState.exportManager?.isHighResExportInProgress()) {
    return;
  }
  if (renderState.drawScheduled) {
    return;
  }

  renderState.drawScheduled = true;
  window.requestAnimationFrame(async () => {
    renderState.drawScheduled = false;
    if (!renderState.drawDirty || renderState.drawInProgress) {
      return;
    }

    renderState.drawDirty = false;
    renderState.drawInProgress = true;
    try {
      await draw();
    } finally {
      renderState.drawInProgress = false;
      if (renderState.drawDirty) {
        requestDraw({ invalidate: false });
      }
    }
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function createFrameCacheCanvas(width, height) {
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = width;
  frameCanvas.height = height;
  return frameCanvas;
}

function cloneFrameCanvas(sourceCanvas) {
  const frameCanvas = createFrameCacheCanvas(sourceCanvas.width, sourceCanvas.height);
  const frameCtx = frameCanvas.getContext("2d", { willReadFrequently: true });
  if (!frameCtx) {
    throw new Error("Frame cache context unavailable.");
  }
  frameCtx.drawImage(sourceCanvas, 0, 0);
  return frameCanvas;
}

function getRenderStateKey(stateLike = captureCurrentState()) {
  const state = stateLike || {};
  return stableStringify({
    formulaId: state.formulaId ?? currentFormulaId,
    cmapName: state.cmapName ?? appData?.defaults?.cmapName,
    sliders: state.sliders ?? appData?.defaults?.sliders,
    derivedParams: state.derivedParams ?? getDerivedParams(),
    iterationAbsoluteMax: state.iterationAbsoluteMax ?? getIterationAbsoluteMax(),
    iterations: state.sliders?.iters ?? appData?.defaults?.sliders?.iters,
    burn: state.sliders?.burn ?? appData?.defaults?.sliders?.burn,
    scaleMode: state.scaleMode ?? getScaleMode(),
    fixedView: state.fixedView ?? renderState.fixedView,
    seed: state.seed ?? getSeedForFormula(state.formulaId ?? currentFormulaId),
    renderColoring: state.renderColoring ?? getRenderColoringOptions(),
    backgroundColor: state.backgroundColor ?? appData?.defaults?.backgroundColor,
    rangesOverridesByFormula: state.rangesOverridesByFormula ?? appData?.defaults?.rangesOverridesByFormula,
    formulaParamDefaultsByFormula: state.formulaParamDefaultsByFormula ?? appData?.defaults?.formulaParamDefaultsByFormula,
    formulaSeeds: state.formulaSeeds ?? appData?.defaults?.formulaSeeds,
    colorMapStopOverrides: state.colorMapStopOverrides ?? getColorMapStopOverrides(),
  });
}

function drawCachedFrameEntry(frameEntry, { syncExport = true } = {}) {
  if (!frameEntry?.canvas) {
    return false;
  }
  const viewportWidth = Math.max(1, canvas.width);
  const viewportHeight = Math.max(1, canvas.height);
  const cropX = Math.max(0, Math.floor((frameEntry.canvas.width - viewportWidth) * 0.5));
  const cropY = Math.max(0, Math.floor((frameEntry.canvas.height - viewportHeight) * 0.5));
  const cropW = Math.min(viewportWidth, frameEntry.canvas.width - cropX);
  const cropH = Math.min(viewportHeight, frameEntry.canvas.height - cropY);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(frameEntry.canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  if (frameEntry.meta) {
    renderState.lastRenderMeta = frameEntry.meta;
    renderState.lastFullRenderMeta = frameEntry.fullMeta || frameEntry.meta;
    redrawOverlayCanvases(renderState.lastRenderMeta);
  }
  if (syncExport) {
    exportState.exportManager?.syncCachedFrame(frameEntry, renderState.renderRevision);
  }
  return true;
}

function drawInteractionFrameFromCache(frameEntry) {
  if (!frameEntry?.canvas || !frameEntry.sourceFixedView || !renderState.fixedView) {
    return false;
  }
  const viewportWidth = Math.max(1, canvas.width);
  const viewportHeight = Math.max(1, canvas.height);
  const sourceZoom = Number(frameEntry.sourceFixedView.zoom) || 1;
  const targetZoom = Number(renderState.fixedView.zoom) || 1;
  if (sourceZoom <= 0 || targetZoom <= 0) {
    return false;
  }
  const zoomRatio = targetZoom / sourceZoom;
  if (!Number.isFinite(zoomRatio) || zoomRatio <= 0) {
    return false;
  }

  const cropX = Math.max(0, (frameEntry.canvas.width - viewportWidth) * 0.5);
  const cropY = Math.max(0, (frameEntry.canvas.height - viewportHeight) * 0.5);
  const sourceRectWidth = viewportWidth / zoomRatio;
  const sourceRectHeight = viewportHeight / zoomRatio;
  const sourceRectX = cropX + viewportWidth * 0.5 + (frameEntry.sourceFixedView.offsetX || 0)
    - (viewportWidth * 0.5 + (renderState.fixedView.offsetX || 0)) / zoomRatio;
  const sourceRectY = cropY + viewportHeight * 0.5 + (frameEntry.sourceFixedView.offsetY || 0)
    - (viewportHeight * 0.5 + (renderState.fixedView.offsetY || 0)) / zoomRatio;

  const clippedX = clamp(sourceRectX, 0, frameEntry.canvas.width);
  const clippedY = clamp(sourceRectY, 0, frameEntry.canvas.height);
  const clippedMaxX = clamp(sourceRectX + sourceRectWidth, 0, frameEntry.canvas.width);
  const clippedMaxY = clamp(sourceRectY + sourceRectHeight, 0, frameEntry.canvas.height);
  const clippedWidth = clippedMaxX - clippedX;
  const clippedHeight = clippedMaxY - clippedY;
  if (clippedWidth <= 0 || clippedHeight <= 0) {
    return false;
  }

  const destScaleX = viewportWidth / sourceRectWidth;
  const destScaleY = viewportHeight / sourceRectHeight;
  const destX = (clippedX - sourceRectX) * destScaleX;
  const destY = (clippedY - sourceRectY) * destScaleY;
  const destWidth = clippedWidth * destScaleX;
  const destHeight = clippedHeight * destScaleY;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(frameEntry.canvas, clippedX, clippedY, clippedWidth, clippedHeight, destX, destY, destWidth, destHeight);
  if (frameEntry.meta) {
    renderState.lastRenderMeta = frameEntry.meta;
    renderState.lastFullRenderMeta = frameEntry.fullMeta || frameEntry.meta;
    redrawOverlayCanvases(renderState.lastRenderMeta);
  }
  return true;
}

function pruneHistoryRenderCache() {
  const maxEntries = getHistoryCacheSize();
  while (historyStateRef.historyRenderCache.size > maxEntries) {
    const oldestKey = historyStateRef.historyRenderCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    if (renderState.currentRenderCache && oldestKey === renderState.currentRenderCache.key && historyStateRef.historyRenderCache.size > 1) {
      const currentEntry = historyStateRef.historyRenderCache.get(oldestKey);
      historyStateRef.historyRenderCache.delete(oldestKey);
      historyStateRef.historyRenderCache.set(oldestKey, currentEntry);
      continue;
    }
    historyStateRef.historyRenderCache.delete(oldestKey);
  }
}

function getHistoryCachedFrame(key) {
  if (!key || !historyStateRef.historyRenderCache.has(key)) {
    return null;
  }
  const entry = historyStateRef.historyRenderCache.get(key);
  historyStateRef.historyRenderCache.delete(key);
  historyStateRef.historyRenderCache.set(key, entry);
  return entry;
}

function cacheAccurateFrame({ key, fullCanvas, fullMeta, frameMeta, sourceFixedView }) {
  if (!key || !fullCanvas || !fullMeta || !frameMeta) {
    return null;
  }
  const cloneMeta = (value) => (typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)));
  const entry = {
    key,
    canvas: cloneFrameCanvas(fullCanvas),
    fullMeta: cloneMeta(fullMeta),
    meta: cloneMeta(frameMeta),
    sourceFixedView: { ...(sourceFixedView || renderState.fixedView) },
  };
  renderState.currentRenderCache = entry;
  historyStateRef.historyRenderCache.delete(key);
  historyStateRef.historyRenderCache.set(key, entry);
  pruneHistoryRenderCache();
  return entry;
}

function isHelpOverlayOpen() {
  return Boolean(uiState.helpOverlayController?.isOpen?.());
}

function positionToastForTopActions() {
  if (!toastEl) {
    return false;
  }

  toastEl.classList.remove("is-below-actions");
  toastEl.style.removeProperty("--toast-below-top");

  const actionsEl = document.getElementById("topRightActions");
  if (!actionsEl) {
    return false;
  }

  const toastRect = toastEl.getBoundingClientRect();
  const actionsRect = actionsEl.getBoundingClientRect();
  const overlaps = !(
    toastRect.right < actionsRect.left
    || toastRect.left > actionsRect.right
    || toastRect.bottom < actionsRect.top
    || toastRect.top > actionsRect.bottom
  );

  if (!overlaps) {
    return false;
  }

  toastEl.classList.add("is-below-actions");
  toastEl.style.setProperty("--toast-below-top", `${Math.round(actionsRect.bottom + 8)}px`);
  return true;
}

function suppressToastWhenHelpOpenAndBelowActions() {
  if (!toastEl) {
    return;
  }

  if (isHelpOverlayOpen() && toastEl.classList.contains("is-below-actions")) {
    toastEl.classList.remove("is-visible");
  }
}

function showToast(message) {
  if (!toastEl) {
    return;
  }

  renderState.renderProgressVisible = false;
  window.clearTimeout(renderState.renderProgressHideTimer);
  renderState.renderProgressHideTimer = null;
  window.clearTimeout(uiState.toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();

  uiState.toastTimer = window.setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, 5000);
}

function hideRenderProgressToast() {
  if (!toastEl) {
    return;
  }

  renderState.renderProgressVisible = false;
  window.clearTimeout(renderState.renderProgressHideTimer);
  renderState.renderProgressHideTimer = null;
  toastEl.classList.remove("is-visible");
  toastEl.classList.remove("is-below-actions");
  toastEl.style.removeProperty("--toast-below-top");
}

function updateRenderProgressToast(percent, isComplete = false) {
  if (exportState.exportManager?.isHighResExportInProgress()) {
    return;
  }

  if (!toastEl) {
    return;
  }

  const elapsedMs = performance.now() - renderState.renderProgressStartedAt;
  if (!isComplete && elapsedMs < 1000) {
    return;
  }
  if (isComplete && !renderState.renderProgressShownThisDraw) {
    return;
  }

  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  window.clearTimeout(renderState.renderProgressHideTimer);
  renderState.renderProgressHideTimer = null;
  toastEl.textContent = `Render ${normalizedPercent}%`;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();
  renderState.renderProgressVisible = true;
  renderState.renderProgressShownThisDraw = true;

  if (isComplete) {
    renderState.renderProgressHideTimer = window.setTimeout(() => {
      hideRenderProgressToast();
    }, 2000);
  }
}

function updateExportRenderProgressToast(label, percent, isComplete = false) {
  if (!toastEl) {
    return;
  }

  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  window.clearTimeout(renderState.renderProgressHideTimer);
  renderState.renderProgressHideTimer = null;
  toastEl.textContent = `${label}: ${normalizedPercent}%`;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();
  renderState.renderProgressVisible = true;

  if (isComplete) {
    renderState.renderProgressHideTimer = window.setTimeout(() => {
      hideRenderProgressToast();
    }, 2000);
  }
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

function resizeCanvasElement(targetCanvas, width, height) {
  if (!targetCanvas) {
    return false;
  }
  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
    return true;
  }
  return false;
}

function resizeCanvas() {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));

  const didResizeBase = resizeCanvasElement(canvas, width, height);
  const didResizeInterest = resizeCanvasElement(interestOverlayCanvas, width, height);
  const didResizeManual = resizeCanvasElement(manualOverlayCanvas, width, height);
  return didResizeBase || didResizeInterest || didResizeManual;
}


function actualToSliderValue(actualValue, min, max) {
  const span = Math.max(max - min, 1e-9);
  return clamp(((actualValue - min) / span) * 100, 0, 100);
}

function formatNumberForUi(value, fractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function getRangeValuesForFormula(formulaId) {
  if (!appData || !formulaId) {
    return DEFAULT_PARAM_RANGES;
  }

  const override = appData.defaults.rangesOverridesByFormula?.[formulaId];
  const builtIn = builtInFormulaRanges[formulaId];
  return override || builtIn || DEFAULT_PARAM_RANGES;
}

function getCurrentFormulaRange() {
  return getRangeValuesForFormula(currentFormulaId);
}

function applyFormulaPresetToSliders(formulaId) {
  const preset = appData?.defaults?.formulaParamDefaultsByFormula?.[formulaId] || FORMULA_DEFAULT_PRESETS[formulaId];
  if (!preset || !appData?.defaults?.sliders) {
    return false;
  }

  const range = getRangeValuesForFormula(formulaId);
  const keyToSlider = { a: "a", b: "b", c: "c", d: "d" };

  for (const [paramKey, sliderKey] of Object.entries(keyToSlider)) {
    if (!Object.prototype.hasOwnProperty.call(preset, paramKey)) {
      continue;
    }

    const value = Number(preset[paramKey]);
    if (!Number.isFinite(value)) {
      continue;
    }

    const [min, max] = range[paramKey];
    appData.defaults.sliders[sliderKey] = actualToSliderValue(value, min, max);
  }

  return true;
}

function findFormulaMeta(formulaId) {
  return appData?.formulas?.find((formula) => formula.id === formulaId) || null;
}

function getFormulaUsedParams(formulaId) {
  const formula = findFormulaMeta(formulaId);
  if (!formula || !Array.isArray(formula.usedParams)) {
    return ["a", "b", "c", "d"];
  }
  return formula.usedParams;
}

function isFormulaParamUsed(formulaId, paramKey) {
  return getFormulaUsedParams(formulaId).includes(paramKey);
}

function isSliderKeyAvailable(sliderKey) {
  if (!["a", "b", "c", "d"].includes(sliderKey)) {
    return true;
  }
  return isFormulaParamUsed(currentFormulaId, sliderKey);
}

function renderFormulaDetail(formulaId) {
  if (!rangesFormulaLineXEl || !rangesFormulaLineYEl) {
    return;
  }

  const formula = findFormulaMeta(formulaId);
  const ui = FORMULA_UI_EQUATIONS[formulaId] || null;

  if (rangesFormulaNameEl) {
    rangesFormulaNameEl.textContent = ui?.name || formula?.name || formulaId || "Formula";
  }

  rangesFormulaLineXEl.textContent = String(ui?.xNew || "x_new = --").trim();
  rangesFormulaLineYEl.textContent = String(ui?.yNew || "y_new = --").trim();
}

function getDerivedParams() {
  if (historyStateRef.sharedParamsOverride && historyStateRef.sharedParamsFormulaId === currentFormulaId) {
    return { ...historyStateRef.sharedParamsOverride };
  }

  return getParamsForFormula({
    rangesForFormula: getCurrentFormulaRange(),
    sliderDefaults: appData.defaults.sliders,
  });
}

function clearSharedParamsOverride() {
  historyStateRef.sharedParamsOverride = null;
  historyStateRef.sharedParamsFormulaId = null;
}

function buildQrCanvas(text, sizePx) {
  const qrcodeFactory = window.qrcode;
  if (typeof qrcodeFactory !== "function") {
    throw new Error("QR generator unavailable.");
  }

  const qr = qrcodeFactory(0, "M");
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const totalModules = moduleCount + QR_QUIET_ZONE_MODULES * 2;
  const canvasEl = document.createElement("canvas");
  canvasEl.width = sizePx;
  canvasEl.height = sizePx;
  const qrCtx = canvasEl.getContext("2d", { alpha: false });
  if (!qrCtx) {
    throw new Error("QR canvas context unavailable.");
  }

  qrCtx.fillStyle = "#000000";
  qrCtx.fillRect(0, 0, sizePx, sizePx);
  qrCtx.fillStyle = OVERLAY_TEXT_COLOR;

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!qr.isDark(row, col)) {
        continue;
      }

      const x = Math.round(((col + QR_QUIET_ZONE_MODULES) * sizePx) / totalModules);
      const y = Math.round(((row + QR_QUIET_ZONE_MODULES) * sizePx) / totalModules);
      const nextX = Math.round(((col + QR_QUIET_ZONE_MODULES + 1) * sizePx) / totalModules);
      const nextY = Math.round(((row + QR_QUIET_ZONE_MODULES + 1) * sizePx) / totalModules);
      qrCtx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
    }
  }

  return canvasEl;
}

function resolveInitialFormulaId() {
  const ids = new Set(appData.formulas.map((formula) => formula.id));
  return ids.has(appData.defaults.formulaId) ? appData.defaults.formulaId : appData.formulas[0].id;
}

function resolveInitialColorMap() {
  const names = new Set(appData.colormaps || []);
  return names.has(appData.defaults.cmapName) ? appData.defaults.cmapName : appData.colormaps[0];
}


function rgbToHex(rgb) {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) {
    return [5, 7, 12];
  }
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function applyBackgroundTheme() {
  const bg = appData?.defaults?.backgroundColor || "#05070c";
  document.body.style.background = bg;
  const [r, g, b] = hexToRgb(bg);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isLight = luminance > 0.52;
  document.documentElement.style.setProperty("--ui-gray-rgb", isLight ? "44, 50, 60" : "148, 154, 164");
  document.documentElement.style.setProperty("--panel-rgb", isLight ? "255, 255, 255" : "12, 14, 20");
}

function applyDialogTransparency() {
  const alpha = clamp(Number(appData?.defaults?.overlayAlpha), 0.1, 1);
  document.documentElement.style.setProperty("--dialog-alpha", String(alpha));
}
function buildColorMapGradient(cmapName) {
  const stops = [];
  const count = 9;
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const [r, g, b] = sampleColorMap(cmapName, t, hexToRgb(appData?.defaults?.backgroundColor || "#05070c"));
    stops.push(`rgb(${r}, ${g}, ${b}) ${Math.round(t * 100)}%`);
  }

  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function getActiveActualValue() {
  if (!uiState.activeSliderKey) {
    return null;
  }

  return getControlValue(uiState.activeSliderKey);
}

function normalizeSliderDefaults() {
  normalizeIterationSettings();
  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    const rawValue = Number(appData.defaults.sliders?.[sliderKey]);
    const fallbackValue = sliderKey === "burn" ? 120 : (sliderKey === "iters" ? getIterationStartupDefault() : 50);
    const safeValue = Number.isFinite(rawValue) ? rawValue : fallbackValue;
    const clampedValue = clamp(safeValue, control.min, control.max);
    appData.defaults.sliders[sliderKey] = (sliderKey === "iters" || sliderKey === "burn") ? Math.round(clampedValue) : clampedValue;
  }
}

function getControlValue(sliderKey) {
  const control = sliderControls[sliderKey];
  if (control.paramKey === "iters" || control.paramKey === "burn") {
    return appData.defaults.sliders[sliderKey];
  }

  const params = getDerivedParams();
  return params[control.paramKey];
}

function formatControlValue(control, value) {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return formatNumberForUi(value, control.displayDp ?? 4);
}

function refreshParamButtons() {
  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    if (!control.button) {
      continue;
    }

    const isUnusedParam = ["a", "b", "c", "d"].includes(sliderKey) && !isSliderKeyAvailable(sliderKey);
    control.button.disabled = Boolean(isUnusedParam);
    control.button.classList.toggle("is-na", Boolean(isUnusedParam));
    control.button.textContent = isUnusedParam ? "-" : formatControlValue(control, getControlValue(sliderKey));
  }

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  formulaBtn.textContent = clampLabel(formula?.name || currentFormulaId);
  cmapBtn.textContent = clampLabel(appData.defaults.cmapName);
}

function updateCurrentPickerSelection() {
  const options = Array.from(pickerList.querySelectorAll(".pickerOption"));
  for (const option of options) {
    const isSelected = option.dataset.value === (uiState.activePicker === "formula" ? currentFormulaId : appData.defaults.cmapName);
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
  applyResponsiveUiSizing();
}

function collectUiTextLines() {
  const lines = [];
  const trackedNodes = [...document.querySelectorAll(".poLabel, .poBtn, #randomModeBtn, #scaleModeBtn")];

  for (const node of trackedNodes) {
    const text = String(node.textContent || "").trim();
    if (!text) {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) {
        lines.push(trimmed);
      }
    }
  }

  // Include the longest possible values (not just current selection) so the
  // shared font size remains stable and still fits any formula/colormap choice.
  if (appData?.formulas?.length) {
    for (const formula of appData.formulas) {
      lines.push(clampLabel(formula?.name || formula?.id || ""));
    }
  }
  if (appData?.colormaps?.length) {
    for (const cmapName of appData.colormaps) {
      lines.push(clampLabel(cmapName || ""));
    }
  }

  lines.push("Random", "All", "Fix", "Auto", "Scale", "Fixed", "iter");

  return lines;
}

function measureLineWidth(text, fontSizePx) {
  if (!ctx) {
    return text.length * fontSizePx * 0.6;
  }
  ctx.save();
  ctx.font = `${fontSizePx}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function applyResponsiveUiSizing({ force = false } = {}) {
  if (!bottomBarEl) {
    return;
  }

  const viewportWidth = Math.round(window.innerWidth || 0);
  const viewportHeight = Math.round(window.innerHeight || 0);
  const viewportUnchanged = viewportWidth === uiState.lastSizingViewport.width && viewportHeight === uiState.lastSizingViewport.height;
  if (!force && viewportUnchanged) {
    return;
  }
  uiState.lastSizingViewport = { width: viewportWidth, height: viewportHeight };

  const root = document.documentElement;
  const styles = window.getComputedStyle(bottomBarEl);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "6") || 6;
  const barWidth = bottomBarEl.clientWidth;
  if (!barWidth) {
    return;
  }

  const tileWidth = Math.max(60, (barWidth - gap * 7) / 8);
  const horizontalPadding = 14;
  const availableTextWidth = Math.max(24, tileWidth - horizontalPadding);
  const textLines = collectUiTextLines();

  let fontSize = 18;
  while (fontSize > 10) {
    const widestLine = textLines.reduce((max, line) => Math.max(max, measureLineWidth(line, fontSize)), 0);
    if (widestLine <= availableTextWidth) {
      break;
    }
    fontSize -= 0.5;
  }

  const reducedFontSize = fontSize * 0.8;
  const roundedFontSize = Math.max(10, Math.floor(reducedFontSize * 2) / 2);
  if (uiState.lastComputedUiMetrics.fontSize !== roundedFontSize) {
    root.style.setProperty("--ui-font-size", `${roundedFontSize}px`);
    uiState.lastComputedUiMetrics.fontSize = roundedFontSize;
  }

  const firstTile = bottomBarEl.querySelector(".poItem");
  const measuredTileHeight = firstTile ? Math.round(firstTile.getBoundingClientRect().height) : 42;
  const actionSize = Math.max(34, measuredTileHeight);

  if (uiState.lastComputedUiMetrics.tileSize !== actionSize) {
    root.style.setProperty("--tile-size", `${actionSize}px`);
    uiState.lastComputedUiMetrics.tileSize = actionSize;
  }

  if (topRightActionsEl) {
    topRightActionsEl.style.alignItems = "stretch";
  }
}

function setRangesEditorWarning(message = "") {
  if (rangesEditorWarningEl) {
    rangesEditorWarningEl.textContent = message;
  }
}

function getSelectedRangesEditorFormulaId() {
  return rangesEditorFormulaId || currentFormulaId;
}

function loadFormulaRangesIntoEditor(formulaId) {
  const ranges = getRangeValuesForFormula(formulaId);
  const presetValues = appData?.defaults?.formulaParamDefaultsByFormula?.[formulaId] || FORMULA_DEFAULT_PRESETS[formulaId] || {};
  const formula = findFormulaMeta(formulaId);
  if (rangesFormulaNameEl) {
    rangesFormulaNameEl.textContent = formula?.name || formulaId || "Formula";
  }
  if (extraFormulaParamsEl) {
    extraFormulaParamsEl.innerHTML = "";
  }
  for (const key of RANGE_KEYS) {
    const field = rangeInputMap[key];
    if (!field) {
      continue;
    }

    const isUsed = isFormulaParamUsed(formulaId, key);
    for (const inputEl of [field.min, field.value, field.max]) {
      if (!inputEl) {
        continue;
      }
      inputEl.disabled = !isUsed;
      inputEl.classList.toggle("is-na", !isUsed);
    }

    if (!isUsed) {
      field.min.value = "-";
      field.value.value = "-";
      field.max.value = "-";
      continue;
    }

    field.min.value = String(ranges[key][0]);
    field.value.value = String(Number.isFinite(Number(presetValues[key])) ? Number(presetValues[key]) : "");
    field.max.value = String(ranges[key][1]);
  }

  const extraParamKeys = getFormulaUsedParams(formulaId)
    .filter((key) => !RANGE_KEYS.includes(key));
  if (extraFormulaParamsEl && extraParamKeys.length > 0) {
    for (const key of extraParamKeys) {
      const row = document.createElement("div");
      row.className = "formulaParamRow";
      const label = document.createElement("span");
      label.className = "formulaParamKey";
      label.textContent = key;
      row.append(label);
      for (let index = 0; index < 3; index += 1) {
        const input = document.createElement("input");
        input.className = "rangeInput is-na";
        input.value = "-";
        input.disabled = true;
        row.append(input);
      }
      extraFormulaParamsEl.append(row);
    }
  }
  rangesEditorFormulaId = formulaId;
  setRangesEditorWarning("");
  renderFormulaDetail(formulaId);
  syncSeedEditorInputs(formulaId);
}

function remapSliderToPreserveParams(formulaId, nextRange) {
  if (!formulaId || formulaId !== currentFormulaId) {
    return;
  }

  clearSharedParamsOverride();

  const previousRange = getRangeValuesForFormula(formulaId);
  const keysToSliders = { a: "a", b: "b", c: "c", d: "d" };

  for (const key of RANGE_KEYS) {
    const sliderKey = keysToSliders[key];
    const sliderValue = Number(appData.defaults.sliders[sliderKey]);
    const oldMin = previousRange[key][0];
    const oldMax = previousRange[key][1];
    const newMin = nextRange[key][0];
    const newMax = nextRange[key][1];
    const t = clamp(sliderValue / 100, 0, 1);
    const actual = oldMin + (oldMax - oldMin) * t;
    const denom = Math.max(newMax - newMin, 1e-9);
    const normalized = ((actual - newMin) / denom) * 100;
    appData.defaults.sliders[sliderKey] = clamp(normalized, 0, 100);
  }
}

function readRangeEditorDraft(formulaId) {
  const nextRanges = {};
  const nextDefaults = {};
  const currentRanges = getRangeValuesForFormula(formulaId);
  const currentDefaults = appData?.defaults?.formulaParamDefaultsByFormula?.[formulaId] || FORMULA_DEFAULT_PRESETS[formulaId] || {};
  for (const key of RANGE_KEYS) {
    const field = rangeInputMap[key];
    const isUsed = isFormulaParamUsed(formulaId, key);
    if (!isUsed) {
      nextRanges[key] = currentRanges[key];
      if (Object.prototype.hasOwnProperty.call(currentDefaults, key)) {
        nextDefaults[key] = Number(currentDefaults[key]);
      }
      continue;
    }

    const minValue = Number(field?.min?.value);
    const defaultValueRaw = String(field?.value?.value ?? "").trim();
    const maxValue = Number(field?.max?.value);
    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      return { error: `Please enter valid numeric values for ${key}.` };
    }
    if (minValue >= maxValue) {
      return { error: `Invalid range for ${key}: min must be less than max.` };
    }
    if (defaultValueRaw.length > 0) {
      const defaultValue = Number(defaultValueRaw);
      if (!Number.isFinite(defaultValue)) {
        return { error: `Please enter a valid default value for ${key}.` };
      }
      if (defaultValue < minValue || defaultValue > maxValue) {
        return { error: `Default ${key} must be inside min/max.` };
      }
      nextDefaults[key] = defaultValue;
    }
    nextRanges[key] = [minValue, maxValue];
  }
  return { ranges: nextRanges, defaults: nextDefaults };
}

function readSeedEditorDraft(formulaId) {
  const builtIn = getBuiltInFormulaSeed(formulaId);
  const xSeed = Number(detailSeedXInputEl?.value);
  const ySeed = Number(detailSeedYInputEl?.value);
  if (!Number.isFinite(xSeed) || !Number.isFinite(ySeed)) {
    return { error: "Please enter valid numeric seed values." };
  }

  return {
    seed: {
      x: normalizeSeedValue(xSeed, builtIn.x),
      y: normalizeSeedValue(ySeed, builtIn.y),
    },
  };
}

function applyRangesOverrideFromEditor() {
  const formulaId = getSelectedRangesEditorFormulaId();
  const rangeDraft = readRangeEditorDraft(formulaId);
  if (rangeDraft.error) {
    setRangesEditorWarning(rangeDraft.error);
    return;
  }

  const seedDraft = readSeedEditorDraft(formulaId);
  if (seedDraft.error) {
    setRangesEditorWarning(seedDraft.error);
    return;
  }

  remapSliderToPreserveParams(formulaId, rangeDraft.ranges);
  appData.defaults.rangesOverridesByFormula[formulaId] = rangeDraft.ranges;
  appData.defaults.formulaParamDefaultsByFormula[formulaId] = rangeDraft.defaults;
  appData.defaults.formulaSeeds[formulaId] = seedDraft.seed;
  syncSeedEditorInputs(formulaId);
  saveDefaultsToStorage();
  setRangesEditorWarning("Applied.");
  requestDraw();
  commitCurrentStateToHistory();
}

function resetFormulaRangeOverride(formulaId) {
  if (!formulaId) {
    return;
  }
  const builtInRange = builtInFormulaRanges[formulaId] || DEFAULT_PARAM_RANGES;
  remapSliderToPreserveParams(formulaId, builtInRange);
  delete appData.defaults.rangesOverridesByFormula[formulaId];
  loadFormulaRangesIntoEditor(formulaId);
}

function resetFormulaSeedOverride(formulaId) {
  if (!formulaId) {
    return;
  }

  appData.defaults.formulaSeeds[formulaId] = getBuiltInFormulaSeed(formulaId);
}

function resetFormulaDefaults(formulaId) {
  if (!formulaId) {
    return;
  }

  resetFormulaRangeOverride(formulaId);
  delete appData.defaults.formulaParamDefaultsByFormula[formulaId];
  resetFormulaSeedOverride(formulaId);
  syncSeedEditorInputs(formulaId);
  saveDefaultsToStorage();
  setRangesEditorWarning("Formula defaults reset.");
  requestDraw();
  commitCurrentStateToHistory();
}

function resetAllFormulaSeeds() {
  const nextSeeds = {};
  for (const formula of appData.formulas || []) {
    nextSeeds[formula.id] = getBuiltInFormulaSeed(formula.id);
  }
  appData.defaults.formulaSeeds = nextSeeds;
}

function resetAllFormulaParamDefaults() {
  appData.defaults.formulaParamDefaultsByFormula = {};
}

function getHoldTimingSettings() {
  const holdRepeatMs = Math.round(clamp(Number(appData?.defaults?.holdRepeatMs ?? HOLD_REPEAT_MS_DEFAULT), HOLD_REPEAT_MS_MIN, HOLD_REPEAT_MS_MAX));
  const holdAccelStartMs = Math.round(clamp(Number(appData?.defaults?.holdAccelStartMs ?? HOLD_ACCEL_START_MS_DEFAULT), HOLD_ACCEL_START_MS_MIN, HOLD_ACCEL_START_MS_MAX));
  const holdAccelEndMs = Math.round(clamp(Number(appData?.defaults?.holdAccelEndMs ?? HOLD_ACCEL_END_MS_DEFAULT), HOLD_ACCEL_END_MS_MIN, HOLD_ACCEL_END_MS_MAX));
  const normalizedAccelEndMs = Math.max(holdAccelStartMs + 1, holdAccelEndMs);

  return { holdRepeatMs, holdAccelStartMs, holdAccelEndMs: normalizedAccelEndMs };
}

function normalizeHoldTimingDefaults() {
  if (!appData?.defaults) {
    return;
  }

  const { holdRepeatMs, holdAccelStartMs, holdAccelEndMs } = getHoldTimingSettings();
  appData.defaults.holdRepeatMs = holdRepeatMs;
  appData.defaults.holdAccelStartMs = holdAccelStartMs;
  appData.defaults.holdAccelEndMs = holdAccelEndMs;
}

function syncDetailedSettingsControls() {
  const {
    iterationAbsoluteMax,
    iterationStartupDefault,
    maxRandomIters,
    historyCacheSize,
  } = normalizeIterationSettings();
  const burnValue = Math.round(clamp(appData.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max));
  if (detailStartupIterationsRangeEl) {
    detailStartupIterationsRangeEl.min = String(sliderControls.iters.min);
    detailStartupIterationsRangeEl.max = String(iterationAbsoluteMax);
    detailStartupIterationsRangeEl.value = String(iterationStartupDefault);
  }
  if (detailStartupIterationsFormattedEl) detailStartupIterationsFormattedEl.textContent = formatNumberForUi(iterationStartupDefault, 0);
  if (detailMaxRandomItersRangeEl) detailMaxRandomItersRangeEl.value = String(maxRandomIters);
  if (detailMaxRandomItersRangeEl) {
    detailMaxRandomItersRangeEl.min = String(sliderControls.iters.min);
    detailMaxRandomItersRangeEl.max = String(iterationAbsoluteMax);
  }
  if (detailMaxRandomItersFormattedEl) detailMaxRandomItersFormattedEl.textContent = formatNumberForUi(maxRandomIters, 0);
  if (detailIterationAbsoluteMaxRangeEl) {
    detailIterationAbsoluteMaxRangeEl.min = String(sliderControls.iters.min);
    detailIterationAbsoluteMaxRangeEl.max = String(ITERATION_FALLBACK_ABSOLUTE_MAX);
    detailIterationAbsoluteMaxRangeEl.value = String(iterationAbsoluteMax);
  }
  if (detailIterationAbsoluteMaxFormattedEl) detailIterationAbsoluteMaxFormattedEl.textContent = formatNumberForUi(iterationAbsoluteMax, 0);
  if (detailHistoryCacheSizeRangeEl) {
    detailHistoryCacheSizeRangeEl.min = String(HISTORY_CACHE_SIZE_MIN);
    detailHistoryCacheSizeRangeEl.max = String(HISTORY_CACHE_SIZE_MAX);
    detailHistoryCacheSizeRangeEl.value = String(historyCacheSize);
  }
  if (detailHistoryCacheSizeFormattedEl) detailHistoryCacheSizeFormattedEl.textContent = formatNumberForUi(historyCacheSize, 0);
  if (detailBurnRangeEl) detailBurnRangeEl.value = String(burnValue);
  if (detailBurnFormattedEl) detailBurnFormattedEl.textContent = formatNumberForUi(burnValue, 0);
  if (detailDebugToggleEl) detailDebugToggleEl.checked = Boolean(appData.defaults.debug);
  if (detailOverlayAlphaRangeEl) detailOverlayAlphaRangeEl.value = String(clamp(Number(appData.defaults.overlayAlpha), 0.1, 1));
  if (detailOverlayAlphaFormattedEl) detailOverlayAlphaFormattedEl.textContent = formatNumberForUi(clamp(Number(appData.defaults.overlayAlpha), 0.1, 1), 2);
  if (detailInterestOverlayToggleEl) detailInterestOverlayToggleEl.checked = Boolean(appData.defaults.interestOverlayEnabled);
  const interestOverlayOpacity = normalizeInterestOverlayOpacity(appData.defaults.interestOverlayOpacity);
  if (detailInterestOverlayOpacityRangeEl) detailInterestOverlayOpacityRangeEl.value = String(interestOverlayOpacity);
  if (detailInterestOverlayOpacityFormattedEl) detailInterestOverlayOpacityFormattedEl.textContent = formatNumberForUi(interestOverlayOpacity, 2);
  const interestGridSize = normalizeInterestGridSize(appData.defaults.interestGridSize);
  const interestScanIterations = Math.round(clamp(Number(appData.defaults.interestScanIterations), INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
  const interestLyapunovEnabled = Boolean(appData.defaults.interestLyapunovEnabled);
  const interestLyapunovMinExponent = clamp(Number(appData.defaults.interestLyapunovMinExponent), INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX);
  const interestLyapunovDelta0 = clamp(Number(appData.defaults.interestLyapunovDelta0), INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX);
  const interestLyapunovRescale = Boolean(appData.defaults.interestLyapunovRescale);
  const interestLyapunovMaxDistance = clamp(Number(appData.defaults.interestLyapunovMaxDistance), INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX);
  if (detailInterestGridSizeRangeEl) detailInterestGridSizeRangeEl.value = String(interestGridSize);
  if (detailInterestGridSizeFormattedEl) detailInterestGridSizeFormattedEl.textContent = formatNumberForUi(interestGridSize, 0);
  if (detailInterestScanIterationsRangeEl) detailInterestScanIterationsRangeEl.value = String(interestScanIterations);
  if (detailInterestScanIterationsFormattedEl) detailInterestScanIterationsFormattedEl.textContent = formatNumberForUi(interestScanIterations, 0);
  if (detailInterestLyapunovEnabledToggleEl) detailInterestLyapunovEnabledToggleEl.checked = interestLyapunovEnabled;
  if (detailInterestLyapunovMinExponentRangeEl) detailInterestLyapunovMinExponentRangeEl.value = String(interestLyapunovMinExponent);
  if (detailInterestLyapunovMinExponentFormattedEl) detailInterestLyapunovMinExponentFormattedEl.textContent = formatNumberForUi(interestLyapunovMinExponent, 2);
  if (detailInterestLyapunovDelta0RangeEl) detailInterestLyapunovDelta0RangeEl.value = String(interestLyapunovDelta0);
  if (detailInterestLyapunovDelta0FormattedEl) detailInterestLyapunovDelta0FormattedEl.textContent = interestLyapunovDelta0.toExponential(2);
  if (detailInterestLyapunovRescaleToggleEl) detailInterestLyapunovRescaleToggleEl.checked = interestLyapunovRescale;
  if (detailInterestLyapunovMaxDistanceRangeEl) detailInterestLyapunovMaxDistanceRangeEl.value = String(interestLyapunovMaxDistance);
  if (detailInterestLyapunovMaxDistanceFormattedEl) detailInterestLyapunovMaxDistanceFormattedEl.textContent = formatNumberForUi(interestLyapunovMaxDistance, 3);
  interestOverlay.syncToggleUi();
  const holdSpeedScale = clamp(Number(appData.defaults.holdSpeedScale ?? 1), HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
  const touchZoomDeadbandPx = getTouchZoomDeadbandPx();
  const touchZoomRatioMin = getTouchZoomRatioMin();
  const { holdRepeatMs, holdAccelStartMs, holdAccelEndMs } = getHoldTimingSettings();
  if (holdSpeedRangeEl) holdSpeedRangeEl.value = String(holdSpeedScale);
  if (holdSpeedValueEl) holdSpeedValueEl.textContent = `Hold speed: ${holdSpeedScale.toFixed(2)}×`;
  if (holdRepeatMsRangeEl) holdRepeatMsRangeEl.value = String(holdRepeatMs);
  if (holdRepeatMsValueEl) holdRepeatMsValueEl.textContent = `Repeat interval: ${holdRepeatMs} ms`;
  if (holdAccelStartMsRangeEl) holdAccelStartMsRangeEl.value = String(holdAccelStartMs);
  if (holdAccelStartMsValueEl) holdAccelStartMsValueEl.textContent = `Accel start: ${holdAccelStartMs} ms`;
  if (holdAccelEndMsRangeEl) holdAccelEndMsRangeEl.value = String(holdAccelEndMs);
  if (holdAccelEndMsValueEl) holdAccelEndMsValueEl.textContent = `Accel end: ${holdAccelEndMs} ms`;
  if (touchZoomDeadbandRangeEl) touchZoomDeadbandRangeEl.value = String(touchZoomDeadbandPx);
  if (touchZoomDeadbandValueEl) touchZoomDeadbandValueEl.textContent = `Touch zoom deadband: ${touchZoomDeadbandPx.toFixed(1)} px`;
  if (touchZoomRatioMinRangeEl) touchZoomRatioMinRangeEl.value = String(touchZoomRatioMin);
  if (touchZoomRatioMinValueEl) touchZoomRatioMinValueEl.textContent = `Touch zoom ratio min: ${touchZoomRatioMin.toFixed(3)}`;
  if (detailColorModeSelectEl) detailColorModeSelectEl.value = appData.defaults.renderColorMode;
  if (detailLogStrengthRangeEl) detailLogStrengthRangeEl.value = String(appData.defaults.renderLogStrength);
  if (detailLogStrengthFormattedEl) detailLogStrengthFormattedEl.textContent = formatNumberForUi(appData.defaults.renderLogStrength, 1);
  if (detailDensityGammaRangeEl) detailDensityGammaRangeEl.value = String(appData.defaults.renderDensityGamma);
  if (detailDensityGammaFormattedEl) detailDensityGammaFormattedEl.textContent = formatNumberForUi(appData.defaults.renderDensityGamma, 2);
  if (detailHybridBlendRangeEl) detailHybridBlendRangeEl.value = String(appData.defaults.renderHybridBlend);
  if (detailHybridBlendFormattedEl) detailHybridBlendFormattedEl.textContent = formatNumberForUi(appData.defaults.renderHybridBlend, 2);
  if (detailBackgroundColorEl) detailBackgroundColorEl.value = appData.defaults.backgroundColor || "#05070c";
  if (detailBackgroundColorValueEl) detailBackgroundColorValueEl.textContent = appData.defaults.backgroundColor || "#05070c";
  const pickerModeSelectEl = document.getElementById("pickerColorModeProxy");
  if (pickerModeSelectEl) pickerModeSelectEl.value = appData.defaults.renderColorMode;
  const pickerBackgroundInputEl = document.getElementById("pickerBackgroundColorProxy");
  if (pickerBackgroundInputEl) pickerBackgroundInputEl.value = appData.defaults.backgroundColor || "#05070c";
}

function applyHoldSpeedScale(nextValue) {
  appData.defaults.holdSpeedScale = clamp(Number(nextValue), HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyTouchZoomTuningSetting(key, nextValue) {
  if (!appData?.defaults) {
    return;
  }

  if (key === "touchZoomDeadbandPx") {
    appData.defaults.touchZoomDeadbandPx = clamp(Number(nextValue), TOUCH_ZOOM_DEADBAND_PX_MIN, TOUCH_ZOOM_DEADBAND_PX_MAX);
  } else if (key === "touchZoomRatioMin") {
    appData.defaults.touchZoomRatioMin = clamp(Number(nextValue), TOUCH_ZOOM_RATIO_MIN_MIN, TOUCH_ZOOM_RATIO_MIN_MAX);
  }

  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyHoldTimingSetting(key, nextValue) {
  if (!appData?.defaults) {
    return;
  }

  const numeric = Math.round(Number(nextValue));
  if (key === "holdRepeatMs") {
    appData.defaults.holdRepeatMs = clamp(numeric, HOLD_REPEAT_MS_MIN, HOLD_REPEAT_MS_MAX);
  } else if (key === "holdAccelStartMs") {
    appData.defaults.holdAccelStartMs = clamp(numeric, HOLD_ACCEL_START_MS_MIN, HOLD_ACCEL_START_MS_MAX);
  } else if (key === "holdAccelEndMs") {
    appData.defaults.holdAccelEndMs = clamp(numeric, HOLD_ACCEL_END_MS_MIN, HOLD_ACCEL_END_MS_MAX);
  }

  normalizeHoldTimingDefaults();
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyDetailedSliderValue(sliderKey, nextValue) {
  const control = sliderControls[sliderKey];
  if (!control) return;
  const clamped = clamp(Number(nextValue), control.min, control.max);
  appData.defaults.sliders[sliderKey] = Math.round(clamped);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyIterationStartupDefault(nextValue) {
  appData.defaults.iterationStartupDefault = normalizeIterationValue(nextValue, getIterationStartupDefault(), ITERATION_MIN, getIterationAbsoluteMax());
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyMaxRandomIterations(nextValue) {
  appData.defaults.maxRandomIters = normalizeIterationValue(nextValue, getRandomIterationCap(), ITERATION_MIN, getIterationAbsoluteMax());
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyIterationAbsoluteMax(nextValue) {
  appData.defaults.iterationAbsoluteMax = normalizeIterationValue(nextValue, getIterationAbsoluteMax(), ITERATION_MIN, ITERATION_FALLBACK_ABSOLUTE_MAX);
  normalizeIterationSettings();
  syncQuickSliderPosition();
  refreshParamButtons();
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyHistoryCacheSize(nextValue) {
  appData.defaults.historyCacheSize = getHistoryCacheSize({ historyCacheSize: nextValue });
  pruneHistoryRenderCache();
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function applyRenderColorMode(mode) {
  const normalizedMode = String(mode || "").trim();
  appData.defaults.renderColorMode = RENDER_COLOR_MODE_SET.has(normalizedMode)
    ? normalizedMode
    : RENDER_COLOR_MODES.ITERATION_ORDER;
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyRenderColorParam(key, nextValue, min, max, digits) {
  const numeric = clamp(Number(nextValue), min, max);
  const factor = 10 ** digits;
  appData.defaults[key] = Math.round(numeric * factor) / factor;
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}


function applyInterestOverlayEnabled(nextValue) {
  appData.defaults.interestOverlayEnabled = Boolean(nextValue);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  showToast(`Interest overlay ${appData.defaults.interestOverlayEnabled ? "enabled" : "disabled"}.`);
  if (appData.defaults.interestOverlayEnabled) {
    interestOverlay.scheduleRecalc({ immediate: true, showProgress: true });
  }
  commitCurrentStateToHistory();
}

function applyInterestOverlayOpacity(nextValue) {
  appData.defaults.interestOverlayOpacity = normalizeInterestOverlayOpacity(nextValue);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  showToast(`Interest overlay opacity ${formatNumberForUi(appData.defaults.interestOverlayOpacity, 2)}.`);
  commitCurrentStateToHistory();
}

function applyInterestGridSize(nextValue) {
  appData.defaults.interestGridSize = normalizeInterestGridSize(nextValue);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestScanIterations(nextValue) {
  appData.defaults.interestScanIterations = Math.round(clamp(Number(nextValue), INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestLyapunovEnabled(nextValue) {
  appData.defaults.interestLyapunovEnabled = Boolean(nextValue);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestLyapunovMinExponent(nextValue) {
  appData.defaults.interestLyapunovMinExponent = clamp(Number(nextValue), INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestLyapunovDelta0(nextValue) {
  appData.defaults.interestLyapunovDelta0 = clamp(Number(nextValue), INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestLyapunovRescale(nextValue) {
  appData.defaults.interestLyapunovRescale = Boolean(nextValue);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyInterestLyapunovMaxDistance(nextValue) {
  appData.defaults.interestLyapunovMaxDistance = clamp(Number(nextValue), INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX);
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function applyOverlayTransparency(nextValue) {
  appData.defaults.overlayAlpha = clamp(Number(nextValue), 0.1, 1);
  applyDialogTransparency();
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
}

function getRenderColoringOptions() {
  return {
    mode: appData.defaults.renderColorMode,
    logStrength: appData.defaults.renderLogStrength,
    densityGamma: appData.defaults.renderDensityGamma,
    hybridBlend: appData.defaults.renderHybridBlend,
  };
}

function showSettingsInfo(message, anchorEl = null, panelEl = null) {
  if (!settingsInfoPopupEl || !settingsInfoTextEl) return;
  if (uiState.activeInfoAnchorEl === anchorEl && !settingsInfoPopupEl.classList.contains("is-hidden")) {
    hideSettingsInfo();
    return;
  }

  uiState.activeInfoAnchorEl = anchorEl;
  uiState.activeInfoPanelEl = panelEl || anchorEl?.closest("#rangesEditorPanel, #colorSettingsPanel, #modeSettingsPanel") || rangesEditorPanelEl;
  settingsInfoTextEl.textContent = message;
  settingsInfoPopupEl.classList.remove("is-hidden");

  const panelRect = uiState.activeInfoPanelEl?.getBoundingClientRect();
  const anchorRect = anchorEl?.getBoundingClientRect();
  if (panelRect && anchorRect) {
    const left = Math.max(8, Math.min(panelRect.width - 290, anchorRect.left - panelRect.left - 240));
    const top = Math.max(8, Math.min(panelRect.height - 120, anchorRect.top - panelRect.top + 28));
    settingsInfoPopupEl.style.left = `${left}px`;
    settingsInfoPopupEl.style.top = `${top}px`;
    uiState.activeInfoPanelEl.append(settingsInfoPopupEl);
  } else {
    settingsInfoPopupEl.style.left = "10px";
    settingsInfoPopupEl.style.top = "10px";
  }
}

function hideSettingsInfo() {
  uiState.activeInfoAnchorEl = null;
  uiState.activeInfoPanelEl = null;
  settingsInfoPopupEl?.classList.add("is-hidden");
}

function getScaleMode() {
  return appData?.defaults?.scaleMode === "fixed" ? "fixed" : "auto";
}

function isAutoScale() {
  return getScaleMode() === "auto";
}

function syncFixedViewFromLastRenderMeta() {
  if (!renderState.lastRenderMeta?.world || !renderState.lastRenderMeta?.view) {
    return false;
  }

  const world = renderState.lastRenderMeta.world;
  const view = renderState.lastRenderMeta.view;
  const width = Number(view.width);
  const height = Number(view.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }

  const spanX = Number(world.maxX) - Number(world.minX);
  const spanY = Number(world.maxY) - Number(world.minY);
  if (!Number.isFinite(spanX) || !Number.isFinite(spanY) || spanX <= 0 || spanY <= 0) {
    return false;
  }

  let scaleX = Number(view.scaleX);
  let scaleY = Number(view.scaleY);

  if (!Number.isFinite(scaleX) || scaleX <= 0) {
    const safeWidth = Math.max(1, width - 1);
    const worldPerPxX = spanX / safeWidth;
    scaleX = 1 / worldPerPxX;
  }

  if (!Number.isFinite(scaleY) || scaleY <= 0) {
    const safeHeight = Math.max(1, height - 1);
    const worldPerPxY = spanY / safeHeight;
    scaleY = 1 / worldPerPxY;
  }

  if (!Number.isFinite(scaleX) || scaleX <= 0 || !Number.isFinite(scaleY) || scaleY <= 0) {
    return false;
  }

  const spanFromScaleX = (Math.max(1, width - 1)) / scaleX;
  const spanFromScaleY = (Math.max(1, height - 1)) / scaleY;
  const fixedScaleX = width / spanFromScaleX;
  const fixedScaleY = height / spanFromScaleY;
  const scale = (fixedScaleX + fixedScaleY) * 0.5;
  const minDim = Math.min(width, height);
  const baseScale = minDim / 220;
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(baseScale) || baseScale <= 0) {
    return false;
  }

  const centerX = Number.isFinite(world.centerX) ? Number(world.centerX) : (Number(world.minX) + Number(world.maxX)) * 0.5;
  const centerY = Number.isFinite(world.centerY) ? Number(world.centerY) : (Number(world.minY) + Number(world.maxY)) * 0.5;
  if (!Number.isFinite(centerX) || !Number.isFinite(centerY)) {
    return false;
  }

  const viewCenterX = width * 0.5;
  const viewCenterY = height * 0.5;
  const screenCenterX = (width - 1) * 0.5;
  const screenCenterY = (height - 1) * 0.5;
  const fixedCenterX = screenCenterX - centerX * scale;
  const fixedCenterY = screenCenterY - centerY * scale;

  renderState.fixedView = {
    offsetX: fixedCenterX - viewCenterX,
    offsetY: fixedCenterY - viewCenterY,
    zoom: scale / baseScale,
  };

  return true;
}

function setScaleModeFixed(reason = "manual pan/zoom") {
  if (!appData || !isAutoScale()) {
    return;
  }

  appData.defaults.scaleMode = "fixed";
  syncScaleModeButton();
  saveDefaultsToStorage();
  commitCurrentStateToHistory();
  showToast(`Scale: Fixed (${reason})`);
}

function syncScaleModeButton() {
  const isAuto = getScaleMode() === "auto";
  scaleModeBtn.textContent = "Auto\nScale";
  scaleModeBtn.classList.toggle("is-active", isAuto);
  scaleModeBtn.setAttribute("aria-label", isAuto ? "Disable auto scale" : "Enable auto scale");
  scaleModeBtn.title = isAuto ? "Auto scale on" : "Auto scale off";
}

function syncRandomModeButton() {
  const globalMode = getGlobalRandomFixMixState();

  if (globalMode === "ran") {
    uiState.randomAllNextMode = "fix";
  } else if (globalMode === "fix") {
    uiState.randomAllNextMode = "rand";
  }

  randomModeBtn.textContent = uiState.randomAllNextMode === "fix" ? "Fix\nAll" : "Random\nAll";
  randomModeTile?.classList.toggle("is-random", globalMode === "ran");
  randomModeTile?.classList.toggle("is-fixed", globalMode === "fix");
  randomModeTile?.classList.toggle("is-mixed", globalMode === "mix");
  randomModeBtn.setAttribute("aria-label", uiState.randomAllNextMode === "fix" ? "Set all parameter modes to fixed" : "Set all parameter modes to random");
  randomModeBtn.title = uiState.randomAllNextMode === "fix" ? "Fix all" : "Random all";
}


function syncDebugToggleUi() {
  const isDebug = Boolean(appData?.defaults?.debug);
  debugPanelEl?.classList.toggle("is-hidden", !isDebug);
  if (detailDebugToggleEl) {
    detailDebugToggleEl.checked = isDebug;
  }
  layoutFloatingActions();
}

function maybeShowLandscapeHint() {
  const isPhone = window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches;
  const isPortrait = window.matchMedia("(orientation: portrait)").matches;
  if (!isPhone || !isPortrait) {
    return;
  }

  try {
    if (window.localStorage.getItem(LANDSCAPE_HINT_STORAGE_KEY) === "1") {
      return;
    }
  } catch {
    // ignore storage access errors
  }

  window.setTimeout(() => {
    window.alert("For best results on phones, rotate your device to landscape mode.");
    try {
      window.localStorage.setItem(LANDSCAPE_HINT_STORAGE_KEY, "1");
    } catch {
      // ignore storage access errors
    }
  }, 350);
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
  if (!PARAM_LOCK_STATES.has(nextMode)) {
    return;
  }

  for (const key of PARAM_MODE_KEYS) {
    paramModes[key] = getParamState(key);
    paramModes[key].lockState = nextMode;
  }

  normalizeParamModes();
  syncParamModeVisuals();
  saveParamModesToStorage();
  syncRandomModeButton();
  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function getParamMode(paramKey) {
  return getParamState(paramKey).lockState;
}

function getParamState(paramKey) {
  const state = paramModes[paramKey];
  if (state && typeof state === "object") {
    const lockState = PARAM_LOCK_STATES.has(state.lockState) ? state.lockState : "rand";
    const modAxis = PARAM_MOD_AXES.has(state.modAxis) ? state.modAxis : "none";
    return { lockState, modAxis };
  }

  return { lockState: "rand", modAxis: "none" };
}

function isRandomizedParam(paramKey) {
  return getParamState(paramKey).lockState === "rand";
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
    const { lockState, modAxis } = getParamState(target.modeKey);
    const item = target.button.closest(".poItem");
    if (!item) {
      continue;
    }

    item.classList.remove("po-lock-fix", "po-lock-rand", "po-axis-none", "po-axis-manx", "po-axis-many");
    item.classList.add(`po-lock-${lockState}`);
    item.classList.add(`po-axis-${modAxis === "manX" ? "manx" : modAxis === "manY" ? "many" : "none"}`);
    item.dataset.lockState = lockState;
    item.dataset.modAxis = modAxis;
  }

  interestOverlay.syncToggleUi();
}

function normalizeLegacyModeValue(mode) {
  if (mode === "fix" || mode === "rand") {
    return { lockState: mode, modAxis: "none" };
  }
  if (mode === "manx") {
    return { lockState: "fix", modAxis: "manX" };
  }
  if (mode === "many") {
    return { lockState: "fix", modAxis: "manY" };
  }
  return null;
}

function normalizeRawParamState(rawState) {
  if (typeof rawState === "string") {
    return normalizeLegacyModeValue(rawState) || { lockState: "rand", modAxis: "none" };
  }

  if (!rawState || typeof rawState !== "object") {
    return { lockState: "rand", modAxis: "none" };
  }

  const lockState = PARAM_LOCK_STATES.has(rawState.lockState) ? rawState.lockState : "rand";
  const modAxis = PARAM_MOD_AXES.has(rawState.modAxis) ? rawState.modAxis : "none";
  return { lockState, modAxis };
}

function normalizeParamModes() {
  const normalized = {};
  let manXOwner = null;
  let manYOwner = null;

  for (const key of PARAM_MODE_KEYS) {
    normalized[key] = normalizeRawParamState(paramModes[key]);
    if (!MOD_AXIS_ELIGIBLE_KEYS.has(key)) {
      normalized[key].modAxis = "none";
    }
  }

  for (const key of PARAM_MODE_KEYS) {
    if (normalized[key].modAxis === "manX") {
      if (!manXOwner) {
        manXOwner = key;
      } else {
        normalized[key].modAxis = "none";
      }
    }

    if (normalized[key].modAxis === "manY") {
      if (!manYOwner) {
        manYOwner = key;
      } else {
        normalized[key].modAxis = "none";
      }
    }
  }

  paramModes = normalized;
}

function applyParamLockState(paramKey, nextLockState) {
  if (!PARAM_LOCK_STATES.has(nextLockState) || !PARAM_MODE_KEYS.includes(paramKey)) {
    return;
  }

  if (getParamState(paramKey).lockState === nextLockState) {
    return;
  }

  paramModes[paramKey] = getParamState(paramKey);
  paramModes[paramKey].lockState = nextLockState;

  normalizeParamModes();
  syncParamModeVisuals();
  saveParamModesToStorage();
  syncRandomModeButton();
  commitCurrentStateToHistory();
}

function applyParamModAxis(paramKey, nextAxis) {
  if (!PARAM_MOD_AXES.has(nextAxis) || !MOD_AXIS_ELIGIBLE_KEYS.has(paramKey)) {
    return;
  }

  const currentAxis = getParamState(paramKey).modAxis;
  if (currentAxis === nextAxis) {
    return;
  }

  paramModes[paramKey] = getParamState(paramKey);

  if (nextAxis === "none") {
    paramModes[paramKey].modAxis = "none";
  } else {
    const previousOwner = Object.keys(paramModes).find((key) => key !== paramKey && getParamState(key).modAxis === nextAxis);
    if (previousOwner) {
      paramModes[previousOwner].modAxis = currentAxis;
    }
    paramModes[paramKey].modAxis = nextAxis;
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
    fallback[key] = { lockState: "rand", modAxis: "none" };
  }

  try {
    const raw = window.localStorage.getItem(PARAM_MODES_STORAGE_KEY);
    if (!raw) {
      paramModes = fallback;
      return;
    }

    const parsed = JSON.parse(raw);
    paramModes = JSON.parse(JSON.stringify(fallback));
    for (const key of Object.keys(fallback)) {
      if (Object.prototype.hasOwnProperty.call(parsed || {}, key)) {
        paramModes[key] = parsed[key];
      }
    }
  } catch (error) {
    console.warn("Could not load parameter modes.", error);
    paramModes = fallback;
  }

  normalizeParamModes();
}

function normalizeRangePair(pair, fallbackPair) {
  if (!Array.isArray(pair) || pair.length < 2) {
    return [...fallbackPair];
  }

  const min = Number(pair[0]);
  const max = Number(pair[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return [...fallbackPair];
  }

  return [min, max];
}

function normalizeRangeObject(rangeCandidate, fallbackRange = DEFAULT_PARAM_RANGES) {
  const normalized = {};
  for (const key of RANGE_KEYS) {
    normalized[key] = normalizeRangePair(rangeCandidate?.[key], fallbackRange[key]);
  }
  return normalized;
}

function normalizeSeedValue(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function getBuiltInFormulaSeed(formulaId) {
  const base = FORMULA_DEFAULT_SEEDS[formulaId];
  if (base) {
    return {
      x: normalizeSeedValue(base.x, 0),
      y: normalizeSeedValue(base.y, 0),
    };
  }

  return { x: 0, y: 0 };
}

function normalizeFormulaSeeds(seedMap, formulaList) {
  const normalized = {};
  for (const formula of formulaList || []) {
    const formulaId = formula.id;
    const builtIn = getBuiltInFormulaSeed(formulaId);
    const candidate = seedMap?.[formulaId] || {};
    normalized[formulaId] = {
      x: normalizeSeedValue(candidate.x, builtIn.x),
      y: normalizeSeedValue(candidate.y, builtIn.y),
    };
  }

  return normalized;
}

function getSeedForFormula(formulaId) {
  const existing = appData?.defaults?.formulaSeeds?.[formulaId];
  if (existing && Number.isFinite(existing.x) && Number.isFinite(existing.y)) {
    return existing;
  }

  return getBuiltInFormulaSeed(formulaId);
}

function syncSeedEditorInputs(formulaId = null) {
  if (!appData || !detailSeedXInputEl || !detailSeedYInputEl) {
    return;
  }

  const selectedFormulaId = formulaId || getSelectedRangesEditorFormulaId() || currentFormulaId;
  if (!selectedFormulaId) {
    return;
  }

  const seed = getSeedForFormula(selectedFormulaId);
  detailSeedXInputEl.value = formatNumberForUi(seed.x, 4);
  detailSeedYInputEl.value = formatNumberForUi(seed.y, 4);
}

function saveDefaultsToStorage() {
  if (!appData?.defaults) {
    return;
  }

  try {
    appData.defaults.colorMapStopOverrides = getColorMapStopOverrides();
    window.localStorage.setItem(APP_DEFAULTS_STORAGE_KEY, JSON.stringify(appData.defaults));
  } catch (error) {
    console.warn("Could not save defaults.", error);
  }
}

function loadDefaultsFromStorage() {
  try {
    const raw = window.localStorage.getItem(APP_DEFAULTS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return;
    }

    appData.defaults = {
      ...appData.defaults,
      ...parsed,
      sliders: migrateLegacySliderKeys({
        ...(appData.defaults.sliders || {}),
        ...(parsed.sliders || {}),
      }),
      rangesOverridesByFormula: {
        ...(appData.defaults.rangesOverridesByFormula || {}),
        ...(parsed.rangesOverridesByFormula || {}),
      },
      formulaSeeds: {
        ...(appData.defaults.formulaSeeds || {}),
        ...(parsed.formulaSeeds || {}),
      },
      colorMapStopOverrides: {
        ...(appData.defaults.colorMapStopOverrides || {}),
        ...(parsed.colorMapStopOverrides || {}),
      },
      formulaParamDefaultsByFormula: {
        ...(appData.defaults.formulaParamDefaultsByFormula || {}),
        ...(parsed.formulaParamDefaultsByFormula || {}),
      },
    };
  } catch (error) {
    console.warn("Could not load defaults.", error);
  }
}

function captureCurrentState() {
  const derivedParams = getDerivedParams();
  return {
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    sliders: { ...appData.defaults.sliders },
    iterationAbsoluteMax: appData.defaults.iterationAbsoluteMax,
    iterationStartupDefault: appData.defaults.iterationStartupDefault,
    maxRandomIters: appData.defaults.maxRandomIters,
    historyCacheSize: appData.defaults.historyCacheSize,
    renderColorMode: appData.defaults.renderColorMode,
    renderLogStrength: appData.defaults.renderLogStrength,
    renderDensityGamma: appData.defaults.renderDensityGamma,
    renderHybridBlend: appData.defaults.renderHybridBlend,
    overlayAlpha: appData.defaults.overlayAlpha,
    interestOverlayEnabled: appData.defaults.interestOverlayEnabled,
    interestGridSize: appData.defaults.interestGridSize,
    interestScanIterations: appData.defaults.interestScanIterations,
    interestLyapunovEnabled: appData.defaults.interestLyapunovEnabled,
    interestLyapunovMinExponent: appData.defaults.interestLyapunovMinExponent,
    interestLyapunovDelta0: appData.defaults.interestLyapunovDelta0,
    interestLyapunovRescale: appData.defaults.interestLyapunovRescale,
    interestLyapunovMaxDistance: appData.defaults.interestLyapunovMaxDistance,
    holdSpeedScale: appData.defaults.holdSpeedScale,
    holdRepeatMs: appData.defaults.holdRepeatMs,
    holdAccelStartMs: appData.defaults.holdAccelStartMs,
    holdAccelEndMs: appData.defaults.holdAccelEndMs,
    backgroundColor: appData.defaults.backgroundColor,
    colorMapStopOverrides: JSON.parse(JSON.stringify(appData.defaults.colorMapStopOverrides || {})),
    rangesOverridesByFormula: JSON.parse(JSON.stringify(appData.defaults.rangesOverridesByFormula || {})),
    derivedParams,
    scaleMode: getScaleMode(),
    seed: getSeedForFormula(currentFormulaId),
    renderColoring: getRenderColoringOptions(),
    fixedView: { ...renderState.fixedView },
    viewport: {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      cssWidth: Math.round(canvas.getBoundingClientRect().width),
      cssHeight: Math.round(canvas.getBoundingClientRect().height),
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    formulaSeeds: JSON.parse(JSON.stringify(appData.defaults.formulaSeeds || {})),
    formulaParamDefaultsByFormula: JSON.parse(JSON.stringify(appData.defaults.formulaParamDefaultsByFormula || {})),
  };
}

function statesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function applyState(state) {
  if (!state) {
    return;
  }

  invalidatePendingRenders();
  currentFormulaId = state.formulaId;
  appData.defaults.cmapName = state.cmapName;
  if (state.iterationAbsoluteMax != null) {
    appData.defaults.iterationAbsoluteMax = state.iterationAbsoluteMax;
  }
  if (state.iterationStartupDefault != null) {
    appData.defaults.iterationStartupDefault = state.iterationStartupDefault;
  }
  appData.defaults.sliders = { ...appData.defaults.sliders, ...state.sliders };
  appData.defaults.maxRandomIters = state.maxRandomIters ?? appData.defaults.maxRandomIters;
  appData.defaults.historyCacheSize = state.historyCacheSize ?? appData.defaults.historyCacheSize;
  appData.defaults.renderColorMode = RENDER_COLOR_MODE_SET.has(state.renderColorMode)
    ? state.renderColorMode
    : appData.defaults.renderColorMode;
  appData.defaults.renderLogStrength = clamp(Number(state.renderLogStrength ?? appData.defaults.renderLogStrength), 0.5, 30);
  appData.defaults.renderDensityGamma = clamp(Number(state.renderDensityGamma ?? appData.defaults.renderDensityGamma), 0.2, 2);
  appData.defaults.renderHybridBlend = clamp(Number(state.renderHybridBlend ?? appData.defaults.renderHybridBlend), 0, 1);
  appData.defaults.overlayAlpha = clamp(Number(state.overlayAlpha ?? appData.defaults.overlayAlpha), 0.1, 1);
  appData.defaults.interestOverlayEnabled = Boolean(state.interestOverlayEnabled ?? appData.defaults.interestOverlayEnabled);
  appData.defaults.interestGridSize = normalizeInterestGridSize(state.interestGridSize ?? appData.defaults.interestGridSize);
  appData.defaults.interestScanIterations = Math.round(clamp(Number(state.interestScanIterations ?? appData.defaults.interestScanIterations), INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
  appData.defaults.interestLyapunovEnabled = Boolean(state.interestLyapunovEnabled ?? appData.defaults.interestLyapunovEnabled);
  appData.defaults.interestLyapunovMinExponent = clamp(Number(state.interestLyapunovMinExponent ?? appData.defaults.interestLyapunovMinExponent), INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX);
  appData.defaults.interestLyapunovDelta0 = clamp(Number(state.interestLyapunovDelta0 ?? appData.defaults.interestLyapunovDelta0), INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX);
  appData.defaults.interestLyapunovRescale = Boolean(state.interestLyapunovRescale ?? appData.defaults.interestLyapunovRescale);
  appData.defaults.interestLyapunovMaxDistance = clamp(Number(state.interestLyapunovMaxDistance ?? appData.defaults.interestLyapunovMaxDistance), INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX);
  appData.defaults.holdSpeedScale = clamp(Number(state.holdSpeedScale ?? appData.defaults.holdSpeedScale ?? 1), HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
  appData.defaults.holdRepeatMs = Math.round(Number(state.holdRepeatMs ?? appData.defaults.holdRepeatMs ?? HOLD_REPEAT_MS_DEFAULT));
  appData.defaults.holdAccelStartMs = Math.round(Number(state.holdAccelStartMs ?? appData.defaults.holdAccelStartMs ?? HOLD_ACCEL_START_MS_DEFAULT));
  appData.defaults.holdAccelEndMs = Math.round(Number(state.holdAccelEndMs ?? appData.defaults.holdAccelEndMs ?? HOLD_ACCEL_END_MS_DEFAULT));
  normalizeHoldTimingDefaults();
  appData.defaults.backgroundColor = state.backgroundColor || appData.defaults.backgroundColor;
  appData.defaults.colorMapStopOverrides = JSON.parse(JSON.stringify(state.colorMapStopOverrides || appData.defaults.colorMapStopOverrides || {}));
  setColorMapStopOverrides(appData.defaults.colorMapStopOverrides);
  applyBackgroundTheme();
  applyDialogTransparency();
  normalizeIterationSettings();
  normalizeSliderDefaults();
  if (state.rangesOverridesByFormula && typeof state.rangesOverridesByFormula === "object") {
    appData.defaults.rangesOverridesByFormula = JSON.parse(JSON.stringify(state.rangesOverridesByFormula));
  }
  if (state.formulaSeeds && typeof state.formulaSeeds === "object") {
    appData.defaults.formulaSeeds = JSON.parse(JSON.stringify(state.formulaSeeds));
  }
  if (state.formulaParamDefaultsByFormula && typeof state.formulaParamDefaultsByFormula === "object") {
    appData.defaults.formulaParamDefaultsByFormula = JSON.parse(JSON.stringify(state.formulaParamDefaultsByFormula));
  }
  if (state.fixedView && typeof state.fixedView === "object") {
    renderState.fixedView = {
      offsetX: Number.isFinite(state.fixedView.offsetX) ? state.fixedView.offsetX : 0,
      offsetY: Number.isFinite(state.fixedView.offsetY) ? state.fixedView.offsetY : 0,
      zoom: Number.isFinite(state.fixedView.zoom) && state.fixedView.zoom > 0 ? state.fixedView.zoom : 1,
    };
  }
  syncSeedEditorInputs(currentFormulaId);
  syncQuickSliderPosition();
  syncDetailedSettingsControls();
  saveDefaultsToStorage();
  const cacheKey = getRenderStateKey(state);
  const cachedFrame = getHistoryCachedFrame(cacheKey);
  if (cachedFrame && drawCachedFrameEntry(cachedFrame)) {
    renderState.currentRenderCache = cachedFrame;
    renderState.drawDirty = false;
    redrawOverlayCanvases(renderState.lastRenderMeta);
    refreshParamButtons();
    updateQuickSliderReadout();
    layoutFloatingActions();
  } else {
    requestDraw();
  }
}

const historyState = initHistoryState({
  historyLimit: HISTORY_LIMIT,
  getAppData: () => appData,
  getCurrentFormulaId: () => currentFormulaId,
  captureCurrentState,
  statesEqual,
  onDiscardFutureState: (state) => {
    historyStateRef.historyRenderCache.delete(getRenderStateKey(state));
  },
  applyState,
  getShareState: () => ({
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations: Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max)),
    view: renderState.fixedView || {},
  }),
  applySharedState: ({ formulaId, cmapName, params, iterations, view }) => {
    const formulaExists = appData.formulas.some((formula) => formula.id === formulaId);
    const cmapExists = appData.colormaps.includes(cmapName);
    if (!formulaExists || !cmapExists) {
      return false;
    }

    appData.defaults.scaleMode = "fixed";
    for (const key of PARAM_MODE_KEYS) {
      paramModes[key] = { lockState: "fix", modAxis: "none" };
    }
    normalizeParamModes();

    currentFormulaId = formulaId;
    appData.defaults.cmapName = cmapName;
    appData.defaults.sliders.iters = Math.round(clamp(iterations, sliderControls.iters.min, sliderControls.iters.max));
    renderState.fixedView = {
      offsetX: view[0],
      offsetY: view[1],
      zoom: view[2],
    };
    historyStateRef.sharedParamsOverride = {
      a: params[0],
      b: params[1],
      c: params[2],
      d: params[3],
    };
    historyStateRef.sharedParamsFormulaId = formulaId;
    syncParamModeVisuals();
    syncScaleModeButton();
    syncRandomModeButton();
    saveParamModesToStorage();
    saveDefaultsToStorage();
    return true;
  },
});

const {
  applySharedStateFromHash,
  buildSharePayload,
  commitCurrentStateToHistory,
  moveBackward: moveBackwardInHistory,
  moveForward: moveForwardInHistory,
  getHistoryStatus,
  isApplyingHistoryState,
  persistCurrentHistoryViewState,
} = historyState;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomizeAllParameters() {
  clearSharedParamsOverride();
  const randomIterationCap = getRandomIterationCap();
  const preservedFixedSliderValues = {};

  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    if (sliderKey === "burn") {
      continue;
    }

    if (!isRandomizedParam(control.paramKey)) {
      preservedFixedSliderValues[sliderKey] = appData.defaults.sliders[sliderKey];
    }
  }

  if (isRandomizedParam("formula")) {
    const previousFormulaId = currentFormulaId;
    currentFormulaId = randomChoice(appData.formulas).id;
    if (currentFormulaId !== previousFormulaId) {
      applyFormulaPresetToSliders(currentFormulaId);
    }
  }

  if (isRandomizedParam("cmap")) {
    appData.defaults.cmapName = randomChoice(appData.colormaps);
  }

  for (const [sliderKey, control] of Object.entries(sliderControls)) {
    if (sliderKey === "burn") {
      continue;
    }

    if (!isRandomizedParam(control.paramKey)) {
      continue;
    }

    if (sliderKey === "iters") {
      appData.defaults.sliders[sliderKey] = randomInt(control.min, randomIterationCap);
      continue;
    }
    appData.defaults.sliders[sliderKey] = Number((Math.random() * (control.max - control.min) + control.min).toFixed(4));
  }

  for (const [sliderKey, preservedValue] of Object.entries(preservedFixedSliderValues)) {
    appData.defaults.sliders[sliderKey] = preservedValue;
  }

  saveDefaultsToStorage();
  requestDraw();
  commitCurrentStateToHistory();
}

function isEventInsideInteractiveUi(eventTarget) {
  if (!(eventTarget instanceof Element)) {
    return false;
  }

  return Boolean(eventTarget.closest("button, input, #paramOverlay, #quickSliderOverlay, #pickerOverlay, #floatingActions, #rangesEditorPanel, #formulaSettingsPanel, #colorSettingsPanel, #modeSettingsPanel, #rangesEditorToggle"));
}

function handleScreenHistoryNavigation(event) {
  if (!hasAnyRandomizedModes() || !appData || !currentFormulaId || overlayState.suppressHistoryTap) {
    return;
  }

  if (!overlayState.historyTapTracker || event.pointerId !== overlayState.historyTapTracker.pointerId || !overlayState.historyTapTracker.validTap) {
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
    const nextState = moveForwardInHistory();
    if (nextState) {
      showToast(`History ${nextState.index + 1}/${nextState.length}`);
      return;
    }

    randomizeAllParameters();
    showToast("Randomised all parameters.");
    return;
  }

  const previousState = moveBackwardInHistory();
  if (previousState) {
    showToast(`History ${previousState.index + 1}/${previousState.length}`);
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

  for (const [paramKey, state] of Object.entries(paramModes)) {
    if (state.modAxis === "manX") {
      manX = sliderKeyByParamKey[paramKey] || null;
    }
    if (state.modAxis === "manY") {
      manY = sliderKeyByParamKey[paramKey] || null;
    }
  }

  return { manX, manY };
}

function requestLiveModulationDraw() {
  redrawInterestOverlayCanvas(renderState.lastRenderMeta);
  redrawManualOverlayCanvas(renderState.lastRenderMeta);
  requestDraw({ invalidate: false });
}

function applyManualModulation(deltaX, deltaY, { invalidate = true } = {}) {
  const { manX, manY } = getManualAxisTargets();
  if (!manX && !manY) {
    return false;
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

  if (invalidate) {
    requestDraw();
  } else {
    requestLiveModulationDraw();
  }
  return true;
}

function syncQuickSliderPosition() {
  if (!uiState.activeSliderKey || !qsRange) {
    return;
  }

  qsRange.value = String(getQuickSliderRangeValueFromSliderValue(uiState.activeSliderKey, appData.defaults.sliders[uiState.activeSliderKey]));
  updateQuickSliderReadout();
}

function applyPanDelta(deltaX, deltaY) {
  renderState.fixedView.offsetX += deltaX;
  renderState.fixedView.offsetY += deltaY;
  persistCurrentHistoryViewState(renderState.fixedView);
  requestDraw();
}

function setZoomAtPoint(targetZoom, anchorX, anchorY) {
  if (!Number.isFinite(targetZoom) || targetZoom <= 0) {
    return false;
  }

  const prevZoom = renderState.fixedView.zoom;
  const ratio = targetZoom / prevZoom;
  if (!Number.isFinite(ratio) || ratio === 1) {
    return false;
  }

  const viewCenterX = canvas.width * 0.5;
  const viewCenterY = canvas.height * 0.5;
  const centerX = viewCenterX + renderState.fixedView.offsetX;
  const centerY = viewCenterY + renderState.fixedView.offsetY;
  const nextCenterX = anchorX - (anchorX - centerX) * ratio;
  const nextCenterY = anchorY - (anchorY - centerY) * ratio;

  renderState.fixedView.zoom = targetZoom;
  renderState.fixedView.offsetX = nextCenterX - viewCenterX;
  renderState.fixedView.offsetY = nextCenterY - viewCenterY;
  return true;
}

function applyZoomAtPoint(zoomFactor, anchorX, anchorY) {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    return;
  }

  const nextZoom = renderState.fixedView.zoom * zoomFactor;
  if (!setZoomAtPoint(nextZoom, anchorX, anchorY)) {
    return;
  }

  persistCurrentHistoryViewState(renderState.fixedView);
  requestDraw();
}

function applyTwoFingerGestureTransform(targetZoom, anchorX, anchorY, deltaX, deltaY) {
  let didChange = false;

  if (Number.isFinite(targetZoom) && targetZoom > 0) {
    didChange = setZoomAtPoint(targetZoom, anchorX, anchorY) || didChange;
  }

  if (Number.isFinite(deltaX) && Number.isFinite(deltaY) && (deltaX !== 0 || deltaY !== 0)) {
    renderState.fixedView.offsetX += deltaX;
    renderState.fixedView.offsetY += deltaY;
    didChange = true;
  }

  if (!didChange) {
    return;
  }

  persistCurrentHistoryViewState(renderState.fixedView);
  requestDraw();
}

function updateHistoryTapTrackerFromMove(event) {
  if (!overlayState.historyTapTracker || event.pointerId !== overlayState.historyTapTracker.pointerId || !overlayState.historyTapTracker.validTap) {
    return;
  }

  const moved = Math.hypot(event.clientX - overlayState.historyTapTracker.startX, event.clientY - overlayState.historyTapTracker.startY);
  if (moved > HISTORY_TAP_MAX_MOVE_PX) {
    overlayState.historyTapTracker.validTap = false;
  }
}

function getLockedTwoPointers() {
  if (!overlayState.twoFingerGesture) {
    return null;
  }

  const ptrA = overlayState.activePointers.get(overlayState.twoFingerGesture.idA);
  const ptrB = overlayState.activePointers.get(overlayState.twoFingerGesture.idB);
  if (ptrA && ptrB) {
    return [ptrA, ptrB];
  }

  if (overlayState.activePointers.size < 2) {
    return null;
  }

  const [fallbackA, fallbackB] = Array.from(overlayState.activePointers.values());
  initializeTwoFingerGesture(fallbackA.pointerId, fallbackB.pointerId);
  return [fallbackA, fallbackB];
}

function initializeTwoFingerGesture(pointerIdA, pointerIdB) {
  cancelSingleTouchModulationStartDraw();
  const ptrA = overlayState.activePointers.get(pointerIdA);
  const ptrB = overlayState.activePointers.get(pointerIdB);
  if (!ptrA || !ptrB) {
    overlayState.twoFingerGesture = null;
    overlayState.lastTwoDebug = null;
    return;
  }

  const posA = getCanvasPointerPosition(ptrA);
  const posB = getCanvasPointerPosition(ptrB);
  const lastD = Math.hypot(posB.x - posA.x, posB.y - posA.y);
  const lastMX = (posA.x + posB.x) * 0.5;
  const lastMY = (posA.y + posB.y) * 0.5;

  overlayState.twoFingerGesture = {
    idA: pointerIdA,
    idB: pointerIdB,
    startD: lastD,
    startZoom: renderState.fixedView.zoom,
    lastD,
    lastMX,
    lastMY,
    justStarted: true,
    isArmed: false,
  };
  overlayState.interactionState = INTERACTION_STATE.TWO_ACTIVE;
  overlayState.suppressHistoryTap = true;
}

function clearTwoFingerGesture() {
  overlayState.twoFingerGesture = null;
  overlayState.lastTwoDebug = null;
}

function cloneFixedViewSnapshot(view = renderState.fixedView) {
  return {
    offsetX: Number.isFinite(view?.offsetX) ? view.offsetX : 0,
    offsetY: Number.isFinite(view?.offsetY) ? view.offsetY : 0,
    zoom: Number.isFinite(view?.zoom) && view.zoom > 0 ? view.zoom : 1,
  };
}

function ensurePanZoomCacheBase() {
  if (renderState.activePanZoomCacheEntry?.canvas) {
    return renderState.activePanZoomCacheEntry;
  }

  if (!renderState.currentRenderCache?.canvas) {
    return null;
  }

  renderState.activePanZoomCacheEntry = {
    key: renderState.currentRenderCache.key,
    canvas: renderState.currentRenderCache.canvas,
    meta: renderState.currentRenderCache.meta,
    fullMeta: renderState.currentRenderCache.fullMeta,
    sourceFixedView: cloneFixedViewSnapshot(),
  };

  return renderState.activePanZoomCacheEntry;
}

function clearPanZoomInteractionCache() {
  renderState.activePanZoomCacheEntry = null;
}

function cancelSingleTouchModulationStartDraw() {
  if (renderState.singleTouchModulationStartDrawTimer) {
    window.clearTimeout(renderState.singleTouchModulationStartDrawTimer);
    renderState.singleTouchModulationStartDrawTimer = null;
  }
}

function scheduleSingleTouchModulationStartDraw() {
  cancelSingleTouchModulationStartDraw();
  renderState.singleTouchModulationStartDrawTimer = window.setTimeout(() => {
    renderState.singleTouchModulationStartDrawTimer = null;
    if (overlayState.interactionState === INTERACTION_STATE.MOD_1 && overlayState.activePointers.size === 1) {
      requestDraw();
    }
  }, SINGLE_TOUCH_MODULATION_START_DRAW_DELAY_MS);
}

function resetPanZoomInteractionStateForModulation() {
  if (renderState.panZoomSettleTimer) {
    window.clearTimeout(renderState.panZoomSettleTimer);
    renderState.panZoomSettleTimer = null;
  }
  renderState.panZoomInteractionActive = false;
  clearPanZoomInteractionCache();
}

function getTouchZoomDeadbandPx() {
  return clamp(Number(appData?.defaults?.touchZoomDeadbandPx ?? TOUCH_ZOOM_DEADBAND_PX_DEFAULT), TOUCH_ZOOM_DEADBAND_PX_MIN, TOUCH_ZOOM_DEADBAND_PX_MAX);
}

function getTouchZoomDeadbandThreshold() {
  return getTouchZoomDeadbandPx() * DPR;
}

function getTouchZoomRatioMin() {
  return clamp(Number(appData?.defaults?.touchZoomRatioMin ?? TOUCH_ZOOM_RATIO_MIN_DEFAULT), TOUCH_ZOOM_RATIO_MIN_MIN, TOUCH_ZOOM_RATIO_MIN_MAX);
}

function prepareFixedViewForPanZoom(reason = "manual pan/zoom") {
  if (isAutoScale()) {
    syncFixedViewFromLastRenderMeta();
  }
  setScaleModeFixed(reason);
}

function beginPanZoomInteraction(baseCacheEntry = null) {
  renderState.panZoomInteractionActive = true;
  if (baseCacheEntry?.canvas) {
    renderState.activePanZoomCacheEntry = baseCacheEntry;
  } else {
    ensurePanZoomCacheBase();
  }
  if (renderState.panZoomSettleTimer) {
    window.clearTimeout(renderState.panZoomSettleTimer);
    renderState.panZoomSettleTimer = null;
  }
}

function schedulePanZoomSettledRedraw() {
  if (!renderState.panZoomInteractionActive) {
    return;
  }

  if (renderState.panZoomSettleTimer) {
    window.clearTimeout(renderState.panZoomSettleTimer);
  }

  renderState.panZoomSettleTimer = window.setTimeout(() => {
    renderState.panZoomSettleTimer = null;
    renderState.panZoomInteractionActive = false;
    requestDraw();
  }, PAN_ZOOM_SETTLE_MS);
}

function onCanvasPointerDown(event) {
  if (!appData) {
    return;
  }

  const isDirectTouchPointer = event.pointerType !== "mouse";
  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }

  if (event.pointerType === "mouse" && event.button === 2) {
    event.preventDefault();
  }

  canvas.setPointerCapture(event.pointerId);
  overlayState.activePointers.set(event.pointerId, {
    pointerId: event.pointerId,
    clientX: event.clientX,
    clientY: event.clientY,
  });

  overlayState.historyTapTracker = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    validTap: true,
  };

  if (event.pointerType === "mouse" && event.button === 2) {
    prepareFixedViewForPanZoom("manual pan/zoom");
    beginPanZoomInteraction();
    overlayState.interactionState = INTERACTION_STATE.PAN_MOUSE_RMB;
    overlayState.primaryPointerId = event.pointerId;
    const pos = getCanvasPointerPosition(event);
    overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
    overlayState.suppressHistoryTap = true;
    requestDraw();
    return;
  }

  if (overlayState.activePointers.size === 1) {
    overlayState.interactionState = INTERACTION_STATE.MOD_1;
    overlayState.primaryPointerId = event.pointerId;
    overlayState.isManualModulating = false;
    const pos = getCanvasPointerPosition(event);
    overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
    if (isDirectTouchPointer) {
      resetPanZoomInteractionStateForModulation();
      scheduleSingleTouchModulationStartDraw();
    } else {
      requestDraw();
    }
    return;
  }

  if (overlayState.activePointers.size === 2) {
    const pointers = Array.from(overlayState.activePointers.values());
    initializeTwoFingerGesture(pointers[0].pointerId, pointers[1].pointerId);
  }
}

function onCanvasPointerMove(event) {
  if (!overlayState.activePointers.has(event.pointerId)) {
    return;
  }

  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }

  updateHistoryTapTrackerFromMove(event);
  const pointerRecord = overlayState.activePointers.get(event.pointerId);
  pointerRecord.clientX = event.clientX;
  pointerRecord.clientY = event.clientY;

  if (overlayState.interactionState === INTERACTION_STATE.MOD_1 && event.pointerId === overlayState.primaryPointerId) {
    const pos = getCanvasPointerPosition(event);
    if (!overlayState.lastPointerPosition) {
      overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
      return;
    }
    const didModulate = applyManualModulation(pos.x - overlayState.lastPointerPosition.x, pos.y - overlayState.lastPointerPosition.y, { invalidate: false });
    overlayState.isManualModulating = overlayState.isManualModulating || didModulate;
    overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
    return;
  }

  if (overlayState.interactionState === INTERACTION_STATE.PAN_MOUSE_RMB && event.pointerId === overlayState.primaryPointerId) {
    const pos = getCanvasPointerPosition(event);
    if (!overlayState.lastPointerPosition) {
      overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
      return;
    }
    beginPanZoomInteraction();
    applyPanDelta(pos.x - overlayState.lastPointerPosition.x, pos.y - overlayState.lastPointerPosition.y);
    overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
    return;
  }

  if (overlayState.activePointers.size < 2 || overlayState.interactionState !== INTERACTION_STATE.TWO_ACTIVE) {
    return;
  }

  const pointers = getLockedTwoPointers();
  if (!pointers || !overlayState.twoFingerGesture) {
    return;
  }

  const posA = getCanvasPointerPosition(pointers[0]);
  const posB = getCanvasPointerPosition(pointers[1]);
  const midpoint = {
    x: (posA.x + posB.x) * 0.5,
    y: (posA.y + posB.y) * 0.5,
  };
  const distance = Math.hypot(posB.x - posA.x, posB.y - posA.y);
  const dxm = midpoint.x - overlayState.twoFingerGesture.lastMX;
  const dym = midpoint.y - overlayState.twoFingerGesture.lastMY;
  const dd = distance - overlayState.twoFingerGesture.lastD;
  const ratioStep = overlayState.twoFingerGesture.lastD > 0 ? distance / overlayState.twoFingerGesture.lastD : 1;

  if (overlayState.twoFingerGesture.justStarted) {
    overlayState.twoFingerGesture.lastD = distance;
    overlayState.twoFingerGesture.lastMX = midpoint.x;
    overlayState.twoFingerGesture.lastMY = midpoint.y;
    overlayState.twoFingerGesture.justStarted = false;
    return;
  }

  const panMagnitude = Math.hypot(dxm, dym);
  const zoomRatioDelta = Math.abs(ratioStep - 1);
  const touchZoomDeadbandThreshold = getTouchZoomDeadbandThreshold();
  const touchZoomRatioMin = getTouchZoomRatioMin();
  const shouldPan = panMagnitude > PAN_DEADBAND_PX;
  const shouldZoom = Math.abs(dd) > touchZoomDeadbandThreshold || zoomRatioDelta > touchZoomRatioMin;

  overlayState.lastTwoDebug = {
    state: overlayState.interactionState,
    dxm,
    dym,
    dd,
    ratioStep,
    viewZoom: renderState.fixedView.zoom,
    touchZoomDeadbandThreshold,
    touchZoomRatioMin,
  };

  if (!overlayState.twoFingerGesture.isArmed) {
    if (!shouldZoom && !shouldPan) {
      overlayState.twoFingerGesture.lastD = distance;
      overlayState.twoFingerGesture.lastMX = midpoint.x;
      overlayState.twoFingerGesture.lastMY = midpoint.y;
      return;
    }

    prepareFixedViewForPanZoom("manual pan/zoom");
    overlayState.twoFingerGesture.startZoom = renderState.fixedView.zoom;
    overlayState.twoFingerGesture.isArmed = true;
    beginPanZoomInteraction();
  }

  let targetZoom = null;
  if (shouldZoom && Number.isFinite(overlayState.twoFingerGesture.startD) && overlayState.twoFingerGesture.startD > 0) {
    const zoomFromStart = distance / overlayState.twoFingerGesture.startD;
    if (Number.isFinite(zoomFromStart) && zoomFromStart > 0) {
      targetZoom = overlayState.twoFingerGesture.startZoom * zoomFromStart;
    }
  }

  if (targetZoom !== null || shouldPan) {
    beginPanZoomInteraction();
    applyTwoFingerGestureTransform(targetZoom, midpoint.x, midpoint.y, shouldPan ? dxm : 0, shouldPan ? dym : 0);
  }

  overlayState.twoFingerGesture.lastD = distance;
  overlayState.twoFingerGesture.lastMX = midpoint.x;
  overlayState.twoFingerGesture.lastMY = midpoint.y;
}

function clearPointerState(pointerId) {
  if (!overlayState.activePointers.has(pointerId)) {
    return;
  }

  cancelSingleTouchModulationStartDraw();
  const endingTwoFingerGesture = overlayState.interactionState === INTERACTION_STATE.TWO_ACTIVE || Boolean(overlayState.twoFingerGesture);
  const endingPanZoomGesture = endingTwoFingerGesture || overlayState.interactionState === INTERACTION_STATE.PAN_MOUSE_RMB || renderState.panZoomInteractionActive;
  overlayState.activePointers.delete(pointerId);

  if (overlayState.activePointers.size === 0) {
    overlayState.interactionState = INTERACTION_STATE.NONE;
    overlayState.primaryPointerId = null;
    overlayState.lastPointerPosition = null;
    overlayState.isManualModulating = false;
    clearTwoFingerGesture();
    if (endingPanZoomGesture) {
      schedulePanZoomSettledRedraw();
    } else {
      requestDraw();
    }
    return;
  }

  if (overlayState.activePointers.size === 1 && endingTwoFingerGesture) {
    overlayState.activePointers.clear();
    overlayState.interactionState = INTERACTION_STATE.NONE;
    overlayState.primaryPointerId = null;
    overlayState.lastPointerPosition = null;
    overlayState.isManualModulating = false;
    clearTwoFingerGesture();
    schedulePanZoomSettledRedraw();
    return;
  }

  if (overlayState.activePointers.size === 1) {
    const remaining = Array.from(overlayState.activePointers.values())[0];
    clearTwoFingerGesture();
    overlayState.primaryPointerId = remaining.pointerId;
    overlayState.interactionState = INTERACTION_STATE.MOD_1;
    overlayState.isManualModulating = false;
    const pos = getCanvasPointerPosition(remaining);
    overlayState.lastPointerPosition = { x: pos.x, y: pos.y };
    requestDraw();
    return;
  }

  if (overlayState.activePointers.size >= 2) {
    const pointers = Array.from(overlayState.activePointers.values());
    initializeTwoFingerGesture(pointers[0].pointerId, pointers[1].pointerId);
    requestDraw();
  }
}

function onCanvasPointerUp(event) {
  if (event.pointerType !== "mouse") {
    event.preventDefault();
  }
  overlayState.historyTapTracker = overlayState.historyTapTracker?.pointerId === event.pointerId ? overlayState.historyTapTracker : null;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  clearPointerState(event.pointerId);
  window.setTimeout(() => {
    overlayState.suppressHistoryTap = false;
  }, 0);
}

function onCanvasWheel(event) {
  event.preventDefault();
  prepareFixedViewForPanZoom("manual pan/zoom");
  beginPanZoomInteraction();
  const pos = getCanvasPointerPosition(event);
  const zoomFactor = Math.exp(-event.deltaY * 0.0025);
  applyZoomAtPoint(zoomFactor, pos.x, pos.y);
  schedulePanZoomSettledRedraw();
  overlayState.suppressHistoryTap = true;
  window.setTimeout(() => {
    overlayState.suppressHistoryTap = false;
  }, 0);
}

function closeQuickSlider() {
  uiState.activeSliderKey = null;
  quickSliderOverlay.classList.remove("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "true");
  uiState.helpOverlayController?.render();
}

function alignQuickSliderAboveBottomBar() {
  if (!paramOverlayEl || !quickSliderEl) {
    return;
  }

  const overlayRect = paramOverlayEl.getBoundingClientRect();
  const overlayHeight = Math.max(0, window.innerHeight - overlayRect.top);
  quickSliderEl.style.bottom = `${overlayHeight + 6}px`;
  uiState.helpOverlayController?.scheduleRender();
}

function closePicker({ force = false } = {}) {
  if (!force && (!formulaSettingsPanelEl?.classList.contains("is-hidden") || !colorSettingsPanelEl?.classList.contains("is-hidden"))) {
    return;
  }

  uiState.activePicker = null;
  uiState.activePickerTrigger = null;
  pickerOverlay.classList.remove("is-open");
  pickerOverlay.setAttribute("aria-hidden", "true");
  uiState.helpOverlayController?.render();
}

function layoutPickerPanel() {
  const formulaTile = formulaBtn?.closest(".poItem");
  const cmapTile = cmapBtn?.closest(".poItem");
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const margin = 6;
  const eyeBottom = overlayToggleBtn?.getBoundingClientRect()?.bottom ?? 0;
  const bottomUiTop = quickSliderOverlay.classList.contains("is-open")
    ? quickSliderEl?.getBoundingClientRect()?.top
    : paramOverlayEl?.getBoundingClientRect()?.top;
  const bottomInset = Math.max(margin, Math.round(viewportHeight - ((bottomUiTop ?? viewportHeight) - 2)));

  if (formulaTile && cmapTile) {
    const firstRect = formulaTile.getBoundingClientRect();
    const secondRect = cmapTile.getBoundingClientRect();
    const baseWidth = secondRect.right - firstRect.left;
    const minWidth = uiState.activePicker === "cmap" ? 280 : 180;
    const targetWidth = uiState.activePicker === "cmap" ? baseWidth * 1.5 : baseWidth;
    const width = clamp(targetWidth, minWidth, viewportWidth - margin * 2);
    const maxLeft = Math.max(margin, viewportWidth - margin - width);
    const left = clamp(firstRect.left, margin, maxLeft);
    pickerPanel.style.width = `${Math.round(width)}px`;
    pickerPanel.style.left = `${Math.round(left)}px`;
    pickerPanel.style.transform = "none";
    const preferredTop = margin;
    const fallbackTop = Math.max(margin, Math.round(eyeBottom + 2));
    const overlapsEyeButton = Boolean(
      overlayToggleBtn
      && left < (overlayToggleBtn.getBoundingClientRect().right + 2)
      && left + width > (overlayToggleBtn.getBoundingClientRect().left - 2)
      && preferredTop < overlayToggleBtn.getBoundingClientRect().bottom,
    );
    const availableTopAlignedHeight = viewportHeight - preferredTop - bottomInset;
    const availableFallbackHeight = viewportHeight - fallbackTop - bottomInset;
    const useFallbackTop = overlapsEyeButton || availableTopAlignedHeight < 220;
    pickerPanel.style.top = `${useFallbackTop ? fallbackTop : preferredTop}px`;
    pickerPanel.style.bottom = `${bottomInset}px`;
    if (useFallbackTop && availableFallbackHeight < 180) {
      pickerPanel.style.top = `${Math.max(margin, viewportHeight - bottomInset - 180)}px`;
    }
    uiState.helpOverlayController?.scheduleRender();
    return;
  }

  const fallbackWidth = uiState.activePicker === "cmap" ? 420 : 320;
  pickerPanel.style.width = `${Math.min(fallbackWidth, viewportWidth - margin * 2)}px`;
  pickerPanel.style.left = `${margin}px`;
  pickerPanel.style.transform = "none";
  const fallbackTop = Math.max(margin, Math.round(eyeBottom + 2));
  const overlapsEyeButton = Boolean(
    overlayToggleBtn
    && margin < (overlayToggleBtn.getBoundingClientRect().right + 2)
    && margin + Math.min(fallbackWidth, viewportWidth - margin * 2) > (overlayToggleBtn.getBoundingClientRect().left - 2)
    && margin < overlayToggleBtn.getBoundingClientRect().bottom,
  );
  pickerPanel.style.top = `${overlapsEyeButton ? fallbackTop : margin}px`;
  pickerPanel.style.bottom = `${bottomInset}px`;
  uiState.helpOverlayController?.scheduleRender();
}

function renderFormulaPicker() {
  if (pickerTopControls) {
    pickerTopControls.innerHTML = "";
  }
  pickerList.innerHTML = "";

  for (const formula of appData.formulas) {
    const rowWrap = document.createElement("div");
    rowWrap.className = "pickerOptionRow";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "pickerOption";
    button.classList.add("formulaPickerOption");
    if (formula.id === currentFormulaId) {
      button.classList.add("is-selected");
    }
    button.dataset.value = formula.id;

    const row = document.createElement("div");
    row.className = "formulaRow";

    const name = document.createElement("span");
    name.className = "formulaName";
    name.textContent = clampLabel(formula.name);

    row.append(name);
    button.append(row);

    button.addEventListener("click", () => {
      clearSharedParamsOverride();
      const previousFormulaId = currentFormulaId;
      currentFormulaId = formula.id;
      if (previousFormulaId !== currentFormulaId) {
        applyFormulaPresetToSliders(currentFormulaId);
      }
      if (getParamMode("formula") === "rand") {
        applyParamLockState("formula", "fix");
      }
      updateCurrentPickerSelection();
      if (!formulaSettingsPanelEl?.classList.contains("is-hidden")) {
        loadFormulaRangesIntoEditor(currentFormulaId);
        uiState.layoutFormulaSettingsPanel();
      }
      saveDefaultsToStorage();
      requestDraw();
      commitCurrentStateToHistory();
      // Keep picker open so users can live-preview multiple options before closing.
    });

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "formulaPickerSettingsBtn";
    settingsButton.setAttribute("aria-label", `Edit defaults for ${formula.name || formula.id}`);
    settingsButton.textContent = "⚙";
    settingsButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      uiState.openFormulaSettingsPanel(formula.id);
    });

    rowWrap.append(button, settingsButton);
    pickerList.append(rowWrap);
  }
}

function renderColorMapPicker() {
  if (pickerTopControls) {
    pickerTopControls.innerHTML = "";
  }
  pickerList.innerHTML = "";

  const topSection = document.createElement("div");
  topSection.className = "colourPanelTopSection";
  topSection.innerHTML = `
    <div class="pickerSectionRow">
      <span class="perfSettingLabel pickerSectionLabel">Background</span>
      <span aria-hidden="true"></span>
      <input id="pickerBackgroundColorProxy" class="perfRangeInput pickerInlineSwatch" type="color" aria-label="Background colour" />
      <button id="pickerBackgroundSettingsProxy" class="compactIconBtn" type="button" aria-label="Open background settings">⚙</button>
    </div>
    <div class="modeRow">
      <span class="perfSettingLabel modeRowLabel">Mode</span>
      <select id="pickerColorModeProxy" class="perfSelect" aria-label="Mode">
        <option value="iteration_order">Iteration order (default)</option>
        <option value="hit_density_linear">Hit density (linear)</option>
        <option value="hit_density_log">Hit density (log)</option>
        <option value="hit_density_gamma">Hit density (gamma)</option>
        <option value="hit_density_percentile">Hit density (percentile)</option>
        <option value="hybrid_density_age">Hybrid (density + iteration)</option>
      </select>
      <button id="pickerModeSettingsProxy" class="compactIconBtn" type="button" aria-label="Open mode settings">⚙</button>
    </div>
    <div class="pickerTopDivider" aria-hidden="true"></div>
  `;
  pickerTopControls?.append(topSection);

  const backgroundInput = topSection.querySelector("#pickerBackgroundColorProxy");
  const modeSelect = topSection.querySelector("#pickerColorModeProxy");
  const backgroundSettingsBtn = topSection.querySelector("#pickerBackgroundSettingsProxy");
  const modeSettingsBtn = topSection.querySelector("#pickerModeSettingsProxy");

  if (backgroundInput) {
    backgroundInput.value = appData.defaults.backgroundColor || "#05070c";
    backgroundInput.addEventListener("input", (event) => {
      appData.defaults.backgroundColor = event.target.value;
      if (detailBackgroundColorValueEl) detailBackgroundColorValueEl.textContent = appData.defaults.backgroundColor;
      if (detailBackgroundColorEl) detailBackgroundColorEl.value = appData.defaults.backgroundColor;
      applyBackgroundTheme();
      requestDraw();
      saveDefaultsToStorage();
    });
  }

  if (modeSelect) {
    modeSelect.value = appData.defaults.renderColorMode;
    modeSelect.addEventListener("change", () => {
      applyRenderColorMode(modeSelect.value);
    });
  }

  backgroundSettingsBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (uiState.isPanelOpen(modeSettingsPanelEl) && uiState.getActiveColourPanelSettings() === "background") {
      uiState.closeModeSettingsPanel();
    } else {
      uiState.openModeSettingsPanel("background");
    }
  });
  modeSettingsBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (uiState.isPanelOpen(modeSettingsPanelEl) && uiState.getActiveColourPanelSettings() === "mode") {
      uiState.closeModeSettingsPanel();
    } else {
      uiState.openModeSettingsPanel("mode");
    }
  });

  for (const cmapName of appData.colormaps) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pickerOption";
    button.classList.add("colorPickerOption");
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
      clearSharedParamsOverride();
      appData.defaults.cmapName = cmapName;
      if (getParamMode("cmap") === "rand") {
        applyParamLockState("cmap", "fix");
      }
      updateCurrentPickerSelection();
      saveDefaultsToStorage();
      requestDraw();
      commitCurrentStateToHistory();
      // Keep picker open so users can live-preview multiple options before closing.
    });

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "colorPickerSettingsBtn";
    settingsButton.textContent = "⚙";
    settingsButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      uiState.openColorSettingsPanel(cmapName);
    });

    const rowWrap = document.createElement("div");
    rowWrap.className = "pickerOptionRow";
    rowWrap.append(button, settingsButton);
    pickerList.append(rowWrap);
  }

  if (uiState.isPanelOpen(modeSettingsPanelEl)) {
    uiState.layoutModeSettingsPanel();
  }
}



function renderColorStopsEditor() {
  if (!colorStopsListEl || !uiState.activeColorSettingsMap) return;
  const stops = getColorMapStops(uiState.activeColorSettingsMap) || [];
  colorStopsListEl.innerHTML = "";
  stops.forEach((stop, index) => {
    const card = document.createElement("div");
    card.className = "colorStopCard";

    const colorRow = document.createElement("div");
    colorRow.className = "stopRow";

    const label = document.createElement("span");
    label.textContent = `Stop ${index + 1}`;

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "colorStopColorInput colorStopTile";
    colorInput.value = rgbToHex(stop.slice(1, 4));
    colorInput.classList.toggle("is-transparent", stop[4] <= 0.001);

    const transparentBtn = document.createElement("button");
    transparentBtn.type = "button";
    transparentBtn.className = "rangeActionBtn";
    transparentBtn.textContent = "Transparent";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "rangeActionBtn";
    removeBtn.textContent = "Remove";

    colorRow.append(label, colorInput, transparentBtn, removeBtn);

    const posInput = document.createElement("input");
    posInput.type = "range";
    posInput.min = "0";
    posInput.max = "1";
    posInput.step = "0.01";
    posInput.value = String(stop[0]);

    colorInput.addEventListener("input", () => {
      const [r, g, b] = hexToRgb(colorInput.value);
      const next = getColorMapStops(uiState.activeColorSettingsMap) || [];
      next[index][1] = r;
      next[index][2] = g;
      next[index][3] = b;
      if (next[index][4] <= 0.001) {
        next[index][4] = 1;
      }
      setColorMapStops(uiState.activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
      requestDraw();
    });

    transparentBtn.addEventListener("click", () => {
      const next = getColorMapStops(uiState.activeColorSettingsMap) || [];
      next[index][4] = next[index][4] <= 0.001 ? 1 : 0;
      setColorMapStops(uiState.activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
      requestDraw();
    });

    posInput.addEventListener("input", () => {
      const next = getColorMapStops(uiState.activeColorSettingsMap) || [];
      next[index][0] = Number(posInput.value);
      setColorMapStops(uiState.activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
      requestDraw();
    });

    removeBtn.addEventListener("click", () => {
      const next = getColorMapStops(uiState.activeColorSettingsMap) || [];
      if (next.length <= 2) return;
      next.splice(index, 1);
      setColorMapStops(uiState.activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
      requestDraw();
    });

    card.append(colorRow, posInput);
    colorStopsListEl.append(card);
  });
}

({
  openRangesEditor: uiState.openRangesEditor,
  closeRangesEditor: uiState.closeRangesEditor,
  openFormulaSettingsPanel: uiState.openFormulaSettingsPanel,
  closeFormulaSettingsPanel: uiState.closeFormulaSettingsPanel,
  openColorSettingsPanel: uiState.openColorSettingsPanel,
  closeColorSettingsPanel: uiState.closeColorSettingsPanel,
  openModeSettingsPanel: uiState.openModeSettingsPanel,
  closeModeSettingsPanel: uiState.closeModeSettingsPanel,
  closeDismissablePanelsForTarget: uiState.closeDismissablePanelsForTarget,
  layoutFormulaSettingsPanel: uiState.layoutFormulaSettingsPanel,
  layoutColorSettingsPanel: uiState.layoutColorSettingsPanel,
  layoutModeSettingsPanel: uiState.layoutModeSettingsPanel,
  isPanelOpen: uiState.isPanelOpen,
  getActiveColourPanelSettings: uiState.getActiveColourPanelSettings,
} = initUIPanels({
  rangesEditorPanelEl,
  rangesEditorToggleEl,
  formulaSettingsPanelEl,
  colorSettingsPanelEl,
  modeSettingsPanelEl,
  backgroundSettingsSectionEl,
  modeSettingsSectionEls,
  pickerPanel,
  renderHelpOverlay: () => uiState.helpOverlayController?.render(),
  scheduleHelpOverlayRender: () => uiState.helpOverlayController?.scheduleRender(),
  syncDetailedSettingsControls,
  hideSettingsInfo,
  getSelectedRangesEditorFormulaId,
  loadFormulaRangesIntoEditor,
  syncSeedEditorInputs,
  setActiveColorSettingsMap: (value) => {
    uiState.activeColorSettingsMap = value;
  },
  setColorSettingsName: (value) => {
    colorSettingsNameEl.textContent = value;
  },
  setColorSettingsPreview: (value) => {
    colorSettingsPreviewEl.style.background = value;
  },
  buildColorMapGradient,
  renderColorStopsEditor,
  saveDefaultsToStorage,
}));

function openPicker(kind, triggerEl) {
  uiState.activePicker = kind;
  uiState.activePickerTrigger = triggerEl;
  pickerOverlay.classList.add("is-open");
  pickerOverlay.setAttribute("aria-hidden", "false");

  if (kind === "formula") {
    renderFormulaPicker();
  } else {
    renderColorMapPicker();
  }

  layoutPickerPanel();
  uiState.helpOverlayController?.render();
}

function getQuickSliderRangeValueFromSliderValue(sliderKey, sliderValue) {
  if (sliderKey !== "iters") {
    return sliderValue;
  }

  const min = sliderControls.iters.min;
  const max = sliderControls.iters.max;
  const safeValue = clamp(Number(sliderValue), min, max);
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const position = ((Math.log10(safeValue) - logMin) / (logMax - logMin)) * 1000;
  return clamp(position, 0, 1000);
}

function getSliderValueFromQuickSliderRangeValue(sliderKey, rangeValue) {
  if (sliderKey !== "iters") {
    return rangeValue;
  }

  const min = sliderControls.iters.min;
  const max = sliderControls.iters.max;
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const normalized = clamp(Number(rangeValue), 0, 1000) / 1000;
  const actual = 10 ** (logMin + normalized * (logMax - logMin));
  return Math.round(clamp(actual, min, max));
}

function updateQuickSliderReadout() {
  if (!uiState.activeSliderKey) {
    return;
  }
  const control = sliderControls[uiState.activeSliderKey];
  const actualValue = getActiveActualValue();
  qsLabel.textContent = control.label;
  qsValue.textContent = formatControlValue(control, actualValue);
}

function applySliderValue(nextValue, { commitHistory = true } = {}) {
  if (!uiState.activeSliderKey) {
    return;
  }

  const control = sliderControls[uiState.activeSliderKey];
  const value = clamp(nextValue, control.min, control.max);
  if (uiState.activeSliderKey !== "iters" && uiState.activeSliderKey !== "burn") {
    clearSharedParamsOverride();
  }
  appData.defaults.sliders[uiState.activeSliderKey] = value;
  saveDefaultsToStorage();
  qsRange.value = String(getQuickSliderRangeValueFromSliderValue(uiState.activeSliderKey, value));
  updateQuickSliderReadout();
  requestDraw();
  if (commitHistory) {
    commitCurrentStateToHistory();
  }
}

function openQuickSlider(sliderKey) {
  if (!isSliderKeyAvailable(sliderKey)) {
    showToast(`${sliderKey} is not used by this formula.`);
    return;
  }

  uiState.activeSliderKey = sliderKey;
  quickSliderOverlay.classList.add("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "false");
  alignQuickSliderAboveBottomBar();

  const control = sliderControls[sliderKey];
  if (sliderKey === "iters") {
    qsRange.min = "0";
    qsRange.max = "1000";
    qsRange.step = "1";
  } else {
    qsRange.min = String(control.min);
    qsRange.max = String(control.max);
    qsRange.step = String(control.sliderStep);
  }
  syncQuickSliderPosition();
  uiState.helpOverlayController?.render();
}

function resetParamSliderToZero(sliderKey) {
  if (!isSliderKeyAvailable(sliderKey)) {
    showToast(`${sliderKey} is not used by this formula.`);
    return;
  }

  const control = sliderControls[sliderKey];
  if (!control || !["a", "b", "c", "d"].includes(control.paramKey)) {
    return;
  }

  const range = getCurrentFormulaRange();
  const rawBounds = range?.[control.paramKey];
  const min = Number(rawBounds?.[0]);
  const max = Number(rawBounds?.[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || Math.abs(max - min) < 1e-9) {
    return;
  }

  clearSharedParamsOverride();
  appData.defaults.sliders[sliderKey] = actualToSliderValue(0, min, max);
  saveDefaultsToStorage();
  refreshParamButtons();
  if (uiState.activeSliderKey === sliderKey) {
    syncQuickSliderPosition();
  }
  requestDraw();
  commitCurrentStateToHistory();
  showToast(`${control.paramKey} set to 0`);
}

function onParamPointerDown(event, targetKey) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (event.currentTarget?.setPointerCapture) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  paramPressState.pointerId = event.pointerId;
  paramPressState.targetKey = targetKey;
  paramPressState.startX = event.clientX;
  paramPressState.startY = event.clientY;
  paramPressState.longTriggered = false;
  paramPressState.moved = false;
  if (paramPressState.timer) {
    window.clearTimeout(paramPressState.timer);
  }
  paramPressState.timer = window.setTimeout(() => {
    if (paramPressState.pointerId !== event.pointerId || paramPressState.targetKey !== targetKey) {
      return;
    }

    const modeKey = paramTileTargets[targetKey]?.modeKey;
    if (modeKey && MOD_AXIS_ELIGIBLE_KEYS.has(modeKey) && getParamState(modeKey).modAxis !== "none") {
      applyParamModAxis(modeKey, "none");
      showToast(`${modeKey}: modulation cleared`);
      requestDraw();
    }
    paramPressState.longTriggered = true;
  }, PARAM_LONG_PRESS_MS);
}

function onParamPointerMove(event) {
  if (paramPressState.pointerId !== event.pointerId || paramPressState.longTriggered) {
    return;
  }

  const deltaX = event.clientX - paramPressState.startX;
  const deltaY = event.clientY - paramPressState.startY;
  if (Math.hypot(deltaX, deltaY) > PARAM_MOVE_CANCEL_PX) {
    paramPressState.moved = true;
    if (paramPressState.timer) {
      window.clearTimeout(paramPressState.timer);
      paramPressState.timer = null;
    }
  }
}

function toggleFixRandMode(modeKey) {
  const nextMode = getParamMode(modeKey) === "rand" ? "fix" : "rand";
  applyParamLockState(modeKey, nextMode);
  requestDraw();
}

function applySwipeModeForTile(targetKey, deltaX, deltaY) {
  const modeKey = paramTileTargets[targetKey]?.modeKey;
  if (!modeKey || !MOD_AXIS_ELIGIBLE_KEYS.has(modeKey) || !isFormulaParamUsed(currentFormulaId, modeKey)) {
    return false;
  }

  if (Math.abs(deltaX) < PARAM_SWIPE_TRIGGER_PX && Math.abs(deltaY) < PARAM_SWIPE_TRIGGER_PX) {
    return false;
  }

  const nextMode = Math.abs(deltaX) >= Math.abs(deltaY) ? "manX" : "manY";
  applyParamModAxis(modeKey, nextMode);
  showToast(nextMode === "manX" ? `${modeKey}: ManX` : `${modeKey}: ManY`);
  requestDraw();
  return true;
}

function onParamPointerEnd(event) {
  if (paramPressState.pointerId !== event.pointerId) {
    return;
  }

  if (event.currentTarget?.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const targetKey = paramPressState.targetKey;
  const deltaX = event.clientX - paramPressState.startX;
  const deltaY = event.clientY - paramPressState.startY;
  if (paramPressState.timer) {
    window.clearTimeout(paramPressState.timer);
    paramPressState.timer = null;
  }
  paramPressState.pointerId = null;
  paramPressState.targetKey = null;
  const wasLongPress = paramPressState.longTriggered;
  const wasMoved = paramPressState.moved;
  paramPressState.longTriggered = false;
  paramPressState.moved = false;

  if (applySwipeModeForTile(targetKey, deltaX, deltaY)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (wasLongPress || wasMoved) {
    return;
  }

  const now = performance.now();
  const isDoubleTap = uiState.lastParamTap.targetKey === targetKey && now - uiState.lastParamTap.timestamp <= DOUBLE_TAP_MS;
  uiState.lastParamTap = { targetKey, timestamp: now };

  if (isDoubleTap) {
    if (uiState.pendingTileTapTimer) {
      window.clearTimeout(uiState.pendingTileTapTimer);
      uiState.pendingTileTapTimer = null;
    }

    const modeKey = paramTileTargets[targetKey]?.modeKey;
    if (modeKey) {
      toggleFixRandMode(modeKey);
    }
    return;
  }

  if (uiState.pendingTileTapTimer) {
    window.clearTimeout(uiState.pendingTileTapTimer);
  }
  uiState.pendingTileTapTimer = window.setTimeout(() => {
    uiState.pendingTileTapTimer = null;
    paramTileTargets[targetKey]?.shortTap();
  }, DOUBLE_TAP_MS + 10);
}

function clearStepHold() {
  if (uiState.holdInterval) {
    window.clearInterval(uiState.holdInterval);
    uiState.holdInterval = null;
  }
}

function isTextEntryTarget(el) {
  if (!el || !(el instanceof Element)) {
    return false;
  }

  return Boolean(el.closest("input, textarea, select, [contenteditable='true']"));
}

function getHoldSpeedScale() {
  return clamp(Number(appData?.defaults?.holdSpeedScale ?? 1), HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
}

function stepSliderKey(sliderKey, direction, stepSize) {
  const control = sliderControls[sliderKey];
  if (!control) {
    return;
  }

  appData.defaults.sliders[sliderKey] = clamp(
    appData.defaults.sliders[sliderKey] + direction * stepSize,
    control.min,
    control.max,
  );

  if (uiState.activeSliderKey === sliderKey) {
    syncQuickSliderPosition();
  }

  requestDraw();
}

function stepSliderKeySingle(sliderKey, direction) {
  const control = sliderControls[sliderKey];
  if (!control) {
    return;
  }

  stepSliderKey(sliderKey, direction, control.stepSize);
}

function getHoldStepSizeForKey(sliderKey, holdElapsedMs) {
  const control = sliderControls[sliderKey];
  if (!control) {
    return 0;
  }

  const baseStep = control.stepSize;
  const holdSpeedScale = getHoldSpeedScale();
  const { holdAccelStartMs, holdAccelEndMs } = getHoldTimingSettings();
  if (holdElapsedMs < holdAccelStartMs) {
    return baseStep * holdSpeedScale;
  }

  if (holdElapsedMs >= holdAccelEndMs) {
    return baseStep * HOLD_MAX_MULTIPLIER * holdSpeedScale;
  }

  const accelProgress = (holdElapsedMs - holdAccelStartMs) / (holdAccelEndMs - holdAccelStartMs);
  const growth = Math.pow(HOLD_MAX_MULTIPLIER, accelProgress);
  return baseStep * growth * holdSpeedScale;
}

function stepActiveSlider(direction) {
  if (!uiState.activeSliderKey) {
    return;
  }

  const control = sliderControls[uiState.activeSliderKey];
  applySliderValue(appData.defaults.sliders[uiState.activeSliderKey] + direction * control.stepSize);
}

function getHoldStepSize(holdElapsedMs) {
  if (!uiState.activeSliderKey) {
    return 0;
  }

  return getHoldStepSizeForKey(uiState.activeSliderKey, holdElapsedMs);
}

function stepActiveSliderBy(direction, stepSize) {
  if (!uiState.activeSliderKey) {
    return;
  }

  applySliderValue(appData.defaults.sliders[uiState.activeSliderKey] + direction * stepSize);
}

function setupStepHold(button, direction) {
  const startHold = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearStepHold();

    const holdStartMs = performance.now();
    stepActiveSlider(direction);

    const { holdRepeatMs } = getHoldTimingSettings();
    uiState.holdInterval = window.setInterval(() => {
      const holdElapsedMs = performance.now() - holdStartMs;
      const holdStepSize = getHoldStepSize(holdElapsedMs);
      stepActiveSliderBy(direction, holdStepSize);
    }, holdRepeatMs);
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

function getArrowMapping(code) {
  if (code === "ArrowLeft") return { axis: "manX", direction: -1 };
  if (code === "ArrowRight") return { axis: "manX", direction: 1 };
  if (code === "ArrowDown") return { axis: "manY", direction: -1 };
  if (code === "ArrowUp") return { axis: "manY", direction: 1 };
  return null;
}

function stopKeyboardHold() {
  if (uiState.keyHold.interval) {
    window.clearInterval(uiState.keyHold.interval);
  }
  uiState.keyHold = { code: null, axis: null, direction: 0, sliderKey: null, interval: null, startMs: 0 };
  uiState.isKeyboardManualModulating = false;
  requestDraw();
}

function showKeyboardStepToast(sliderKey, direction, stepSize) {
  const signLabel = direction > 0 ? "+" : "−";
  const baseStep = sliderControls[sliderKey]?.stepSize || 1;
  const speedLabel = (stepSize / baseStep).toFixed(2);
  showToast(`${sliderKey} ${signLabel} (${speedLabel}× speed)`);
}

function onKeyboardArrowDown(event) {
  const mapping = getArrowMapping(event.code);
  if (!mapping) {
    return;
  }

  if (isTextEntryTarget(event.target) || isTextEntryTarget(document.activeElement)) {
    return;
  }

  if (event.repeat && uiState.keyHold.code === event.code) {
    event.preventDefault();
    return;
  }

  const { manX, manY } = getManualAxisTargets();
  const targetSliderKey = mapping.axis === "manX" ? manX : manY;
  if (!targetSliderKey) {
    return;
  }

  event.preventDefault();
  const baseStep = sliderControls[targetSliderKey].stepSize;
  stepSliderKeySingle(targetSliderKey, mapping.direction);
  showKeyboardStepToast(targetSliderKey, mapping.direction, baseStep);

  stopKeyboardHold();
  uiState.isKeyboardManualModulating = true;
  requestDraw();
  const { holdRepeatMs } = getHoldTimingSettings();
  const startMs = performance.now();
  uiState.keyHold = {
    code: event.code,
    axis: mapping.axis,
    direction: mapping.direction,
    sliderKey: targetSliderKey,
    startMs,
    interval: window.setInterval(() => {
      const holdElapsedMs = performance.now() - startMs;
      const stepSize = getHoldStepSizeForKey(targetSliderKey, holdElapsedMs);
      stepSliderKey(targetSliderKey, mapping.direction, stepSize);
      showKeyboardStepToast(targetSliderKey, mapping.direction, stepSize);
    }, holdRepeatMs),
  };
}

function onKeyboardArrowUp(event) {
  if (event.code !== uiState.keyHold.code) {
    return;
  }

  stopKeyboardHold();
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
  return formatNumberForUi(clamped, decimals);
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
  const pointerModulating = overlayState.interactionState === INTERACTION_STATE.MOD_1 && overlayState.activePointers.size > 0 && overlayState.isManualModulating;
  return pointerModulating || uiState.isKeyboardManualModulating;
}

function hasAnyManualTargets() {
  const { manX, manY } = getManualAxisTargets();
  return Boolean(manX || manY);
}

function getInterestPlaneConfig() {
  const { manX, manY } = getManualAxisTargets();
  const xControl = getControlForSlider(manX);
  const yControl = getControlForSlider(manY);
  const xParam = xControl?.paramKey || null;
  const yParam = yControl?.paramKey || null;

  if (!xParam && !yParam) {
    return null;
  }

  const xRange = xControl ? getRangeForControl(xControl) : null;
  const yRange = yControl ? getRangeForControl(yControl) : null;

  if (xParam && yParam && xParam !== yParam && xRange && yRange) {
    return {
      mode: "two_axis",
      axisXParam: xParam,
      axisYParam: yParam,
      axisXRange: xRange,
      axisYRange: yRange,
    };
  }

  const axisParam = xParam || yParam;
  const axisRange = xRange || yRange;
  if (!axisParam || !axisRange) {
    return null;
  }

  return {
    mode: "one_axis",
    axisParam,
    axisRange,
  };
}

function normalizeCenteredCellCount(rawCount) {
  const rounded = Math.max(1, Math.round(Number(rawCount) || 1));
  if (rounded % 2 === 1) {
    return rounded;
  }
  return rounded > 1 ? rounded - 1 : 1;
}

function getInterestGridLayout(view, rawGridSize) {
  const selectedGridSize = Math.round(clamp(Number(rawGridSize), INTEREST_GRID_SIZE_MIN, INTEREST_GRID_SIZE_MAX));
  const width = Math.max(1, Number(view?.width) || 1);
  const height = Math.max(1, Number(view?.height) || 1);
  const isWidthLong = width >= height;
  const longCount = selectedGridSize;
  const cellSize = Math.max(1, (isWidthLong ? width : height) / longCount);
  const rawShortCount = (isWidthLong ? height : width) / cellSize;
  const shortCount = normalizeCenteredCellCount(rawShortCount);

  const cols = isWidthLong ? longCount : shortCount;
  const rows = isWidthLong ? shortCount : longCount;
  const gridWidthPx = cols * cellSize;
  const gridHeightPx = rows * cellSize;

  return {
    cols,
    rows,
    cellSize,
    offsetX: (width - gridWidthPx) * 0.5,
    offsetY: (height - gridHeightPx) * 0.5,
  };
}

exportState.exportManager = initExportManager({
  canvas,
  getCurrentFormulaId: () => currentFormulaId,
  getAppData: () => appData,
  getLastRenderMeta: () => renderState.lastRenderMeta,
  getLastFullRenderMeta: () => renderState.lastFullRenderMeta,
  getRenderRevision: () => renderState.renderRevision,
  getFixedView: () => renderState.fixedView,
  getDerivedParams,
  getScaleMode,
  getSeedForFormula,
  getRenderColoringOptions,
  renderFrame,
  clamp,
  hexToRgb,
  sliderControls,
  formatNumberForUi,
  showToast,
  requestDraw,
  updateExportRenderProgressToast,
  buildSharePayload,
  overlayTextColor: OVERLAY_TEXT_COLOR,
  qrQuietZoneModules: QR_QUIET_ZONE_MODULES,
});

const interestOverlay = initInterestOverlay({
  classifyInterestGridLyapunov,
  clamp,
  getAppData: () => appData,
  getCanvasSize: () => ({ width: Math.max(1, canvas.width), height: Math.max(1, canvas.height) }),
  getCurrentFormulaId: () => currentFormulaId,
  getDerivedParams,
  getInterestGridLayout,
  getInterestPlaneConfig,
  getLastRenderMeta: () => renderState.lastRenderMeta,
  getOverlayContext: () => interestOverlayCtx,
  getOverlayCanvas: () => interestOverlayCanvas,
  hasAnyManualTargets,
  isHighResExportInProgress: () => exportState.exportManager?.isHighResExportInProgress(),
  normalizeInterestOverlayOpacity,
  overlayToggleBtn,
  redrawOverlayCanvas: () => redrawInterestOverlayCanvas(renderState.lastRenderMeta),
  shouldShowManualOverlay,
  showToast,
  windowObject: window,
  performanceObject: performance,
  interestConfig: {
    scanIterationsMin: INTEREST_SCAN_ITERATIONS_MIN,
    scanIterationsMax: INTEREST_SCAN_ITERATIONS_MAX,
    lyapunovMinExponentMin: INTEREST_LYAPUNOV_MIN_EXPONENT_MIN,
    lyapunovMinExponentMax: INTEREST_LYAPUNOV_MIN_EXPONENT_MAX,
    lyapunovDelta0Min: INTEREST_LYAPUNOV_DELTA0_MIN,
    lyapunovDelta0Max: INTEREST_LYAPUNOV_DELTA0_MAX,
    lyapunovMaxDistanceMin: INTEREST_LYAPUNOV_MAX_DISTANCE_MIN,
    lyapunovMaxDistanceMax: INTEREST_LYAPUNOV_MAX_DISTANCE_MAX,
  },
});

function drawManualParamOverlay(meta, targetCtx = ctx) {
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
  const AXIS_WIDTH = 1;
  const OVERLAY_WHITE = "rgba(255,255,255,1)";
  const OVERLAY_BLACK = "rgba(0,0,0,1)";

  const alignAxisPixel = (value, lineWidth) => {
    if (Math.round(lineWidth) % 2 === 1) {
      return Math.floor(value) + 0.5;
    }
    return Math.round(value);
  };

  const drawAxisLine = (x1, y1, x2, y2) => {
    // 1) Dark outline pass
    targetCtx.save();
    targetCtx.lineWidth = AXIS_WIDTH + 2;
    targetCtx.strokeStyle = OVERLAY_BLACK;
    targetCtx.shadowBlur = 0;
    targetCtx.beginPath();
    targetCtx.moveTo(x1, y1);
    targetCtx.lineTo(x2, y2);
    targetCtx.stroke();
    targetCtx.restore();

    // 2) Final crisp white center pass
    targetCtx.save();
    targetCtx.lineWidth = AXIS_WIDTH;
    targetCtx.strokeStyle = OVERLAY_WHITE;
    targetCtx.shadowBlur = 0;
    targetCtx.shadowColor = "transparent";
    targetCtx.beginPath();
    targetCtx.moveTo(x1, y1);
    targetCtx.lineTo(x2, y2);
    targetCtx.stroke();
    targetCtx.restore();
  };

  const alignedAxisX = alignAxisPixel(paramAxisX, AXIS_WIDTH);
  const alignedAxisY = alignAxisPixel(paramAxisY, AXIS_WIDTH);
  const alignedParamX = alignAxisPixel(paramX, AXIS_WIDTH);
  const alignedParamY = alignAxisPixel(paramY, AXIS_WIDTH);

  targetCtx.save();
  targetCtx.strokeStyle = OVERLAY_WHITE;
  targetCtx.fillStyle = OVERLAY_WHITE;
  targetCtx.lineWidth = AXIS_WIDTH;
  targetCtx.shadowBlur = 0;

  if (manYControl) {
    drawAxisLine(0, alignedAxisY, view.width, alignedAxisY);
  }

  if (manXControl) {
    drawAxisLine(alignedAxisX, 0, alignedAxisX, view.height);
  }

  // Crosshair: black outline pass + white center pass
  targetCtx.save();
  targetCtx.lineWidth = AXIS_WIDTH + 2;
  targetCtx.strokeStyle = OVERLAY_BLACK;
  targetCtx.beginPath();
  targetCtx.moveTo(alignedParamX - crosshairSize, alignedParamY);
  targetCtx.lineTo(alignedParamX + crosshairSize, alignedParamY);
  targetCtx.moveTo(alignedParamX, alignedParamY - crosshairSize);
  targetCtx.lineTo(alignedParamX, alignedParamY + crosshairSize);
  targetCtx.stroke();
  targetCtx.restore();

  targetCtx.save();
  targetCtx.lineWidth = AXIS_WIDTH;
  targetCtx.strokeStyle = OVERLAY_WHITE;
  targetCtx.beginPath();
  targetCtx.moveTo(alignedParamX - crosshairSize, alignedParamY);
  targetCtx.lineTo(alignedParamX + crosshairSize, alignedParamY);
  targetCtx.moveTo(alignedParamX, alignedParamY - crosshairSize);
  targetCtx.lineTo(alignedParamX, alignedParamY + crosshairSize);
  targetCtx.stroke();
  targetCtx.restore();

  const drawOutlinedText = (text, x, y) => {
    targetCtx.save();
    targetCtx.lineWidth = 3;
    targetCtx.strokeStyle = OVERLAY_BLACK;
    targetCtx.strokeText(text, x, y);
    targetCtx.fillStyle = OVERLAY_WHITE;
    targetCtx.fillText(text, x, y);
    targetCtx.restore();
  };

  const drawOutlinedTextClamped = (text, preferredX, preferredY) => {
    const metrics = targetCtx.measureText(text);
    const textWidth = metrics.width;
    const textAscent = metrics.actualBoundingBoxAscent || axisNameFontPx * 0.8;
    const textDescent = metrics.actualBoundingBoxDescent || axisNameFontPx * 0.2;
    const edgePadding = 8;
    const minX = edgePadding;
    const maxX = Math.max(minX, view.width - edgePadding - textWidth);
    const minY = edgePadding + textAscent;
    const maxY = Math.max(minY, view.height - edgePadding - textDescent);

    drawOutlinedText(text, clamp(preferredX, minX, maxX), clamp(preferredY, minY, maxY));
  };

  targetCtx.font = `${axisNameFontPx}px system-ui, sans-serif`;
  if (manYControl) {
    drawOutlinedTextClamped(
      `${manYControl.label}=0`,
      view.width - axisNameFontPx * 1.2,
      Math.max(axisNameFontPx + 4, paramAxisY - labelGap),
    );
  }
  if (manXControl) {
    drawOutlinedTextClamped(
      `${manXControl.label}=0`,
      Math.min(view.width - axisNameFontPx * 2.8, paramAxisX + labelGap),
      axisNameFontPx + 4,
    );
  }

  targetCtx.restore();
}

function clearOverlayCanvas(targetCanvas, targetCtx) {
  if (!targetCanvas || !targetCtx) {
    return;
  }
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
}

function redrawInterestOverlayCanvas(meta = renderState.lastRenderMeta) {
  interestOverlay.redrawOverlay(meta);
}

function redrawManualOverlayCanvas(meta = renderState.lastRenderMeta) {
  clearOverlayCanvas(manualOverlayCanvas, manualOverlayCtx);
  if (!meta || !manualOverlayCtx) {
    return;
  }
  drawDebugOverlay(meta, manualOverlayCtx);
  drawManualParamOverlay(meta, manualOverlayCtx);
}

function redrawOverlayCanvases(meta = renderState.lastRenderMeta) {
  redrawInterestOverlayCanvas(meta);
  redrawManualOverlayCanvas(meta);
}

function drawBaseRenderFromFullCanvas(fullCanvas, frameMetaFull) {
  const viewportWidth = Math.max(1, canvas.width);
  const viewportHeight = Math.max(1, canvas.height);
  const cropX = Math.max(0, Math.floor((fullCanvas.width - viewportWidth) * 0.5));
  const cropY = Math.max(0, Math.floor((fullCanvas.height - viewportHeight) * 0.5));
  const cropW = Math.min(viewportWidth, fullCanvas.width - cropX);
  const cropH = Math.min(viewportHeight, fullCanvas.height - cropY);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  const fullWorld = frameMetaFull.world;
  const fullView = frameMetaFull.view;
  const worldPerPxX = (fullWorld.maxX - fullWorld.minX) / Math.max(1, fullView.width - 1);
  const worldPerPxY = (fullWorld.maxY - fullWorld.minY) / Math.max(1, fullView.height - 1);
  const viewWorldMinX = fullWorld.minX + cropX * worldPerPxX;
  const viewWorldMaxX = viewWorldMinX + worldPerPxX * Math.max(1, cropW - 1);
  const viewWorldMinY = fullWorld.minY + cropY * worldPerPxY;
  const viewWorldMaxY = viewWorldMinY + worldPerPxY * Math.max(1, cropH - 1);

  return {
    cropX, cropY, cropW, cropH,
    frameMeta: {
      ...frameMetaFull,
      world: {
        minX: viewWorldMinX,
        maxX: viewWorldMaxX,
        minY: viewWorldMinY,
        maxY: viewWorldMaxY,
        centerX: (viewWorldMinX + viewWorldMaxX) * 0.5,
        centerY: (viewWorldMinY + viewWorldMaxY) * 0.5,
      },
      view: {
        width: cropW,
        height: cropH,
        centerX: cropW * 0.5,
        centerY: cropH * 0.5,
        scaleX: (cropW - 1) / Math.max(viewWorldMaxX - viewWorldMinX, 1e-6),
        scaleY: (cropH - 1) / Math.max(viewWorldMaxY - viewWorldMinY, 1e-6),
      },
    },
  };
}

function formatDebugDimension(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "n/a";
  }
  return formatNumberForUi(num, Number.isInteger(num) ? 0 : 2);
}

function getScreenViewportDebugLines() {
  const vv = window.visualViewport;
  const orientationType = String(window.screen?.orientation?.type || "n/a");
  const orientationAngle = Number(window.screen?.orientation?.angle);

  return [
    "-- screen / viewport --",
    `screen.width/height: ${formatDebugDimension(window.screen?.width)} x ${formatDebugDimension(window.screen?.height)}`,
    `screen.availWidth/availHeight: ${formatDebugDimension(window.screen?.availWidth)} x ${formatDebugDimension(window.screen?.availHeight)}`,
    `screen.colorDepth/pixelDepth: ${formatDebugDimension(window.screen?.colorDepth)} / ${formatDebugDimension(window.screen?.pixelDepth)}`,
    `screen.orientation.type/angle: ${orientationType} / ${Number.isFinite(orientationAngle) ? formatDebugDimension(orientationAngle) : "n/a"}`,
    `window.devicePixelRatio: ${formatDebugDimension(window.devicePixelRatio)}`,
    `window.innerWidth/innerHeight: ${formatDebugDimension(window.innerWidth)} x ${formatDebugDimension(window.innerHeight)}`,
    `window.outerWidth/outerHeight: ${formatDebugDimension(window.outerWidth)} x ${formatDebugDimension(window.outerHeight)}`,
    `document.clientWidth/clientHeight: ${formatDebugDimension(document.documentElement?.clientWidth)} x ${formatDebugDimension(document.documentElement?.clientHeight)}`,
    `visualViewport.width/height: ${formatDebugDimension(vv?.width)} x ${formatDebugDimension(vv?.height)}`,
    `visualViewport.pageLeft/pageTop: ${formatDebugDimension(vv?.pageLeft)} / ${formatDebugDimension(vv?.pageTop)}`,
    `visualViewport.offsetLeft/offsetTop: ${formatDebugDimension(vv?.offsetLeft)} / ${formatDebugDimension(vv?.offsetTop)}`,
    `visualViewport.scale: ${formatDebugDimension(vv?.scale)}`,
  ];
}

function drawDebugOverlay(meta, targetCtx = ctx) {
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

  targetCtx.save();
  const tickFontPx = Math.max(15, Math.round(Math.min(view.width, view.height) * 0.014));
  targetCtx.fillStyle = "rgba(255,255,255,0.92)";
  targetCtx.font = `${tickFontPx}px system-ui, sans-serif`;

  if (showMinorX || showMinorY) {
    targetCtx.strokeStyle = "rgba(255,255,255,0.08)";
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();

    if (showMinorX) {
      const start = Math.ceil(world.minX / minorXStep) * minorXStep;
      for (let value = start; value <= world.maxX + minorXStep * 0.5; value += minorXStep) {
        const px = ((value - world.minX) / (world.maxX - world.minX)) * view.width;
        targetCtx.moveTo(px, 0);
        targetCtx.lineTo(px, view.height);
      }
    }

    if (showMinorY) {
      const start = Math.ceil(world.minY / minorYStep) * minorYStep;
      for (let value = start; value <= world.maxY + minorYStep * 0.5; value += minorYStep) {
        const py = ((value - world.minY) / (world.maxY - world.minY)) * view.height;
        targetCtx.moveTo(0, py);
        targetCtx.lineTo(view.width, py);
      }
    }

    targetCtx.stroke();
  }

  targetCtx.strokeStyle = "rgba(255,255,255,0.16)";
  targetCtx.lineWidth = 1;
  targetCtx.beginPath();
  for (const xValue of xTicks.values) {
    const xTick = ((xValue - world.minX) / (world.maxX - world.minX)) * view.width;
    targetCtx.moveTo(xTick, 0);
    targetCtx.lineTo(xTick, view.height);
  }
  for (const yValue of yTicks.values) {
    if (originVisible && Math.abs(yValue) <= yTicks.step * 0.5) {
      continue;
    }
    const yTick = ((yValue - world.minY) / (world.maxY - world.minY)) * view.height;
    targetCtx.moveTo(0, yTick);
    targetCtx.lineTo(view.width, yTick);
  }
  targetCtx.stroke();

  targetCtx.strokeStyle = "rgba(255,255,255,0.78)";
  targetCtx.lineWidth = 1.8;
  targetCtx.beginPath();
  targetCtx.moveTo(0, xAxisY);
  targetCtx.lineTo(view.width, xAxisY);
  targetCtx.moveTo(yAxisX, 0);
  targetCtx.lineTo(yAxisX, view.height);
  targetCtx.stroke();

  targetCtx.strokeStyle = "rgba(255,255,255,0.9)";
  targetCtx.lineWidth = 1;
  for (const xValue of xTicks.values) {
    const xTick = ((xValue - world.minX) / (world.maxX - world.minX)) * view.width;
    targetCtx.beginPath();
    targetCtx.moveTo(xTick, xAxisY - 6);
    targetCtx.lineTo(xTick, xAxisY + 6);
    targetCtx.stroke();
    targetCtx.fillText(formatTickValue(xValue, xTicks.step), xTick + 4, xAxisY - 10);
  }

  for (const yValue of yTicks.values) {
    if (originVisible && Math.abs(yValue) <= yTicks.step * 0.5) {
      continue;
    }
    const yTick = ((yValue - world.minY) / (world.maxY - world.minY)) * view.height;
    targetCtx.beginPath();
    targetCtx.moveTo(yAxisX - 6, yTick);
    targetCtx.lineTo(yAxisX + 6, yTick);
    targetCtx.stroke();
    targetCtx.fillText(formatTickValue(yValue, yTicks.step), yAxisX + 9, yTick - 4);
  }

  targetCtx.restore();

  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  const params = getDerivedParams();
  const centerX = (world.minX + world.maxX) / 2;
  const centerY = (world.minY + world.maxY) / 2;

  debugInfoEl.textContent = [
    `formula: ${formula?.name || currentFormulaId}`,
    `a: ${formatNumberForUi(params.a, 6)}`,
    `b: ${formatNumberForUi(params.b, 6)}`,
    `c: ${formatNumberForUi(params.c, 6)}`,
    `d: ${formatNumberForUi(params.d, 6)}`,
    `iterations: ${formatNumberForUi(meta.iterations, 0)}`,
    "seeds: 1",
    `x range: ${formatNumberForUi(world.minX, 3)} to ${formatNumberForUi(world.maxX, 3)}`,
    `y range: ${formatNumberForUi(world.minY, 3)} to ${formatNumberForUi(world.maxY, 3)}`,
    `range centre: (${formatNumberForUi(centerX, 3)}, ${formatNumberForUi(centerY, 3)})`,
    `gesture state: ${overlayState.interactionState}`,
    `2f dxm/dym/dd: ${overlayState.lastTwoDebug ? `${formatNumberForUi(overlayState.lastTwoDebug.dxm, 2)} / ${formatNumberForUi(overlayState.lastTwoDebug.dym, 2)} / ${formatNumberForUi(overlayState.lastTwoDebug.dd, 2)}` : "-"}`,
    `2f ratioStep/zoom: ${overlayState.lastTwoDebug ? `${formatNumberForUi(overlayState.lastTwoDebug.ratioStep, 4)} / ${formatNumberForUi(overlayState.lastTwoDebug.viewZoom, 4)}` : "-"}`,
    `fps: ${formatNumberForUi(renderState.fpsEstimate, 1)}`,
    ...getScreenViewportDebugLines(),
  ].join("\n");
}

async function draw() {
  if (!appData || !currentFormulaId) {
    return;
  }

  const renderGenerationAtStart = renderState.renderGeneration;
  const startedAt = performance.now();
  const didResize = resizeCanvas();
  const iterationSetting = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  const burnSetting = Math.round(clamp(appData.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max));
  const iterations = iterationSetting;
  if (renderState.panZoomInteractionActive && !didResize && renderState.activePanZoomCacheEntry && drawInteractionFrameFromCache(renderState.activePanZoomCacheEntry)) {
    redrawOverlayCanvases(renderState.lastRenderMeta);
    layoutFloatingActions();
    return;
  }
  renderState.renderProgressStartedAt = performance.now();
  renderState.renderProgressShownThisDraw = false;
  const { pxW, pxH } = exportState.exportManager.getExportSizePx(canvas);
  const cropScale = Math.max(
    1,
    canvas.width / Math.max(1, pxW),
    canvas.height / Math.max(1, pxH),
  );
  const fullCanvas = exportState.exportManager.ensureExportCacheCanvas(
    Math.max(1, Math.round(pxW * cropScale)),
    Math.max(1, Math.round(pxH * cropScale)),
  );
  const exportCtx = exportState.exportManager.getExportContext();
  let frameMetaFull;
  try {
    frameMetaFull = await renderFrame({
      ctx: exportCtx,
      canvas: fullCanvas,
      formulaId: currentFormulaId,
      cmapName: appData.defaults.cmapName,
      params: getDerivedParams(),
      iterations,
      burn: burnSetting,
      scaleMode: getScaleMode(),
      fixedView: renderState.fixedView,
      seed: getSeedForFormula(currentFormulaId),
      renderColoring: getRenderColoringOptions(),
      backgroundColor: hexToRgb(appData.defaults.backgroundColor || "#05070c"),
      onProgress: (percent, isComplete) => {
        if (isRenderGenerationCurrent(renderGenerationAtStart)) {
          updateRenderProgressToast(percent, isComplete);
        }
      },
      isCancelled: () => !isRenderGenerationCurrent(renderGenerationAtStart),
    });
  } catch (error) {
    if (isRenderCancelledError(error)) {
      return;
    }
    throw error;
  }

  if (!isRenderGenerationCurrent(renderGenerationAtStart)) {
    return;
  }

  const { frameMeta } = drawBaseRenderFromFullCanvas(fullCanvas, frameMetaFull);


  const now = performance.now();
  const delta = renderState.lastDrawTimestamp > 0 ? now - renderState.lastDrawTimestamp : 0;
  if (delta > 0) {
    const instantFps = 1000 / delta;
    renderState.fpsEstimate = renderState.fpsEstimate === 0 ? instantFps : renderState.fpsEstimate * 0.85 + instantFps * 0.15;
  }
  renderState.lastDrawTimestamp = now;

  renderState.lastRenderMeta = {
    ...frameMeta,
    iterations,
    renderMs: now - startedAt,
  };
  renderState.lastFullRenderMeta = {
    ...frameMetaFull,
    iterations,
    renderMs: now - startedAt,
  };
  const stateKey = getRenderStateKey();
  cacheAccurateFrame({
    key: stateKey,
    fullCanvas,
    fullMeta: renderState.lastFullRenderMeta,
    frameMeta: renderState.lastRenderMeta,
    sourceFixedView: renderState.fixedView,
  });
  clearPanZoomInteractionCache();
  renderState.renderRevision += 1;
  exportState.exportManager.markExportCacheRendered(fullCanvas.width, fullCanvas.height, renderState.renderRevision);

  const manualOverlayActive = shouldShowManualOverlay();
  if (manualOverlayActive && !renderState.wasManualOverlayActive && interestOverlay.isCalcInProgress()) {
    interestOverlay.enableProgressToast();
  }
  renderState.wasManualOverlayActive = manualOverlayActive;

  redrawOverlayCanvases(renderState.lastRenderMeta);
  refreshParamButtons();
  updateQuickSliderReadout();
  syncDetailedSettingsControls();
  layoutFloatingActions();

  if (interestOverlay.shouldShowInterestOverlay()) {
    interestOverlay.scheduleRecalc({ meta: renderState.lastRenderMeta, immediate: false, showProgress: true });
  }

}


function syncCameraButtonHighlight() {
  const shouldHighlight = Boolean(exportState.exportManager?.hasPendingShare()) || Boolean(screenshotMenuOverlayEl?.classList.contains("is-open"));
  cameraBtn?.classList.toggle("is-active", shouldHighlight);
}

function openScreenshotMenu() {
  syncScreenshotMenuShareRetryUi();
  screenshotMenuOverlayEl?.classList.add("is-open");
  syncCameraButtonHighlight();
}

function closeScreenshotMenu() {
  screenshotMenuOverlayEl?.classList.remove("is-open");
  syncCameraButtonHighlight();
}

function syncScreenshotMenuShareRetryUi() {
  if (!screenshotMenuShareRetryEl) {
    return;
  }

  const hasPendingShare = Boolean(exportState.exportManager?.hasPendingShare());
  screenshotMenuShareRetryEl.classList.toggle("is-hidden", !hasPendingShare);
  if (screenshotMenuShareRetryHintEl) {
    screenshotMenuShareRetryHintEl.textContent = hasPendingShare
      ? "Needed when browser requires a second explicit tap to share."
      : "Shown when share needs a fresh tap.";
  }
  syncCameraButtonHighlight();
}

async function retryPendingShare() {
  const outcome = await exportState.exportManager?.retryPendingShare();
  if (outcome === "missing") {
    showToast("No prepared screenshot waiting to share.");
    return;
  }
  if (outcome === "shared") {
    syncScreenshotMenuShareRetryUi();
    closeScreenshotMenu();
    showToast("Screenshot shared.");
    return;
  }
  if (outcome === "cancelled") {
    showToast("Share cancelled.");
    return;
  }
  if (outcome && outcome.startsWith("error:")) {
    showToast(`Share failed: ${outcome.slice(6)}`);
  }
}


function ensureHelpSliderOpen() {
  if (quickSliderOverlay.classList.contains("is-open")) {
    return;
  }

  const preferred = ["a", "b", "c", "d", "iters"];
  const sliderKey = preferred.find((key) => isSliderKeyAvailable(key));
  if (sliderKey) {
    openQuickSlider(sliderKey);
  }
}

function initHelpOverlay() {
  if (!helpBtn || uiState.helpOverlayController) {
    return;
  }

  uiState.helpOverlayController = createHelpOverlay({
    helpButton: helpBtn,
    isSliderOpen: () => quickSliderOverlay.classList.contains("is-open"),
    ensureSliderOpen: ensureHelpSliderOpen,
    closeSlider: closeQuickSlider,
    getActiveHelpContexts: () => {
      const contexts = [];

      if (pickerOverlay.classList.contains("is-open")) {
        if (uiState.activePicker === "formula") {
          contexts.push("formulaPanel");
        } else if (uiState.activePicker === "cmap") {
          contexts.push("colorPanel");
        }
      }

      if (rangesEditorPanelEl && !rangesEditorPanelEl.classList.contains("is-hidden")) {
        contexts.push("settingsPanel");
      }

      return contexts;
    },
    onOpened: () => {
      showToast("Help mode enabled.");
    },
    onClosed: () => {
      showToast("Help mode closed.");
    },
  });
}

function registerHandlers() {
  pickerBackdrop.addEventListener("click", () => closePicker());
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


  const closeSliderFromUi = (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeQuickSlider();
  };
  qsClose.addEventListener("click", closeSliderFromUi);
  qsClose.addEventListener("pointerup", closeSliderFromUi);
  qsClose.addEventListener("touchend", closeSliderFromUi, { passive: false });
  const onQuickSliderTopTap = (event) => {
    if (event.target instanceof Element && event.target.closest("button, input")) {
      return;
    }
    const now = performance.now();
    const isDoubleTap = now - uiState.lastQuickSliderTopTapAt <= DOUBLE_TAP_MS;
    uiState.lastQuickSliderTopTapAt = now;
    if (!isDoubleTap) {
      return;
    }
    if (["a", "b", "c", "d"].includes(uiState.activeSliderKey || "")) {
      resetParamSliderToZero(uiState.activeSliderKey);
    }
  };
  qsTop?.addEventListener("pointerup", onQuickSliderTopTap);
  quickSliderEl?.setAttribute("draggable", "false");
  quickSliderEl?.addEventListener("dragstart", (event) => event.preventDefault());
  quickSliderBackdrop.addEventListener("click", () => {
    closeQuickSlider();
  });

  qsRange.addEventListener("input", () => {
    const rawValue = Number.parseFloat(qsRange.value);
    const mappedValue = getSliderValueFromQuickSliderRangeValue(uiState.activeSliderKey, rawValue);
    applySliderValue(mappedValue, { commitHistory: false });
  });
  qsRange.addEventListener("change", () => {
    commitCurrentStateToHistory();
  });

  setupStepHold(qsMinus, -1);
  setupStepHold(qsPlus, 1);

  cameraBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openScreenshotMenu();
  });
  cameraBtn.addEventListener("contextmenu", (event) => event.preventDefault());
  screenshotMenuCloseEl?.addEventListener("click", () => closeScreenshotMenu());
  screenshotMenuBackdropEl?.addEventListener("click", () => closeScreenshotMenu());
  screenshotMenuCleanEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await exportState.exportManager.captureScreenshotAction("clean", { openScreenshotMenu, onShareRetryStateChange: syncScreenshotMenuShareRetryUi });
  });
  screenshotMenuOverlayOptionEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await exportState.exportManager.captureScreenshotAction("overlay", { openScreenshotMenu, onShareRetryStateChange: syncScreenshotMenuShareRetryUi });
  });
  screenshotMenu4kEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await exportState.exportManager.captureScreenshotAction("4k");
  });
  screenshotMenu8kEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await exportState.exportManager.captureScreenshotAction("8k");
  });
  screenshotMenuShareRetryEl?.addEventListener("click", async () => {
    await retryPendingShare();
  });

  scaleModeBtn.addEventListener("click", () => {
    const currentlyFixed = getScaleMode() === "fixed";
    if (!currentlyFixed) {
      syncFixedViewFromLastRenderMeta();
    }
    appData.defaults.scaleMode = currentlyFixed ? "auto" : "fixed";
    syncScaleModeButton();
    saveDefaultsToStorage();
    requestDraw();
    commitCurrentStateToHistory();
    showToast(getScaleMode() === "auto" ? "Auto scale enabled." : "Auto scale disabled.");
  });

  overlayToggleBtn?.addEventListener("click", () => {
    if (!hasAnyManualTargets()) {
      showToast("Overlay inactive: assign ManX and/or ManY first.");
      return;
    }
    applyInterestOverlayEnabled(!Boolean(appData.defaults.interestOverlayEnabled));
  });

  helpBtn?.addEventListener("click", () => {
    if (!uiState.helpOverlayController) {
      return;
    }
    uiState.helpOverlayController.toggle();
  });

  const toggleRandomMode = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const nextMode = uiState.randomAllNextMode;
    applyAllParamModes(nextMode);
    uiState.randomAllNextMode = nextMode === "rand" ? "fix" : "rand";
    syncRandomModeButton();
    showToast(nextMode === "rand" ? "RAN mode enabled. Tap right to go forward/randomise, left to go back." : "FIX mode enabled. History tap controls are inactive.");
  };

  let randomBtnLastTap = 0;
  randomModeBtn.addEventListener("pointerup", (event) => {
    const now = performance.now();
    if (now - randomBtnLastTap <= DOUBLE_TAP_MS) {
      toggleRandomMode(event);
      randomBtnLastTap = 0;
      return;
    }
    randomBtnLastTap = now;
  });

  rangesEditorToggleEl?.addEventListener("click", () => {
    if (rangesEditorPanelEl?.classList.contains("is-hidden")) {
      uiState.openRangesEditor();
    } else {
      uiState.closeRangesEditor();
    }
  });
  formulaSettingsCloseEl?.addEventListener("click", uiState.closeFormulaSettingsPanel);
  formulaSettingsCloseBottomEl?.addEventListener("click", uiState.closeFormulaSettingsPanel);

  formulaSettingsApplyEl?.addEventListener("click", applyRangesOverrideFromEditor);
  formulaSettingsResetEl?.addEventListener("click", () => {
    resetFormulaDefaults(getSelectedRangesEditorFormulaId());
  });
  detailStartupIterationsRangeEl?.addEventListener("input", () => applyIterationStartupDefault(detailStartupIterationsRangeEl.value));
  detailMaxRandomItersRangeEl?.addEventListener("input", () => applyMaxRandomIterations(detailMaxRandomItersRangeEl.value));
  detailIterationAbsoluteMaxRangeEl?.addEventListener("input", () => applyIterationAbsoluteMax(detailIterationAbsoluteMaxRangeEl.value));
  detailHistoryCacheSizeRangeEl?.addEventListener("input", () => applyHistoryCacheSize(detailHistoryCacheSizeRangeEl.value));
  detailBurnRangeEl?.addEventListener("input", () => applyDetailedSliderValue("burn", detailBurnRangeEl.value));
  detailOverlayAlphaRangeEl?.addEventListener("input", () => applyOverlayTransparency(detailOverlayAlphaRangeEl.value));
  detailInterestOverlayToggleEl?.addEventListener("change", () => applyInterestOverlayEnabled(detailInterestOverlayToggleEl.checked));
  detailInterestOverlayOpacityRangeEl?.addEventListener("input", () => applyInterestOverlayOpacity(detailInterestOverlayOpacityRangeEl.value));
  detailInterestGridSizeRangeEl?.addEventListener("input", () => applyInterestGridSize(detailInterestGridSizeRangeEl.value));
  detailInterestScanIterationsRangeEl?.addEventListener("input", () => applyInterestScanIterations(detailInterestScanIterationsRangeEl.value));
  detailInterestLyapunovEnabledToggleEl?.addEventListener("change", () => applyInterestLyapunovEnabled(detailInterestLyapunovEnabledToggleEl.checked));
  detailInterestLyapunovMinExponentRangeEl?.addEventListener("input", () => applyInterestLyapunovMinExponent(detailInterestLyapunovMinExponentRangeEl.value));
  detailInterestLyapunovDelta0RangeEl?.addEventListener("input", () => applyInterestLyapunovDelta0(detailInterestLyapunovDelta0RangeEl.value));
  detailInterestLyapunovRescaleToggleEl?.addEventListener("change", () => applyInterestLyapunovRescale(detailInterestLyapunovRescaleToggleEl.checked));
  detailInterestLyapunovMaxDistanceRangeEl?.addEventListener("input", () => applyInterestLyapunovMaxDistance(detailInterestLyapunovMaxDistanceRangeEl.value));
  holdSpeedRangeEl?.addEventListener("input", () => applyHoldSpeedScale(holdSpeedRangeEl.value));
  holdRepeatMsRangeEl?.addEventListener("input", () => applyHoldTimingSetting("holdRepeatMs", holdRepeatMsRangeEl.value));
  holdAccelStartMsRangeEl?.addEventListener("input", () => applyHoldTimingSetting("holdAccelStartMs", holdAccelStartMsRangeEl.value));
  holdAccelEndMsRangeEl?.addEventListener("input", () => applyHoldTimingSetting("holdAccelEndMs", holdAccelEndMsRangeEl.value));
  touchZoomDeadbandRangeEl?.addEventListener("input", () => applyTouchZoomTuningSetting("touchZoomDeadbandPx", touchZoomDeadbandRangeEl.value));
  touchZoomRatioMinRangeEl?.addEventListener("input", () => applyTouchZoomTuningSetting("touchZoomRatioMin", touchZoomRatioMinRangeEl.value));

  detailDebugToggleEl?.addEventListener("change", () => {
    appData.defaults.debug = Boolean(detailDebugToggleEl.checked);
    syncDebugToggleUi();
    saveDefaultsToStorage();
    requestDraw();
  });

  detailColorModeSelectEl?.addEventListener("change", () => applyRenderColorMode(detailColorModeSelectEl.value));
  detailLogStrengthRangeEl?.addEventListener("input", () => applyRenderColorParam("renderLogStrength", detailLogStrengthRangeEl.value, 0.5, 30, 1));
  detailDensityGammaRangeEl?.addEventListener("input", () => applyRenderColorParam("renderDensityGamma", detailDensityGammaRangeEl.value, 0.2, 2, 2));
  detailHybridBlendRangeEl?.addEventListener("input", () => applyRenderColorParam("renderHybridBlend", detailHybridBlendRangeEl.value, 0, 1, 2));

  detailBackgroundColorEl?.addEventListener("input", (event) => {
    appData.defaults.backgroundColor = event.target.value;
    detailBackgroundColorValueEl.textContent = appData.defaults.backgroundColor;
    applyBackgroundTheme();
    requestDraw();
    saveDefaultsToStorage();
  });



  addColorStopBtnEl?.addEventListener("click", () => {
    if (!uiState.activeColorSettingsMap) return;
    const next = getColorMapStops(uiState.activeColorSettingsMap) || [];
    if (!next.length) return;
    const insertAt = Math.floor(next.length / 2);
    const left = next[Math.max(0, insertAt - 1)] || next[0];
    const right = next[Math.min(next.length - 1, insertAt)] || next[next.length - 1];
    next.splice(insertAt, 0, [(left[0] + right[0]) * 0.5, right[1], right[2], right[3], right[4]]);
    setColorMapStops(uiState.activeColorSettingsMap, next);
    renderColorStopsEditor();
    colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
    requestDraw();
  });

  resetColorStopsBtnEl?.addEventListener("click", () => {
    if (!uiState.activeColorSettingsMap) return;
    setColorMapStops(uiState.activeColorSettingsMap, null);
    renderColorStopsEditor();
    colorSettingsPreviewEl.style.background = buildColorMapGradient(uiState.activeColorSettingsMap);
    requestDraw();
    saveDefaultsToStorage();
  });

  colorSettingsCloseEl?.addEventListener("click", uiState.closeColorSettingsPanel);

  infoMaxRandomItersEl?.addEventListener("click", (event) => {
    showSettingsInfo("Max random iterations limits the upper bound for randomization of iteration count.", event.currentTarget);
  });
  infoBurnEl?.addEventListener("click", (event) => {
    showSettingsInfo("Burn-in steps discard the first orbit points. Higher burn removes initial transients before plotting.", event.currentTarget);
  });
  infoDebugEl?.addEventListener("click", (event) => {
    showSettingsInfo("Debug overlay draws extra guides and diagnostics. Turning it off reduces UI drawing overhead.", event.currentTarget);
  });
  infoColorModeEl?.addEventListener("click", (event) => {
    showSettingsInfo("Switch between iteration-order and density-based coloring methods to emphasize different structure in the attractor.", event.currentTarget);
  });
  infoLogStrengthEl?.addEventListener("click", (event) => {
    showSettingsInfo("Log strength compresses extreme hit counts. Increase it when dense centers overwhelm medium-detail regions.", event.currentTarget);
  });
  infoDensityGammaEl?.addEventListener("click", (event) => {
    showSettingsInfo("Gamma reshapes density contrast. Lower values brighten medium-density detail; higher values emphasize only the densest regions.", event.currentTarget);
  });
  infoHybridBlendEl?.addEventListener("click", (event) => {
    showSettingsInfo("Hybrid age blend mixes density color with recency color. Increase to make newer orbit paths more visible.", event.currentTarget);
  });
  window.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (uiState.activeInfoAnchorEl && !target.closest("#settingsInfoPopup, .perfInfoBtn")) {
      hideSettingsInfo();
    }
    uiState.closeDismissablePanelsForTarget(target);
  });

  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", onCanvasPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onCanvasPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onCanvasPointerUp, { passive: false });
  canvas.addEventListener("pointercancel", onCanvasPointerUp, { passive: false });
  canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("pointerdown", (event) => {
    if (isEventInsideInteractiveUi(event.target)) {
      overlayState.historyTapTracker = null;
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      overlayState.historyTapTracker = null;
      return;
    }

    overlayState.historyTapTracker = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      validTap: true,
    };
  });

  window.addEventListener("pointermove", updateHistoryTapTrackerFromMove, { passive: true });
  window.addEventListener("pointerup", (event) => {
    handleScreenHistoryNavigation(event);
    if (overlayState.historyTapTracker?.pointerId === event.pointerId) {
      overlayState.historyTapTracker = null;
    }
  });
  window.addEventListener("pointercancel", (event) => {
    if (overlayState.historyTapTracker?.pointerId === event.pointerId) {
      overlayState.historyTapTracker = null;
    }
  });
  window.addEventListener("keydown", onKeyboardArrowDown, { passive: false });
  window.addEventListener("keyup", onKeyboardArrowUp, { passive: true });
  window.addEventListener("blur", stopKeyboardHold, { passive: true });

  window.addEventListener(
    "resize",
    () => {
      if (quickSliderOverlay.classList.contains("is-open")) {
        alignQuickSliderAboveBottomBar();
      }
      if (pickerOverlay.classList.contains("is-open")) {
        layoutPickerPanel();
      }
      uiState.layoutFormulaSettingsPanel();
      uiState.layoutColorSettingsPanel();
      uiState.layoutModeSettingsPanel();
      layoutFloatingActions();
      if (toastEl?.classList.contains("is-visible")) {
        positionToastForTopActions();
        suppressToastWhenHelpOpenAndBelowActions();
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
      uiState.layoutFormulaSettingsPanel();
      uiState.layoutColorSettingsPanel();
      uiState.layoutModeSettingsPanel();
      layoutFloatingActions();
      if (toastEl?.classList.contains("is-visible")) {
        positionToastForTopActions();
        suppressToastWhenHelpOpenAndBelowActions();
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

  data.defaults.sliders = migrateLegacySliderKeys({
    ...(data.defaults.sliders || {}),
  });

  if (typeof data.defaults.sliders.burn !== "number") {
    data.defaults.sliders.burn = 120;
  }
  normalizeIterationSettings(data.defaults);
  if (!RENDER_COLOR_MODE_SET.has(data.defaults.renderColorMode)) {
    data.defaults.renderColorMode = RENDER_COLOR_MODES.ITERATION_ORDER;
  }
  if (typeof data.defaults.renderLogStrength !== "number") {
    data.defaults.renderLogStrength = 9;
  }
  if (typeof data.defaults.renderDensityGamma !== "number") {
    data.defaults.renderDensityGamma = 0.6;
  }
  if (typeof data.defaults.renderHybridBlend !== "number") {
    data.defaults.renderHybridBlend = 0.3;
  }
  if (typeof data.defaults.overlayAlpha !== "number") {
    data.defaults.overlayAlpha = 0.9;
  }
  if (typeof data.defaults.interestOverlayEnabled !== "boolean") {
    data.defaults.interestOverlayEnabled = false;
  }
  if (typeof data.defaults.interestOverlayOpacity !== "number") {
    data.defaults.interestOverlayOpacity = INTEREST_OVERLAY_OPACITY_DEFAULT;
  }
  if (typeof data.defaults.interestGridSize !== "number") {
    data.defaults.interestGridSize = 24;
  }
  if (typeof data.defaults.interestScanIterations !== "number") {
    data.defaults.interestScanIterations = 1200;
  }
  if (typeof data.defaults.interestLyapunovEnabled !== "boolean") {
    data.defaults.interestLyapunovEnabled = false;
  }
  if (typeof data.defaults.interestLyapunovMinExponent !== "number") {
    data.defaults.interestLyapunovMinExponent = 0;
  }
  if (typeof data.defaults.interestLyapunovDelta0 !== "number") {
    data.defaults.interestLyapunovDelta0 = 1e-6;
  }
  if (typeof data.defaults.interestLyapunovRescale !== "boolean") {
    data.defaults.interestLyapunovRescale = true;
  }
  if (typeof data.defaults.interestLyapunovMaxDistance !== "number") {
    data.defaults.interestLyapunovMaxDistance = INTEREST_LYAPUNOV_MAX_DISTANCE_MAX;
  }
  if (typeof data.defaults.holdSpeedScale !== "number") {
    data.defaults.holdSpeedScale = 1;
  }
  if (typeof data.defaults.holdRepeatMs !== "number") {
    data.defaults.holdRepeatMs = HOLD_REPEAT_MS_DEFAULT;
  }
  if (typeof data.defaults.holdAccelStartMs !== "number") {
    data.defaults.holdAccelStartMs = HOLD_ACCEL_START_MS_DEFAULT;
  }
  if (typeof data.defaults.holdAccelEndMs !== "number") {
    data.defaults.holdAccelEndMs = HOLD_ACCEL_END_MS_DEFAULT;
  }
  if (typeof data.defaults.touchZoomDeadbandPx !== "number") {
    data.defaults.touchZoomDeadbandPx = TOUCH_ZOOM_DEADBAND_PX_DEFAULT;
  }
  if (typeof data.defaults.touchZoomRatioMin !== "number") {
    data.defaults.touchZoomRatioMin = typeof data.defaults.touchZoomSensitivityThreshold === "number"
      ? data.defaults.touchZoomSensitivityThreshold
      : TOUCH_ZOOM_RATIO_MIN_DEFAULT;
  }

  normalizeIterationSettings(data.defaults);
  data.defaults.sliders.burn = Math.round(clamp(data.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max));
  data.defaults.renderLogStrength = clamp(data.defaults.renderLogStrength, 0.5, 30);
  data.defaults.renderDensityGamma = clamp(data.defaults.renderDensityGamma, 0.2, 2);
  data.defaults.renderHybridBlend = clamp(data.defaults.renderHybridBlend, 0, 1);
  data.defaults.overlayAlpha = clamp(data.defaults.overlayAlpha, 0.1, 1);
  data.defaults.interestOverlayOpacity = normalizeInterestOverlayOpacity(data.defaults.interestOverlayOpacity);
  data.defaults.interestGridSize = normalizeInterestGridSize(data.defaults.interestGridSize);
  data.defaults.interestScanIterations = Math.round(clamp(data.defaults.interestScanIterations, INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
  data.defaults.interestLyapunovMinExponent = clamp(data.defaults.interestLyapunovMinExponent, INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX);
  data.defaults.interestLyapunovDelta0 = clamp(data.defaults.interestLyapunovDelta0, INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX);
  data.defaults.interestLyapunovMaxDistance = clamp(data.defaults.interestLyapunovMaxDistance, INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX);
  data.defaults.holdSpeedScale = clamp(data.defaults.holdSpeedScale, HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
  data.defaults.holdRepeatMs = Math.round(clamp(data.defaults.holdRepeatMs, HOLD_REPEAT_MS_MIN, HOLD_REPEAT_MS_MAX));
  data.defaults.holdAccelStartMs = Math.round(clamp(data.defaults.holdAccelStartMs, HOLD_ACCEL_START_MS_MIN, HOLD_ACCEL_START_MS_MAX));
  data.defaults.holdAccelEndMs = Math.round(clamp(data.defaults.holdAccelEndMs, HOLD_ACCEL_END_MS_MIN, HOLD_ACCEL_END_MS_MAX));
  data.defaults.touchZoomDeadbandPx = clamp(data.defaults.touchZoomDeadbandPx, TOUCH_ZOOM_DEADBAND_PX_MIN, TOUCH_ZOOM_DEADBAND_PX_MAX);
  data.defaults.touchZoomRatioMin = clamp(data.defaults.touchZoomRatioMin, TOUCH_ZOOM_RATIO_MIN_MIN, TOUCH_ZOOM_RATIO_MIN_MAX);
  if (data.defaults.holdAccelEndMs <= data.defaults.holdAccelStartMs) {
    data.defaults.holdAccelEndMs = data.defaults.holdAccelStartMs + 1;
  }

  if (data.defaults.scaleMode !== "fixed") {
    data.defaults.scaleMode = "auto";
  }

  if (!data.defaults.rangesOverridesByFormula || typeof data.defaults.rangesOverridesByFormula !== "object") {
    data.defaults.rangesOverridesByFormula = {};
  }

  if (!data.defaults.formulaSeeds || typeof data.defaults.formulaSeeds !== "object") {
    data.defaults.formulaSeeds = {};
  }

  if (!data.defaults.formulaParamDefaultsByFormula || typeof data.defaults.formulaParamDefaultsByFormula !== "object") {
    data.defaults.formulaParamDefaultsByFormula = {};
  }

  data.formulas = FORMULA_METADATA.map((formula) => ({ ...formula }));
  data.formula_ranges_raw = JSON.parse(JSON.stringify(FORMULA_RANGES_RAW));

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
    builtInFormulaRanges = appData.formula_ranges_raw || {};
    loadDefaultsFromStorage();
    normalizeIterationSettings();
    normalizeSliderDefaults();
    appData.defaults.backgroundColor = typeof appData.defaults.backgroundColor === "string" ? appData.defaults.backgroundColor : "#05070c";
    appData.defaults.colorMapStopOverrides = appData.defaults.colorMapStopOverrides || {};
    appData.defaults.overlayAlpha = clamp(Number(appData.defaults.overlayAlpha ?? 0.9), 0.1, 1);
    appData.defaults.interestOverlayEnabled = Boolean(appData.defaults.interestOverlayEnabled);
    appData.defaults.interestOverlayOpacity = normalizeInterestOverlayOpacity(appData.defaults.interestOverlayOpacity ?? INTEREST_OVERLAY_OPACITY_DEFAULT);
    appData.defaults.interestGridSize = normalizeInterestGridSize(appData.defaults.interestGridSize ?? 24);
    appData.defaults.interestScanIterations = Math.round(clamp(Number(appData.defaults.interestScanIterations ?? 1200), INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
    appData.defaults.interestLyapunovEnabled = Boolean(appData.defaults.interestLyapunovEnabled);
    appData.defaults.interestLyapunovMinExponent = clamp(Number(appData.defaults.interestLyapunovMinExponent ?? 0), INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX);
    appData.defaults.interestLyapunovDelta0 = clamp(Number(appData.defaults.interestLyapunovDelta0 ?? 1e-6), INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX);
    appData.defaults.interestLyapunovRescale = Boolean(appData.defaults.interestLyapunovRescale ?? true);
    appData.defaults.interestLyapunovMaxDistance = clamp(Number(appData.defaults.interestLyapunovMaxDistance ?? INTEREST_LYAPUNOV_MAX_DISTANCE_MAX), INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX);
    normalizeIterationSettings();
    appData.defaults.holdSpeedScale = clamp(Number(appData.defaults.holdSpeedScale ?? 1), HOLD_SPEED_SCALE_MIN, HOLD_SPEED_SCALE_MAX);
    appData.defaults.touchZoomDeadbandPx = clamp(Number(appData.defaults.touchZoomDeadbandPx ?? TOUCH_ZOOM_DEADBAND_PX_DEFAULT), TOUCH_ZOOM_DEADBAND_PX_MIN, TOUCH_ZOOM_DEADBAND_PX_MAX);
    appData.defaults.touchZoomRatioMin = clamp(Number(appData.defaults.touchZoomRatioMin ?? TOUCH_ZOOM_RATIO_MIN_DEFAULT), TOUCH_ZOOM_RATIO_MIN_MIN, TOUCH_ZOOM_RATIO_MIN_MAX);
    normalizeHoldTimingDefaults();
    setColorMapStopOverrides(appData.defaults.colorMapStopOverrides);
    applyBackgroundTheme();
    applyDialogTransparency();

    appData.defaults.formulaSeeds = normalizeFormulaSeeds(appData.defaults.formulaSeeds, appData.formulas);

    appData.defaults.rangesOverridesByFormula = Object.fromEntries(
      Object.entries(appData.defaults.rangesOverridesByFormula || {}).map(([formulaId, range]) => {
        const fallback = builtInFormulaRanges[formulaId] || DEFAULT_PARAM_RANGES;
        return [formulaId, normalizeRangeObject(range, fallback)];
      }),
    );

    loadParamModesFromStorage();

    currentFormulaId = resolveInitialFormulaId();
    appData.defaults.cmapName = resolveInitialColorMap();
    const loadedSharedState = applySharedStateFromHash();
    configureNameBoxWidths();
    updateCurrentPickerSelection();
    refreshParamButtons();
    syncSeedEditorInputs(currentFormulaId);
    rangesEditorFormulaId = currentFormulaId;
    syncDebugToggleUi();
    syncScaleModeButton();
    syncRandomModeButton();
    syncParamModeVisuals();
    saveParamModesToStorage();
    saveDefaultsToStorage();

    registerHandlers();
    initHelpOverlay();
    maybeShowLandscapeHint();
    commitCurrentStateToHistory();
    requestDraw();
    const formula = appData.formulas.find((item) => item.id === currentFormulaId);
    showToast(loadedSharedState ? "Loaded shared state" : `Loaded ${formula?.name || currentFormulaId}. Slice 2.1 controls ready.`);
  } catch (error) {
    console.error(error);
    showToast(`Startup failed: ${error.message}`);
  }
}

bootstrap();
