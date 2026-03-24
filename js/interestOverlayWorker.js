import { VARIANTS } from "./formulas.js";

const formulaStepById = new Map(VARIANTS.map((formula) => [formula.id, formula.step]));
const STEP2_BURN_IN = 64;
const STEP2_RETAINED_SAMPLES = 192;
const STEP2_GRID_SIZE = 8;
const STEP2_TOTAL_BINS = STEP2_GRID_SIZE * STEP2_GRID_SIZE;
const STEP2_DEGENERATE_EPSILON = 1e-9;

let activeJobId = 0;
let activeScanKey = null;

function isActiveJob(jobId, scanKey) {
  return activeJobId === jobId && activeScanKey === scanKey;
}

function sampleAxisValue(minValue, maxValue, index, count) {
  const t = count > 1 ? index / (count - 1) : 0.5;
  return minValue + (maxValue - minValue) * t;
}

function createBaseParams(baseParams) {
  return {
    a: Number(baseParams?.a) || 0,
    b: Number(baseParams?.b) || 0,
    c: Number(baseParams?.c) || 0,
    d: Number(baseParams?.d) || 0,
  };
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

function classifyCellStep1({ step, cellParams, sampleIterations, minExponent, d0, maxDistance, shouldRescale }) {
  const epsilon = 1e-12;
  const minValidSteps = Math.max(4, Math.floor(sampleIterations * 0.1));
  const earlyCheckStart = Math.max(minValidSteps, Math.floor(sampleIterations * 0.2));
  const earlyAcceptMargin = 0.02;
  const earlyRejectMargin = 0.02;

  let x1 = 0;
  let y1 = 0;
  let x2 = d0;
  let y2 = 0;

  let sumLogRatio = 0;
  let validSteps = 0;
  let previousDistance = d0;
  let minObservedLog = Number.POSITIVE_INFINITY;
  let maxObservedLog = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < sampleIterations; i += 1) {
    [x1, y1] = step(x1, y1, cellParams.a, cellParams.b, cellParams.c, cellParams.d);
    [x2, y2] = step(x2, y2, cellParams.a, cellParams.b, cellParams.c, cellParams.d);

    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      break;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const d1Raw = Math.hypot(dx, dy);
    if (!Number.isFinite(d1Raw)) {
      continue;
    }

    const dPrev = Math.max(previousDistance, epsilon);
    const dNext = Math.max(Math.min(d1Raw, maxDistance), epsilon);
    const ratio = dNext / dPrev;
    if (!Number.isFinite(ratio) || ratio <= 0) {
      continue;
    }

    const logRatio = Math.log(Math.max(ratio, epsilon));
    if (!Number.isFinite(logRatio)) {
      continue;
    }

    sumLogRatio += logRatio;
    validSteps += 1;
    if (logRatio < minObservedLog) minObservedLog = logRatio;
    if (logRatio > maxObservedLog) maxObservedLog = logRatio;

    if (shouldRescale) {
      const scale = d0 / Math.max(d1Raw, epsilon);
      x2 = x1 + dx * scale;
      y2 = y1 + dy * scale;
      previousDistance = d0;
    } else {
      previousDistance = dNext;
    }

    // Conservative step-1 early exit: only decide early after enough evidence and
    // only when even pessimistic/optimistic projections remain clearly separated.
    if (validSteps >= minValidSteps && i + 1 >= earlyCheckStart) {
      const remaining = sampleIterations - (i + 1);
      const projectedTotalSteps = validSteps + remaining;
      const projectedMinAverage = (sumLogRatio + remaining * minObservedLog) / Math.max(1, projectedTotalSteps);
      const projectedMaxAverage = (sumLogRatio + remaining * maxObservedLog) / Math.max(1, projectedTotalSteps);
      if (projectedMaxAverage < minExponent - earlyRejectMargin) {
        return { passesStep1: false };
      }
      if (projectedMinAverage > minExponent + earlyAcceptMargin) {
        return { passesStep1: true };
      }
    }
  }

  if (validSteps < minValidSteps) {
    return { passesStep1: false };
  }

  return { passesStep1: (sumLogRatio / validSteps) >= minExponent };
}

function postRowUpdate({ jobId, scanKey, row, mediumCells, highInterestCells, percent }) {
  if (!isActiveJob(jobId, scanKey)) {
    return;
  }

  self.postMessage({
    type: "row-interest-update",
    jobId,
    scanKey,
    row,
    mediumCells,
    highInterestCells,
    percent,
  });
}

