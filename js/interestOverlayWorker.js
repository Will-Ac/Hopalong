import { classifyInterestGridLyapunov } from "./renderer.js";

let activeJobId = 0;
let activeScanKey = null;

self.onmessage = (event) => {
  const message = event?.data || {};
  if (message.type !== "calculate") {
    return;
  }

  activeJobId = Number(message.jobId) || 0;
  activeScanKey = message.scanKey || null;

  try {
    const scanResult = classifyInterestGridLyapunov({
      formulaId: message.formulaId,
      baseParams: message.baseParams,
      plane: message.plane,
      gridCols: message.gridCols,
      gridRows: message.gridRows,
      iterations: message.iterations,
      lyapunov: message.lyapunov,
      step2: message.step2,
      onProgress: (percent) => {
        if (activeJobId !== message.jobId || activeScanKey !== message.scanKey) {
          return;
        }
        self.postMessage({
          type: "progress",
          jobId: message.jobId,
          scanKey: message.scanKey,
          percent,
        });
      },
      onMediumCells: (partialScanResult) => {
        if (activeJobId !== message.jobId || activeScanKey !== message.scanKey) {
          return;
        }
        self.postMessage({
          type: "medium-result",
          jobId: message.jobId,
          scanKey: message.scanKey,
          scanResult: partialScanResult,
        });
      },
      onHighInterestBatch: (partialScanResult) => {
        if (activeJobId !== message.jobId || activeScanKey !== message.scanKey) {
          return;
        }
        self.postMessage({
          type: "high-interest-batch",
          jobId: message.jobId,
          scanKey: message.scanKey,
          scanResult: partialScanResult,
        });
      },
    });

    if (activeJobId !== message.jobId || activeScanKey !== message.scanKey) {
      return;
    }

    self.postMessage({
      type: "result",
      jobId: message.jobId,
      scanKey: message.scanKey,
      scanResult,
    });
  } catch (error) {
    console.error("Interest overlay worker calculation failed.", error);
    throw error;
  }
};
