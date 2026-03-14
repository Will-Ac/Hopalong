const line = (action, body) => ({ action, body });

export const HELP_OVERLAY_GROUPS = [
  {
    id: "canvas-left",
    group: "canvas",
    lines: [line("Tap left", "previous item in history.")],
    label: { x: 0.30, y: 0.22 },
    targets: [{ point: { x: 0.24, y: 0.50 } }],
  },
  {
    id: "canvas-right",
    group: "canvas",
    lines: [line("Tap right", "next item in history or random next, depending on mode.")],
    label: { x: 0.59, y: 0.22 },
    targets: [{ point: { x: 0.76, y: 0.50 } }],
  },
  {
    id: "topbar",
    group: "topbar",
    lines: [
      line("View", "show Lyapunov overlay in screen control mode."),
      line("Help", "open or close this help."),
      line("Settings", "open or close app settings."),
      line("Auto Scale", "fit content to screen automatically."),
      line("Camera", "save image."),
    ],
    label: { x: 0.84, y: 0.24 },
    targets: [
      { selector: "#overlayToggleBtn", attach: "left" },
      { selector: "#helpBtn", attach: "left" },
      { selector: "#rangesEditorToggle", attach: "left" },
      { selector: "#scaleModeBtn", attach: "left" },
      { selector: "#cameraBtn", attach: "left" },
    ],
  },
  {
    id: "slider",
    group: "slider",
    lines: [
      line("Drag slider", "change assigned parameter value."),
      line("Double-tap header", "set a, b, c or d to zero."),
      line("Tap − or +", "fine control."),
    ],
    label: { x: 0.50, y: 0.70 },
    targets: [
      { selector: "#quickSlider", attach: "top" },
      { selector: "#quickSlider .qsTop", attach: "top-left" },
      { selector: "#quickSlider .qsControlRow", attach: "top-right" },
    ],
  },
  {
    id: "formula-cmap",
    group: "bottomTiles",
    lines: [
      line("Tap tile", "open selection list and adjust settings."),
      line("Double-tap tile", "toggle fixed or random."),
    ],
    label: { x: 0.14, y: 0.74 },
    targets: [
      { selector: "#formulaBtn", attach: "top" },
      { selector: "#cmapBtn", attach: "top" },
    ],
  },
  {
    id: "params",
    group: "params",
    lines: [
      line("Tap tile", "assign to slider control."),
      line("Double-tap tile", "toggle fixed or random."),
      line("Swipe up or down", "assign vertical screen control."),
      line("Swipe left or right", "assign horizontal screen control."),
      line("Long press", "clear screen control assignment."),
    ],
    label: { x: 0.45, y: 0.73 },
    targets: [
      { selector: "#btnAlpha", attach: "top" },
      { selector: "#btnBeta", attach: "top" },
      { selector: "#btnDelta", attach: "top" },
      { selector: "#btnGamma", attach: "top" },
    ],
  },
  {
    id: "iter",
    group: "iter",
    lines: [
      line("Tap tile", "assign to slider control."),
      line("Double-tap tile", "toggle fixed or random."),
    ],
    label: { x: 0.73, y: 0.74 },
    targets: [{ selector: "#btnIters", attach: "top" }],
  },
  {
    id: "random",
    group: "random",
    lines: [line("Double-tap this tile", "toggles all tiles to random or fixed.")],
    label: { x: 0.90, y: 0.74 },
    targets: [{ selector: "#randomModeBtn", attach: "top" }],
  },
];

export const HELP_GROUP_BRACKETS = [
  {
    id: "formula-cmap-group",
    targetSelectors: ["#formulaBtn", "#cmapBtn"],
  },
  {
    id: "params-group",
    targetSelectors: ["#btnAlpha", "#btnBeta", "#btnDelta", "#btnGamma"],
  },
];
