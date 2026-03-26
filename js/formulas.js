// Extracted from hopalongv124.html (Variants array)
// ES module version for ground-up rewrite (no DOM code here).

const PARAM_KEYS = ["a", "b", "c", "d"];

function inferUsedParams(formula) {
  const discovered = new Set();
  const stepSource = String(formula.step || "");
  for (const match of stepSource.matchAll(/p\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    if (match[1]) {
      discovered.add(match[1]);
    }
  }
  const core = PARAM_KEYS.filter((key) => discovered.has(key));
  const extras = [...discovered].filter((key) => !PARAM_KEYS.includes(key)).sort();
  return [...core, ...extras];
}

export const FORMULA_DEFS = [
  {
    id: "classic_sqrt",
    name: "Classic (sqrt)",
    desc: "Classic sqrt",
    params: PARAM_KEYS,
    ranges: {
      a: [-10.0, 10.0],
      b: [-10.0, 10.0],
      c: [-10.0, 10.0],
      d: [-5.0, 5.0],
    },
    defaults: { a: 9.454999999999998, b: 1.7581399999999991, c: 7.1841599999999985, d: -1.2194099999999999 },
    seed: { x: 0.0, y: 0.0 },
    detailX: "x_next = y - sign(x) * sqrt(abs(b*x - c))",
    detailY: "y_next = a - x",
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.c)), p.a - x];
    },
  },
  {
    id: "sqrt_plus_gamma_y",
    name: "Classic + dy",
    desc: "sqrt + c*y",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 77.59],
      b: [-21.75, 30.0],
      c: [-28.94, 26.57],
      d: [-2.14, 2.89],
    },
    defaults: { a: -1.205, b: 4.125, c: -1.185, d: 0.375 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * y, p.a - x];
    },
  },
  {
    id: "sqrt_plus_gamma_x",
    name: "Classic + dx",
    desc: "sqrt + c*x",
    params: PARAM_KEYS,
    ranges: {
      a: [-78.55, 77.52],
      b: [-30.0, 24.37],
      c: [-29.13, 30.0],
      d: [-1.8, 2.73],
    },
    defaults: { a: -0.515, b: -2.815, c: 0.435, d: 0.465 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * x, p.a - x];
    },
  },
  {
    id: "mix_inside",
    name: "sqrt(|b(x+dy)−c|)",
    desc: "mix in sqrt",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 80.0],
      b: [-28.02, 30.0],
      c: [-25.91, 30.0],
      d: [-3.0, 2.92],
    },
    defaults: { a: 0.0, b: 0.99, c: 2.045, d: -0.04 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * (x + p.c * y) - p.d)), p.a - x];
    },
  },
  {
    id: "trig_kick_x",
    name: "Trig kick (sin x)",
    desc: "sin x kick",
    params: PARAM_KEYS,
    ranges: {
      a: [-75.2, 80.0],
      b: [-28.73, 30.0],
      c: [-30.0, 27.43],
      d: [-0.85, 2.95],
    },
    defaults: { a: 2.4, b: 0.635, c: -1.285, d: 1.05 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [
        y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * Math.sin(x),
        p.a - x,
      ];
    },
  },
  {
    id: "damped",
    name: "Damped (|d|)",
    desc: "damped",
    params: PARAM_KEYS,
    ranges: {
      a: [-56.36, 60.0],
      b: [-20.0, 19.92],
      c: [-30.0, 30.0],
      d: [-0.2, 0.84],
    },
    defaults: { a: 1.82, b: -0.04, c: 0.0, d: 0.32 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const base = y - s * Math.sqrt(Math.abs(p.b * x - p.d));
      const damp = 1 - Math.min(0.95, Math.abs(p.c));
      return [base * damp, p.a - x];
    },
  },
  {
    id: "y_feedback",
    name: "Y feedback (a−x+d·y)",
    desc: "y feedback",
    params: PARAM_KEYS,
    ranges: {
      a: [-60.0, 57.06],
      b: [-19.92, 20.0],
      c: [-30.0, 30.0],
      d: [-1.0, 0.64],
    },
    defaults: { a: -1.47, b: 0.04, c: 0.0, d: -0.18 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const xn = y - s * Math.sqrt(Math.abs(p.b * x - p.d));
      const yn = p.a - x + p.c * y;
      return [xn, yn];
    },
  },
  {
    id: "trig_kick_y",
    name: "Trig kick (sin y)",
    desc: "sin y kick",
    params: PARAM_KEYS,
    ranges: {
      a: [-79.84, 78.7],
      b: [-30.0, 28.62],
      c: [-30.0, 30.0],
      d: [-2.4, 2.75],
    },
    defaults: { a: -0.57, b: -0.69, c: 0.0, d: 0.175 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [
        y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * Math.sin(y),
        p.a - x,
      ];
    },
  },
  {
    id: "classic_plus_yy",
    name: "Classic + d·y²",
    desc: "c*y^2",
    params: PARAM_KEYS,
    ranges: {
      a: [-57.16, 60.0],
      b: [-20.0, 20.0],
      c: [-30.0, 30.0],
      d: [-0.03, 0.09],
    },
    defaults: { a: 1.42, b: 0.0, c: 0.0, d: 0.03 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [
        y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * (y * y),
        p.a - x,
      ];
    },
  },
  {
    id: "cos_xy_kick",
    name: "Trig kick (cos(x+y))",
    desc: "cos(x+y)",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 78.57],
      b: [-30.0, 30.0],
      c: [-30.0, 30.0],
      d: [-1.18, 2.79],
    },
    defaults: { a: -0.715, b: 0.0, c: 0.0, d: 0.805 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [
        y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * Math.cos(x + y),
        p.a - x,
      ];
    },
  },
  {
    id: "inside_sin_y",
    name: "Inside sqrt sin(y)",
    desc: "sin in sqrt",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 78.64],
      b: [-28.68, 30.0],
      c: [-29.85, 30.0],
      d: [-2.84, 3.0],
    },
    defaults: { a: -0.68, b: 0.66, c: 0.075, d: 0.08 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const t = x + p.c * Math.sin(y);
      return [y - s * Math.sqrt(Math.abs(p.b * t - p.d)), p.a - x];
    },
  },
  {
    id: "inside_cos_x",
    name: "Inside sqrt cos(x)",
    desc: "cos in sqrt",
    params: PARAM_KEYS,
    ranges: {
      a: [-75.39, 78.33],
      b: [-27.62, 30.0],
      c: [-30.0, 29.85],
      d: [-2.34, 3.0],
    },
    defaults: { a: 1.47, b: 1.19, c: -0.075, d: 0.33 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const t = x + p.c * Math.cos(x);
      return [y - s * Math.sqrt(Math.abs(p.b * t - p.d)), p.a - x];
    },
  },
  {
    id: "softsign_kick",
    name: "Softsign kick",
    desc: "softsign",
    params: PARAM_KEYS,
    ranges: {
      a: [-76.43, 80.0],
      b: [-30.0, 29.48],
      c: [-22.17, 30.0],
      d: [-3.0, 2.88],
    },
    defaults: { a: 1.785, b: -0.26, c: 3.915, d: -0.06 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const k = x / (1 + Math.abs(x));
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * k, p.a - x];
    },
  },
  {
    id: "tanh_kick",
    name: "Tanh kick",
    desc: "tanh kick",
    params: PARAM_KEYS,
    ranges: {
      a: [-79.66, 76.93],
      b: [-30.0, 30.0],
      c: [-16.76, 30.0],
      d: [-2.8, 2.98],
    },
    defaults: { a: -1.365, b: 0.0, c: 6.62, d: 0.09 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const k = Math.tanh(x);
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * k, p.a - x];
    },
  },
  {
    id: "sign_xy",
    name: "Sign of (x·y)",
    desc: "sign(x*y)",
    params: PARAM_KEYS,
    ranges: {
      a: [-28.57, 75.71],
      b: [-26.8, 30.0],
      c: [-30.0, 30.0],
      d: [0.0, 0.0],
    },
    defaults: { a: 23.57, b: 1.6, c: 0.0, d: 0.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const q = x * y;
      const s = q > 0 ? 1 : q < 0 ? -1 : 0;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)), p.a - x];
    },
  },
  {
    id: "double_root",
    name: "Double-root kick",
    desc: "double root",
    params: PARAM_KEYS,
    ranges: {
      a: [-60.0, 57.77],
      b: [-10.41, 12.0],
      c: [-30.0, 25.26],
      d: [-1.15, 2.5],
    },
    defaults: { a: -1.115, b: 0.795, c: -2.37, d: 0.675 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const r1 = Math.sqrt(Math.abs(p.b * x - p.d));
      const r2 = Math.sqrt(Math.abs(p.b * y - p.d));
      return [y - s * (r1 + p.c * r2), p.a - x];
    },
  },
  {
    id: "xy_coupling",
    name: "XY coupling",
    desc: "xy coupling",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 78.78],
      b: [-28.77, 30.0],
      c: [-27.33, 30.0],
      d: [-0.46, 2.25],
    },
    defaults: { a: -0.61, b: 0.615, c: 1.335, d: 0.895 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const k = (x * y) / 50;
      return [y - s * Math.sqrt(Math.abs(p.b * x - p.d)) + p.c * k, p.a - x];
    },
  },
  {
    id: "positive_hopalong",
    name: "Positive Hopalong",
    desc: "positive hop",
    params: PARAM_KEYS,
    ranges: {
      a: [-76.57, 73.43],
      b: [-30.0, 28.86],
      c: [-29.32, 30.0],
      d: [0.0, 0.0],
    },
    defaults: { a: -1.57, b: -0.57, c: 0.34, d: 0.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      return [y + s * Math.sqrt(Math.abs(p.b * x - p.d)), p.a - x];
    },
  },
  {
    id: "sinusoidal_hopalong",
    name: "Sinusoidal Hopalong",
    desc: "sin hop",
    params: PARAM_KEYS,
    ranges: {
      a: [-26.13, 56.28],
      b: [-29.48, 27.34],
      c: [-29.31, 30.0],
      d: [0.0, 0.0],
    },
    defaults: { a: 15.075, b: -1.07, c: 0.345, d: 0.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => [y + Math.sin(p.b * x - p.d), p.a - x],
  },
  {
    id: "threeply",
    name: "Threeply (Peters)",
    desc: "threeply",
    params: PARAM_KEYS,
    ranges: {
      a: [-11.16, 11.73],
      b: [-12.0, 12.0],
      c: [-30.0, 30.0],
      d: [-5.24, 10.94],
    },
    defaults: { a: 0.285, b: 0.0, c: 0.0, d: 2.85 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const t =
        Math.sin(x) * Math.cos(p.b) + p.c - x * Math.sin(p.a + p.b + p.c);
      return [y - s * Math.abs(t), p.a - x];
    },
  },
  {
    id: "quadrup2",
    name: "Quadrup-2 (Peters)",
    desc: "quadrup2",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 75.98],
      b: [-10.0, 10.0],
      c: [-28.89, 30.0],
      d: [0.0, 0.0],
    },
    defaults: { a: -2.01, b: 0.0, c: 0.555, d: 0.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const ln1 = Math.log(Math.abs(p.b * x - p.d) + 1e-12);
      const ln2 = Math.log(Math.abs(p.d * x - p.b) + 1e-12);
      const k = Math.sin(ln1) * Math.atan(ln2 * ln2);
      return [y - s * k, p.a - x];
    },
  },
  {
    id: "chip",
    name: "Chip (Peters)",
    desc: "chip",
    params: PARAM_KEYS,
    ranges: {
      a: [-80.0, 80.0],
      b: [-10.0, 9.88],
      c: [-30.0, 29.98],
      d: [0.0, 0.0],
    },
    defaults: { a: 0.0, b: -0.06, c: -0.01, d: 0.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const s = x > 0 ? 1 : x < 0 ? -1 : 0;
      const ln = Math.log(Math.abs(p.b * x - p.d) + 1e-12);
      const t = ln * ln;
      const k = Math.cos(t) * Math.atan(t);
      return [y - s * k, p.a - x];
    },
  },
  {
    id: "pickover_clifford",
    name: "Pickover/Clifford",
    desc: "pickover",
    params: PARAM_KEYS,
    ranges: { a: [-2.0, 2.0], b: [-2.0, 2.0], c: [-2.0, 2.0], d: [-2.0, 2.0] },
    defaults: { a: 0.024, b: 0.228, c: -0.456, d: 0.252 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => {
      const s = 20;
      return [
        s * (Math.sin(p.b * y) + p.c * Math.sin(p.b * x)),
        s * (Math.sin(p.a * x) + p.d * Math.sin(p.a * y)),
      ];
    },
  },
  {
    id: "peter_de_jong",
    name: "Peter de Jong",
    desc: "de jong",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.sin(p.a * y) - Math.cos(p.b * x),
      Math.sin(p.c * x) - Math.cos(p.d * y),
    ],
  },
  {
    id: "clifford",
    name: "Clifford (Pickover)",
    desc: "clifford",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.sin(p.a * y) + p.c * Math.cos(p.a * x),
      Math.sin(p.b * x) + p.d * Math.cos(p.b * y),
    ],
  },
  {
    id: "fractal_dream",
    name: "Fractal Dream",
    desc: "fractal dream",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-0.5, 1.5], d: [-0.5, 1.5] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.sin(y * p.b) + p.c * Math.sin(x * p.b),
      Math.sin(x * p.a) + p.d * Math.sin(y * p.a),
    ],
  },
  {
    id: "tinkerbell",
    name: "Tinkerbell map",
    desc: "tinkerbell",
    params: PARAM_KEYS,
    ranges: { a: [-1.5, 1.5], b: [-1.5, 1.5], c: [-2.5, 2.5], d: [-1.5, 1.5] },
    defaults: { a: 0.9, b: -0.6013, c: 2.0, d: 0.5 },
    seed: { x: 0.01, y: 0.01 },
    step: (x, y, p) => [
      x * x - y * y + p.a * x + p.b * y,
      2 * x * y + p.c * x + p.d * y,
    ],
  },
  {
    id: "henon",
    name: "Hénon (with offsets)",
    desc: "henon",
    params: PARAM_KEYS,
    ranges: { a: [0.8, 1.6], b: [0.1, 0.4], c: [-1.0, 1.0], d: [-1.0, 1.0] },
    defaults: { a: 1.4, b: 0.3, c: 0.0, d: 0.0 },
    seed: { x: 0.1, y: 0.0 },
    step: (x, y, p) => [1 - p.a * x * x + y + p.c, p.b * x + p.d],
  },
  {
    id: "lozi",
    name: "Lozi (with offsets)",
    desc: "lozi",
    params: PARAM_KEYS,
    ranges: { a: [1.2, 2.0], b: [0.2, 0.7], c: [-1.0, 1.0], d: [-1.0, 1.0] },
    defaults: { a: 1.7, b: 0.5, c: 0.0, d: 0.0 },
    seed: { x: 0.1, y: 0.0 },
    step: (x, y, p) => [1 - p.a * Math.abs(x) + y + p.c, p.b * x + p.d],
  },
  {
    id: "ikeda",
    name: "Ikeda (4-param)",
    desc: "ikeda",
    params: PARAM_KEYS,
    ranges: { a: [0.0, 1.5], b: [0.5, 0.99], c: [-1.0, 1.0], d: [0.0, 10.0] },
    defaults: { a: 0.4, b: 0.9, c: 0.0, d: 6.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const r2 = x * x + y * y;
      const t = p.c - p.d / (1 + r2);
      const ct = Math.cos(t);
      const st = Math.sin(t);
      return [p.a + p.b * (x * ct - y * st), p.b * (x * st + y * ct)];
    },
  },
  {
    id: "gingerbread",
    name: "Gingerbreadman (generalized)",
    desc: "gingerbread",
    params: PARAM_KEYS,
    ranges: { a: [-2.0, 2.0], b: [0.4, 1.6], c: [0.8, 1.3], d: [-1.0, 1.0] },
    defaults: { a: 1.2, b: 1.0, c: 1.0, d: 0.0 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [p.a - y + p.b * Math.abs(x), p.c * x + p.d],
  },
  {
    id: "popcorn",
    name: "Popcorn",
    desc: "popcorn",
    params: PARAM_KEYS,
    ranges: {
      a: [0.001, 0.06],
      b: [0.001, 0.06],
      c: [-0.5, 0.5],
      d: [-0.5, 0.5],
    },
    defaults: { a: 0.03, b: 0.03, c: 0.0, d: 0.0 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => {
      const safeTan = (v) => {
        const t = Math.tan(v);
        return Number.isFinite(t) ? Math.max(-10, Math.min(10, t)) : 0;
      };
      return [
        x - p.a * Math.sin(y + safeTan(3 * y)) + p.c,
        y - p.b * Math.sin(x + safeTan(3 * x)) + p.d,
      ];
    },
  },
  {
    id: "bedhead",
    name: "Bedhead",
    desc: "bedhead",
    detailX: "x_next = sin(x*y/b)*y+cos(a*x-y)",
    detailY: "y_next = x+sin(y)/b",
    params: PARAM_KEYS,
    ranges: { a: [-1.2, 1.2], b: [0.2, 2.0], c: [0.2, 2.0], d: [-0.8, 0.8] },
    defaults: { a: 0.65, b: 0.73, c: 1.1, d: 0.1 },
    seed: { x: 1.0, y: 1.0 },
    step: (x, y, p) => {
      const safeB = Math.abs(p.b) < 1e-9 ? (p.b < 0 ? -1e-9 : 1e-9) : p.b;
      const safeC = Math.abs(p.c) < 1e-9 ? (p.c < 0 ? -1e-9 : 1e-9) : p.c;
      return [
        Math.sin((x * y) / safeB) * y + Math.cos(p.a * x - y) + p.d,
        x + Math.sin(y) / safeC,
      ];
    },
  },
  {
    id: "jason_rampe_1",
    name: "Jason Rampe 1",
    desc: "rampe 1",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.cos(y * p.b) + p.c * Math.sin(x * p.b),
      Math.cos(x * p.a) + p.d * Math.sin(y * p.a),
    ],
  },
  {
    id: "jason_rampe_2",
    name: "Jason Rampe 2",
    desc: "rampe 2",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.cos(y * p.b) + p.c * Math.cos(x * p.b),
      Math.cos(x * p.a) + p.d * Math.cos(y * p.a),
    ],
  },
  {
    id: "jason_rampe_3",
    name: "Jason Rampe 3",
    desc: "rampe 3",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      Math.sin(y * p.b) + p.c * Math.cos(x * p.b),
      Math.cos(x * p.a) + p.d * Math.sin(y * p.a),
    ],
  },
  {
    id: "johnny_svensson",
    name: "Johnny Svensson",
    desc: "svensson",
    params: PARAM_KEYS,
    ranges: { a: [-3.0, 3.0], b: [-3.0, 3.0], c: [-3.0, 3.0], d: [-3.0, 3.0] },
    defaults: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    seed: { x: 0.1, y: 0.1 },
    step: (x, y, p) => [
      p.d * Math.sin(x * p.a) - Math.sin(y * p.b),
      p.c * Math.cos(x * p.a) + Math.cos(y * p.b),
    ],
  },
  {
    id: "gumowski_mira",
    name: "Gumowski–Mira",
    desc: "gumowski",
    params: PARAM_KEYS,
    ranges: { a: [-0.05, 0.05], b: [-1.0, 1.0], c: [0.0, 1.0], d: [0.3, 1.0] },
    defaults: { a: 0.01, b: -0.7, c: 0.05, d: 0.7 },
    seed: { x: 0.0, y: 0.5 },
    step: (x, y, p) => {
      const f = (u) => p.c * u + (2 * (1 - p.c) * u * u) / (1 + u * u);
      const x1 = y + p.a * (1 - p.b * y * y) * y + f(x);
      return [x1, -x + p.d * f(x1)];
    },
  },
  {
    id: "shifted_hopalong",
    name: "Shifted Hopalong",
    desc: "shifted hop",
    detailX: "x_next = y-1-sqrt(abs(b*x-1-c))*sign(x-1)",
    detailY: "y_next = a-x-1",
    params: PARAM_KEYS,
    ranges: {
      a: [-2.0, 10.0],
      b: [-10.0, 10.0],
      c: [-4.0, 4.0],
      d: [-4.0, 4.0],
    },
    defaults: { a: 7.0, b: 8.0, c: 2.5, d: 1.0 },
    seed: { x: 0.0, y: 0.0 },
    step: (x, y, p) => {
      const xShift = x + p.c;
      const sign = xShift >= 0 ? 1 : -1;
      return [
        y - sign * Math.sqrt(Math.abs(p.b * xShift - p.a)),
        p.a - xShift + p.d,
      ];
    },
  },
];

