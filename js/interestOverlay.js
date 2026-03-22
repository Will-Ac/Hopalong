export function initInterestOverlay({
  classifyInterestGridLyapunov,
  clamp,
  getAppData,
  getCanvasSize,
  getCurrentFormulaId,
  getDerivedParams,
  getInterestGridLayout,
  getInterestPlaneConfig,
  getLastRenderMeta,
  getOverlayContext,
  getOverlayCanvas,
  hasAnyManualTargets,
  isHighResExportInProgress,
  normalizeInterestOverlayOpacity,
  overlayToggleBtn,
  performanceObject = performance,
  redrawOverlayCanvas,
  shouldShowManualOverlay,
  showToast,
  windowObject = window,
  interestConfig,
}) {
  let interestOverlayScanCache = null;
  let interestOverlayCalcInProgress = false;
  let interestOverlayCalcProgressPercent = 0;
  let interestOverlayShowProgressToast = false;
  let interestOverlayLastProgressToastPercent = -1;
  let interestOverlayRecalcTimer = null;
  let interestOverlayPendingPlan = null;
  let interestOverlayComputeSeq = 0;
  let interestOverlayActiveJobSeq = 0;

  function clearOverlayCanvas(targetCanvas, targetCtx) {
    if (!targetCanvas || !targetCtx) {
      return;
    }
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  }

  function buildInterestOverlayScanKey({ formulaId, planeConfig, baseParams, lyapunovConfig, gridCols, gridRows, scanIterations }) {
    const fixedParamKeys = ["a", "b", "c", "d"].filter((key) => {
      if (planeConfig.mode === "two_axis") {
        return key !== planeConfig.axisXParam && key !== planeConfig.axisYParam;
      }
      return key !== planeConfig.axisParam;
    });

    const fixedParams = Object.fromEntries(fixedParamKeys.map((key) => [key, Number(baseParams[key]) || 0]));

    return JSON.stringify({
      formulaId,
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
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
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

    const view = meta?.view || getCanvasSize();
    const gridLayout = getInterestGridLayout(view, appData.defaults.interestGridSize);
    const gridCols = gridLayout.cols;
    const gridRows = gridLayout.rows;
    const scanIterations = Math.round(clamp(Number(appData.defaults.interestScanIterations), interestConfig.scanIterationsMin, interestConfig.scanIterationsMax));
    const lyapunovConfig = {
      minExponent: clamp(Number(appData.defaults.interestLyapunovMinExponent), interestConfig.lyapunovMinExponentMin, interestConfig.lyapunovMinExponentMax),
      delta0: clamp(Number(appData.defaults.interestLyapunovDelta0), interestConfig.lyapunovDelta0Min, interestConfig.lyapunovDelta0Max),
      rescale: Boolean(appData.defaults.interestLyapunovRescale),
      maxDistance: clamp(Number(appData.defaults.interestLyapunovMaxDistance), interestConfig.lyapunovMaxDistanceMin, interestConfig.lyapunovMaxDistanceMax),
    };
    const baseParams = getDerivedParams();
    const scanKey = buildInterestOverlayScanKey({
      formulaId: currentFormulaId,
      planeConfig,
      baseParams,
      lyapunovConfig,
      gridCols,
      gridRows,
      scanIterations,
    });

    return { planeConfig, gridLayout, gridCols, gridRows, scanIterations, lyapunovConfig, baseParams, scanKey, formulaId: currentFormulaId };
  }

  function shouldShowInterestOverlay() {
    const appData = getAppData();
    return Boolean(appData?.defaults?.interestOverlayEnabled) && shouldShowManualOverlay() && hasAnyManualTargets();
  }

  function scheduleRecalc({ meta = null, immediate = false, showProgress = false } = {}) {
    if (isHighResExportInProgress()) {
      return;
    }

    const plan = getInterestOverlayScanPlan(meta);
    if (!plan) {
      interestOverlayPendingPlan = null;
      if (interestOverlayRecalcTimer) {
        windowObject.clearTimeout(interestOverlayRecalcTimer);
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
      windowObject.clearTimeout(interestOverlayRecalcTimer);
      interestOverlayRecalcTimer = null;
    }

    const delayMs = immediate ? 0 : 220;
    interestOverlayRecalcTimer = windowObject.setTimeout(() => {
      interestOverlayRecalcTimer = null;
      void runRecalc();
    }, delayMs);
  }

  async function runRecalc() {
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
      await new Promise((resolve) => windowObject.setTimeout(resolve, 0));

      const scanResult = classifyInterestGridLyapunov({
        formulaId: plan.formulaId,
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
          computedAt: performanceObject.now(),
          gridCols: plan.gridCols,
          gridRows: plan.gridRows,
        };
        redrawOverlayCanvas();
      }
    } finally {
      interestOverlayCalcInProgress = false;
      if (interestOverlayShowProgressToast) {
        showToast("Interest overlay calc 100%");
        interestOverlayShowProgressToast = false;
      }

      if (interestOverlayPendingPlan && interestOverlayScanCache?.scanKey !== interestOverlayPendingPlan.scanKey) {
        scheduleRecalc({ immediate: true, showProgress: true });
      }
    }
  }

  function drawOverlay(meta, targetCtx) {
    const appData = getAppData();
    if (!meta || !targetCtx || !shouldShowInterestOverlay() || !Boolean(appData?.defaults?.interestLyapunovEnabled)) {
      return;
    }

    const plan = getInterestOverlayScanPlan(meta);
    if (!plan) {
      return;
    }

    if (!interestOverlayScanCache || interestOverlayScanCache.scanKey !== plan.scanKey) {
      return;
    }

    const scanResult = interestOverlayScanCache?.scanResult;
    if (!scanResult || scanResult.gridCols !== plan.gridCols || scanResult.gridRows !== plan.gridRows || !Array.isArray(scanResult.highCells) || scanResult.highCells.length === 0) {
      return;
    }

    const { cellSize, offsetX, offsetY } = plan.gridLayout;
    const overlayOpacity = normalizeInterestOverlayOpacity(appData.defaults.interestOverlayOpacity);

    targetCtx.save();
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.fillStyle = `rgba(120, 200, 255, ${overlayOpacity})`;
    for (const cellIndex of scanResult.highCells) {
      const col = cellIndex % plan.gridCols;
      const row = Math.floor(cellIndex / plan.gridCols);
      const left = Math.round(offsetX + col * cellSize);
      const right = Math.round(offsetX + (col + 1) * cellSize);
      const top = Math.round(offsetY + row * cellSize);
      const bottom = Math.round(offsetY + (row + 1) * cellSize);
      targetCtx.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
    }

    targetCtx.restore();
  }

  function redrawOverlay(meta = getLastRenderMeta()) {
    const overlayCanvas = getOverlayCanvas();
    const overlayCtx = getOverlayContext();
    clearOverlayCanvas(overlayCanvas, overlayCtx);
    if (!meta || !overlayCtx) {
      return;
    }
    drawOverlay(meta, overlayCtx);
  }

  function syncToggleUi() {
    const enabled = Boolean(getAppData()?.defaults?.interestOverlayEnabled);
    const hasManualTargets = hasAnyManualTargets();
    overlayToggleBtn?.classList.toggle("is-disabled", !hasManualTargets);
    overlayToggleBtn?.classList.toggle("is-active", enabled && hasManualTargets);
    overlayToggleBtn?.setAttribute("aria-pressed", enabled && hasManualTargets ? "true" : "false");
  }

  function enableProgressToast() {
    interestOverlayShowProgressToast = true;
    interestOverlayLastProgressToastPercent = -1;
  }

  return {
    drawOverlay,
    redrawOverlay,
    scheduleRecalc,
    shouldShowInterestOverlay,
    syncToggleUi,
    enableProgressToast,
    isCalcInProgress: () => interestOverlayCalcInProgress,
    getCalcProgressPercent: () => interestOverlayCalcProgressPercent,
  };
}
