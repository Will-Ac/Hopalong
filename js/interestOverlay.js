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
  let interestOverlayActiveScanKey = null;
  let interestOverlayWorker = null;
  let interestOverlayWorkerAvailable = true;

  function clearOverlayCanvas(targetCanvas, targetCtx) {
    if (!targetCanvas || !targetCtx) {
      return;
    }
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  }

  function buildInterestOverlayScanKey({ formulaId, planeConfig, baseParams, lyapunovConfig, gridCols, gridRows, scanIterations, step2Threshold }) {
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
      step2Threshold,
      fixedParams,
    });
  }

  function getInterestOverlayScanPlan(meta = null) {
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
    if (!appData || !currentFormulaId) {
      return null;
    }
    if (!appData.defaults.interestOverlayEnabled || !appData.defaults.interestLyapunovEnabled || !hasAnyManualTargets()) {
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
    const step2Threshold = clamp(Number(appData.defaults.interestHighThreshold), interestConfig.step2ThresholdMin, interestConfig.step2ThresholdMax);
    const scanKey = buildInterestOverlayScanKey({
      formulaId: currentFormulaId,
      planeConfig,
      baseParams,
      lyapunovConfig,
      step2Threshold,
      gridCols,
      gridRows,
      scanIterations,
    });

    return { planeConfig, gridLayout, gridCols, gridRows, scanIterations, lyapunovConfig, step2Threshold, baseParams, scanKey, formulaId: currentFormulaId };
  }

  function shouldShowInterestOverlay() {
    const appData = getAppData();
    return Boolean(appData?.defaults?.interestOverlayEnabled) && shouldShowManualOverlay() && hasAnyManualTargets();
  }

  function createWorkerJobPayload(plan, jobId) {
    return {
      type: "calculate",
      jobId,
      scanKey: plan.scanKey,
      formulaId: plan.formulaId,
      baseParams: plan.baseParams,
      plane: plan.planeConfig,
      gridCols: plan.gridCols,
      gridRows: plan.gridRows,
      iterations: plan.scanIterations,
      lyapunov: plan.lyapunovConfig,
      step2Threshold: plan.step2Threshold,
    };
  }

  function handleCalcProgress(percent) {
    const nextPercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
    interestOverlayCalcProgressPercent = nextPercent;
    if (interestOverlayShowProgressToast && nextPercent !== interestOverlayLastProgressToastPercent) {
      showToast(`Interest overlay calc ${nextPercent}%`);
      interestOverlayLastProgressToastPercent = nextPercent;
    }
  }

  function finalizeCalcCycle() {
    interestOverlayCalcInProgress = false;
    interestOverlayActiveScanKey = null;
    if (interestOverlayShowProgressToast) {
      showToast("Interest overlay calc 100%");
      interestOverlayShowProgressToast = false;
    }

    if (interestOverlayPendingPlan && interestOverlayScanCache?.scanKey !== interestOverlayPendingPlan.scanKey) {
      scheduleRecalc({ immediate: true, showProgress: true });
    }
  }

  function resetProgressiveScanCache(plan) {
    if (!plan) {
      return;
    }

    // Clear previous overlay results before progressive row updates for a new scan.
    interestOverlayScanCache = {
      scanKey: plan.scanKey,
      scanResult: {
        gridCols: plan.gridCols,
        gridRows: plan.gridRows,
        mediumCells: [],
        highCells: [],
        highInterestCells: [],
      },
      computedAt: performanceObject.now(),
      gridCols: plan.gridCols,
      gridRows: plan.gridRows,
    };
    redrawOverlayCanvas();
  }

  function applyRowInterestUpdate(plan, jobSeq, rowMediumCells, rowHighInterestCells) {
    if (jobSeq !== interestOverlayActiveJobSeq) {
      return;
    }
    if (interestOverlayPendingPlan?.scanKey !== plan.scanKey) {
      return;
    }

    const mediumCellsForRow = Array.isArray(rowMediumCells) ? rowMediumCells : [];
    const highInterestCellsForRow = Array.isArray(rowHighInterestCells) ? rowHighInterestCells : [];
    const existingCache = interestOverlayScanCache;
    const mediumCells = Array.isArray(existingCache?.scanResult?.mediumCells)
      ? existingCache.scanResult.mediumCells.slice()
      : (Array.isArray(existingCache?.scanResult?.highCells) ? existingCache.scanResult.highCells.slice() : []);
    const highInterestCells = Array.isArray(existingCache?.scanResult?.highInterestCells)
      ? existingCache.scanResult.highInterestCells.slice()
      : [];

    if (mediumCellsForRow.length === 0 && highInterestCellsForRow.length === 0) {
      return;
    }

    // Row-wise progressive apply: append this completed row's medium/high cells only.
    if (mediumCellsForRow.length > 0) {
      mediumCells.push(...mediumCellsForRow);
    }
    if (highInterestCellsForRow.length > 0) {
      highInterestCells.push(...highInterestCellsForRow);
    }

    interestOverlayScanCache = {
      scanKey: plan.scanKey,
      scanResult: {
        ...(existingCache?.scanResult || {}),
        gridCols: plan.gridCols,
        gridRows: plan.gridRows,
        mediumCells,
        highCells: mediumCells.slice(),
        highInterestCells,
      },
      computedAt: performanceObject.now(),
      gridCols: plan.gridCols,
      gridRows: plan.gridRows,
    };
    redrawOverlayCanvas();
  }

  function applyCompletedScanResult(plan, jobSeq, scanResult) {
    if (jobSeq !== interestOverlayActiveJobSeq) {
      return;
    }
    if (interestOverlayPendingPlan?.scanKey !== plan.scanKey) {
      return;
    }

    const mediumCells = Array.isArray(scanResult?.mediumCells)
      ? scanResult.mediumCells
      : (Array.isArray(scanResult?.highCells) ? scanResult.highCells : []);
    const highInterestCells = Array.isArray(scanResult?.highInterestCells) ? scanResult.highInterestCells : [];

    interestOverlayScanCache = {
      scanKey: plan.scanKey,
      scanResult: {
        ...scanResult,
        mediumCells: mediumCells.slice(),
        highCells: mediumCells.slice(),
        highInterestCells: highInterestCells.slice(),
      },
      computedAt: performanceObject.now(),
      gridCols: plan.gridCols,
      gridRows: plan.gridRows,
    };
    redrawOverlayCanvas();
  }

  function ensureWorker() {
    if (!interestOverlayWorkerAvailable) {
      return null;
    }
    if (interestOverlayWorker) {
      return interestOverlayWorker;
    }

    try {
      interestOverlayWorker = new Worker(new URL("./interestOverlayWorker.js", import.meta.url), { type: "module" });
      interestOverlayWorker.onmessage = (event) => {
        const message = event?.data || {};
        if (message.type === "progress") {
          if (message.jobId === interestOverlayActiveJobSeq && message.scanKey === interestOverlayActiveScanKey) {
            handleCalcProgress(message.percent);
          }
          return;
        }

        if (message.type === "row-interest-update") {
          const plan = interestOverlayPendingPlan;
          if (!interestOverlayCalcInProgress) {
            return;
          }
          if (message.jobId !== interestOverlayActiveJobSeq || message.scanKey !== interestOverlayActiveScanKey) {
            return;
          }
          if (!plan || plan.scanKey !== message.scanKey) {
            return;
          }
          applyRowInterestUpdate(plan, message.jobId, message.mediumCells, message.highInterestCells);
          if (Number.isFinite(message.percent)) {
            handleCalcProgress(message.percent);
          }
          return;
        }

        if (message.type === "result") {
          const plan = interestOverlayPendingPlan;
          try {
            if (!interestOverlayCalcInProgress) {
              return;
            }
            if (message.jobId !== interestOverlayActiveJobSeq || message.scanKey !== interestOverlayActiveScanKey) {
              return;
            }
            if (!plan || plan.scanKey !== message.scanKey) {
              return;
            }
            applyCompletedScanResult(plan, message.jobId, message.scanResult);
          } finally {
            if (message.jobId === interestOverlayActiveJobSeq) {
              finalizeCalcCycle();
            }
          }
        }
      };
      interestOverlayWorker.onerror = (error) => {
        console.error("Interest overlay worker failed.", error);
        if (interestOverlayWorker) {
          interestOverlayWorker.terminate();
          interestOverlayWorker = null;
        }
        interestOverlayWorkerAvailable = false;
        if (interestOverlayCalcInProgress) {
          finalizeCalcCycle();
        }
      };
    } catch (error) {
      interestOverlayWorkerAvailable = false;
      interestOverlayWorker = null;
      console.error("Failed to create interest overlay worker.", error);
    }

    return interestOverlayWorker;
  }

  function invalidateInFlightCalculation(nextPlan) {
    if (!interestOverlayCalcInProgress) {
      return;
    }
    if (!nextPlan || interestOverlayActiveScanKey === nextPlan.scanKey) {
      return;
    }
    if (interestOverlayWorker) {
      interestOverlayWorker.terminate();
      interestOverlayWorker = null;
    }
    interestOverlayActiveJobSeq = 0;
    interestOverlayActiveScanKey = null;
    interestOverlayCalcInProgress = false;
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

    const invalidatesActiveCalc = interestOverlayCalcInProgress && interestOverlayActiveScanKey && interestOverlayActiveScanKey !== plan.scanKey;
    interestOverlayPendingPlan = plan;
    if (showProgress) {
      interestOverlayShowProgressToast = true;
      interestOverlayLastProgressToastPercent = -1;
    }

    if (invalidatesActiveCalc) {
      invalidateInFlightCalculation(plan);
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
    interestOverlayActiveScanKey = plan.scanKey;
    interestOverlayCalcInProgress = true;
    interestOverlayCalcProgressPercent = 0;
    interestOverlayLastProgressToastPercent = -1;
    resetProgressiveScanCache(plan);

    const worker = ensureWorker();
    if (!worker) {
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
          onProgress: handleCalcProgress,
        });
        applyCompletedScanResult(plan, jobSeq, scanResult);
      } catch (error) {
        console.error("Interest overlay fallback calculation failed.", error);
      } finally {
        finalizeCalcCycle();
      }
      return;
    }

    try {
      await new Promise((resolve) => windowObject.setTimeout(resolve, 0));
      worker.postMessage(createWorkerJobPayload(plan, jobSeq));
    } catch (error) {
      console.error("Failed to dispatch interest overlay worker job.", error);
      finalizeCalcCycle();
    }
  }

  function drawOverlay(meta, targetCtx) {
    const appData = getAppData();
    if (!meta || !targetCtx || !shouldShowInterestOverlay() || !appData?.defaults?.interestLyapunovEnabled) {
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
    const mediumCells = Array.isArray(scanResult?.mediumCells)
      ? scanResult.mediumCells
      : (Array.isArray(scanResult?.highCells) ? scanResult.highCells : []);
    const highInterestCells = Array.isArray(scanResult?.highInterestCells) ? scanResult.highInterestCells : [];
    if (!scanResult || scanResult.gridCols !== plan.gridCols || scanResult.gridRows !== plan.gridRows || mediumCells.length === 0) {
      return;
    }

    const { cellSize, offsetX, offsetY } = plan.gridLayout;
    const overlayOpacity = normalizeInterestOverlayOpacity(appData.defaults.interestOverlayOpacity);

    targetCtx.save();
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.fillStyle = `rgba(120, 200, 255, ${overlayOpacity})`;
    for (const cellIndex of mediumCells) {
      const col = cellIndex % plan.gridCols;
      const row = Math.floor(cellIndex / plan.gridCols);
      const left = Math.round(offsetX + col * cellSize);
      const right = Math.round(offsetX + (col + 1) * cellSize);
      const top = Math.round(offsetY + row * cellSize);
      const bottom = Math.round(offsetY + (row + 1) * cellSize);
      targetCtx.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
    }

    if (highInterestCells.length > 0) {
      // Darker fill only upgrades cells that passed the worker-side refinement.
      targetCtx.fillStyle = `rgba(48, 110, 180, ${overlayOpacity})`;
      for (const cellIndex of highInterestCells) {
        const col = cellIndex % plan.gridCols;
        const row = Math.floor(cellIndex / plan.gridCols);
        const left = Math.round(offsetX + col * cellSize);
        const right = Math.round(offsetX + (col + 1) * cellSize);
        const top = Math.round(offsetY + row * cellSize);
        const bottom = Math.round(offsetY + (row + 1) * cellSize);
        targetCtx.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top));
      }
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
