import { classifyInterestGridLyapunov } from "./renderer.js";
import { VARIANTS } from "./formulas.js";

const formulaStepById = new Map(VARIANTS.map((formula) => [formula.id, formula.step]));
const STEP2_BURN_IN = 64;
const STEP2_RETAINED_SAMPLES = 192;
const STEP2_GRID_SIZE = 8;
const STEP2_TOTAL_BINS = STEP2_GRID_SIZE * STEP2_GRID_SIZE;
const STEP2_DEGENERATE_EPSILON = 1e-9;
const STEP2_PROGRESS_START = 85;

let activeJobId = 0;
let activeScanKey = null;

function isActiveJob(jobId, scanKey) {
  return activeJobId === jobId && activeScanKey === scanKey;
}

function sampleAxisValue(minValue, maxValue, index, count) {
  const t = count > 1 ? index / (count - 1) : 0.5;
  return minValue + (maxValue - minValue) * t;
}

function getCellParams(baseParams, plane, gridCols, gridRows, cellIndex) {
  const cellParams = {
    a: Number(baseParams?.a) || 0,
    b: Number(baseParams?.b) || 0,
    c: Number(baseParams?.c) || 0,
    d: Number(baseParams?.d) || 0,
  };

  if (plane.mode === "one_axis") {
    const [axisMin, axisMax] = plane.axisRange || [cellParams[plane.axisParam], cellParams[plane.axisParam]];
    const col = cellIndex % gridCols;
    cellParams[plane.axisParam] = sampleAxisValue(axisMin, axisMax, col, gridCols);
    return cellParams;
  }

  const [xMin, xMax] = plane.axisXRange || [cellParams[plane.axisXParam], cellParams[plane.axisXParam]];
  const [yMin, yMax] = plane.axisYRange || [cellParams[plane.axisYParam], cellParams[plane.axisYParam]];
  const col = cellIndex % gridCols;
  const row = Math.floor(cellIndex / gridCols);
  cellParams[plane.axisXParam] = sampleAxisValue(xMin, xMax, col, gridCols);
  cellParams[plane.axisYParam] = sampleAxisValue(yMax, yMin, row, gridRows);
  return cellParams;
}

function computeHighInterestScore(step, cellParams) {
  const retainedX = new Float64Array(STEP2_RETAINED_SAMPLES);
  const retainedY = new Float64Array(STEP2_RETAINED_SAMPLES);
  let x = 0;
  let y = 0;

  for (let i = 0; i < STEP2_BURN_IN; i += 1) {
    [x, y] = step(x, y, cellParams.a, cellParams.b, cellParams.c, cellParams.d);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return -1;
    }
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let sumX = 0;
  let sumY = 0;

  for (let i = 0; i < STEP2_RETAINED_SAMPLES; i += 1) {
    [x, y] = step(x, y, cellParams.a, cellParams.b, cellParams.c, cellParams.d);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return -1;
    }

    retainedX[i] = x;
    retainedY[i] = y;
    sumX += x;
    sumY += y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (!Number.isFinite(spanX) || !Number.isFinite(spanY) || spanX <= STEP2_DEGENERATE_EPSILON || spanY <= STEP2_DEGENERATE_EPSILON) {
    return -1;
  }

  const meanX = sumX / STEP2_RETAINED_SAMPLES;
  const meanY = sumY / STEP2_RETAINED_SAMPLES;
  const occupancy = new Uint8Array(STEP2_TOTAL_BINS);
  let occupiedBins = 0;
  let covXX = 0;
  let covXY = 0;
  let covYY = 0;

  for (let i = 0; i < STEP2_RETAINED_SAMPLES; i += 1) {
    const sampleX = retainedX[i];
    const sampleY = retainedY[i];
    const u = (sampleX - minX) / spanX;
    const v = (sampleY - minY) / spanY;
    const gridX = Math.min(STEP2_GRID_SIZE - 1, Math.max(0, Math.floor(u * STEP2_GRID_SIZE)));
    const gridY = Math.min(STEP2_GRID_SIZE - 1, Math.max(0, Math.floor(v * STEP2_GRID_SIZE)));
    const binIndex = gridY * STEP2_GRID_SIZE + gridX;
    if (occupancy[binIndex] === 0) {
      occupancy[binIndex] = 1;
      occupiedBins += 1;
    }

    const dx = sampleX - meanX;
    const dy = sampleY - meanY;
    covXX += dx * dx;
    covXY += dx * dy;
    covYY += dy * dy;
  }

  const divisor = Math.max(1, STEP2_RETAINED_SAMPLES - 1);
  covXX /= divisor;
  covXY /= divisor;
  covYY /= divisor;

  const trace = covXX + covYY;
  const determinant = covXX * covYY - covXY * covXY;
  const discriminant = Math.max(0, trace * trace - 4 * determinant);
  const sqrtDiscriminant = Math.sqrt(discriminant);
  const lambda1 = Math.max((trace + sqrtDiscriminant) * 0.5, 0);
  const lambda2 = Math.max((trace - sqrtDiscriminant) * 0.5, 0);
  if (lambda1 <= STEP2_DEGENERATE_EPSILON) {
    return -1;
  }

  const occupancyRatio = occupiedBins / STEP2_TOTAL_BINS;
  const widthRatio = Math.max(0, Math.min(1, lambda2 / lambda1));
  return occupancyRatio * Math.sqrt(widthRatio);
}