function runCombinedInterestPass({ formulaId, baseParams, plane, gridCols, gridRows, iterations, lyapunov, step2Threshold, jobId, scanKey }) {
  const step = formulaStepById.get(formulaId);
  if (!step || !plane) {
    return { gridCols: 0, gridRows: 0, mediumCells: [], highInterestCells: [] };
  }

  const safeGridCols = Math.max(1, Math.round(Number(gridCols) || 25));
  const safeGridRows = Math.max(1, Math.round(Number(gridRows) || 25));
  const sampleIterations = Math.max(1, Math.round(Number(iterations) || 1200));

  const d0Raw = Number(lyapunov?.delta0);
  const d0 = Number.isFinite(d0Raw) && d0Raw > 0 ? d0Raw : 1e-6;
  const minExponent = Number(lyapunov?.minExponent) || 0;
  const maxDistanceRaw = Number(lyapunov?.maxDistance);
  const maxDistance = Number.isFinite(maxDistanceRaw) && maxDistanceRaw > 0 ? maxDistanceRaw : 1e6;
  const shouldRescale = Boolean(lyapunov?.rescale);
  const safeBase = createBaseParams(baseParams);

  const mediumCells = [];
  const highInterestCells = [];

  const [xMin, xMax] = plane.axisXRange || [safeBase[plane.axisXParam], safeBase[plane.axisXParam]];
  const [yMin, yMax] = plane.axisYRange || [safeBase[plane.axisYParam], safeBase[plane.axisYParam]];
  const [axisMin, axisMax] = plane.axisRange || [safeBase[plane.axisParam], safeBase[plane.axisParam]];

  for (let row = 0; row < safeGridRows; row += 1) {
    if (!isActiveJob(jobId, scanKey)) {
      break;
    }

    const rowMediumCells = [];
    const rowHighInterestCells = [];

    for (let col = 0; col < safeGridCols; col += 1) {
      const cellIndex = row * safeGridCols + col;
      const cellParams = { ...safeBase };

      if (plane.mode === "one_axis") {
        cellParams[plane.axisParam] = sampleAxisValue(axisMin, axisMax, col, safeGridCols);
      } else {
        cellParams[plane.axisXParam] = sampleAxisValue(xMin, xMax, col, safeGridCols);
        cellParams[plane.axisYParam] = sampleAxisValue(yMax, yMin, row, safeGridRows);
      }

      const step1Result = classifyCellStep1({
        step,
        cellParams,
        sampleIterations,
        minExponent,
        d0,
        maxDistance,
        shouldRescale,
      });

      // Combined flow: step 2 runs immediately in the same row pass, but only for
      // cells that pass the unchanged step-1 Lyapunov gate.
      if (!step1Result.passesStep1) {
        continue;
      }

      rowMediumCells.push(cellIndex);
      mediumCells.push(cellIndex);

      const score = computeHighInterestScore(step, cellParams);
      if (Number.isFinite(score) && score >= step2Threshold) {
        rowHighInterestCells.push(cellIndex);
        highInterestCells.push(cellIndex);
      }
    }

    const percent = Math.min(99, Math.floor(((row + 1) / Math.max(1, safeGridRows)) * 100));
    // Progressive updates are row-batched to reduce worker/main-thread chatter.
    postRowUpdate({
      jobId,
      scanKey,
      row,
      mediumCells: rowMediumCells,
      highInterestCells: rowHighInterestCells,
      percent,
    });
  }

  return {
    gridCols: safeGridCols,
    gridRows: safeGridRows,
    mediumCells,
    highInterestCells,
  };
}

self.onmessage = (event) => {
  const message = event?.data || {};
  if (message.type !== "calculate") {
    return;
  }

  activeJobId = Number(message.jobId) || 0;
  activeScanKey = message.scanKey || null;

  try {
    const step2ThresholdRaw = Number(message.step2Threshold);
    const step2Threshold = Number.isFinite(step2ThresholdRaw) ? step2ThresholdRaw : 0.22;

    const scanResult = runCombinedInterestPass({
      formulaId: message.formulaId,
      baseParams: message.baseParams,
      plane: message.plane,
      gridCols: message.gridCols,
      gridRows: message.gridRows,
      iterations: message.iterations,
      lyapunov: message.lyapunov,
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
      scanResult,
    });
  } catch (error) {
    console.error("Interest overlay worker calculation failed.", error);
    throw error;
  }
};
