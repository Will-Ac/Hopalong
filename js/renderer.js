import { sampleColorMap } from "./colormaps.js";
import { getVariantById } from "./formulas.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mapNormalized(normalizedValue, min, max) {
  const t = clamp(normalizedValue / 100, 0, 1);
  return min + (max - min) * t;
}

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

export function renderFrame({ ctx, canvas, formulaId, cmapName, params, iterations = 120000 }) {
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

  const minDim = Math.min(width, height);
  const scale = minDim / 220;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  for (let i = 0; i < iterations; i += 1) {
    [x, y] = variant.step(x, y, params.a, params.b, params.d, params.c);
    const px = Math.round(centerX + x * scale);
    const py = Math.round(centerY + y * scale);

    if (px < 0 || py < 0 || px >= width || py >= height) {
      continue;
    }

    const idx = (py * width + px) * 4;
    const [r, g, b] = sampleColorMap(cmapName, i / iterations);
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
}
