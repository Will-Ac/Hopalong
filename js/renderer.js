import { sampleColorMap } from "./colormaps.js";
import { getVariantById } from "./formulas.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mapNormalized(normalizedValue, min, max) {
  const t = clamp(normalizedValue / 100, 0, 1);
  return min + (max - min) * t;
}

const LUT_SIZE = 2048;

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

export function renderFrame({ ctx, canvas, formulaId, cmapName, params, iterations = 120000, scaleMode = "auto" }) {
  const variant = getVariantById(formulaId);
  if (!variant) {
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

  let x = 0;
  let y = 0;
  const burn = 120;
  for (let i = 0; i < burn; i += 1) {
    [x, y] = variant.step(x, y, params.a, params.b, params.d, params.c);
  }

  const xs = new Float32Array(iterations);
  const ys = new Float32Array(iterations);
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < iterations; i += 1) {
    [x, y] = variant.step(x, y, params.a, params.b, params.d, params.c);
    xs[i] = x;
    ys[i] = y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  let worldMinX;
  let worldMaxX;
  let worldMinY;
  let worldMaxY;
  let worldSpanX;
  let worldSpanY;

  if (scaleMode === "fixed") {
    const minDim = Math.min(width, height);
    const scale = minDim / 220;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
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

  for (let i = 0; i < iterations; i += 1) {
    const px = Math.round(((xs[i] - worldMinX) / worldSpanX) * (width - 1));
    const py = Math.round(((ys[i] - worldMinY) / worldSpanY) * (height - 1));

    if (px < 0 || py < 0 || px >= width || py >= height) {
      continue;
    }

    const idx = (py * width + px) * 4;
    const lutIndex = Math.floor((i * (LUT_SIZE - 1)) / iterations);
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
