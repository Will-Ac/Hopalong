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

const DATA_PATH = "./data/hopalong_data.json";
const DEFAULTS_PATH = "./data/defaults.json";

const canvas = document.getElementById("c");
const toastEl = document.getElementById("toast");
const formulaBtn = document.getElementById("formulaBtn");
const cmapBtn = document.getElementById("cmapBtn");
const debugBugBtn = document.getElementById("debugBugBtn");
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
const settingsTabColorEl = document.getElementById("settingsTabColor");
const settingsTabGeneralEl = document.getElementById("settingsTabGeneral");
const colorTabPanelEl = document.getElementById("colorTabPanel");
const generalTabPanelEl = document.getElementById("generalTabPanel");
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
let appData = null;
let currentFormulaId = null;
let activeSliderKey = null;
let activePicker = null;
let activeColorSettingsMap = null;
let activePickerTrigger = null;
let activeInfoAnchorEl = null;
let activeInfoPanelEl = null;
let activeColourPanelSettings = "mode";
let holdInterval = null;
let lastRenderMeta = null;
let lastFullRenderMeta = null;
let lastDrawTimestamp = 0;
let fpsEstimate = 0;
let interestOverlayScanCache = null;
let interestOverlayCalcInProgress = false;
let interestOverlayCalcProgressPercent = 0;
let interestOverlayShowProgressToast = false;
let interestOverlayLastProgressToastPercent = -1;
let interestOverlayRecalcTimer = null;
let interestOverlayPendingPlan = null;
let interestOverlayComputeSeq = 0;
let interestOverlayActiveJobSeq = 0;
let wasManualOverlayActive = false;
let drawScheduled = false;
let drawDirty = false;
let drawInProgress = false;
let highResExportInProgress = false;
let panZoomInteractionActive = false;
let panZoomSettleTimer = null;
let singleTouchModulationStartDrawTimer = null;
let toastTimer = null;
let renderProgressHideTimer = null;
let renderProgressVisible = false;
let renderProgressStartedAt = 0;
let renderProgressShownThisDraw = false;
let lastComputedUiMetrics = { fontSize: null, tileSize: null };
let lastSizingViewport = { width: 0, height: 0 };
let lastQuickSliderTopTapAt = 0;
let helpOverlayController = null;

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

let exportCacheCanvas = null;
let exportCacheCtx = null;
let exportCacheMeta = null;
let renderRevision = 0;
let renderGeneration = 0;
let currentRenderCache = null;
let activePanZoomCacheEntry = null;
const historyRenderCache = new Map();
let pendingShareFile = null;
let pendingShareTitle = "";
let isApplyingHistoryState = false;
let historyStates = [];
let historyIndex = -1;
let paramModes = {};
let lastParamTap = { targetKey: null, timestamp: 0 };
let pendingTileTapTimer = null;
let randomAllNextMode = "rand";
let keyHold = { code: null, axis: null, direction: 0, sliderKey: null, interval: null, startMs: 0 };
let isKeyboardManualModulating = false;
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

let interactionState = INTERACTION_STATE.NONE;
let activePointers = new Map();
let primaryPointerId = null;
let lastPointerPosition = null;
let isManualModulating = false;
let twoFingerGesture = null;
let lastTwoDebug = null;
let historyTapTracker = null;
let suppressHistoryTap = false;
let fixedView = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};
let sharedParamsOverride = null;
let sharedParamsFormulaId = null;

