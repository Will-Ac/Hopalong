// Colormaps extracted from hopalongv124.html
// Returns RGB arrays [r,g,b] with components 0-255.

function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function lerp3(c1, c2, t) { return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]; }
function fromStops(stops, t) {
  t = clamp01(t);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i];
    const b = stops[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const u = (t - a[0]) / (b[0] - a[0] || 1);
      return lerp3(a[1], b[1], u);
    }
  }
  return stops[stops.length - 1][1];
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
  ];
}

function makeBandedSoftMap({ bands, count, smoothness }) {
  const totalWeight = bands.reduce((sum, band) => sum + band.w, 0);
  const fractions = bands.map((band) => band.w / totalWeight);
  const edges = [0];
  for (const fraction of fractions) {
    edges.push(edges[edges.length - 1] + fraction);
  }

  return (t) => {
    const normalized = clamp01(t);
    const repeated = ((normalized * count) % 1 + 1) % 1;
    let index = 0;
    while (index < bands.length - 1 && repeated > edges[index + 1]) {
      index += 1;
    }

    const bandStart = edges[index];
    const bandEnd = edges[index + 1];
    const bandWidth = Math.max(1e-6, bandEnd - bandStart);
    const blendWidth = (bandWidth * smoothness) / 2;
    const current = hexToRgb(bands[index].hex);

    if (blendWidth <= 0) {
      return current;
    }

    const next = hexToRgb(bands[(index + 1) % bands.length].hex);
    const prev = hexToRgb(bands[(index - 1 + bands.length) % bands.length].hex);

    if (repeated < bandStart + blendWidth) {
      const u = (repeated - bandStart) / blendWidth;
      return lerp3(prev, current, clamp01(u));
    }

    if (repeated > bandEnd - blendWidth) {
      const u = (repeated - (bandEnd - blendWidth)) / blendWidth;
      return lerp3(current, next, clamp01(u));
    }

    return current;
  };
}


