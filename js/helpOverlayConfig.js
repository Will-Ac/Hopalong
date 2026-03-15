const line = (action, body, options = {}) => ({ action, body, ...options });

export const HELP_OVERLAY_GROUPS = [
  {
    id: "tile-border-legend",
    group: "legend",
    lines: [
      line("", "fixed", { noAction: true, tilePreview: "solid" }),
      line("", "random", { noAction: true, tilePreview: "dashed" }),
      line("", "vertical control", { noAction: true, tilePreview: "side" }),
      line("", "horizontal control", { noAction: true, tilePreview: "upperLower" }),
    ],
    label: { x: 0.16, y: 0.18 },
    noArrow: true,
  },
  {
    id: "topbar",
    group: "topbar",
    lines: [
      line("", "show/hide interest overlay", { iconSelector: "#overlayToggleBtn", noAction: true }),
      line("", "open/close help", { iconSelector: "#helpBtn", noAction: true }),
      line("", "open/close settings", { iconSelector: "#rangesEditorToggle", noAction: true }),
      line("", "auto/fix scale to screen", { iconSelector: "#scaleModeBtn", noAction: true }),
      line("", "save image", { iconSelector: "#cameraBtn", noAction: true }),
    ],
    label: { x: 0.82, y: 0.18 },
    target: { selector: "#topRightActions", attach: "bottom" },
    noArrow: true,
  },
  {
    id: "canvas-left",
    group: "canvas",
    variant: "canvasSplit",
    lines: [line("Tap left", "previous image")],
    label: { x: 0.42, y: 0.31 },
    noArrow: true,
  },
  {
    id: "canvas-right",
    group: "canvas",
    variant: "canvasSplit",
    lines: [line("Tap right", "next image")],
    label: { x: 0.62, y: 0.31 },
    noArrow: true,
  },
  {
    id: "formula-cmap",
    group: "bottomTiles",
    lines: [
      line("Tap tile", "open selection list"),
      line("Double tap", "toggle fixed/random"),
    ],
    label: { x: 0.0, y: 0.55 },
    align: "leftPinned",
    target: { bracketId: "formula-cmap-group" },
  },
  {
    id: "params",
    group: "params",
    lines: [
      line("Tap tile", "assign / open slider"),
      line("Double tap tile", "toggle fixed or random"),
      line("Swipe down abcd", "assign vertical screen control"),
      line("Swipe right abcd", "assign horizontal screen control"),
      line("Long press abcd", "clear horizontal screen control"),
    ],
    label: { x: 0.56, y: 0.52 },
    target: { bracketId: "params-group" },
  },
  {
    id: "slider",
    group: "slider",
    lines: [
      line("Drag slider", "change assigned item value"),
      line("Double tap header", "set a, b, c or d to zero"),
      line("Tap − or +", "fine control"),
    ],
    label: { x: 0.34, y: 0.62 },
    target: { selector: "#qsLabel", attach: "top" },
    arrowFrom: "bottom-center",
  },
  {
    id: "random",
    group: "random",
    lines: [line("Double tap", "toggle fixed/random")],
    label: { x: 0.88, y: 0.54 },
    target: { selector: "#randomModeBtn", attach: "top" },
  },
];

export const HELP_GROUP_BRACKETS = [
  {
    id: "formula-cmap-group",
    targetSelectors: ["#formulaBtn", "#cmapBtn"],
    side: "top",
  },
  {
    id: "params-group",
    targetSelectors: ["#btnAlpha", "#btnBeta", "#btnDelta", "#btnGamma", "#btnIters"],
    side: "top",
  },
];
