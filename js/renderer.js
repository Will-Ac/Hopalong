import { sampleColorMap } from "./colormaps.js";
import { VARIANTS } from "./formulas.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mapNormalized(normalizedValue, min, max) {
  const t = clamp(normalizedValue / 100, 0, 1);
  return min + (max - min) * t;
}


function clamp01(value) {
  return clamp(value, 0, 1);
}

function blendRgb(base, top, amount) {
  const t = clamp01(amount);
  return [
    Math.round(base[0] + (top[0] - base[0]) * t),
    Math.round(base[1] + (top[1] - base[1]) * t),
    Math.round(base[2] + (top[2] - base[2]) * t),
  ];
}

function mapHitToT(hits, maxHits, mode, { logStrength, densityGamma }) {
  if (!Number.isFinite(hits) || hits <= 0 || !Number.isFinite(maxHits) || maxHits <= 0) {
    return 0;
  }

  const linear = clamp01(hits / maxHits);
  if (mode === "hit_density_log") {
    const k = Math.max(0.01, Number(logStrength) || 9);
    const numerator = Math.log1p(k * hits);
    const denominator = Math.log1p(k * maxHits);
    return clamp01(denominator > 0 ? numerator / denominator : linear);
  }

  if (mode === "hit_density_gamma") {
    const gamma = Math.max(0.05, Number(densityGamma) || 0.6);
    return clamp01(linear ** gamma);
  }

  return linear;
}

const LUT_SIZE = 2048;

const ESCAPE_ABS_BOUND = 1e6;

const formulaStepById = new Map(VARIANTS.map((formula) => [formula.id, formula.step]));


export function getParamsForFormula({ rangesForFormula, sliderDefaults }) {
  const fallbackRanges = {
    a: [-80, 80],
    b: [-20, 20],
    c: [-20, 20],
    d: [-20, 20],
  };

  const ranges = rangesForFormula || fallbackRanges;
  const readSlider = (key, fallbackKey) => {
    if (Number.isFinite(sliderDefaults?.[key])) return sliderDefaults[key];
    return sliderDefaults?.[fallbackKey];
  };
  return {
    a: mapNormalized(readSlider("a", "alpha"), ranges.a[0], ranges.a[1]),
    b: mapNormalized(readSlider("b", "beta"), ranges.b[0], ranges.b[1]),
    c: mapNormalized(readSlider("c", "delta"), ranges.c[0], ranges.c[1]),
    d: mapNormalized(readSlider("d", "gamma"), ranges.d[0], ranges.d[1]),
  };
}