export const FORMULA_UI_EQUATIONS = {
  classic_sqrt: {
    name: "Classic (sqrt)",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - c|)",
    yNew: "y_new = a - x",
  },
  sqrt_plus_gamma_y: {
    name: "Classic + dy",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * y",
    yNew: "y_new = a - x",
  },
  sqrt_plus_gamma_x: {
    name: "Classic + dx",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * x",
    yNew: "y_new = a - x",
  },
  mix_inside: {
    name: "sqrt inside",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - c|) + d * y",
    yNew: "y_new = a - x",
  },
  trig_kick_x: {
    name: "Trig kick X",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * sin(x)",
    yNew: "y_new = a - x",
  },
  damped: {
    name: "Damped",
    xNew: "x_new = (y - sign(x) * sqrt(|b * x - d|)) * (1 - min(0.95, |c|))",
    yNew: "y_new = a - x",
  },
  y_feedback: {
    name: "Y feedback",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|)",
    yNew: "y_new = a - x + c * y",
  },
  trig_kick_y: {
    name: "Trig kick Y",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * sin(y)",
    yNew: "y_new = a - x",
  },
  classic_plus_yy: {
    name: "Classic + y^2",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * y * y",
    yNew: "y_new = a - x",
  },
  cos_xy_kick: {
    name: "cos(x+y) kick",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * cos(x + y)",
    yNew: "y_new = a - x",
  },
  inside_sin_y: {
    name: "Inside sin(y)",
    xNew: "x_new = y - sign(x) * sqrt(|b * (x + c * sin(y)) - d|)",
    yNew: "y_new = a - x",
  },
  inside_cos_x: {
    name: "Inside cos(x)",
    xNew: "x_new = y - sign(x) * sqrt(|b * (x + c * cos(x)) - d|)",
    yNew: "y_new = a - x",
  },
  softsign_kick: {
    name: "Softsign kick",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * (x / (1 + |x|))",
    yNew: "y_new = a - x",
  },
  tanh_kick: {
    name: "Tanh kick",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * tanh(x)",
    yNew: "y_new = a - x",
  },
  sign_xy: {
    name: "sign(x*y)",
    xNew: "x_new = y - sign(x*y) * sqrt(|b * x - d|)",
    yNew: "y_new = a - x",
  },
  double_root: {
    name: "Double root",
    xNew: "x_new = y - sign(x) * (sqrt(|b * x - d|) + c * sqrt(|b * y - d|))",
    yNew: "y_new = a - x",
  },
  xy_coupling: {
    name: "x*y coupling",
    xNew: "x_new = y - sign(x) * sqrt(|b * x - d|) + c * ((x * y) / 50)",
    yNew: "y_new = a - x",
  },
  positive_hopalong: {
    name: "Positive Hopalong",
    xNew: "x_new = y + sign(x) * sqrt(|b * x - d|)",
    yNew: "y_new = a - x",
  },
  sinusoidal_hopalong: {
    name: "Threeply (abs kick)",
    xNew: "x_new = y - sign(x) * |sin(x) * cos(b) + c - x * sin(a + b + c)|",
    yNew: "y_new = a - x",
  },
  threeply: {
    name: "Threeply",
    xNew: "x_new = y - sign(x) * |sin(x) * cos(b) + c - x * sin(a + b + c)|",
    yNew: "y_new = a - x",
  },
  quadrup2: {
    name: "Quadrup-2",
    xNew: "x_new = y - sign(x) * (sin(log(|b * x - d| + 1e-12)) * atan(log(|d * x - b| + 1e-12) * log(|d * x - b| + 1e-12)))",
    yNew: "y_new = a - x",
  },
  chip: {
    name: "Chip",
    xNew: "x_new = y - sign(x) * (cos((log(|b * x - d| + 1e-12) * log(|b * x - d| + 1e-12))) * atan((log(|b * x - d| + 1e-12) * log(|b * x - d| + 1e-12))))",
    yNew: "y_new = a - x",
  },
  pickover_clifford: {
    name: "Pickover/Clifford",
    xNew: "x_new = 20.0 * (sin(b * y) + c * sin(b * x))",
    yNew: "y_new = 20.0 * (sin(a * x) + d * sin(a * y))",
  },
  peter_de_jong: {
    name: "Ikeda (named “Peter de Jong” in file)",
    xNew: "x_new = a + b * (x * cos(c - d / (1 + (x * x + y * y))) - y * sin(c - d / (1 + (x * x + y * y))))",
    yNew: "y_new = b * (x * sin(c - d / (1 + (x * x + y * y))) + y * cos(c - d / (1 + (x * x + y * y))))",
  },
  clifford: {
    name: "Clifford",
    xNew: "x_new = sin(a * y) + c * cos(a * x)",
    yNew: "y_new = sin(b * x) + d * cos(b * y)",
  },
  fractal_dream: {
    name: "Fractal Dream",
    xNew: "x_new = sin(b * y) + c * sin(b * x)",
    yNew: "y_new = sin(a * x) + d * sin(a * y)",
  },
  tinkerbell: {
    name: "Tinkerbell",
    xNew: "x_new = x * x - y * y + a * x + b * y",
    yNew: "y_new = 2 * x * y + c * x + d * y",
  },
  henon: {
    name: "Henon",
    xNew: "x_new = 1 - a * x * x + y + c",
    yNew: "y_new = b * x + d",
  },
  lozi: {
    name: "Lozi",
    xNew: "x_new = 1 - a * |x| + y + c",
    yNew: "y_new = b * x + d",
  },
  ikeda: {
    name: "Ikeda",
    xNew: "x_new = a + b * (x * cos(c - d / (1 + (x * x + y * y))) - y * sin(c - d / (1 + (x * x + y * y))))",
    yNew: "y_new = b * (x * sin(c - d / (1 + (x * x + y * y))) + y * cos(c - d / (1 + (x * x + y * y))))",
  },
  gingerbread: {
    name: "Gingerbread",
    xNew: "x_new = a - y + b * |x|",
    yNew: "y_new = c * x + d",
  },
  popcorn: {
    name: "Popcorn",
    xNew: "safeTan(u) = (isFinite(tan(u)) ? max(-10, min(10, tan(u))) : 0); x_new = x - a * sin(y + (isFinite(tan(3 * y)) ? max(-10, min(10, tan(3 * y))) : 0)) + c",
    yNew: "safeTan(u) = (isFinite(tan(u)) ? max(-10, min(10, tan(u))) : 0); y_new = y - b * sin(x + (isFinite(tan(3 * x)) ? max(-10, min(10, tan(3 * x))) : 0)) + d",
  },
  bedhead: {
    name: "Bedhead",
    xNew: "x_new = sin((x * y) / (|b| < 1e-9 ? (b < 0 ? -1e-9 : 1e-9) : b)) * y + cos(a * x - y) + d",
    yNew: "y_new = x + sin(y) / (|c| < 1e-9 ? (c < 0 ? -1e-9 : 1e-9) : c)",
  },
  jason_rampe_1: {
    name: "Jason Rampe 1",
    xNew: "x_new = cos(y * b) + c * sin(x * b)",
    yNew: "y_new = cos(x * a) + d * sin(y * a)",
  },
  jason_rampe_2: {
    name: "Jason Rampe 2",
    xNew: "x_new = cos(y * b) + c * cos(x * b)",
    yNew: "y_new = cos(x * a) + d * cos(y * a)",
  },
  jason_rampe_3: {
    name: "Jason Rampe 3",
    xNew: "x_new = sin(y * b) + c * cos(x * b)",
    yNew: "y_new = cos(x * a) + d * sin(y * a)",
  },
  johnny_svensson: {
    name: "Johnny Svensson",
    xNew: "x_new = d * sin(x * a) - sin(y * b)",
    yNew: "y_new = c * cos(x * a) + cos(y * b)",
  },
  gumowski_mira: {
    name: "Gumowski–Mira",
    xNew: "x_new = (y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x))))",
    yNew: "y_new = -x + d * (c * ((y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x))))) + (2 * (1 - c) * ((y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x))))) * ((y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x)))))) / (1 + ((y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x))))) * ((y + a * (1 - b * y * y) * y + (c * (x) + (2 * (1 - c) * (x) * (x)) / (1 + (x) * (x)))))))",
  },
  shifted_hopalong: {
    name: "Shifted Hopalong",
    xNew: "x_new = y - sign(x + c) * sqrt(|b * (x + c) - a|)",
    yNew: "y_new = a - (x + c) + d",
  },
};

export const VARIANTS = FORMULA_DEFS.map((formula) => ({
  id: formula.id,
  name: formula.name,
  desc: formula.desc,
  step: (x, y, a, b, c, d) => formula.step(x, y, { a, b, c, d }),
}));

export const FORMULA_RANGES_RAW = Object.fromEntries(
  FORMULA_DEFS.map((formula) => [formula.id, formula.ranges]),
);
export const FORMULA_DEFAULT_PRESETS = Object.fromEntries(
  FORMULA_DEFS.map((formula) => [formula.id, formula.defaults]),
);
export const FORMULA_DEFAULT_SEEDS = Object.fromEntries(
  FORMULA_DEFS.map((formula) => [formula.id, formula.seed]),
);

export const FORMULA_METADATA = FORMULA_DEFS.map((formula) => ({
  id: formula.id,
  name: formula.name,
  desc: formula.desc,
  detailX: formula.detailX || "",
  detailY: formula.detailY || "",
  usedParams: inferUsedParams(formula),
}));
