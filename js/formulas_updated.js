// formulas.js
// Hopalong-style 2D iterative maps used by the renderer.
// Parameters are always (a,b,c,d) to match main.js slider mapping:
//   a -> alpha, b -> beta, c -> delta, d -> gamma.
//
// This file is designed to be merged with your existing JSON-driven formula list:
// - Keep your existing appData.formulas / appData.formula_ranges_raw as-is.
// - Import { EXTRA_FORMULAS, EXTRA_FORMULA_RANGES_RAW } from this file and merge-in by id.

export const EXTRA_FORMULAS = [
  // --- Existing Hopalong variants (ported from your previous formulas.js) ---
  {
    id: "classic_sqrt",
    name: "Classic (sqrt)",
    desc: "Wolfram/Martin: x' = y − sgn(x)·sqrt(|b·x − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)), a - x];
    },
  },
  {
    id: "sqrt_plus_dy",
    name: "Classic + d·y",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·y, y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * y, a - x];
    },
  },
  {
    id: "sqrt_plus_dx",
    name: "Classic + d·x",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·x, y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * x, a - x];
    },
  },
  {
    id: "mix_inside",
    name: "sqrt(|b(x + d·y) − c|)",
    desc: "Mix x,y inside sqrt: x' = y − sgn(x)·sqrt(|b(x + d·y) − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * (x + d * y) - c)), a - x];
    },
  },
  {
    id: "trig_kick_x",
    name: "Trig kick (sin x)",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·sin(x), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * Math.sin(x), a - x];
    },
  },
  {
    id: "trig_kick_y",
    name: "Trig kick (sin y)",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·sin(y), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * Math.sin(y), a - x];
    },
  },
  {
    id: "classic_plus_yy",
    name: "Classic + d·y²",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·y², y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * (y * y), a - x];
    },
  },
  {
    id: "cos_xy_kick",
    name: "Trig kick (cos(x+y))",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·cos(x+y), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * Math.cos(x + y), a - x];
    },
  },
  {
    id: "inside_sin_y",
    name: "Inside sqrt sin(y)",
    desc: "x' = y − sgn(x)·sqrt(|b(x + d·sin(y)) − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      const t = x + d * Math.sin(y);
      return [y - s * Math.sqrt(Math.abs(b * t - c)), a - x];
    },
  },
  {
    id: "inside_cos_x",
    name: "Inside sqrt cos(x)",
    desc: "x' = y − sgn(x)·sqrt(|b(x + d·cos(x)) − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      const t = x + d * Math.cos(x);
      return [y - s * Math.sqrt(Math.abs(b * t - c)), a - x];
    },
  },
  {
    id: "softsign_kick",
    name: "Softsign kick",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·(x/(1+|x|)), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      const k = x / (1 + Math.abs(x));
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * k, a - x];
    },
  },
  {
    id: "tanh_kick",
    name: "Tanh kick",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·tanh(x), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * Math.tanh(x), a - x];
    },
  },
  {
    id: "sign_xy",
    name: "Sign of (x·y)",
    desc: "Use sign(x·y): x' = y − sgn(xy)·sqrt(|b·x − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const p = x * y;
      const s = p > 0 ? 1 : (p < 0 ? -1 : 0);
      return [y - s * Math.sqrt(Math.abs(b * x - c)), a - x];
    },
  },
  {
    id: "double_root",
    name: "Double-root kick",
    desc: "x' = y − sgn(x)·(sqrt(|b·x−c|) + d·sqrt(|b·y−c|)), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      const r1 = Math.sqrt(Math.abs(b * x - c));
      const r2 = Math.sqrt(Math.abs(b * y - c));
      return [y - s * (r1 + d * r2), a - x];
    },
  },
  {
    id: "xy_coupling",
    name: "XY coupling",
    desc: "x' = y − sgn(x)·sqrt(|b·x − c|) + d·(x·y/k), y' = a − x (k fixed)",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      const k = 50;
      return [y - s * Math.sqrt(Math.abs(b * x - c)) + d * (x * y / k), a - x];
    },
  },
  {
    id: "positive_hopalong",
    name: "Positive Hopalong",
    desc: "x' = y + sgn(x)·sqrt(|b·x − c|), y' = a − x",
    step: (x, y, a, b, c, d) => {
      const s = x > 0 ? 1 : (x < 0 ? -1 : 0);
      return [y + s * Math.sqrt(Math.abs(b * x - c)), a - x];
    },
  },
  {
    id: "sinusoidal_hopalong",
    name: "Sinusoidal Hopalong",
    desc: "x' = y + sin(b·x − c), y' = a − x",
    step: (x, y, a, b, c, d) => [y + Math.sin(b * x - c), a - x],
  },

  // --- New (non-Hopalong) candidates that fit the same app architecture ---
  // Peter de Jong map (4 params)
  {
    id: "peter_de_jong",
    name: "Peter de Jong",
    desc: "x' = sin(a·y) − cos(b·x), y' = sin(c·x) − cos(d·y)",
    step: (x, y, a, b, c, d) => [
      Math.sin(a * y) - Math.cos(b * x),
      Math.sin(c * x) - Math.cos(d * y),
    ],
  },

  // Clifford (Pickover) attractor (4 params)
  {
    id: "clifford",
    name: "Clifford (Pickover)",
    desc: "x' = sin(a·y) + c·cos(a·x), y' = sin(b·x) + d·cos(b·y)",
    step: (x, y, a, b, c, d) => [
      Math.sin(a * y) + c * Math.cos(a * x),
      Math.sin(b * x) + d * Math.cos(b * y),
    ],
  },

  // Tinkerbell map (4 params)
  {
    id: "tinkerbell",
    name: "Tinkerbell map",
    desc: "x' = x² − y² + a·x + b·y, y' = 2xy + c·x + d·y",
    step: (x, y, a, b, c, d) => [
      x * x - y * y + a * x + b * y,
      2 * x * y + c * x + d * y,
    ],
  },

  // Hénon map (extended to 4 params via offsets)
  {
    id: "henon",
    name: "Hénon (with offsets)",
    desc: "x' = 1 − a·x² + y + c, y' = b·x + d",
    step: (x, y, a, b, c, d) => [
      1 - a * x * x + y + c,
      b * x + d,
    ],
  },

  // Lozi map (extended to 4 params via offsets)
  {
    id: "lozi",
    name: "Lozi (with offsets)",
    desc: "x' = 1 − a·|x| + y + c, y' = b·x + d",
    step: (x, y, a, b, c, d) => [
      1 - a * Math.abs(x) + y + c,
      b * x + d,
    ],
  },

  // Ikeda map (4 params: a=translation, b=dissipation, c=base angle, d=radial term)
  {
    id: "ikeda",
    name: "Ikeda (4-param)",
    desc: "t = c − d/(1 + x² + y²); x' = a + b(x cos t − y sin t); y' = b(x sin t + y cos t)",
    step: (x, y, a, b, c, d) => {
      const r2 = x * x + y * y;
      const t = c - d / (1 + r2);
      const ct = Math.cos(t);
      const st = Math.sin(t);
      return [
        a + b * (x * ct - y * st),
        b * (x * st + y * ct),
      ];
    },
  },

  // Gingerbreadman (generalized to 4 params)
  {
    id: "gingerbread",
    name: "Gingerbreadman (generalized)",
    desc: "x' = a − y + b|x|, y' = c·x + d",
    step: (x, y, a, b, c, d) => [
      a - y + b * Math.abs(x),
      c * x + d,
    ],
  },



  {
    id: "zaslavsky_web",
    name: "Zaslavsky Web",
    desc: "t = y + d·sin(x+c); x' = x + a·sin(t); y' = t + b",
    step: (x, y, a, b, c, d) => {
      const t = y + d * Math.sin(x + c);
      return [x + a * Math.sin(t), t + b];
    },
  },

  {
    id: "popcorn",
    name: "Popcorn",
    desc: "x' = x − a·sin(y + tan(3y)) + c, y' = y − b·sin(x + tan(3x)) + d",
    step: (x, y, a, b, c, d) => {
      const x1 = x - a * Math.sin(y + Math.tan(3 * y));
      const y1 = y - b * Math.sin(x + Math.tan(3 * x));
      return [x1 + c, y1 + d];
    },
  },

  {
    id: "bedhead",
    name: "Bedhead",
    desc: "x' = sin(xy/b)·y + cos(ax−y) + d, y' = x + sin(y)/c",
    step: (x, y, a, b, c, d) => {
      const safeB = Math.abs(b) < 1e-9 ? (b < 0 ? -1e-9 : 1e-9) : b;
      const safeC = Math.abs(c) < 1e-9 ? (c < 0 ? -1e-9 : 1e-9) : c;
      const x1 = Math.sin((x * y) / safeB) * y + Math.cos(a * x - y);
      const y1 = x + Math.sin(y) / safeC;
      return [x1 + d, y1];
    },
  },

  {
    id: "gumowski_mira",
    name: "Gumowski–Mira",
    desc: "f(u)=c·u+2(1−c)u²/(1+u²); x'=y+a(1−by²)y+f(x), y'=-x+d·f(x')",
    step: (x, y, a, b, c, d) => {
      const f = (u) => c * u + (2 * (1 - c) * u * u) / (1 + u * u);
      const x1 = y + a * (1 - b * y * y) * y + f(x);
      return [x1, -x + f(x1) * d];
    },
  },

  {
    id: "shifted_hopalong",
    name: "Shifted Hopalong",
    desc: "xShift=x+c; x' = y − sgn(xShift)·sqrt(|b·xShift−a|), y' = a − xShift + d",
    step: (x, y, a, b, c, d) => {
      const xShift = x + c;
      const sign = xShift >= 0 ? 1 : -1;
      return [
        y - sign * Math.sqrt(Math.abs(b * xShift - a)),
        a - xShift + d,
      ];
    },
  },

];
// Built-in ranges to seed your in-app range editor and “Randomize” behavior.
// These are intentionally conservative to reduce blow-ups / NaNs.
// Tune freely in your ranges editor once integrated.
export const EXTRA_FORMULA_RANGES_RAW = {
  // Hopalong family (typical good starting territory)
  classic_sqrt:      { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-2, 2] },
  sqrt_plus_dy:      { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-1, 1] },
  sqrt_plus_dx:      { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-1, 1] },
  mix_inside:        { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-0.05, 0.05] },
  trig_kick_x:       { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-5, 5] },
  trig_kick_y:       { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-5, 5] },
  classic_plus_yy:   { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-0.02, 0.02] },
  cos_xy_kick:       { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-5, 5] },
  inside_sin_y:      { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-10, 10] },
  inside_cos_x:      { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-10, 10] },
  softsign_kick:     { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-20, 20] },
  tanh_kick:         { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-20, 20] },
  sign_xy:           { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-2, 2] },
  double_root:       { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-2, 2] },
  xy_coupling:       { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-2, 2] },
  positive_hopalong: { a: [-80, 80], b: [-3, 3],   c: [-80, 80], d: [-2, 2] },
  sinusoidal_hopalong:{a: [-80, 80], b: [-10, 10], c: [-10, 10], d: [-2, 2] },

  // External classic strange attractors (small parameter ranges work well)
  peter_de_jong:     { a: [-3, 3],   b: [-3, 3],   c: [-3, 3],   d: [-3, 3] },
  clifford:          { a: [-3, 3],   b: [-3, 3],   c: [-3, 3],   d: [-3, 3] },

  // Quadratic maps can blow up quickly; keep ranges tight + allow offsets.
  tinkerbell:        { a: [-1.5, 1.5], b: [-1.5, 1.5], c: [-1.0, 3.0], d: [-1.5, 1.5] },
  henon:             { a: [0.0, 2.0],  b: [-1.0, 1.0],  c: [-0.5, 0.5], d: [-0.5, 0.5] },
  lozi:              { a: [0.0, 2.0],  b: [-1.0, 1.0],  c: [-0.5, 0.5], d: [-0.5, 0.5] },

  // Ikeda: b is dissipation (<=1). d controls swirl intensity.
  ikeda:             { a: [0.0, 1.5],  b: [0.5, 0.99],  c: [-1.0, 1.0], d: [0.0, 10.0] },

  // Gingerbreadman generalization: easy to explode if c too large; keep moderate.
  gingerbread:       { a: [-2.0, 2.0], b: [0.0, 2.0],   c: [-1.2, 1.2], d: [-2.0, 2.0] },

  zaslavsky_web:      { a: [0.0, 2.0],   b: [0.0, 2.0],   c: [0.0, 6.28318], d: [0.0, 2.0] },
  popcorn:            { a: [0.0, 0.2],   b: [0.0, 0.2],   c: [-2.0, 2.0],   d: [-2.0, 2.0] },
  bedhead:            { a: [-2.0, 2.0],  b: [-2.0, 2.0],  c: [-2.0, 2.0],   d: [-2.0, 2.0] },
  gumowski_mira:      { a: [-1.0, 1.0],  b: [-1.0, 1.0],  c: [0.0, 1.0],    d: [0.0, 1.0] },
  shifted_hopalong:   { a: [-5.0, 5.0],  b: [-5.0, 5.0],  c: [-5.0, 5.0],   d: [-5.0, 5.0] },

};

export function getExtraFormulaById(id) {
  return EXTRA_FORMULAS.find((f) => f.id === id) || null;
}

export function listExtraFormulaIds() {
  return EXTRA_FORMULAS.map((f) => f.id);
}