function clampLabel(text, maxChars = NAME_MAX_CHARS) {
  const normalized = String(text ?? "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function invalidatePendingRenders() {
  renderGeneration += 1;
  return renderGeneration;
}

function isRenderGenerationCurrent(generation) {
  return generation === renderGeneration;
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
  drawDirty = true;
  if (highResExportInProgress) {
    return;
  }
  if (drawScheduled) {
    return;
  }

  drawScheduled = true;
  window.requestAnimationFrame(async () => {
    drawScheduled = false;
    if (!drawDirty || drawInProgress) {
      return;
    }

    drawDirty = false;
    drawInProgress = true;
    try {
      await draw();
    } finally {
      drawInProgress = false;
      if (drawDirty) {
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
    fixedView: state.fixedView ?? fixedView,
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
    lastRenderMeta = frameEntry.meta;
    lastFullRenderMeta = frameEntry.fullMeta || frameEntry.meta;
  }
  if (syncExport) {
    const targetCanvas = ensureExportCacheCanvas(frameEntry.canvas.width, frameEntry.canvas.height);
    exportCacheCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    exportCacheCtx.drawImage(frameEntry.canvas, 0, 0);
    exportCacheMeta = {
      pxW: targetCanvas.width,
      pxH: targetCanvas.height,
      updatedAt: performance.now(),
      renderRevision,
    };
  }
  return true;
}

function drawInteractionFrameFromCache(frameEntry) {
  if (!frameEntry?.canvas || !frameEntry.sourceFixedView || !fixedView) {
    return false;
  }
  const viewportWidth = Math.max(1, canvas.width);
  const viewportHeight = Math.max(1, canvas.height);
  const sourceZoom = Number(frameEntry.sourceFixedView.zoom) || 1;
  const targetZoom = Number(fixedView.zoom) || 1;
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
    - (viewportWidth * 0.5 + (fixedView.offsetX || 0)) / zoomRatio;
  const sourceRectY = cropY + viewportHeight * 0.5 + (frameEntry.sourceFixedView.offsetY || 0)
    - (viewportHeight * 0.5 + (fixedView.offsetY || 0)) / zoomRatio;

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
    lastRenderMeta = frameEntry.meta;
    lastFullRenderMeta = frameEntry.fullMeta || frameEntry.meta;
  }
  return true;
}

function pruneHistoryRenderCache() {
  const maxEntries = getHistoryCacheSize();
  while (historyRenderCache.size > maxEntries) {
    const oldestKey = historyRenderCache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    if (currentRenderCache && oldestKey === currentRenderCache.key && historyRenderCache.size > 1) {
      const currentEntry = historyRenderCache.get(oldestKey);
      historyRenderCache.delete(oldestKey);
      historyRenderCache.set(oldestKey, currentEntry);
      continue;
    }
    historyRenderCache.delete(oldestKey);
  }
}

function getHistoryCachedFrame(key) {
  if (!key || !historyRenderCache.has(key)) {
    return null;
  }
  const entry = historyRenderCache.get(key);
  historyRenderCache.delete(key);
  historyRenderCache.set(key, entry);
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
    sourceFixedView: { ...(sourceFixedView || fixedView) },
  };
  currentRenderCache = entry;
  historyRenderCache.delete(key);
  historyRenderCache.set(key, entry);
  pruneHistoryRenderCache();
  return entry;
}

function isHelpOverlayOpen() {
  return Boolean(helpOverlayController?.isOpen?.());
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

  renderProgressVisible = false;
  window.clearTimeout(renderProgressHideTimer);
  renderProgressHideTimer = null;
  window.clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();

  toastTimer = window.setTimeout(() => {
    toastEl.classList.remove("is-visible");
  }, 5000);
}

function hideRenderProgressToast() {
  if (!toastEl) {
    return;
  }

  renderProgressVisible = false;
  window.clearTimeout(renderProgressHideTimer);
  renderProgressHideTimer = null;
  toastEl.classList.remove("is-visible");
  toastEl.classList.remove("is-below-actions");
  toastEl.style.removeProperty("--toast-below-top");
}

function updateRenderProgressToast(percent, isComplete = false) {
  if (highResExportInProgress) {
    return;
  }

  if (!toastEl) {
    return;
  }

  const elapsedMs = performance.now() - renderProgressStartedAt;
  if (!isComplete && elapsedMs < 1000) {
    return;
  }
  if (isComplete && !renderProgressShownThisDraw) {
    return;
  }

  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  window.clearTimeout(renderProgressHideTimer);
  renderProgressHideTimer = null;
  toastEl.textContent = `Render ${normalizedPercent}%`;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();
  renderProgressVisible = true;
  renderProgressShownThisDraw = true;

  if (isComplete) {
    renderProgressHideTimer = window.setTimeout(() => {
      hideRenderProgressToast();
    }, 2000);
  }
}

function updateExportRenderProgressToast(label, percent, isComplete = false) {
  if (!toastEl) {
    return;
  }

  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent / 5) * 5));
  window.clearTimeout(renderProgressHideTimer);
  renderProgressHideTimer = null;
  toastEl.textContent = `${label}: ${normalizedPercent}%`;
  toastEl.classList.add("is-visible");
  positionToastForTopActions();
  suppressToastWhenHelpOpenAndBelowActions();
  renderProgressVisible = true;

  if (isComplete) {
    renderProgressHideTimer = window.setTimeout(() => {
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
  if (sharedParamsOverride && sharedParamsFormulaId === currentFormulaId) {
    return { ...sharedParamsOverride };
  }

  return getParamsForFormula({
    rangesForFormula: getCurrentFormulaRange(),
    sliderDefaults: appData.defaults.sliders,
  });
}

function clearSharedParamsOverride() {
  sharedParamsOverride = null;
  sharedParamsFormulaId = null;
}

function buildSharePayload() {
  const params = getDerivedParams();
  const iterations = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  const view = fixedView || {};
  const paramText = `${params.a},${params.b},${params.c},${params.d}`;
  const viewText = `${view.offsetX ?? 0},${view.offsetY ?? 0},${view.zoom ?? 1}`;
  const refreshToken = Date.now().toString(36);

  const pairs = [
    ["f", currentFormulaId],
    ["c", appData.defaults.cmapName],
    ["p", paramText],
    ["i", String(iterations)],
    ["v", viewText],
    ["r", refreshToken],
  ];

  return pairs
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
}

function buildShareUrl() {
  return `${location.origin}${location.pathname}#s=${buildSharePayload()}`;
}

function applySharedStateFromHash() {
  if (!location.hash.includes("#s=")) {
    return false;
  }

  const payloadStart = location.hash.indexOf("#s=");
  if (payloadStart < 0) {
    return false;
  }

  const payload = location.hash.slice(payloadStart + 3);
  if (!payload) {
    return false;
  }

  try {
    const params = new URLSearchParams(payload);
    const formulaId = params.get("f");
    const cmapName = params.get("c");
    const pRaw = params.get("p");
    const iRaw = params.get("i");
    const vRaw = params.get("v");
    if (!formulaId || !cmapName || !pRaw || !iRaw || !vRaw) {
      return false;
    }

    const pValues = pRaw.split(",").map((value) => Number.parseFloat(value));
    const vValues = vRaw.split(",").map((value) => Number.parseFloat(value));
    const iterations = Number.parseInt(iRaw, 10);
    if (pValues.length !== 4 || pValues.some((value) => !Number.isFinite(value))) {
      return false;
    }
    if (vValues.length !== 3 || vValues.some((value) => !Number.isFinite(value))) {
      return false;
    }
    if (!Number.isFinite(iterations) || iterations < 1 || vValues[2] <= 0) {
      return false;
    }

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
    fixedView = {
      offsetX: vValues[0],
      offsetY: vValues[1],
      zoom: vValues[2],
    };
    sharedParamsOverride = {
      a: pValues[0],
      b: pValues[1],
      c: pValues[2],
      d: pValues[3],
    };
    sharedParamsFormulaId = formulaId;
    syncParamModeVisuals();
    syncScaleModeButton();
    syncRandomModeButton();
    saveParamModesToStorage();
    saveDefaultsToStorage();
    return true;
  } catch (error) {
    console.warn("Could not parse shared hash state.", error);
    return false;
  }
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
  if (!activeSliderKey) {
    return null;
  }

  return getControlValue(activeSliderKey);
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
  applyResponsiveUiSizing();

  if (!debugBugBtn || !debugPanelEl || !paramOverlayEl) {
    return;
  }

  const appRect = paramOverlayEl.parentElement?.getBoundingClientRect();
  const bugRect = debugBugBtn.getBoundingClientRect();
  if (!appRect) {
    return;
  }

  const margin = 6;
  const maxLeft = Math.max(0, appRect.width - debugPanelEl.offsetWidth - margin);
  const nextLeft = clamp(bugRect.left - appRect.left, 0, maxLeft);
  const nextTop = bugRect.bottom - appRect.top + margin;
  debugPanelEl.style.left = `${Math.round(nextLeft)}px`;
  debugPanelEl.style.top = `${Math.round(nextTop)}px`;
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
  const viewportUnchanged = viewportWidth === lastSizingViewport.width && viewportHeight === lastSizingViewport.height;
  if (!force && viewportUnchanged) {
    return;
  }
  lastSizingViewport = { width: viewportWidth, height: viewportHeight };

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
  if (lastComputedUiMetrics.fontSize !== roundedFontSize) {
    root.style.setProperty("--ui-font-size", `${roundedFontSize}px`);
    lastComputedUiMetrics.fontSize = roundedFontSize;
  }

  const firstTile = bottomBarEl.querySelector(".poItem");
  const measuredTileHeight = firstTile ? Math.round(firstTile.getBoundingClientRect().height) : 42;
  const actionSize = Math.max(34, measuredTileHeight);

  if (lastComputedUiMetrics.tileSize !== actionSize) {
    root.style.setProperty("--tile-size", `${actionSize}px`);
    lastComputedUiMetrics.tileSize = actionSize;
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

function resetAllRangeOverrides() {
  const currentBuiltIn = builtInFormulaRanges[currentFormulaId] || DEFAULT_PARAM_RANGES;
  remapSliderToPreserveParams(currentFormulaId, currentBuiltIn);
  appData.defaults.rangesOverridesByFormula = {};
  resetAllFormulaParamDefaults();
  resetAllFormulaSeeds();
  saveDefaultsToStorage();
  loadFormulaRangesIntoEditor(getSelectedRangesEditorFormulaId());
  syncSeedEditorInputs(getSelectedRangesEditorFormulaId());
  setRangesEditorWarning("All overrides cleared.");
  requestDraw();
  commitCurrentStateToHistory();
}

function openRangesEditor() {
  if (!rangesEditorPanelEl) {
    return;
  }

  closeFormulaSettingsPanel();
  closeColorSettingsPanel();
  closeModeSettingsPanel();
  rangesEditorPanelEl.classList.remove("is-hidden");
  rangesEditorToggleEl?.classList.add("is-active");
  rangesEditorToggleEl?.setAttribute("aria-pressed", "true");
  syncDetailedSettingsControls();
  hideSettingsInfo();
  helpOverlayController?.render();
}

function closeRangesEditor() {
  rangesEditorPanelEl?.classList.add("is-hidden");
  rangesEditorToggleEl?.classList.remove("is-active");
  rangesEditorToggleEl?.setAttribute("aria-pressed", "false");
  hideSettingsInfo();
  helpOverlayController?.render();
}

function openFormulaSettingsPanel(formulaId = null) {
  if (!formulaSettingsPanelEl) {
    return;
  }

  closeRangesEditor();
  closeColorSettingsPanel();
  closeModeSettingsPanel();
  formulaSettingsPanelEl.classList.remove("is-hidden");
  const targetFormulaId = formulaId || getSelectedRangesEditorFormulaId();
  loadFormulaRangesIntoEditor(targetFormulaId);
  syncSeedEditorInputs(targetFormulaId);
  layoutFormulaSettingsPanel();
  helpOverlayController?.render();
}

function closeFormulaSettingsPanel() {
  formulaSettingsPanelEl?.classList.add("is-hidden");
  helpOverlayController?.render();
}

function syncColourPanelSettingsSections() {
  backgroundSettingsSectionEl?.classList.toggle("is-hidden", activeColourPanelSettings !== "background");
  for (const sectionEl of modeSettingsSectionEls) {
    sectionEl.classList.toggle("is-hidden", activeColourPanelSettings !== "mode");
  }
}

function openModeSettingsPanel(sectionKey = "mode") {
  if (!modeSettingsPanelEl) {
    return;
  }

  activeColourPanelSettings = sectionKey;
  syncColourPanelSettingsSections();
  modeSettingsPanelEl.classList.remove("is-hidden");
  layoutModeSettingsPanel();
  helpOverlayController?.render();
}

function closeModeSettingsPanel() {
  modeSettingsPanelEl?.classList.add("is-hidden");
  helpOverlayController?.render();
}

function isPanelOpen(panelEl) {
  return Boolean(panelEl && !panelEl.classList.contains("is-hidden"));
}

function closeDismissablePanelsForTarget(target) {
  if (!(target instanceof Element)) {
    return;
  }

  if (isPanelOpen(modeSettingsPanelEl) && !target.closest("#modeSettingsPanel, #pickerModeSettingsProxy, #pickerBackgroundSettingsProxy, #settingsInfoPopup")) {
    closeModeSettingsPanel();
  }
  if (isPanelOpen(colorSettingsPanelEl) && !target.closest("#colorSettingsPanel, #pickerOverlay, #settingsInfoPopup")) {
    closeColorSettingsPanel();
  }
  if (isPanelOpen(formulaSettingsPanelEl) && !target.closest("#formulaSettingsPanel, #pickerOverlay")) {
    closeFormulaSettingsPanel();
  }
  if (isPanelOpen(rangesEditorPanelEl) && !target.closest("#rangesEditorPanel, #rangesEditorToggle, #settingsInfoPopup")) {
    closeRangesEditor();
  }
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
  syncInterestOverlayToggleUi();
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
    scheduleInterestOverlayRecalc({ immediate: true, showProgress: true });
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
  if (activeInfoAnchorEl === anchorEl && !settingsInfoPopupEl.classList.contains("is-hidden")) {
    hideSettingsInfo();
    return;
  }

  activeInfoAnchorEl = anchorEl;
  activeInfoPanelEl = panelEl || anchorEl?.closest("#rangesEditorPanel, #colorSettingsPanel, #modeSettingsPanel") || rangesEditorPanelEl;
  settingsInfoTextEl.textContent = message;
  settingsInfoPopupEl.classList.remove("is-hidden");

  const panelRect = activeInfoPanelEl?.getBoundingClientRect();
  const anchorRect = anchorEl?.getBoundingClientRect();
  if (panelRect && anchorRect) {
    const left = Math.max(8, Math.min(panelRect.width - 290, anchorRect.left - panelRect.left - 240));
    const top = Math.max(8, Math.min(panelRect.height - 120, anchorRect.top - panelRect.top + 28));
    settingsInfoPopupEl.style.left = `${left}px`;
    settingsInfoPopupEl.style.top = `${top}px`;
    activeInfoPanelEl.append(settingsInfoPopupEl);
  } else {
    settingsInfoPopupEl.style.left = "10px";
    settingsInfoPopupEl.style.top = "10px";
  }
}

function hideSettingsInfo() {
  activeInfoAnchorEl = null;
  activeInfoPanelEl = null;
  settingsInfoPopupEl?.classList.add("is-hidden");
}

function getScaleMode() {
  return appData?.defaults?.scaleMode === "fixed" ? "fixed" : "auto";
}

function isAutoScale() {
  return getScaleMode() === "auto";
}

function syncFixedViewFromLastRenderMeta() {
  if (!lastRenderMeta?.world || !lastRenderMeta?.view) {
    return false;
  }

  const world = lastRenderMeta.world;
  const view = lastRenderMeta.view;
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

  fixedView = {
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
    randomAllNextMode = "fix";
  } else if (globalMode === "fix") {
    randomAllNextMode = "rand";
  }

  randomModeBtn.textContent = randomAllNextMode === "fix" ? "Fix\nAll" : "Random\nAll";
  randomModeTile?.classList.toggle("is-random", globalMode === "ran");
  randomModeTile?.classList.toggle("is-fixed", globalMode === "fix");
  randomModeTile?.classList.toggle("is-mixed", globalMode === "mix");
  randomModeBtn.setAttribute("aria-label", randomAllNextMode === "fix" ? "Set all parameter modes to fixed" : "Set all parameter modes to random");
  randomModeBtn.title = randomAllNextMode === "fix" ? "Fix all" : "Random all";
}


function syncDebugToggleUi() {
  const isDebug = Boolean(appData?.defaults?.debug);
  debugPanelEl?.classList.toggle("is-hidden", !isDebug);
  debugBugBtn?.classList.toggle("is-active", isDebug);
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

  syncInterestOverlayToggleUi();
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
    fixedView: { ...fixedView },
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
    for (const state of historyStates.slice(historyIndex + 1)) {
      historyRenderCache.delete(getRenderStateKey(state));
    }
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

  invalidatePendingRenders();
  isApplyingHistoryState = true;
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
    fixedView = {
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
    currentRenderCache = cachedFrame;
    drawDirty = false;
    drawDebugOverlay(lastRenderMeta);
    drawInterestOverlay(lastRenderMeta);
    drawManualParamOverlay(lastRenderMeta);
    refreshParamButtons();
    updateQuickSliderReadout();
    layoutFloatingActions();
  } else {
    requestDraw();
  }
  isApplyingHistoryState = false;
}

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

function applyManualModulation(deltaX, deltaY) {
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

  requestDraw();
  return true;
}

function syncQuickSliderPosition() {
  if (!activeSliderKey || !qsRange) {
    return;
  }

  qsRange.value = String(getQuickSliderRangeValueFromSliderValue(activeSliderKey, appData.defaults.sliders[activeSliderKey]));
  updateQuickSliderReadout();
}

function persistCurrentHistoryViewState() {
  if (historyIndex < 0 || historyIndex >= historyStates.length) {
    return;
  }

  const state = historyStates[historyIndex];
  if (!state || typeof state !== "object") {
    return;
  }

  state.fixedView = { ...fixedView };
}

function applyPanDelta(deltaX, deltaY) {
  fixedView.offsetX += deltaX;
  fixedView.offsetY += deltaY;
  persistCurrentHistoryViewState();
  requestDraw();
}

function applyZoomAtPoint(zoomFactor, anchorX, anchorY) {
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
    return;
  }

  const prevZoom = fixedView.zoom;
  const nextZoom = prevZoom * zoomFactor;
  if (!Number.isFinite(nextZoom) || nextZoom <= 0) {
    return;
  }

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
  persistCurrentHistoryViewState();
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
  cancelSingleTouchModulationStartDraw();
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
    justStarted: true,
    isArmed: false,
  };
  interactionState = INTERACTION_STATE.TWO_ACTIVE;
  suppressHistoryTap = true;
}

function clearTwoFingerGesture() {
  twoFingerGesture = null;
  lastTwoDebug = null;
}

function cloneFixedViewSnapshot(view = fixedView) {
  return {
    offsetX: Number.isFinite(view?.offsetX) ? view.offsetX : 0,
    offsetY: Number.isFinite(view?.offsetY) ? view.offsetY : 0,
    zoom: Number.isFinite(view?.zoom) && view.zoom > 0 ? view.zoom : 1,
  };
}

function ensurePanZoomCacheBase() {
  if (activePanZoomCacheEntry?.canvas) {
    return activePanZoomCacheEntry;
  }

  if (!currentRenderCache?.canvas) {
    return null;
  }

  activePanZoomCacheEntry = {
    key: currentRenderCache.key,
    canvas: currentRenderCache.canvas,
    meta: currentRenderCache.meta,
    fullMeta: currentRenderCache.fullMeta,
    sourceFixedView: cloneFixedViewSnapshot(),
  };

  return activePanZoomCacheEntry;
}

function clearPanZoomInteractionCache() {
  activePanZoomCacheEntry = null;
}

function cancelSingleTouchModulationStartDraw() {
  if (singleTouchModulationStartDrawTimer) {
    window.clearTimeout(singleTouchModulationStartDrawTimer);
    singleTouchModulationStartDrawTimer = null;
  }
}

function scheduleSingleTouchModulationStartDraw() {
  cancelSingleTouchModulationStartDraw();
  singleTouchModulationStartDrawTimer = window.setTimeout(() => {
    singleTouchModulationStartDrawTimer = null;
    if (interactionState === INTERACTION_STATE.MOD_1 && activePointers.size === 1) {
      requestDraw();
    }
  }, SINGLE_TOUCH_MODULATION_START_DRAW_DELAY_MS);
}

function resetPanZoomInteractionStateForModulation() {
  if (panZoomSettleTimer) {
    window.clearTimeout(panZoomSettleTimer);
    panZoomSettleTimer = null;
  }
  panZoomInteractionActive = false;
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
  panZoomInteractionActive = true;
  if (baseCacheEntry?.canvas) {
    activePanZoomCacheEntry = baseCacheEntry;
  } else {
    ensurePanZoomCacheBase();
  }
  if (panZoomSettleTimer) {
    window.clearTimeout(panZoomSettleTimer);
    panZoomSettleTimer = null;
  }
}

function schedulePanZoomSettledRedraw() {
  if (!panZoomInteractionActive) {
    return;
  }

  if (panZoomSettleTimer) {
    window.clearTimeout(panZoomSettleTimer);
  }

  panZoomSettleTimer = window.setTimeout(() => {
    panZoomSettleTimer = null;
    panZoomInteractionActive = false;
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
    prepareFixedViewForPanZoom("manual pan/zoom");
    beginPanZoomInteraction();
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
    isManualModulating = false;
    const pos = getCanvasPointerPosition(event);
    lastPointerPosition = { x: pos.x, y: pos.y };
    if (isDirectTouchPointer) {
      resetPanZoomInteractionStateForModulation();
      scheduleSingleTouchModulationStartDraw();
    } else {
      requestDraw();
    }
    return;
  }

  if (activePointers.size === 2) {
    const pointers = Array.from(activePointers.values());
    initializeTwoFingerGesture(pointers[0].pointerId, pointers[1].pointerId);
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
    const didModulate = applyManualModulation(pos.x - lastPointerPosition.x, pos.y - lastPointerPosition.y);
    isManualModulating = isManualModulating || didModulate;
    lastPointerPosition = { x: pos.x, y: pos.y };
    return;
  }

  if (interactionState === INTERACTION_STATE.PAN_MOUSE_RMB && event.pointerId === primaryPointerId) {
    const pos = getCanvasPointerPosition(event);
    if (!lastPointerPosition) {
      lastPointerPosition = { x: pos.x, y: pos.y };
      return;
    }
    beginPanZoomInteraction();
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

  if (twoFingerGesture.justStarted) {
    twoFingerGesture.lastD = distance;
    twoFingerGesture.lastMX = midpoint.x;
    twoFingerGesture.lastMY = midpoint.y;
    twoFingerGesture.justStarted = false;
    return;
  }

  const panMagnitude = Math.hypot(dxm, dym);
  const zoomRatioDelta = Math.abs(ratioStep - 1);
  const touchZoomDeadbandThreshold = getTouchZoomDeadbandThreshold();
  const touchZoomRatioMin = getTouchZoomRatioMin();
  const shouldPan = panMagnitude > PAN_DEADBAND_PX;
  const shouldZoom = Math.abs(dd) > touchZoomDeadbandThreshold || zoomRatioDelta > touchZoomRatioMin;

  lastTwoDebug = {
    state: interactionState,
    dxm,
    dym,
    dd,
    ratioStep,
    viewZoom: fixedView.zoom,
    touchZoomDeadbandThreshold,
    touchZoomRatioMin,
  };

  if (!twoFingerGesture.isArmed) {
    if (!shouldZoom && !shouldPan) {
      twoFingerGesture.lastD = distance;
      twoFingerGesture.lastMX = midpoint.x;
      twoFingerGesture.lastMY = midpoint.y;
      return;
    }

    prepareFixedViewForPanZoom("manual pan/zoom");
    twoFingerGesture.isArmed = true;
    beginPanZoomInteraction();
  }

  if (shouldZoom && Number.isFinite(ratioStep) && ratioStep > 0) {
    beginPanZoomInteraction();
    applyZoomAtPoint(ratioStep, midpoint.x, midpoint.y);
  }

  if (shouldPan) {
    beginPanZoomInteraction();
    applyPanDelta(dxm, dym);
  }

  twoFingerGesture.lastD = distance;
  twoFingerGesture.lastMX = midpoint.x;
  twoFingerGesture.lastMY = midpoint.y;
}

function clearPointerState(pointerId) {
  if (!activePointers.has(pointerId)) {
    return;
  }

  cancelSingleTouchModulationStartDraw();
  const endingTwoFingerGesture = interactionState === INTERACTION_STATE.TWO_ACTIVE || Boolean(twoFingerGesture);
  const endingPanZoomGesture = endingTwoFingerGesture || interactionState === INTERACTION_STATE.PAN_MOUSE_RMB || panZoomInteractionActive;
  activePointers.delete(pointerId);

  if (activePointers.size === 0) {
    interactionState = INTERACTION_STATE.NONE;
    primaryPointerId = null;
    lastPointerPosition = null;
    isManualModulating = false;
    clearTwoFingerGesture();
    if (endingPanZoomGesture) {
      schedulePanZoomSettledRedraw();
    } else {
      requestDraw();
    }
    return;
  }

  if (activePointers.size === 1 && endingTwoFingerGesture) {
    activePointers.clear();
    interactionState = INTERACTION_STATE.NONE;
    primaryPointerId = null;
    lastPointerPosition = null;
    isManualModulating = false;
    clearTwoFingerGesture();
    schedulePanZoomSettledRedraw();
    return;
  }

  if (activePointers.size === 1) {
    const remaining = Array.from(activePointers.values())[0];
    clearTwoFingerGesture();
    primaryPointerId = remaining.pointerId;
    interactionState = INTERACTION_STATE.MOD_1;
    isManualModulating = false;
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
  prepareFixedViewForPanZoom("manual pan/zoom");
  beginPanZoomInteraction();
  const pos = getCanvasPointerPosition(event);
  const zoomFactor = Math.exp(-event.deltaY * 0.0025);
  applyZoomAtPoint(zoomFactor, pos.x, pos.y);
  schedulePanZoomSettledRedraw();
  suppressHistoryTap = true;
  window.setTimeout(() => {
    suppressHistoryTap = false;
  }, 0);
}

function closeQuickSlider() {
  activeSliderKey = null;
  quickSliderOverlay.classList.remove("is-open");
  quickSliderOverlay.setAttribute("aria-hidden", "true");
  helpOverlayController?.render();
}

function alignQuickSliderAboveBottomBar() {
  if (!paramOverlayEl || !quickSliderEl) {
    return;
  }

  const overlayRect = paramOverlayEl.getBoundingClientRect();
  const overlayHeight = Math.max(0, window.innerHeight - overlayRect.top);
  quickSliderEl.style.bottom = `${overlayHeight + 6}px`;
  helpOverlayController?.scheduleRender();
}

function closePicker({ force = false } = {}) {
  if (!force && (!formulaSettingsPanelEl?.classList.contains("is-hidden") || !colorSettingsPanelEl?.classList.contains("is-hidden"))) {
    return;
  }

  activePicker = null;
  activePickerTrigger = null;
  pickerOverlay.classList.remove("is-open");
  pickerOverlay.setAttribute("aria-hidden", "true");
  helpOverlayController?.render();
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
    const minWidth = activePicker === "cmap" ? 280 : 180;
    const targetWidth = activePicker === "cmap" ? baseWidth * 1.5 : baseWidth;
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
    helpOverlayController?.scheduleRender();
    return;
  }

  const fallbackWidth = activePicker === "cmap" ? 420 : 320;
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
  helpOverlayController?.scheduleRender();
}

function layoutFormulaSettingsPanel() {
  if (!formulaSettingsPanelEl || formulaSettingsPanelEl.classList.contains("is-hidden")) {
    return;
  }

  const margin = 8;
  const viewportWidth = window.innerWidth;
  const pickerRect = pickerPanel?.getBoundingClientRect();
  const panelWidth = formulaSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
  const targetLeft = pickerRect
    ? Math.max(margin, pickerRect.left - panelWidth - 8)
    : margin;
  formulaSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
  formulaSettingsPanelEl.style.right = "auto";
  helpOverlayController?.scheduleRender();
}


function layoutColorSettingsPanel() {
  if (!colorSettingsPanelEl || colorSettingsPanelEl.classList.contains("is-hidden")) {
    return;
  }

  const margin = 8;
  const viewportWidth = window.innerWidth;
  const pickerRect = pickerPanel?.getBoundingClientRect();
  const panelWidth = colorSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
  const targetLeft = pickerRect
    ? Math.max(margin, pickerRect.left - panelWidth - 8)
    : margin;
  colorSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
  colorSettingsPanelEl.style.right = "auto";
  helpOverlayController?.scheduleRender();
}

function layoutModeSettingsPanel() {
  if (!modeSettingsPanelEl || modeSettingsPanelEl.classList.contains("is-hidden")) {
    return;
  }

  const margin = 8;
  const viewportWidth = window.innerWidth;
  const anchorId = activeColourPanelSettings === "background"
    ? "pickerBackgroundSettingsProxy"
    : "pickerModeSettingsProxy";
  const anchorRect = document.getElementById(anchorId)?.getBoundingClientRect();
  const parentRect = anchorRect ? pickerPanel?.getBoundingClientRect() : colorSettingsPanelEl?.getBoundingClientRect();
  const panelWidth = modeSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
  const targetLeft = parentRect && anchorRect
    ? Math.max(margin, parentRect.left - panelWidth - 8)
    : margin;
  modeSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
  modeSettingsPanelEl.style.right = "auto";
  modeSettingsPanelEl.style.top = parentRect ? `${Math.round(parentRect.top)}px` : `${margin}px`;
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
        layoutFormulaSettingsPanel();
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
      openFormulaSettingsPanel(formula.id);
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
    if (isPanelOpen(modeSettingsPanelEl) && activeColourPanelSettings === "background") {
      closeModeSettingsPanel();
    } else {
      openModeSettingsPanel("background");
    }
  });
  modeSettingsBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPanelOpen(modeSettingsPanelEl) && activeColourPanelSettings === "mode") {
      closeModeSettingsPanel();
    } else {
      openModeSettingsPanel("mode");
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
      openColorSettingsPanel(cmapName);
    });

    const rowWrap = document.createElement("div");
    rowWrap.className = "pickerOptionRow";
    rowWrap.append(button, settingsButton);
    pickerList.append(rowWrap);
  }

  if (isPanelOpen(modeSettingsPanelEl)) {
    layoutModeSettingsPanel();
  }
}