function emitStep2Progress(processed, total, jobId, scanKey) {
  if (total <= 0 || !isActiveJob(jobId, scanKey)) {
    return;
  }

  const fraction = processed / total;
  const percent = Math.max(STEP2_PROGRESS_START, Math.min(99, Math.floor(STEP2_PROGRESS_START + fraction * (100 - STEP2_PROGRESS_START))));
  self.postMessage({
    type: "progress",
    jobId,
    scanKey,
    percent,
  });
}

function emitHighInterestBatch(batch, jobId, scanKey) {
  if (!batch.length || !isActiveJob(jobId, scanKey)) {
    return;
  }

  self.postMessage({
    type: "high-interest-batch",
    jobId,
    scanKey,
    highInterestCells: batch,
  });
}

function refineHighInterestCells({ scanResult, formulaId, baseParams, plane, gridCols, gridRows, step2Threshold, jobId, scanKey }) {
  const step = formulaStepById.get(formulaId);
  const mediumCells = Array.isArray(scanResult?.highCells) ? scanResult.highCells : [];
  if (!step || !plane || mediumCells.length === 0) {
    return [];
  }

  const highInterestCells = [];
  let batch = [];

  for (let index = 0; index < mediumCells.length; index += 1) {
    if (!isActiveJob(jobId, scanKey)) {
      break;
    }

    const cellIndex = mediumCells[index];
    const cellParams = getCellParams(baseParams, plane, gridCols, gridRows, cellIndex);
    // Step 2 only refines cells that already passed the unchanged Lyapunov gate.
    const score = computeHighInterestScore(step, cellParams);
    if (Number.isFinite(score) && score >= step2Threshold) {
      highInterestCells.push(cellIndex);
      batch.push(cellIndex);
      if (batch.length >= 64) {
        emitHighInterestBatch(batch, jobId, scanKey);
        batch = [];
      }
    }

    emitStep2Progress(index + 1, mediumCells.length, jobId, scanKey);
  }

  emitHighInterestBatch(batch, jobId, scanKey);
  return highInterestCells;
}

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
      onProgress: (percent) => {
        if (!isActiveJob(message.jobId, message.scanKey)) {
          return;
        }
        self.postMessage({
          type: "progress",
          jobId: message.jobId,
          scanKey: message.scanKey,
          percent,
        });
      },
    });

    if (!isActiveJob(message.jobId, message.scanKey)) {
      return;
    }

    self.postMessage({
      type: "medium-interest-ready",
      jobId: message.jobId,
      scanKey: message.scanKey,
      scanResult: {
        ...scanResult,
        mediumCells: Array.isArray(scanResult?.highCells) ? scanResult.highCells : [],
        highInterestCells: [],
      },
    });

    const step2ThresholdRaw = Number(message.step2Threshold);
    const step2Threshold = Number.isFinite(step2ThresholdRaw) ? step2ThresholdRaw : 0.22;
    const highInterestCells = refineHighInterestCells({
      scanResult,
      formulaId: message.formulaId,
      baseParams: message.baseParams,
      plane: message.plane,
      gridCols: message.gridCols,
      gridRows: message.gridRows,
      step2Threshold,
      jobId: message.jobId,
      scanKey: message.scanKey,
    });

    if (!isActiveJob(message.jobId, message.scanKey)) {
      return;
    }

    self.postMessage({
      type: "result",
      jobId: message.jobId,
      scanKey: message.scanKey,
      scanResult: {
        ...scanResult,
        mediumCells: Array.isArray(scanResult?.highCells) ? scanResult.highCells : [],
        highInterestCells,
      },
    });
  } catch (error) {
    console.error("Interest overlay worker calculation failed.", error);
    throw error;
  }
};