function normalizeColorMapName(name) {
  return String(name || "")
    .normalize("NFKC")
    .replace(/[  -​  　]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const ColorMaps = {
  Turbo: (t) => fromStops([
    [0.00, [48, 18, 59]], [0.10, [50, 44, 125]], [0.20, [32, 96, 189]], [0.30, [41, 158, 179]],
    [0.40, [93, 201, 99]], [0.50, [177, 222, 44]], [0.60, [236, 199, 24]], [0.70, [250, 144, 25]],
    [0.80, [243, 85, 38]], [0.90, [206, 41, 57]], [1.00, [122, 4, 3]],
  ], t),
  Viridis: (t) => fromStops([[0, [68, 1, 84]], [0.25, [59, 82, 139]], [0.5, [33, 145, 140]], [0.75, [94, 201, 98]], [1, [253, 231, 37]]], t),
  Magma: (t) => fromStops([[0, [0, 0, 4]], [0.25, [78, 18, 123]], [0.5, [182, 54, 121]], [0.75, [251, 136, 97]], [1, [252, 253, 191]]], t),
  Gray: (t) => { const v = Math.round(255 * clamp01(t)); return [v, v, v]; },
  Ocean: (t) => fromStops([[0, [0, 0, 0]], [0.25, [0, 20, 70]], [0.5, [0, 90, 160]], [0.75, [40, 180, 220]], [1, [220, 250, 255]]], t),
  "H&E": (t) => fromStops([[0, [20, 10, 30]], [0.20, [60, 40, 120]], [0.45, [190, 90, 180]], [0.70, [245, 170, 210]], [1, [255, 245, 250]]], t),
  Giemsa: (t) => fromStops([[0, [10, 8, 30]], [0.25, [30, 60, 140]], [0.50, [80, 140, 170]], [0.75, [210, 180, 120]], [1, [250, 245, 220]]], t),
  Gram: (t) => fromStops([[0, [15, 10, 20]], [0.30, [90, 40, 140]], [0.55, [160, 90, 210]], [0.78, [210, 160, 80]], [1, [245, 245, 235]]], t),
  PAS: (t) => fromStops([[0, [15, 8, 8]], [0.28, [120, 30, 70]], [0.55, [220, 120, 160]], [0.78, [245, 210, 120]], [1, [255, 250, 235]]], t),
  Trichrome: (t) => fromStops([[0, [5, 20, 30]], [0.25, [10, 70, 120]], [0.50, [40, 140, 160]], [0.75, [170, 190, 120]], [1, [245, 245, 230]]], t),
  DAB: (t) => fromStops([[0, [5, 5, 5]], [0.25, [60, 40, 20]], [0.50, [120, 80, 40]], [0.75, [190, 150, 90]], [1, [250, 245, 235]]], t),
  Fluorescein: (t) => fromStops([[0, [0, 0, 0]], [0.15, [0, 30, 10]], [0.40, [0, 120, 40]], [0.70, [60, 220, 90]], [1, [230, 255, 240]]], t),
  Toluidine: (t) => fromStops([[0, [5, 5, 20]], [0.25, [30, 30, 110]], [0.50, [80, 90, 190]], [0.75, [150, 170, 220]], [1, [245, 250, 255]]], t),
  "Safranin+FG": (t) => fromStops([[0, [10, 5, 5]], [0.25, [160, 40, 60]], [0.50, [220, 120, 90]], [0.72, [80, 160, 90]], [1, [235, 250, 235]]], t),

  "Ice → Cyan → White": (t) => fromStops([[0.0, hexToRgb("#DFF6FF")], [0.45, hexToRgb("#6FD3FF")], [0.75, hexToRgb("#00AAFF")], [1.0, hexToRgb("#FFFFFF")]], t),
  "White → Indigo": (t) => fromStops([[0.0, hexToRgb("#FFFFFF")], [0.35, hexToRgb("#C8D0FF")], [0.7, hexToRgb("#6B82FF")], [1.0, hexToRgb("#2F3FAE")]], t),
  "Sand → Coral → Rose": (t) => fromStops([[0.0, hexToRgb("#FFF6E5")], [0.45, hexToRgb("#FFC4A3")], [0.75, hexToRgb("#FF7B89")], [1.0, hexToRgb("#C9184A")]], t),
  "Mint→Teal→Cyan": (t) => fromStops([[0.0, hexToRgb("#F0FFF7")], [0.4, hexToRgb("#8EF6D0")], [0.72, hexToRgb("#1BC5BD")], [1.0, hexToRgb("#087F8C")]], t),
  "White → Gold": (t) => fromStops([[0.0, hexToRgb("#FFFFFF")], [0.35, hexToRgb("#FFF1B0")], [0.7, hexToRgb("#FFC300")], [1.0, hexToRgb("#B8860B")]], t),
  "Blue↔White↔Orange": (t) => fromStops([[0.0, hexToRgb("#6FA8FF")], [0.5, hexToRgb("#FFFFFF")], [1.0, hexToRgb("#FFB366")]], t),
  "Gray→White→Laven": (t) => fromStops([[0.0, hexToRgb("#CFD8DC")], [0.5, hexToRgb("#FFFFFF")], [1.0, hexToRgb("#D8B4F8")]], t),
  "Pastel 5-band soft": makeBandedSoftMap({
    bands: [
      { hex: "#FFFFFF", w: 1 },
      { hex: "#FFE1EA", w: 1 },
      { hex: "#FFE9CC", w: 1 },
      { hex: "#DDEBFF", w: 1 },
      { hex: "#E6FFF2", w: 1 },
      { hex: "#FFFFFF", w: 1 },
    ],
    count: 6,
    smoothness: 0.15,
  }),
  "Gold contour bands": makeBandedSoftMap({
    bands: [
      { hex: "#FFFFFF", w: 1 },
      { hex: "#FFF1B0", w: 1 },
      { hex: "#FFC300", w: 1 },
      { hex: "#B8860B", w: 1 },
      { hex: "#FFC300", w: 1 },
      { hex: "#FFF1B0", w: 1 },
      { hex: "#FFFFFF", w: 1 },
    ],
    count: 5,
    smoothness: 0.12,
  }),
};

ColorMaps.ice_cyan_white = ColorMaps["Ice → Cyan → White"];
ColorMaps.white_indigo = ColorMaps["White → Indigo"];
ColorMaps.sand_coral_rose = ColorMaps["Sand → Coral → Rose"];
ColorMaps.mint_teal_cyan = ColorMaps["Mint→Teal→Cyan"];
ColorMaps.white_gold = ColorMaps["White → Gold"];
ColorMaps.blue_white_orange_soft = ColorMaps["Blue↔White↔Orange"];
ColorMaps.gray_white_lavender_soft = ColorMaps["Gray→White→Laven"];
ColorMaps.pastel_5_band_contour = ColorMaps["Pastel 5-band soft"];
ColorMaps.gold_contour_bands = ColorMaps["Gold contour bands"];

const ColorMapLookup = new Map();
for (const [name, fn] of Object.entries(ColorMaps)) {
  ColorMapLookup.set(normalizeColorMapName(name), fn);
}

export const ColorMapNames = Object.keys(ColorMaps).filter((name) => !name.includes("_"));

export function sampleColorMap(name, t) {
  const fn =
    ColorMaps[name]
    || ColorMapLookup.get(normalizeColorMapName(name))
    || ColorMaps[ColorMapNames[0]];
  return fn ? fn(t) : [255, 255, 255];
}
