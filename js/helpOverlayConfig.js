const line = (action, body, options = {}) => ({ action, body, ...options });

export const HELP_OVERLAY_GROUPS = [
  {
    id: "canvas-left",
    group: "canvas",
    variant: "canvasSplit",
    lines: [line("Tap left", "previous item in history.")],
    label: { x: 0.36, y: 0.23 },
    noArrow: true,
  },
  {
    id: "canvas-right",
    group: "canvas",
    variant: "canvasSplit",
    lines: [line("Tap right", "next item in history\nor random next, depending on mode.")],
    label: { x: 0.64, y: 0.23 },
    noArrow: true,
  },
  {
    id: "topbar",
    group: "topbar",
    lines: [
      line("View", "show Lyapunov overlay in screen control mode.", { iconSelector: "#overlayToggleBtn" }),
      line("Help", "open or close this help.", { iconSelector: "#helpBtn" }),
      line("Settings", "open or close app settings.", { iconSelector: "#rangesEditorToggle" }),
      line("Auto Scale", "fit content to screen automatically.", { iconSelector: "#scaleModeBtn" }),
      line("Camera", "save image.", { iconSelector: "#cameraBtn" }),
    ],
    label: { x: 0.82, y: 0.27 },
    target: { bracketId: "topbar-group" },
  },
  {
    id: "slider",
    group: "slider",
    lines: [
      line("Drag slider", "change assigned parameter value."),
      line("Double-tap header", "set a, b, c or d to zero."),
      line("Tap − or +", "fine control."),
    ],
    label: { x: 0.34, y: 0.77 },
    target: { selector: "#quickSlider .qsTop", attach: "top" },
  },
  {
    id: "formula-cmap",
    group: "bottomTiles",
    lines: [
      line("Tap tile", "open selection list and adjust settings."),
      line("Double-tap tile", "toggle fixed or random."),
    ],
    label: { x: 0.16, y: 0.68 },
    target: { bracketId: "formula-cmap-group" },
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
    label: { x: 0.61, y: 0.57 },
    target: { bracketId: "params-group" },
  },
  {
    id: "iter",
    group: "iter",
    lines: [
      line("Tap tile", "assign to slider control."),
      line("Double-tap tile", "toggle fixed or random."),
    ],
    label: { x: 0.78, y: 0.86 },
    target: { selector: "#btnIters", attach: "top" },
  },
  {
    id: "random",
    group: "random",
    lines: [line("Double tap", "toggles all random or fixed")],
    label: { x: 0.90, y: 0.58 },
    target: { selector: "#randomModeBtn", attach: "top" },
  },
];

export const HELP_GROUP_BRACKETS = [
  {
    id: "topbar-group",
    targetSelectors: ["#overlayToggleBtn", "#helpBtn", "#rangesEditorToggle", "#scaleModeBtn", "#cameraBtn"],
    side: "left",
  },
  {
    id: "formula-cmap-group",
    targetSelectors: ["#formulaBtn", "#cmapBtn"],
    side: "top",
  },
  {
    id: "params-group",
    targetSelectors: ["#btnAlpha", "#btnBeta", "#btnDelta", "#btnGamma"],
    side: "top",
  },
];
