import { sampleColorMap } from "./colormaps.js";
import { VARIANTS } from "./formulas.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mapNormalized(normalizedValue, min, max) {
  const t = clamp(normalizedValue / 100, 0, 1);
  return min + (max - min) * t;
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
  return {
    a: mapNormalized(sliderDefaults.alpha, ranges.a[0], ranges.a[1]),
    b: mapNormalized(sliderDefaults.beta, ranges.b[0], ranges.b[1]),
    c: mapNormalized(sliderDefaults.delta, ranges.c[0], ranges.c[1]),
    d: mapNormalized(sliderDefaults.gamma, ranges.d[0], ranges.d[1]),
  };
}

export function renderFrame({ ctx, canvas, formulaId, cmapName, params, iterations = 120000, burn = 120, scaleMode = "auto", fixedView = null, worldOverride = null, seed = null }) {
  const step = formulaStepById.get(formulaId);
  if (!step) {
    throw new Error(`Unknown formula id: ${formulaId}`);
  }

  const width = canvas.width;
  const height = canvas.height;
  const image = ctx.createImageData(width, height);
  const pixels = image.data;

  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 5;
    pixels[i + 1] = 7;
    pixels[i + 2] = 12;
    pixels[i + 3] = 255;
  }

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
    const [r, g, b] = sampleColorMap(cmapName, t);
    const colorOffset = lutIndex * 3;
    colorLut[colorOffset] = r;
    colorLut[colorOffset + 1] = g;
    colorLut[colorOffset + 2] = b;
  }

  for (let i = 0; i < sampleCount; i += 1) {
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
