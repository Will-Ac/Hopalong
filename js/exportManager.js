export function initExportManager({
  canvas,
  getCurrentFormulaId,
  getAppData,
  getLastRenderMeta,
  getLastFullRenderMeta,
  getRenderRevision,
  getFixedView,
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
  updateExportRenderProgressToast,
  buildShareUrl,
  overlayTextColor,
  qrQuietZoneModules,
}) {
  let exportCacheCanvas = null;
  let exportCacheCtx = null;
  let exportCacheMeta = null;
  let pendingShareFile = null;
  let pendingShareTitle = "";
  let highResExportInProgress = false;

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
    const isLandscape = orientationType ? orientationType.startsWith("landscape") : vw > vh;
    const screenW = Number(window.screen?.width) || 0;
    const screenH = Number(window.screen?.height) || 0;
    const hasUsableScreenSize = screenW > 0 && screenH > 0;
    const cssW = hasUsableScreenSize ? screenW : Math.max(1, vw);
    const cssH = hasUsableScreenSize ? screenH : Math.max(1, vh);
    const cssLong = Math.max(cssW, cssH);
    const cssShort = Math.max(1, Math.min(cssW, cssH));
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
      hasScreenSize: hasUsableScreenSize,
      debug: {
        orientationType,
        vw,
        vh,
        screenW,
        screenH,
        selectedSource: hasUsableScreenSize ? "screen" : "viewport",
        selectedLong: cssLong,
        selectedShort: cssShort,
        cssW: isLandscape ? cssLong : cssShort,
        cssH: isLandscape ? cssShort : cssLong,
        liveCanvasW: liveCanvas.width,
        liveCanvasH: liveCanvas.height,
      },
    };
  }

  function buildScreenshotOverlayLines() {
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
    const formula = appData.formulas.find((item) => item.id === currentFormulaId);
    const params = getDerivedParams();
    const iterValue = Math.round(clamp(appData.defaults.sliders.iters, sliderControls.iters.min, sliderControls.iters.max));
    return `${formula?.name || currentFormulaId} | ${appData.defaults.cmapName} | a ${formatNumberForUi(params.a, 4)} | b ${formatNumberForUi(params.b, 4)} | c ${formatNumberForUi(params.c, 4)} | d ${formatNumberForUi(params.d, 4)} | iter ${formatNumberForUi(iterValue, 0)}`;
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
    const totalModules = moduleCount + qrQuietZoneModules * 2;
    const canvasEl = document.createElement("canvas");
    canvasEl.width = sizePx;
    canvasEl.height = sizePx;
    const qrCtx = canvasEl.getContext("2d", { alpha: false });
    if (!qrCtx) {
      throw new Error("QR canvas context unavailable.");
    }

    qrCtx.fillStyle = "#000000";
    qrCtx.fillRect(0, 0, sizePx, sizePx);
    qrCtx.fillStyle = overlayTextColor;

    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (!qr.isDark(row, col)) {
          continue;
        }

        const x = Math.round(((col + qrQuietZoneModules) * sizePx) / totalModules);
        const y = Math.round(((row + qrQuietZoneModules) * sizePx) / totalModules);
        const nextX = Math.round(((col + qrQuietZoneModules + 1) * sizePx) / totalModules);
        const nextY = Math.round(((row + qrQuietZoneModules + 1) * sizePx) / totalModules);
        qrCtx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
      }
    }

    return canvasEl;
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
    targetCtx.fillStyle = overlayTextColor;
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

  function getExportWorldFromLiveMeta(exportWidth, exportHeight) {
    const sourceMeta = getLastRenderMeta() || getLastFullRenderMeta();
    if (!sourceMeta?.world || !sourceMeta?.view) {
      return null;
    }

    const liveView = sourceMeta.view;
    const liveWorld = sourceMeta.world;
    const liveSpanX = Math.max(liveWorld.maxX - liveWorld.minX, 1e-6);
    const liveSpanY = Math.max(liveWorld.maxY - liveWorld.minY, 1e-6);
    const liveWidth = Math.max(1, Number(liveView.width) || 1);
    const liveHeight = Math.max(1, Number(liveView.height) || 1);
    const worldPerPxX = liveSpanX / Math.max(1, liveWidth - 1);
    const worldPerPxY = liveSpanY / Math.max(1, liveHeight - 1);
    const exportSpanX = worldPerPxX * Math.max(1, exportWidth - 1);
    const exportSpanY = worldPerPxY * Math.max(1, exportHeight - 1);

    const centerX = Number.isFinite(liveWorld.centerX) ? liveWorld.centerX : (liveWorld.minX + liveWorld.maxX) * 0.5;
    const centerY = Number.isFinite(liveWorld.centerY) ? liveWorld.centerY : (liveWorld.minY + liveWorld.maxY) * 0.5;

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
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
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
      fixedView: getFixedView(),
      worldOverride: exportWorld,
      seed: getSeedForFormula(currentFormulaId),
      renderColoring: getRenderColoringOptions(),
      backgroundColor: hexToRgb(appData.defaults.backgroundColor || "#05070c"),
    });
  }

  async function refreshExportCacheFromCurrentFrame() {
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
    if (!canvas || !getLastRenderMeta() || !appData || !currentFormulaId) {
      return;
    }
    const { pxW, pxH } = getExportSizePx(canvas);
    const targetCanvas = ensureExportCacheCanvas(pxW, pxH);
    await renderCurrentFrameIntoExportCanvas(targetCanvas, exportCacheCtx);
    exportCacheMeta = {
      pxW,
      pxH,
      updatedAt: performance.now(),
      renderRevision: getRenderRevision(),
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
    const appData = getAppData();
    const currentFormulaId = getCurrentFormulaId();
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
        fixedView: getFixedView(),
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
    }
  }

  async function captureScreenshotAction(action, { openScreenshotMenu, onShareRetryStateChange } = {}) {
    try {
      if (action === "clean") {
        await captureCachedScreenshot(false);
        onShareRetryStateChange?.();
        return;
      }
      if (action === "overlay") {
        await captureCachedScreenshot(true);
        onShareRetryStateChange?.();
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
      onShareRetryStateChange?.();
      if (error?.message === "Share cancelled.") {
        showToast("Share cancelled.");
        return;
      }
      if (error?.message === "Share needs a fresh tap. Use 'Share prepared screenshot now'.") {
        openScreenshotMenu?.();
        showToast("Share needs one more tap. Use 'Share prepared screenshot now'.");
        return;
      }
      console.error(error);
      showToast(`Screenshot failed: ${error.message}`);
    }
  }

  async function retryPendingShare() {
    if (!pendingShareFile || !navigator.share) {
      return "missing";
    }

    try {
      await navigator.share({ files: [pendingShareFile], title: pendingShareTitle || pendingShareFile.name });
      pendingShareFile = null;
      pendingShareTitle = "";
      return "shared";
    } catch (error) {
      if (String(error?.name || "") === "AbortError") {
        return "cancelled";
      }
      console.error(error);
      return `error:${error.message}`;
    }
  }

  function syncCachedFrame(frameEntry, renderRevision) {
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

  return {
    captureScreenshotAction,
    ensureExportCacheCanvas,
    getExportContext: () => exportCacheCtx,
    getExportSizePx,
    hasPendingShare: () => Boolean(pendingShareFile),
    isHighResExportInProgress: () => highResExportInProgress,
    markExportCacheRendered: (width, height, renderRevision) => {
      exportCacheMeta = {
        pxW: width,
        pxH: height,
        updatedAt: performance.now(),
        renderRevision,
      };
    },
    retryPendingShare,
    syncCachedFrame,
  };
}
