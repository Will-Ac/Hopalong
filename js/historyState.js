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

  function buildSharePayload() {
    const { formulaId, cmapName, params, iterations, view } = getShareState();
    const paramText = `${params.a},${params.b},${params.c},${params.d}`;
    const viewText = `${view.offsetX ?? 0},${view.offsetY ?? 0},${view.zoom ?? 1}`;
    const refreshToken = Date.now().toString(36);

    const pairs = [
      ["f", formulaId],
      ["c", cmapName],
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
    const location = getLocation();
    return `${location.origin}${location.pathname}#s=${buildSharePayload()}`;
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
        view: vValues,
      });
    } catch (error) {
      console.warn("Could not parse shared hash state.", error);
      return false;
    }
  }

  return {
    buildSharePayload,
    buildShareUrl,
    applySharedStateFromHash,
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