export async function renderFrame({ ctx, canvas, formulaId, cmapName, params, iterations = 120000, burn = 120, scaleMode = "auto", fixedView = null, worldOverride = null, seed = null, renderColoring = {}, backgroundColor = [5, 7, 12], onProgress = null }) {
  const step = formulaStepById.get(formulaId);
  if (!step) {
    throw new Error(`Unknown formula id: ${formulaId}`);
  }

  const width = canvas.width;
  const height = canvas.height;
  const image = ctx.createImageData(width, height);
  const pixels = image.data;

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = backgroundColor[0];
    pixels[i + 1] = backgroundColor[1];
    pixels[i + 2] = backgroundColor[2];
    pixels[i + 3] = 255;
  }

  const renderMode = String(renderColoring?.mode || "iteration_order").trim();
  const logStrength = Number(renderColoring?.logStrength) || 9;
  const densityGamma = Number(renderColoring?.densityGamma) || 0.6;
  const hybridBlend = clamp01(Number(renderColoring?.hybridBlend) || 0.3);

  let nextProgressPercent = 0;
  let lastYieldMs = performance.now();
  const maybeYieldToBrowser = async () => {
    const now = performance.now();
    if (now - lastYieldMs < 20) {
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    lastYieldMs = performance.now();
  };

  const maybeEmitProgress = (fraction, forceComplete = false) => {
    if (typeof onProgress !== "function") {
      return;
    }

    if (forceComplete) {
      onProgress(100, true);
      return;
    }

    const percent = Math.max(0, Math.min(100, Math.floor(fraction * 100)));
    while (nextProgressPercent <= percent) {
      onProgress(nextProgressPercent, false);
      nextProgressPercent += 5;
    }
  };

  maybeEmitProgress(0, false);

  let x = Number(seed?.x);
  let y = Number(seed?.y);
  if (!Number.isFinite(x)) x = 0;
  if (!Number.isFinite(y)) y = 0;
  const burnSteps = clamp(burn ?? 120, 0, 5000);
  for (let i = 0; i < burnSteps; i += 1) {
    [x, y] = step(x, y, params.a, params.b, params.c, params.d);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > ESCAPE_ABS_BOUND || Math.abs(y) > ESCAPE_ABS_BOUND) {
      x = 0;
      y = 0;
      break;
    }
  }

  const xs = new Float32Array(iterations);
  const ys = new Float32Array(iterations);
  let sampleCount = 0;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < iterations; i += 1) {
    if (i % 1024 === 0) {
      maybeEmitProgress((i / Math.max(1, iterations)) * 0.7);
      await maybeYieldToBrowser();
    }
    [x, y] = step(x, y, params.a, params.b, params.c, params.d);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > ESCAPE_ABS_BOUND || Math.abs(y) > ESCAPE_ABS_BOUND) {
      break;
    }

    xs[sampleCount] = x;
    ys[sampleCount] = y;
    sampleCount += 1;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  if (sampleCount === 0) {
    maybeEmitProgress(1, true);
    ctx.putImageData(image, 0, 0);
    return {
      world: {
        minX: -1,
        maxX: 1,
        minY: -1,
        maxY: 1,
        centerX: 0,
        centerY: 0,
      },
      view: {
        width,
        height,
        centerX: width * 0.5,
        centerY: height * 0.5,
        scaleX: (width - 1) / 2,
        scaleY: (height - 1) / 2,
      },
    };
  }

  let worldMinX;
  let worldMaxX;
  let worldMinY;
  let worldMaxY;
  let worldSpanX;
  let worldSpanY;

  if (worldOverride) {
    worldMinX = Number(worldOverride.minX);
    worldMaxX = Number(worldOverride.maxX);
    worldMinY = Number(worldOverride.minY);
    worldMaxY = Number(worldOverride.maxY);
    worldSpanX = Math.max(worldMaxX - worldMinX, 1e-6);
    worldSpanY = Math.max(worldMaxY - worldMinY, 1e-6);
  } else if (scaleMode === "fixed") {
    const minDim = Math.min(width, height);
    const zoomRaw = Number(fixedView?.zoom ?? 1);
    const zoom = Number.isFinite(zoomRaw) && zoomRaw > 0 ? zoomRaw : 1;
    const scale = (minDim / 220) * zoom;
    const centerX = width * 0.5 + (fixedView?.offsetX ?? 0);
    const centerY = height * 0.5 + (fixedView?.offsetY ?? 0);
    worldMinX = (0 - centerX) / scale;
    worldMaxX = (width - centerX) / scale;
    worldMinY = (0 - centerY) / scale;
    worldMaxY = (height - centerY) / scale;
    worldSpanX = Math.max(worldMaxX - worldMinX, 1e-6);
    worldSpanY = Math.max(worldMaxY - worldMinY, 1e-6);
  } else {
    const safeSpanX = Math.max(maxX - minX, 1e-6);
    const safeSpanY = Math.max(maxY - minY, 1e-6);
    const paddingRatio = 0.08;
    let paddedSpanX = safeSpanX * (1 + paddingRatio * 2);
    let paddedSpanY = safeSpanY * (1 + paddingRatio * 2);

    const targetAspect = Math.max(width, 1) / Math.max(height, 1);
    if (paddedSpanX / paddedSpanY > targetAspect) {
      paddedSpanY = paddedSpanX / targetAspect;
    } else {
      paddedSpanX = paddedSpanY * targetAspect;
    }

    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    worldMinX = centerX - paddedSpanX * 0.5;
    worldMaxX = centerX + paddedSpanX * 0.5;
    worldMinY = centerY - paddedSpanY * 0.5;
    worldMaxY = centerY + paddedSpanY * 0.5;
    worldSpanX = Math.max(worldMaxX - worldMinX, 1e-6);
    worldSpanY = Math.max(worldMaxY - worldMinY, 1e-6);
  }

  const colorLut = new Uint8Array(LUT_SIZE * 3);

  for (let lutIndex = 0; lutIndex < LUT_SIZE; lutIndex += 1) {
    const t = lutIndex / (LUT_SIZE - 1);
    const [r, g, b] = sampleColorMap(cmapName, t, backgroundColor);
    const colorOffset = lutIndex * 3;
    colorLut[colorOffset] = r;
    colorLut[colorOffset + 1] = g;
    colorLut[colorOffset + 2] = b;
  }

  if (renderMode === "iteration_order") {
    for (let i = 0; i < sampleCount; i += 1) {
      if (i % 2048 === 0) {
        maybeEmitProgress(0.7 + (i / Math.max(1, sampleCount)) * 0.3);
        await maybeYieldToBrowser();
      }
      const px = Math.round(((xs[i] - worldMinX) / worldSpanX) * (width - 1));
      const py = Math.round(((ys[i] - worldMinY) / worldSpanY) * (height - 1));

      if (px < 0 || py < 0 || px >= width || py >= height) {
        continue;
      }

      const idx = (py * width + px) * 4;
      const lutIndex = Math.floor((i * (LUT_SIZE - 1)) / Math.max(1, sampleCount));
      const colorOffset = lutIndex * 3;
      pixels[idx] = colorLut[colorOffset];
      pixels[idx + 1] = colorLut[colorOffset + 1];
      pixels[idx + 2] = colorLut[colorOffset + 2];
      pixels[idx + 3] = 255;
    }
  } else {
    const pixelCount = width * height;
    const hitCounts = new Uint32Array(pixelCount);
    const lastHitIteration = renderMode === "hybrid_density_age" ? new Uint32Array(pixelCount) : null;
    let maxHits = 0;

    for (let i = 0; i < sampleCount; i += 1) {
      if (i % 2048 === 0) {
        maybeEmitProgress(0.7 + (i / Math.max(1, sampleCount)) * 0.15);
        await maybeYieldToBrowser();
      }
      const px = Math.round(((xs[i] - worldMinX) / worldSpanX) * (width - 1));
      const py = Math.round(((ys[i] - worldMinY) / worldSpanY) * (height - 1));

      if (px < 0 || py < 0 || px >= width || py >= height) {
        continue;
      }

      const pixelIndex = py * width + px;
      const nextHits = hitCounts[pixelIndex] + 1;
      hitCounts[pixelIndex] = nextHits;
      if (nextHits > maxHits) {
        maxHits = nextHits;
      }
      if (lastHitIteration) {
        lastHitIteration[pixelIndex] = i + 1;
      }
    }

    const percentileLookup = new Map();
    if (renderMode === "hit_density_percentile" && maxHits > 0) {
      const frequencyByHits = new Map();
      let activePixels = 0;
      for (let i = 0; i < hitCounts.length; i += 1) {
        const hits = hitCounts[i];
        if (hits <= 0) continue;
        activePixels += 1;
        frequencyByHits.set(hits, (frequencyByHits.get(hits) || 0) + 1);
      }

      const sortedHits = [...frequencyByHits.keys()].sort((a, b) => a - b);
      let cumulative = 0;
      for (const hits of sortedHits) {
        cumulative += frequencyByHits.get(hits) || 0;
        percentileLookup.set(hits, activePixels > 0 ? cumulative / activePixels : 0);
      }
    }

    for (let pixelIndex = 0; pixelIndex < hitCounts.length; pixelIndex += 1) {
      if (pixelIndex % 4096 === 0) {
        maybeEmitProgress(0.85 + (pixelIndex / Math.max(1, hitCounts.length)) * 0.15);
        await maybeYieldToBrowser();
      }
      const hits = hitCounts[pixelIndex];
      if (hits <= 0) {
        continue;
      }

      let t = 0;
      if (renderMode === "hit_density_percentile") {
        t = percentileLookup.get(hits) || 0;
      } else {
        t = mapHitToT(hits, maxHits, renderMode, { logStrength, densityGamma });
      }

      const idx = pixelIndex * 4;
      if (renderMode === "hybrid_density_age") {
        const ageT = clamp01((lastHitIteration[pixelIndex] - 1) / Math.max(1, sampleCount - 1));
        const [baseR, baseG, baseB] = sampleColorMap(cmapName, t);
        const [ageR, ageG, ageB] = sampleColorMap(cmapName, ageT);
        const [mixR, mixG, mixB] = blendRgb([baseR, baseG, baseB], [ageR, ageG, ageB], hybridBlend);
        pixels[idx] = mixR;
        pixels[idx + 1] = mixG;
        pixels[idx + 2] = mixB;
      } else {
        const lutIndex = Math.floor(clamp01(t) * (LUT_SIZE - 1));
        const colorOffset = lutIndex * 3;
        pixels[idx] = colorLut[colorOffset];
        pixels[idx + 1] = colorLut[colorOffset + 1];
        pixels[idx + 2] = colorLut[colorOffset + 2];
      }
      pixels[idx + 3] = 255;
    }
  }

  maybeEmitProgress(1, true);
  ctx.putImageData(image, 0, 0);

  return {
    world: {
      minX: worldMinX,
      maxX: worldMaxX,
      minY: worldMinY,
      maxY: worldMaxY,
      centerX: (worldMinX + worldMaxX) * 0.5,
      centerY: (worldMinY + worldMaxY) * 0.5,
    },
    view: {
      width,
      height,
      centerX: width * 0.5,
      centerY: height * 0.5,
      scaleX: (width - 1) / worldSpanX,
      scaleY: (height - 1) / worldSpanY,
    },
  };
}


