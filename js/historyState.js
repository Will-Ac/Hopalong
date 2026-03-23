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

  function buildShareUrl() {
    const location = getLocation();
    const {
      formulaId,
      cmapName,
      params,
      iterations,
      burn,
      seed,
      scaleMode,
      view,
    } = getShareState();
    const url = new URL(`${location.origin}${location.pathname}`);
    const searchParams = new URLSearchParams();

    searchParams.set("formula", formulaId);
    searchParams.set("cmap", cmapName);
    searchParams.set("a", String(params.a));
    searchParams.set("b", String(params.b));
    searchParams.set("c", String(params.c));
    searchParams.set("d", String(params.d));
    searchParams.set("iters", String(iterations));
    searchParams.set("burn", String(burn));
    searchParams.set("scale", String(scaleMode || "fixed"));
    searchParams.set("offsetX", String(view?.offsetX ?? 0));
    searchParams.set("offsetY", String(view?.offsetY ?? 0));
    searchParams.set("zoom", String(view?.zoom ?? 1));
    searchParams.set("seedX", String(seed?.x ?? 0));
    searchParams.set("seedY", String(seed?.y ?? 0));
    url.search = searchParams.toString();
    return url.toString();
  }

  function applySharedStateFromSearch() {
    const location = getLocation();
    const params = new URLSearchParams(location.search || "");
    const formulaId = params.get("formula");
    const cmapName = params.get("cmap");
    const rawParamValues = ["a", "b", "c", "d"].map((key) => Number.parseFloat(params.get(key) || ""));
    const iterations = Number.parseInt(params.get("iters") || "", 10);
    const burn = Number.parseInt(params.get("burn") || "", 10);
    const scaleMode = params.get("scale") || "fixed";
    const view = [
      Number.parseFloat(params.get("offsetX") || "0"),
      Number.parseFloat(params.get("offsetY") || "0"),
      Number.parseFloat(params.get("zoom") || "1"),
    ];
    const seed = {
      x: Number.parseFloat(params.get("seedX") || "0"),
      y: Number.parseFloat(params.get("seedY") || "0"),
    };

    if (!formulaId || !cmapName) {
      return false;
    }
    if (rawParamValues.some((value) => !Number.isFinite(value))) {
      return false;
    }
    if (!Number.isFinite(iterations) || iterations < 1) {
      return false;
    }
    if (!Number.isFinite(burn) || burn < 0) {
      return false;
    }
    if (view.some((value) => !Number.isFinite(value)) || view[2] <= 0) {
      return false;
    }
    if (!Number.isFinite(seed.x) || !Number.isFinite(seed.y)) {
      return false;
    }

    return applySharedState({
      formulaId,
      cmapName,
      params: rawParamValues,
      iterations,
      burn,
      seed,
      scaleMode,
      view,
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
        burn: null,
        seed: null,
        scaleMode: "fixed",
        view: vValues,
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
