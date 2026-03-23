import { DEFAULT_BURN, DEFAULTS } from "./defaults.js";

export function initHistoryState({
  historyLimit,
  getAppData,
  getCurrentFormulaId,
  captureCurrentState,
  statesEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
  onDiscardFutureState,
  applyState,
  getShareState,
  applySharedState,
  getLocation = () => window.location,
}) {
  let isApplyingHistoryState = false;
  let historyStates = [];
  let historyIndex = -1;

  function withHistoryApplyGuard(callback) {
    isApplyingHistoryState = true;
    try {
      return callback();
    } finally {
      isApplyingHistoryState = false;
    }
  }

  function commitCurrentStateToHistory() {
    if (!getAppData() || !getCurrentFormulaId() || isApplyingHistoryState) {
      return;
    }

    const nextState = captureCurrentState();
    const currentState = historyIndex >= 0 ? historyStates[historyIndex] : null;
    if (currentState && statesEqual(currentState, nextState)) {
      return;
    }

    if (historyIndex < historyStates.length - 1) {
      for (const state of historyStates.slice(historyIndex + 1)) {
        onDiscardFutureState?.(state);
      }
      historyStates = historyStates.slice(0, historyIndex + 1);
    }

    historyStates.push(nextState);
    if (historyStates.length > historyLimit) {
      const overflow = historyStates.length - historyLimit;
      historyStates.splice(0, overflow);
      historyIndex = Math.max(-1, historyIndex - overflow);
    }
    historyIndex = historyStates.length - 1;
  }

  function moveHistory(delta) {
    const nextIndex = historyIndex + delta;
    if (nextIndex < 0 || nextIndex >= historyStates.length) {
      return null;
    }

    historyIndex = nextIndex;
    withHistoryApplyGuard(() => applyState(historyStates[historyIndex]));
    return {
      index: historyIndex,
      length: historyStates.length,
      state: historyStates[historyIndex],
    };
  }

  function persistCurrentHistoryViewState(nextFixedView) {
    if (historyIndex < 0 || historyIndex >= historyStates.length) {
      return;
    }

    const state = historyStates[historyIndex];
    if (!state || typeof state !== "object") {
      return;
    }

    state.fixedView = { ...nextFixedView };
  }

  function formatCompactNumber(value) {
    return Number(value).toString();
  }

  function normalizeBackgroundColorForShare(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value.startsWith("#") ? value.slice(1) : value;
  }

  function decodeBackgroundColor(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }
    const trimmed = value.trim();
    return /^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed) ? `#${trimmed}` : trimmed;
  }

  function readFirst(params, keys) {
    for (const key of keys) {
      const value = params.get(key);
      if (value != null && value !== "") {
        return value;
      }
    }
    return null;
  }

  function buildShareUrl() {
    const location = getLocation();
    const {
      formulaId,
      cmapName,
      params,
      iterations,
      view,
      renderColorMode,
      backgroundColor,
    } = getShareState();
    const url = new URL(`${location.origin}${location.pathname}`);
    const searchParams = new URLSearchParams();

    searchParams.set("f", formulaId);
    searchParams.set("m", cmapName);
    searchParams.set("a", formatCompactNumber(params.a));
    searchParams.set("b", formatCompactNumber(params.b));
    searchParams.set("c", formatCompactNumber(params.c));
    searchParams.set("d", formatCompactNumber(params.d));
    searchParams.set("i", String(Math.round(iterations)));

    const sharedView = view && typeof view === "object" ? view : null;
    const centerX = Number(sharedView?.cx);
    const centerY = Number(sharedView?.cy);
    const minSpan = Number(sharedView?.ms);
    const aspectRatio = Number(sharedView?.ar);
    if (Number.isFinite(centerX) && Number.isFinite(centerY) && Number.isFinite(minSpan) && minSpan > 0) {
      searchParams.set("cx", formatCompactNumber(centerX));
      searchParams.set("cy", formatCompactNumber(centerY));
      searchParams.set("ms", formatCompactNumber(minSpan));
      if (Number.isFinite(aspectRatio) && aspectRatio > 0) {
        searchParams.set("ar", formatCompactNumber(aspectRatio));
      }
    } else {
      const zoom = Number(view?.zoom ?? 1);
      const offsetX = Number(view?.offsetX ?? 0);
      const offsetY = Number(view?.offsetY ?? 0);
      if (zoom !== 1) searchParams.set("z", formatCompactNumber(zoom));
      if (offsetX !== 0) searchParams.set("ox", formatCompactNumber(offsetX));
      if (offsetY !== 0) searchParams.set("oy", formatCompactNumber(offsetY));
    }
    if (renderColorMode && renderColorMode !== DEFAULTS.renderColorMode) searchParams.set("rm", renderColorMode);
    const encodedBackgroundColor = normalizeBackgroundColorForShare(backgroundColor);
    if (encodedBackgroundColor && backgroundColor !== DEFAULTS.backgroundColor) searchParams.set("bg", encodedBackgroundColor);

    url.search = searchParams.toString();
    return url.toString();
  }

  function applySharedStateFromSearch() {
    const location = getLocation();
    const params = new URLSearchParams(location.search || "");
    const formulaId = readFirst(params, ["f", "formula"]);
    const cmapName = readFirst(params, ["m", "cmap"]);
    const rawParamValues = ["a", "b", "c", "d"].map((key) => Number.parseFloat(readFirst(params, [key]) || ""));
    const iterations = Number.parseInt(readFirst(params, ["i", "iters"]) || "", 10);
    const sharedCenterX = Number.parseFloat(readFirst(params, ["cx"]) || "NaN");
    const sharedCenterY = Number.parseFloat(readFirst(params, ["cy"]) || "NaN");
    const sharedMinSpan = Number.parseFloat(readFirst(params, ["ms"]) || "NaN");
    const sharedAspectRatio = Number.parseFloat(readFirst(params, ["ar"]) || "NaN");
    const hasWorldSharedView = Number.isFinite(sharedCenterX)
      && Number.isFinite(sharedCenterY)
      && Number.isFinite(sharedMinSpan)
      && sharedMinSpan > 0;
    const view = hasWorldSharedView
      ? [sharedCenterX, sharedCenterY, sharedMinSpan, sharedAspectRatio]
      : [
        Number.parseFloat(readFirst(params, ["ox", "offsetX"]) || "0"),
        Number.parseFloat(readFirst(params, ["oy", "offsetY"]) || "0"),
        Number.parseFloat(readFirst(params, ["z", "zoom"]) || "1"),
      ];
    const seedX = Number.parseFloat(readFirst(params, ["seedX"]) || "0");
    const seedY = Number.parseFloat(readFirst(params, ["seedY"]) || "0");
    const renderColorMode = readFirst(params, ["rm", "renderColorMode"]);
    const backgroundColor = decodeBackgroundColor(readFirst(params, ["bg", "backgroundColor"]));
    const scaleMode = hasWorldSharedView ? "fixed" : (readFirst(params, ["scale"]) || "fixed");

    if (!formulaId || !cmapName) {
      return false;
    }
    if (rawParamValues.some((value) => !Number.isFinite(value))) {
      return false;
    }
    if (!Number.isFinite(iterations) || iterations < 1) {
      return false;
    }
    if (view.some((value) => !Number.isFinite(value)) || view[2] <= 0) {
      return false;
    }
    if (!Number.isFinite(seedX) || !Number.isFinite(seedY)) {
      return false;
    }

    return applySharedState({
      formulaId,
      cmapName,
      params: rawParamValues,
      iterations,
      burn: DEFAULT_BURN,
      seed: params.has("seedX") || params.has("seedY") ? { x: seedX, y: seedY } : null,
      scaleMode,
      view,
      renderColorMode,
      backgroundColor,
    });
  }

  function applySharedStateFromHash() {
    const location = getLocation();
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

      return applySharedState({
        formulaId,
        cmapName,
        params: pValues,
        iterations,
        burn: DEFAULT_BURN,
        seed: null,
        scaleMode: "fixed",
        view: vValues,
        renderColorMode: null,
        backgroundColor: null,
      });
    } catch (error) {
      console.warn("Could not parse shared hash state.", error);
      return false;
    }
  }

  function applySharedStateFromUrl() {
    return applySharedStateFromSearch() || applySharedStateFromHash();
  }

  return {
    buildShareUrl,
    applySharedStateFromSearch,
    applySharedStateFromHash,
    applySharedStateFromUrl,
    captureCurrentState,
    commitCurrentStateToHistory,
    moveBackward: () => moveHistory(-1),
    moveForward: () => moveHistory(1),
    canMoveBackward: () => historyIndex > 0,
    canMoveForward: () => historyIndex < historyStates.length - 1,
    getHistoryStatus: () => ({ index: historyIndex, length: historyStates.length }),
    isApplyingHistoryState: () => isApplyingHistoryState,
    persistCurrentHistoryViewState,
  };
}