export function classifyInterestGridLyapunov({ formulaId, baseParams, plane, gridCols = 25, gridRows = 25, iterations = 1200, lyapunov = {}, onProgress = null }) {
  const step = formulaStepById.get(formulaId);
  if (!step || !plane) {
    return { gridCols: 0, gridRows: 0, highCells: [] };
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
  const epsilon = 1e-12;
  const minValidSteps = Math.max(4, Math.floor(sampleIterations * 0.1));

  const safeBase = {
    a: Number(baseParams?.a) || 0,
    b: Number(baseParams?.b) || 0,
    c: Number(baseParams?.c) || 0,
    d: Number(baseParams?.d) || 0,
  };

  const sampleAxisValue = (minValue, maxValue, index, count) => {
    const t = count > 1 ? index / (count - 1) : 0.5;
    return minValue + (maxValue - minValue) * t;
  };

  const computeLambdaForParams = (cellParams) => {
    let x1 = 0;
    let y1 = 0;
    let x2 = d0;
    let y2 = 0;

    let sumLogRatio = 0;
    let validSteps = 0;
    let previousDistance = d0;

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

      if (shouldRescale) {
        const scale = d0 / Math.max(d1Raw, epsilon);
        x2 = x1 + dx * scale;
        y2 = y1 + dy * scale;
        previousDistance = d0;
      } else {
        previousDistance = dNext;
      }
    }

    if (validSteps < minValidSteps) {
      return Number.NEGATIVE_INFINITY;
    }
    return sumLogRatio / validSteps;
  };

  const highCells = [];

  const totalCells = Math.max(1, safeGridCols * safeGridRows);
  let processedCells = 0;
  let nextProgressPercent = 0;
  const emitProgress = (force = false) => {
    if (typeof onProgress !== "function") return;
    const percent = Math.max(0, Math.min(100, Math.floor((processedCells / totalCells) * 100)));
    if (force) {
      onProgress(100);
      return;
    }
    while (nextProgressPercent <= percent) {
      onProgress(nextProgressPercent);
      nextProgressPercent += 5;
    }
  };

  if (plane.mode === "one_axis") {
    const [axisMin, axisMax] = plane.axisRange || [safeBase[plane.axisParam], safeBase[plane.axisParam]];
    for (let col = 0; col < safeGridCols; col += 1) {
      const cellParams = { ...safeBase };
      cellParams[plane.axisParam] = sampleAxisValue(axisMin, axisMax, col, safeGridCols);
      const lambda = computeLambdaForParams(cellParams);
      if (Number.isFinite(lambda) && lambda >= minExponent) {
        for (let row = 0; row < safeGridRows; row += 1) {
          highCells.push(row * safeGridCols + col);
        }
      }
      processedCells += safeGridRows;
      emitProgress(false);
    }

    emitProgress(true);
    return { gridCols: safeGridCols, gridRows: safeGridRows, highCells };
  }

  const [xMin, xMax] = plane.axisXRange || [safeBase[plane.axisXParam], safeBase[plane.axisXParam]];
  const [yMin, yMax] = plane.axisYRange || [safeBase[plane.axisYParam], safeBase[plane.axisYParam]];

  for (let row = 0; row < safeGridRows; row += 1) {
    for (let col = 0; col < safeGridCols; col += 1) {
      const cellParams = { ...safeBase };
      cellParams[plane.axisXParam] = sampleAxisValue(xMin, xMax, col, safeGridCols);
      cellParams[plane.axisYParam] = sampleAxisValue(yMax, yMin, row, safeGridRows);
      const lambda = computeLambdaForParams(cellParams);
      if (Number.isFinite(lambda) && lambda >= minExponent) {
        highCells.push(row * safeGridCols + col);
      }
      processedCells += 1;
      emitProgress(false);
    }
  }

  emitProgress(true);
  return { gridCols: safeGridCols, gridRows: safeGridRows, highCells };
}
