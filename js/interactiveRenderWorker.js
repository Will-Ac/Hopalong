/* eslint-env worker */
import { setColorMapStopOverrides } from "./colormaps.js";
import { isRenderCancelledError, renderFrame } from "./renderer.js";

const densityCache = { entry: null };
let canvas;
let ctx;
let activeJob;

self.onmessage = async ({ data }) => {
  if (data.type === "cancel") {
    if (activeJob?.id === data.id) activeJob.cancelled = true;
    return;
  }

  const { id, width, height, options, paletteOverrides } = data;
  const job = { id, cancelled: false };
  activeJob = job;
  try {
    if (!canvas) {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
      if (!ctx) throw new Error("OffscreenCanvas 2D context unavailable");
    }
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    setColorMapStopOverrides(paletteOverrides);
    const meta = await renderFrame({
      ...options, ctx, canvas, densityCache,
      isCancelled: () => job.cancelled,
      onProgress: (percent, complete) => self.postMessage({ id, type: "progress", percent, complete }),
    });
    const bitmap = canvas.transferToImageBitmap();
    try {
      self.postMessage({ id, type: "frame", meta, bitmap }, [bitmap]);
    } catch (error) {
      bitmap.close();
      throw error;
    }
  } catch (error) {
    self.postMessage({ id, type: isRenderCancelledError(error) ? "cancelled" : "failed" });
  } finally {
    activeJob = null;
  }
};