function renderColorStopsEditor() {
  if (!colorStopsListEl || !activeColorSettingsMap) return;
  const stops = getColorMapStops(activeColorSettingsMap) || [];
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
      const next = getColorMapStops(activeColorSettingsMap) || [];
      next[index][1] = r;
      next[index][2] = g;
      next[index][3] = b;
      if (next[index][4] <= 0.001) {
        next[index][4] = 1;
      }
      setColorMapStops(activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
      requestDraw();
    });

    transparentBtn.addEventListener("click", () => {
      const next = getColorMapStops(activeColorSettingsMap) || [];
      next[index][4] = next[index][4] <= 0.001 ? 1 : 0;
      setColorMapStops(activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
      requestDraw();
    });

    posInput.addEventListener("input", () => {
      const next = getColorMapStops(activeColorSettingsMap) || [];
      next[index][0] = Number(posInput.value);
      setColorMapStops(activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
      requestDraw();
    });

    removeBtn.addEventListener("click", () => {
      const next = getColorMapStops(activeColorSettingsMap) || [];
      if (next.length <= 2) return;
      next.splice(index, 1);
      setColorMapStops(activeColorSettingsMap, next);
      renderColorStopsEditor();
      colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
      requestDraw();
    });

    card.append(colorRow, posInput);
    colorStopsListEl.append(card);
  });
}

function openColorSettingsPanel(cmapName) {
  activeColorSettingsMap = cmapName;
  colorSettingsNameEl.textContent = cmapName;
  colorSettingsPreviewEl.style.background = buildColorMapGradient(cmapName);
  closeRangesEditor();
  closeFormulaSettingsPanel();
  colorSettingsPanelEl.classList.remove("is-hidden");
  renderColorStopsEditor();
  layoutColorSettingsPanel();
  helpOverlayController?.render();
}

function closeColorSettingsPanel() {
  closeModeSettingsPanel();
  activeColorSettingsMap = null;
  colorSettingsPanelEl?.classList.add("is-hidden");
  saveDefaultsToStorage();
  helpOverlayController?.render();
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
  helpOverlayController?.render();
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
  if (activeSliderKey !== "iters" && activeSliderKey !== "burn") {
    clearSharedParamsOverride();
  }
  appData.defaults.sliders[activeSliderKey] = value;
  saveDefaultsToStorage();
  qsRange.value = String(getQuickSliderRangeValueFromSliderValue(activeSliderKey, value));
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

  activeSliderKey = sliderKey;
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
  helpOverlayController?.render();
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
  if (activeSliderKey === sliderKey) {
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
  const isDoubleTap = lastParamTap.targetKey === targetKey && now - lastParamTap.timestamp <= DOUBLE_TAP_MS;
  lastParamTap = { targetKey, timestamp: now };

  if (isDoubleTap) {
    if (pendingTileTapTimer) {
      window.clearTimeout(pendingTileTapTimer);
      pendingTileTapTimer = null;
    }

    const modeKey = paramTileTargets[targetKey]?.modeKey;
    if (modeKey) {
      toggleFixRandMode(modeKey);
    }
    return;
  }

  if (pendingTileTapTimer) {
    window.clearTimeout(pendingTileTapTimer);
  }
  pendingTileTapTimer = window.setTimeout(() => {
    pendingTileTapTimer = null;
    paramTileTargets[targetKey]?.shortTap();
  }, DOUBLE_TAP_MS + 10);
}

function clearStepHold() {
  if (holdInterval) {
    window.clearInterval(holdInterval);
    holdInterval = null;
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

  if (activeSliderKey === sliderKey) {
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

  return getHoldStepSizeForKey(activeSliderKey, holdElapsedMs);
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

    const { holdRepeatMs } = getHoldTimingSettings();
    holdInterval = window.setInterval(() => {
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
  if (keyHold.interval) {
    window.clearInterval(keyHold.interval);
  }
  keyHold = { code: null, axis: null, direction: 0, sliderKey: null, interval: null, startMs: 0 };
  isKeyboardManualModulating = false;
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

  if (event.repeat && keyHold.code === event.code) {
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
  isKeyboardManualModulating = true;
  requestDraw();
  const { holdRepeatMs } = getHoldTimingSettings();
  const startMs = performance.now();
  keyHold = {
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
  if (event.code !== keyHold.code) {
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
  const pointerModulating = interactionState === INTERACTION_STATE.MOD_1 && activePointers.size > 0 && isManualModulating;
  return pointerModulating || isKeyboardManualModulating;
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

function buildInterestOverlayScanKey({ planeConfig, baseParams, lyapunovConfig, gridCols, gridRows, scanIterations }) {
  const fixedParamKeys = ["a", "b", "c", "d"].filter((key) => {
    if (planeConfig.mode === "two_axis") {
      return key !== planeConfig.axisXParam && key !== planeConfig.axisYParam;
    }
    return key !== planeConfig.axisParam;
  });

  const fixedParams = Object.fromEntries(fixedParamKeys.map((key) => [key, Number(baseParams[key]) || 0]));

  return JSON.stringify({
    formulaId: currentFormulaId,
    planeMode: planeConfig.mode,
    axisXParam: planeConfig.axisXParam || null,
    axisYParam: planeConfig.axisYParam || null,
    axisParam: planeConfig.axisParam || null,
    axisXRange: planeConfig.axisXRange || null,
    axisYRange: planeConfig.axisYRange || null,
    axisRange: planeConfig.axisRange || null,
    gridCols,
    gridRows,
    scanIterations,
    lyapunovConfig,
    fixedParams,
  });
}

function getInterestOverlayScanPlan(meta = null) {
  if (!appData || !currentFormulaId) {
    return null;
  }
  if (!Boolean(appData.defaults.interestOverlayEnabled) || !Boolean(appData.defaults.interestLyapunovEnabled) || !hasAnyManualTargets()) {
    return null;
  }

  const planeConfig = getInterestPlaneConfig();
  if (!planeConfig) {
    return null;
  }

  const view = meta?.view || { width: Math.max(1, canvas.width), height: Math.max(1, canvas.height) };
  const gridLayout = getInterestGridLayout(view, appData.defaults.interestGridSize);
  const gridCols = gridLayout.cols;
  const gridRows = gridLayout.rows;
  const scanIterations = Math.round(clamp(Number(appData.defaults.interestScanIterations), INTEREST_SCAN_ITERATIONS_MIN, INTEREST_SCAN_ITERATIONS_MAX));
  const lyapunovConfig = {
    minExponent: clamp(Number(appData.defaults.interestLyapunovMinExponent), INTEREST_LYAPUNOV_MIN_EXPONENT_MIN, INTEREST_LYAPUNOV_MIN_EXPONENT_MAX),
    delta0: clamp(Number(appData.defaults.interestLyapunovDelta0), INTEREST_LYAPUNOV_DELTA0_MIN, INTEREST_LYAPUNOV_DELTA0_MAX),
    rescale: Boolean(appData.defaults.interestLyapunovRescale),
    maxDistance: clamp(Number(appData.defaults.interestLyapunovMaxDistance), INTEREST_LYAPUNOV_MAX_DISTANCE_MIN, INTEREST_LYAPUNOV_MAX_DISTANCE_MAX),
  };
  const baseParams = getDerivedParams();
  const scanKey = buildInterestOverlayScanKey({
    planeConfig,
    baseParams,
    lyapunovConfig,
    gridCols,
    gridRows,
    scanIterations,
  });

  return { planeConfig, gridLayout, gridCols, gridRows, scanIterations, lyapunovConfig, baseParams, scanKey };
}

function precomputeInterestOverlayScan(meta = null) {
  scheduleInterestOverlayRecalc({ meta, immediate: false });
}

function scheduleInterestOverlayRecalc({ meta = null, immediate = false, showProgress = false } = {}) {
  if (highResExportInProgress) {
    return;
  }

  const plan = getInterestOverlayScanPlan(meta);
  if (!plan) {
    interestOverlayPendingPlan = null;
    if (interestOverlayRecalcTimer) {
      window.clearTimeout(interestOverlayRecalcTimer);
      interestOverlayRecalcTimer = null;
    }
    return;
  }

  if (interestOverlayScanCache?.scanKey === plan.scanKey) {
    return;
  }

  interestOverlayPendingPlan = plan;
  if (showProgress) {
    interestOverlayShowProgressToast = true;
    interestOverlayLastProgressToastPercent = -1;
  }

  if (interestOverlayRecalcTimer) {
    window.clearTimeout(interestOverlayRecalcTimer);
    interestOverlayRecalcTimer = null;
  }

  const delayMs = immediate ? 0 : 220;
  interestOverlayRecalcTimer = window.setTimeout(() => {
    interestOverlayRecalcTimer = null;
    void runInterestOverlayRecalc();
  }, delayMs);
}

async function runInterestOverlayRecalc() {
  if (interestOverlayCalcInProgress) {
    return;
  }

  const plan = interestOverlayPendingPlan;
  if (!plan || interestOverlayScanCache?.scanKey === plan.scanKey) {
    return;
  }

  const jobSeq = ++interestOverlayComputeSeq;
  interestOverlayActiveJobSeq = jobSeq;
  interestOverlayCalcInProgress = true;
  interestOverlayCalcProgressPercent = 0;
  interestOverlayLastProgressToastPercent = -1;

  try {
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const scanResult = classifyInterestGridLyapunov({
      formulaId: currentFormulaId,
      baseParams: plan.baseParams,
      plane: plan.planeConfig,
      gridCols: plan.gridCols,
      gridRows: plan.gridRows,
      iterations: plan.scanIterations,
      lyapunov: plan.lyapunovConfig,
      onProgress: (percent) => {
        const nextPercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
        interestOverlayCalcProgressPercent = nextPercent;
        if (interestOverlayShowProgressToast && nextPercent !== interestOverlayLastProgressToastPercent) {
          showToast(`Interest overlay calc ${nextPercent}%`);
          interestOverlayLastProgressToastPercent = nextPercent;
        }
      },
    });

    if (jobSeq !== interestOverlayActiveJobSeq) {
      return;
    }

    if (interestOverlayPendingPlan?.scanKey === plan.scanKey) {
      interestOverlayScanCache = {
        scanKey: plan.scanKey,
        scanResult,
        computedAt: performance.now(),
        gridCols: plan.gridCols,
        gridRows: plan.gridRows,
      };
    }
  } finally {
    interestOverlayCalcInProgress = false;
    if (interestOverlayShowProgressToast) {
      showToast("Interest overlay calc 100%");
      interestOverlayShowProgressToast = false;
    }

    if (interestOverlayPendingPlan && interestOverlayScanCache?.scanKey !== interestOverlayPendingPlan.scanKey) {
      scheduleInterestOverlayRecalc({ immediate: true, showProgress: true });
    }
  }
}

function shouldShowInterestOverlay() {
  return Boolean(appData?.defaults?.interestOverlayEnabled) && shouldShowManualOverlay() && hasAnyManualTargets();
}

function drawInterestOverlay(meta) {
  if (!meta || !shouldShowInterestOverlay() || !Boolean(appData.defaults.interestLyapunovEnabled)) {
    return;
  }

  const plan = getInterestOverlayScanPlan(meta);
  if (!plan) {
    return;
  }

  const isStaleOverlay = interestOverlayScanCache?.scanKey !== plan.scanKey;
  if (!interestOverlayScanCache) {
    return;
  }

  const scanResult = interestOverlayScanCache?.scanResult;
  if (!scanResult || scanResult.gridCols !== plan.gridCols || scanResult.gridRows !== plan.gridRows || !Array.isArray(scanResult.highCells) || scanResult.highCells.length === 0) {
    return;
  }

  const { cellSize, offsetX, offsetY } = plan.gridLayout;

  const overlayOpacity = normalizeInterestOverlayOpacity(appData.defaults.interestOverlayOpacity);

  ctx.save();
  ctx.fillStyle = isStaleOverlay
    ? `rgba(120, 200, 255, ${Math.max(INTEREST_OVERLAY_OPACITY_MIN, overlayOpacity * 0.6)})`
    : `rgba(120, 200, 255, ${overlayOpacity})`;
  for (const cellIndex of scanResult.highCells) {
    const col = cellIndex % plan.gridCols;
    const row = Math.floor(cellIndex / plan.gridCols);
    const x = offsetX + col * cellSize;
    const y = offsetY + row * cellSize;
    ctx.fillRect(x, y, cellSize, cellSize);
  }

  ctx.restore();
}

function syncInterestOverlayToggleUi() {
  const enabled = Boolean(appData?.defaults?.interestOverlayEnabled);
  const hasManualTargets = hasAnyManualTargets();
  overlayToggleBtn?.classList.toggle("is-disabled", !hasManualTargets);
  overlayToggleBtn?.classList.toggle("is-active", enabled && hasManualTargets);
  overlayToggleBtn?.setAttribute("aria-pressed", enabled && hasManualTargets ? "true" : "false");
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
    ctx.save();
    ctx.lineWidth = AXIS_WIDTH + 2;
    ctx.strokeStyle = OVERLAY_BLACK;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // 2) Final crisp white center pass
    ctx.save();
    ctx.lineWidth = AXIS_WIDTH;
    ctx.strokeStyle = OVERLAY_WHITE;
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const alignedAxisX = alignAxisPixel(paramAxisX, AXIS_WIDTH);
  const alignedAxisY = alignAxisPixel(paramAxisY, AXIS_WIDTH);
  const alignedParamX = alignAxisPixel(paramX, AXIS_WIDTH);
  const alignedParamY = alignAxisPixel(paramY, AXIS_WIDTH);

  ctx.save();
  ctx.strokeStyle = OVERLAY_WHITE;
  ctx.fillStyle = OVERLAY_WHITE;
  ctx.lineWidth = AXIS_WIDTH;
  ctx.shadowBlur = 0;

  if (manYControl) {
    drawAxisLine(0, alignedAxisY, view.width, alignedAxisY);
  }

  if (manXControl) {
    drawAxisLine(alignedAxisX, 0, alignedAxisX, view.height);
  }

  // Crosshair: black outline pass + white center pass
  ctx.save();
  ctx.lineWidth = AXIS_WIDTH + 2;
  ctx.strokeStyle = OVERLAY_BLACK;
  ctx.beginPath();
  ctx.moveTo(alignedParamX - crosshairSize, alignedParamY);
  ctx.lineTo(alignedParamX + crosshairSize, alignedParamY);
  ctx.moveTo(alignedParamX, alignedParamY - crosshairSize);
  ctx.lineTo(alignedParamX, alignedParamY + crosshairSize);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = AXIS_WIDTH;
  ctx.strokeStyle = OVERLAY_WHITE;
  ctx.beginPath();
  ctx.moveTo(alignedParamX - crosshairSize, alignedParamY);
  ctx.lineTo(alignedParamX + crosshairSize, alignedParamY);
  ctx.moveTo(alignedParamX, alignedParamY - crosshairSize);
  ctx.lineTo(alignedParamX, alignedParamY + crosshairSize);
  ctx.stroke();
  ctx.restore();

  const drawOutlinedText = (text, x, y) => {
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = OVERLAY_BLACK;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = OVERLAY_WHITE;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawOutlinedTextClamped = (text, preferredX, preferredY) => {
    const metrics = ctx.measureText(text);
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

  ctx.font = `${axisNameFontPx}px system-ui, sans-serif`;
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

  ctx.restore();
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
    `a: ${formatNumberForUi(params.a, 6)}`,
    `b: ${formatNumberForUi(params.b, 6)}`,
    `c: ${formatNumberForUi(params.c, 6)}`,
    `d: ${formatNumberForUi(params.d, 6)}`,
    `iterations: ${formatNumberForUi(meta.iterations, 0)}`,
    "seeds: 1",
    `x range: ${formatNumberForUi(world.minX, 3)} to ${formatNumberForUi(world.maxX, 3)}`,
    `y range: ${formatNumberForUi(world.minY, 3)} to ${formatNumberForUi(world.maxY, 3)}`,
    `range centre: (${formatNumberForUi(centerX, 3)}, ${formatNumberForUi(centerY, 3)})`,
    `gesture state: ${interactionState}`,
    `2f dxm/dym/dd: ${lastTwoDebug ? `${formatNumberForUi(lastTwoDebug.dxm, 2)} / ${formatNumberForUi(lastTwoDebug.dym, 2)} / ${formatNumberForUi(lastTwoDebug.dd, 2)}` : "-"}`,
    `2f ratioStep/zoom: ${lastTwoDebug ? `${formatNumberForUi(lastTwoDebug.ratioStep, 4)} / ${formatNumberForUi(lastTwoDebug.viewZoom, 4)}` : "-"}`,
    `fps: ${formatNumberForUi(fpsEstimate, 1)}`,
    ...getScreenViewportDebugLines(),
  ].join("\n");
}

async function draw() {
  if (!appData || !currentFormulaId) {
    return;
  }

  const renderGenerationAtStart = renderGeneration;
  const startedAt = performance.now();
  const didResize = resizeCanvas();
  const iterationSetting = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  const burnSetting = Math.round(clamp(appData.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max));
  const iterations = iterationSetting;
  if (panZoomInteractionActive && !didResize && activePanZoomCacheEntry && drawInteractionFrameFromCache(activePanZoomCacheEntry)) {
    drawDebugOverlay(lastRenderMeta);
    drawInterestOverlay(lastRenderMeta);
    drawManualParamOverlay(lastRenderMeta);
    layoutFloatingActions();
    return;
  }
  renderProgressStartedAt = performance.now();
  renderProgressShownThisDraw = false;
  const { pxW, pxH } = getExportSizePx(canvas);
  const cropScale = Math.max(
    1,
    canvas.width / Math.max(1, pxW),
    canvas.height / Math.max(1, pxH),
  );
  const fullCanvas = ensureExportCacheCanvas(
    Math.max(1, Math.round(pxW * cropScale)),
    Math.max(1, Math.round(pxH * cropScale)),
  );
  let frameMetaFull;
  try {
    frameMetaFull = await renderFrame({
      ctx: exportCacheCtx,
      canvas: fullCanvas,
      formulaId: currentFormulaId,
      cmapName: appData.defaults.cmapName,
      params: getDerivedParams(),
      iterations,
      burn: burnSetting,
      scaleMode: getScaleMode(),
      fixedView,
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

  const frameMeta = {
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
  };


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
  lastFullRenderMeta = {
    ...frameMetaFull,
    iterations,
    renderMs: now - startedAt,
  };
  const stateKey = getRenderStateKey();
  cacheAccurateFrame({
    key: stateKey,
    fullCanvas,
    fullMeta: lastFullRenderMeta,
    frameMeta: lastRenderMeta,
    sourceFixedView: fixedView,
  });
  clearPanZoomInteractionCache();
  renderRevision += 1;
  exportCacheMeta = {
    pxW: fullCanvas.width,
    pxH: fullCanvas.height,
    updatedAt: performance.now(),
    renderRevision,
  };

  const manualOverlayActive = shouldShowManualOverlay();
  if (manualOverlayActive && !wasManualOverlayActive && interestOverlayCalcInProgress) {
    interestOverlayShowProgressToast = true;
    interestOverlayLastProgressToastPercent = -1;
  }
  wasManualOverlayActive = manualOverlayActive;

  drawDebugOverlay(lastRenderMeta);
  drawInterestOverlay(lastRenderMeta);
  drawManualParamOverlay(lastRenderMeta);
  refreshParamButtons();
  updateQuickSliderReadout();
  syncDetailedSettingsControls();
  layoutFloatingActions();

  if (shouldShowInterestOverlay()) {
    scheduleInterestOverlayRecalc({ meta: lastRenderMeta, immediate: false, showProgress: true });
  }

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

function getExportSizePx(liveCanvas) {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

  const vw = (window.visualViewport && window.visualViewport.width) ? window.visualViewport.width : window.innerWidth;
  const vh = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : window.innerHeight;
  const orientationType = String(window.screen?.orientation?.type || "").toLowerCase();
  const isLandscape = orientationType
    ? orientationType.startsWith("landscape")
    : vw > vh;

  const viewportLong = Math.max(vw, vh);
  const viewportShort = Math.max(1, Math.min(vw, vh));
  const viewportAspect = viewportLong / viewportShort;

  const screenW = Number(window.screen?.width) || 0;
  const screenH = Number(window.screen?.height) || 0;
  const availW = Number(window.screen?.availWidth) || 0;
  const availH = Number(window.screen?.availHeight) || 0;

  const rawPairs = [
    { source: "screen", w: screenW, h: screenH },
    { source: "avail", w: availW, h: availH },
  ];

  const candidates = rawPairs
    .filter((pair) => pair.w > 0 && pair.h > 0)
    .map((pair) => {
      const long = Math.max(pair.w, pair.h);
      const short = Math.min(pair.w, pair.h);
      const aspect = long / Math.max(1, short);
      return { ...pair, long, short, aspect };
    });

  const nonSquareCandidate = candidates.find((pair) => Number.isFinite(pair.aspect) && pair.aspect > 1.01) || null;
  const baseCandidate = nonSquareCandidate || candidates[0] || null;
  const hasScreenSize = Boolean(baseCandidate);

  const rawCssLong = hasScreenSize ? baseCandidate.long : viewportLong;
  const rawCssShort = hasScreenSize ? baseCandidate.short : viewportShort;

  const isSuspiciousSquareScreen = hasScreenSize
    && Math.abs(rawCssLong - rawCssShort) <= 1
    && Number.isFinite(viewportAspect)
    && viewportAspect > 1.01;

  const cssLong = rawCssLong;
  const cssShort = isSuspiciousSquareScreen
    ? Math.max(1, Math.round(rawCssLong / viewportAspect))
    : rawCssShort;

  let pxW = Math.round((isLandscape ? cssLong : cssShort) * dpr);
  let pxH = Math.round((isLandscape ? cssShort : cssLong) * dpr);

  const liveMin = Math.max(1, Math.min(liveCanvas.width, liveCanvas.height));
  const exportMin = Math.max(1, Math.min(pxW, pxH));
  if (exportMin < liveMin) {
    const upscale = liveMin / exportMin;
    pxW = Math.round(pxW * upscale);
    pxH = Math.round(pxH * upscale);
  }

  return {
    pxW,
    pxH,
    dpr,
    isLandscape,
    hasScreenSize,
    debug: {
      orientationType,
      vw,
      vh,
      viewportAspect,
      screenW,
      screenH,
      availW,
      availH,
      selectedSource: baseCandidate?.source || "viewport",
      selectedLong: rawCssLong,
      selectedShort: rawCssShort,
      isSuspiciousSquareScreen,
      cssW: isLandscape ? cssLong : cssShort,
      cssH: isLandscape ? cssShort : cssLong,
      liveCanvasW: liveCanvas.width,
      liveCanvasH: liveCanvas.height,
    },
  };
}

function buildScreenshotOverlayLines() {
  const formula = appData.formulas.find((item) => item.id === currentFormulaId);
  const params = getDerivedParams();
  const iterValue = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  return `${formula?.name || currentFormulaId} | ${appData.defaults.cmapName} | a ${formatNumberForUi(params.a, 4)} | b ${formatNumberForUi(params.b, 4)} | c ${formatNumberForUi(params.c, 4)} | d ${formatNumberForUi(params.d, 4)} | iter ${formatNumberForUi(iterValue, 0)}`;
}

function drawScreenshotOverlay(targetCtx, width, height) {
  const line = buildScreenshotOverlayLines();
  const marginX = Math.max(16, Math.round(width * 0.02));
  const panelHeight = Math.max(28, Math.round(height * 0.05));
  const yTop = height - panelHeight;
  const margin = Math.max(18, Math.round(width * 0.02));
  const qrSize = clamp(Math.round(Math.min(width, height) * 0.14), 140, 320);
  const qrX = width - margin - qrSize;
  const qrY = height - margin - qrSize;
  const maxTextWidth = Math.max(120, Math.min(width * 0.75, qrX - marginX - 12));

  let fontSize = Math.max(11, Math.round(height * 0.02));
  targetCtx.save();
  targetCtx.textBaseline = "middle";
  targetCtx.textAlign = "left";
  while (fontSize > 9) {
    targetCtx.font = `${fontSize}px Inter, system-ui, -apple-system, Segoe UI, sans-serif`;
    if (targetCtx.measureText(line).width <= maxTextWidth) {
      break;
    }
    fontSize -= 1;
  }

  targetCtx.fillStyle = "#000000";
  targetCtx.fillRect(marginX, yTop, Math.max(80, qrX - marginX - 8), panelHeight);
  targetCtx.fillStyle = OVERLAY_TEXT_COLOR;
  targetCtx.fillText(line, marginX + 10, yTop + panelHeight * 0.5);

  const shareUrl = buildShareUrl();
  const qrCanvas = buildQrCanvas(shareUrl, qrSize);
  targetCtx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  targetCtx.restore();
}

async function saveBlobToDevice(blob, filename) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      pendingShareFile = null;
      pendingShareTitle = "";
      return;
    } catch (error) {
      const shareErrorName = String(error?.name || "");
      const shareErrorMessage = String(error?.message || "");
      const isUserCancelled = shareErrorName === "AbortError";
      const requiresFreshTap = shareErrorName === "NotAllowedError"
        || shareErrorName === "NotSupportedError"
        || /not allowed|denied|permission|policy|context/i.test(shareErrorMessage);

      if (isUserCancelled) {
        throw new Error("Share cancelled.");
      }

      if (!requiresFreshTap) {
        throw error;
      }

      pendingShareFile = file;
      pendingShareTitle = filename;
      console.info("Web Share API needs a fresh user activation. Waiting for explicit retry tap.", {
        shareErrorName,
        shareErrorMessage,
      });
      throw new Error("Share needs a fresh tap. Use 'Share prepared screenshot now'.");
    }
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

function syncScreenshotMenuShareRetryUi() {
  if (!screenshotMenuShareRetryEl) {
    return;
  }

  const hasPendingShare = Boolean(pendingShareFile);
  screenshotMenuShareRetryEl.classList.toggle("is-hidden", !hasPendingShare);
  if (screenshotMenuShareRetryHintEl) {
    screenshotMenuShareRetryHintEl.textContent = hasPendingShare
      ? "Needed when browser requires a second explicit tap to share."
      : "Shown when share needs a fresh tap.";
  }
  syncCameraButtonHighlight();
}

async function retryPendingShare() {
  if (!pendingShareFile || !navigator.share) {
    showToast("No prepared screenshot waiting to share.");
    return;
  }

  try {
    await navigator.share({ files: [pendingShareFile], title: pendingShareTitle || pendingShareFile.name });
    pendingShareFile = null;
    pendingShareTitle = "";
    syncScreenshotMenuShareRetryUi();
    closeScreenshotMenu();
    showToast("Screenshot shared.");
  } catch (error) {
    if (String(error?.name || "") === "AbortError") {
      showToast("Share cancelled.");
      return;
    }
    console.error(error);
    showToast(`Share failed: ${error.message}`);
  }
}

function getExportWorldFromLiveMeta(exportWidth, exportHeight) {
  const sourceMeta = lastFullRenderMeta || lastRenderMeta;
  if (!sourceMeta?.world || !sourceMeta?.view) {
    return null;
  }

  const liveView = sourceMeta.view;
  const liveWorld = sourceMeta.world;
  const liveSpanX = Math.max(liveWorld.maxX - liveWorld.minX, 1e-6);
  const liveSpanY = Math.max(liveWorld.maxY - liveWorld.minY, 1e-6);
  const sourceShortSpan = liveView.width <= liveView.height ? liveSpanX : liveSpanY;
  const targetAspect = Math.max(1e-6, exportWidth / Math.max(1, exportHeight));

  let exportSpanX;
  let exportSpanY;
  if (exportWidth >= exportHeight) {
    exportSpanY = sourceShortSpan;
    exportSpanX = exportSpanY * targetAspect;
  } else {
    exportSpanX = sourceShortSpan;
    exportSpanY = exportSpanX / targetAspect;
  }

  const centerX = Number.isFinite(liveWorld.centerX) ? liveWorld.centerX : (liveWorld.minX + liveWorld.maxX) * 0.5;
  const centerY = Number.isFinite(liveWorld.centerY) ? liveWorld.centerY : (liveWorld.minY + liveWorld.maxY) * 0.5;
  const worldPerPxX = exportSpanX / Math.max(1, exportWidth - 1);
  const worldPerPxY = exportSpanY / Math.max(1, exportHeight - 1);

  return {
    minX: centerX - exportSpanX * 0.5,
    maxX: centerX + exportSpanX * 0.5,
    minY: centerY - exportSpanY * 0.5,
    maxY: centerY + exportSpanY * 0.5,
    worldPerPxX,
    worldPerPxY,
  };
}

function ensureExportCacheCanvas(width, height) {
  if (!exportCacheCanvas) {
    exportCacheCanvas = document.createElement("canvas");
    exportCacheCtx = exportCacheCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (!exportCacheCtx) {
    throw new Error("Screenshot export context unavailable.");
  }
  if (exportCacheCanvas.width !== width || exportCacheCanvas.height !== height) {
    exportCacheCanvas.width = width;
    exportCacheCanvas.height = height;
  }
  return exportCacheCanvas;
}

async function renderCurrentFrameIntoExportCanvas(targetCanvas, targetCtx) {
  const iterationSetting = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
  const burnSetting = Math.round(clamp(appData.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max));
  const scaleMode = getScaleMode();
  const exportWorld = getExportWorldFromLiveMeta(targetCanvas.width, targetCanvas.height);

  await renderFrame({
    ctx: targetCtx,
    canvas: targetCanvas,
    formulaId: currentFormulaId,
    cmapName: appData.defaults.cmapName,
    params: getDerivedParams(),
    iterations: iterationSetting,
    burn: burnSetting,
    scaleMode,
    fixedView,
    worldOverride: exportWorld,
    seed: getSeedForFormula(currentFormulaId),
    renderColoring: getRenderColoringOptions(),
    backgroundColor: hexToRgb(appData.defaults.backgroundColor || "#05070c"),
  });
}

async function refreshExportCacheFromCurrentFrame() {
  if (!canvas || !lastRenderMeta || !appData || !currentFormulaId) {
    return;
  }
  const { pxW, pxH } = getExportSizePx(canvas);
  const targetCanvas = ensureExportCacheCanvas(pxW, pxH);
  await renderCurrentFrameIntoExportCanvas(targetCanvas, exportCacheCtx);
  exportCacheMeta = {
    pxW,
    pxH,
    updatedAt: performance.now(),
    renderRevision,
  };
}

function makeCanvasClone(sourceCanvas, includeOverlay) {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const outputCtx = outputCanvas.getContext("2d", { willReadFrequently: true });
  if (!outputCtx) {
    throw new Error("Screenshot export context unavailable.");
  }
  outputCtx.drawImage(sourceCanvas, 0, 0);
  if (includeOverlay) {
    drawScreenshotOverlay(outputCtx, outputCanvas.width, outputCanvas.height);
  }
  return outputCanvas;
}

async function exportCanvasToBlob(canvasToExport) {
  const blob = await new Promise((resolve) => canvasToExport.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Screenshot export failed.");
  }
  return blob;
}

function getLongEdgeExportSize(targetLongEdge) {
  const size = getExportSizePx(canvas);
  const longEdge = Math.max(1, Number(targetLongEdge) || 1);
  const aspect = size.pxW / Math.max(1, size.pxH);
  if (aspect >= 1) {
    return { width: longEdge, height: Math.max(1, Math.round(longEdge / aspect)) };
  }
  return { width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge };
}

async function captureCachedScreenshot(includeOverlay) {
  if (!exportCacheCanvas || !exportCacheMeta) {
    showToast("Preparing latest screenshot...");
    await refreshExportCacheFromCurrentFrame();
  }
  if (!exportCacheCanvas) {
    throw new Error("No render cache available yet.");
  }
  const outputCanvas = makeCanvasClone(exportCacheCanvas, includeOverlay);
  const blob = await exportCanvasToBlob(outputCanvas);
  const filename = `hopalong-${includeOverlay ? "overlay" : "clean"}-${formatScreenshotTimestamp(new Date())}.png`;
  await saveBlobToDevice(blob, filename);
  showToast(includeOverlay ? "Saved overlay screenshot." : "Saved clean screenshot.");
}

async function captureHighResScreenshot(longEdgePx) {
  const { width, height } = getLongEdgeExportSize(longEdgePx);
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = width;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext("2d", { willReadFrequently: true });
  if (!targetCtx) {
    throw new Error("Screenshot export context unavailable.");
  }

  const label = longEdgePx >= 7680 ? "8K" : "4K";
  highResExportInProgress = true;
  try {
    await renderFrame({
      ctx: targetCtx,
      canvas: targetCanvas,
      formulaId: currentFormulaId,
      cmapName: appData.defaults.cmapName,
      params: getDerivedParams(),
      iterations: Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max)),
      burn: Math.round(clamp(appData.defaults.sliders.burn, sliderControls.burn.min, sliderControls.burn.max)),
      scaleMode: getScaleMode(),
      fixedView,
      worldOverride: getExportWorldFromLiveMeta(width, height),
      seed: getSeedForFormula(currentFormulaId),
      renderColoring: getRenderColoringOptions(),
      backgroundColor: hexToRgb(appData.defaults.backgroundColor || "#05070c"),
      onProgress: (percent, isComplete) => {
        updateExportRenderProgressToast(`Rendering ${label} screenshot`, percent, isComplete);
      },
    });
    const blob = await exportCanvasToBlob(targetCanvas);
    const filenameLabel = longEdgePx >= 7680 ? "8k" : "4k";
    const filename = `hopalong-clean-${filenameLabel}-${formatScreenshotTimestamp(new Date())}.png`;
    await saveBlobToDevice(blob, filename);
    showToast(`Saved clean ${label} screenshot.`);
  } finally {
    highResExportInProgress = false;
    if (drawDirty) {
      requestDraw();
    }
  }
}

function syncCameraButtonHighlight() {
  const shouldHighlight = Boolean(pendingShareFile) || Boolean(screenshotMenuOverlayEl?.classList.contains("is-open"));
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

async function captureScreenshotAction(action) {
  try {
    if (action === "clean") {
      await captureCachedScreenshot(false);
      return;
    }
    if (action === "overlay") {
      await captureCachedScreenshot(true);
      return;
    }
    if (action === "4k") {
      showToast("Rendering 4K screenshot. This may take a moment.");
      await captureHighResScreenshot(3840);
      return;
    }
    if (action === "8k") {
      showToast("Rendering 8K screenshot. This may take longer.");
      await captureHighResScreenshot(7680);
    }
  } catch (error) {
    if (error?.message === "Share cancelled.") {
      showToast("Share cancelled.");
      return;
    }
    if (error?.message === "Share needs a fresh tap. Use 'Share prepared screenshot now'.") {
      openScreenshotMenu();
      showToast("Share needs one more tap. Use 'Share prepared screenshot now'.");
      return;
    }
    console.error(error);
    showToast(`Screenshot failed: ${error.message}`);
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
  if (!helpBtn || helpOverlayController) {
    return;
  }

  helpOverlayController = createHelpOverlay({
    helpButton: helpBtn,
    isSliderOpen: () => quickSliderOverlay.classList.contains("is-open"),
    ensureSliderOpen: ensureHelpSliderOpen,
    closeSlider: closeQuickSlider,
    getActiveHelpContexts: () => {
      const contexts = [];

      if (pickerOverlay.classList.contains("is-open")) {
        if (activePicker === "formula") {
          contexts.push("formulaPanel");
        } else if (activePicker === "cmap") {
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
    const isDoubleTap = now - lastQuickSliderTopTapAt <= DOUBLE_TAP_MS;
    lastQuickSliderTopTapAt = now;
    if (!isDoubleTap) {
      return;
    }
    if (["a", "b", "c", "d"].includes(activeSliderKey || "")) {
      resetParamSliderToZero(activeSliderKey);
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
    const mappedValue = getSliderValueFromQuickSliderRangeValue(activeSliderKey, rawValue);
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
    await captureScreenshotAction("clean");
  });
  screenshotMenuOverlayOptionEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await captureScreenshotAction("overlay");
  });
  screenshotMenu4kEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await captureScreenshotAction("4k");
  });
  screenshotMenu8kEl?.addEventListener("click", async () => {
    closeScreenshotMenu();
    await captureScreenshotAction("8k");
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
    if (!helpOverlayController) {
      return;
    }
    helpOverlayController.toggle();
  });

  const toggleRandomMode = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const nextMode = randomAllNextMode;
    applyAllParamModes(nextMode);
    randomAllNextMode = nextMode === "rand" ? "fix" : "rand";
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
      openRangesEditor();
    } else {
      closeRangesEditor();
    }
  });
  formulaSettingsCloseEl?.addEventListener("click", closeFormulaSettingsPanel);
  formulaSettingsCloseBottomEl?.addEventListener("click", closeFormulaSettingsPanel);

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
    if (!activeColorSettingsMap) return;
    const next = getColorMapStops(activeColorSettingsMap) || [];
    if (!next.length) return;
    const insertAt = Math.floor(next.length / 2);
    const left = next[Math.max(0, insertAt - 1)] || next[0];
    const right = next[Math.min(next.length - 1, insertAt)] || next[next.length - 1];
    next.splice(insertAt, 0, [(left[0] + right[0]) * 0.5, right[1], right[2], right[3], right[4]]);
    setColorMapStops(activeColorSettingsMap, next);
    renderColorStopsEditor();
    colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
    requestDraw();
  });

  resetColorStopsBtnEl?.addEventListener("click", () => {
    if (!activeColorSettingsMap) return;
    setColorMapStops(activeColorSettingsMap, null);
    renderColorStopsEditor();
    colorSettingsPreviewEl.style.background = buildColorMapGradient(activeColorSettingsMap);
    requestDraw();
    saveDefaultsToStorage();
  });

  colorSettingsCloseEl?.addEventListener("click", closeColorSettingsPanel);

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

    if (activeInfoAnchorEl && !target.closest("#settingsInfoPopup, .perfInfoBtn")) {
      hideSettingsInfo();
    }
    closeDismissablePanelsForTarget(target);
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
      historyTapTracker = null;
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      historyTapTracker = null;
      return;
    }

    historyTapTracker = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      validTap: true,
    };
  });

  window.addEventListener("pointermove", updateHistoryTapTrackerFromMove, { passive: true });
  window.addEventListener("pointerup", (event) => {
    handleScreenHistoryNavigation(event);
    if (historyTapTracker?.pointerId === event.pointerId) {
      historyTapTracker = null;
    }
  });
  window.addEventListener("pointercancel", (event) => {
    if (historyTapTracker?.pointerId === event.pointerId) {
      historyTapTracker = null;
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
      layoutFormulaSettingsPanel();
      layoutColorSettingsPanel();
      layoutModeSettingsPanel();
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
      layoutFormulaSettingsPanel();
      layoutColorSettingsPanel();
      layoutModeSettingsPanel();
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
