import { HELP_GROUP_BRACKETS, HELP_OVERLAY_GROUPS } from "./helpOverlayConfig.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const LAYOUT = {
  marginDesktop: 12,
  topAttachYOffset: 18,
  sideAttachOffset: 12,
  bottomAttachOffset: 12,
  sideClampY: 12,
  verticalClampX: 14,
  dividerTapGap: 15,
  dividerHeightFallback: 108,
  dividerYOffsetFactor: 0.22,
  bracketTopOffset: 24,
  bracketLeftOffset: 18,
  bracketStub: 10,
  sliderArrowXOffset: 14,
  sliderArrowYOffset: 14,
  alignedTileGuideOffset: 5,
  topbarGap: 10,
  markerWidth: 6,
  markerHeight: 6,
  markerRefX: 5,
  markerRefY: 3,
};

const TARGET_SELECTORS = {
  helpButton: "#helpBtn",
  viewButton: "#overlayToggleBtn",
  settingsButton: "#rangesEditorToggle",
  autoScaleButton: "#scaleModeBtn",
  cameraButton: "#cameraBtn",
  topRightActions: "#topRightActions",
  paramOverlay: "#paramOverlay",
  quickSlider: "#quickSlider",
  formulaTile: "#formulaBtn",
  colorMapTile: "#cmapBtn",
  alphaTile: "#btnAlpha",
  betaTile: "#btnBeta",
  gammaTile: "#btnGamma",
  deltaTile: "#btnDelta",
  iterTile: "#btnIters",
  randomTile: "#randomModeTile",
  randomButton: "#randomModeBtn",
  quickSliderLabel: "#qsLabel",
  pickerPanel: "#pickerPanel",
  pickerClose: "#pickerClose",
  formulaPickerOption: ".formulaPickerOption",
  formulaPickerSettings: ".formulaPickerSettingsBtn",
  colorPickerOption: ".colorPickerOption",
  colorPickerSettings: ".colorPickerSettingsBtn",
  rangesEditorPanel: "#rangesEditorPanel",
  rangesEditorClose: "#rangesEditorClose",
  settingsTabColor: "#settingsTabColor",
  settingsTabGeneral: "#settingsTabGeneral",
};

const SELECTOR_TO_TARGET_KEY = Object.fromEntries(
  Object.entries(TARGET_SELECTORS).map(([key, selector]) => [selector, key]),
);

const MAIN_HELP_ITEMS = HELP_OVERLAY_GROUPS;

const PANEL_HELP_ITEMS = {
  formulaPanel: [
    {
      id: "panel-formula-choose",
      group: "panel",
      lines: [{ action: "Choose formula", body: "tap a formula" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: ".formulaPickerOption", attach: "center" },
    },
    {
      id: "panel-formula-settings",
      group: "panel",
      lines: [{ action: "Open settings", body: "tap the gear" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: ".formulaPickerSettingsBtn", attach: "center" },
    },
    {
      id: "panel-formula-close",
      group: "panel",
      lines: [{ action: "Close panel", body: "tap ×" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: "#pickerClose", attach: "center" },
    },
  ],
  colorPanel: [
    {
      id: "panel-color-choose",
      group: "panel",
      lines: [{ action: "Choose color map", body: "tap a map" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: ".colorPickerOption", attach: "center" },
    },
    {
      id: "panel-color-settings",
      group: "panel",
      lines: [{ action: "Open settings", body: "tap the gear" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: ".colorPickerSettingsBtn", attach: "center" },
    },
    {
      id: "panel-color-close",
      group: "panel",
      lines: [{ action: "Close panel", body: "tap ×" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: "#pickerClose", attach: "center" },
    },
  ],
  settingsPanel: [
    {
      id: "panel-settings-color",
      group: "panel",
      lines: [{ action: "Color tab", body: "open color settings" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: "#settingsTabColor", attach: "center" },
    },
    {
      id: "panel-settings-general",
      group: "panel",
      lines: [{ action: "General tab", body: "open general settings" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: "#settingsTabGeneral", attach: "center" },
    },
    {
      id: "panel-settings-close",
      group: "panel",
      lines: [{ action: "Close panel", body: "tap ×" }],
      label: { x: 0.2, y: 0.2 },
      target: { selector: "#rangesEditorClose", attach: "center" },
    },
  ],
};

const HELP_CONTEXT_PANEL_SELECTORS = {
  formulaPanel: "#pickerPanel",
  colorPanel: "#pickerPanel",
  settingsPanel: "#rangesEditorPanel",
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function unionRects(rects) {
  const valid = rects.filter(Boolean);
  if (!valid.length) return null;
  const left = Math.min(...valid.map((r) => r.left));
  const top = Math.min(...valid.map((r) => r.top));
  const right = Math.max(...valid.map((r) => r.right));
  const bottom = Math.max(...valid.map((r) => r.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function pointFromRect(rect, attach = "center") {
  switch (attach) {
    case "top":
      return { x: rect.left + rect.width / 2, y: rect.top - LAYOUT.topAttachYOffset };
    case "left":
      return { x: rect.left - LAYOUT.sideAttachOffset, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.right + LAYOUT.sideAttachOffset, y: rect.top + rect.height / 2 };
    case "bottom":
      return { x: rect.left + rect.width / 2, y: rect.bottom + LAYOUT.bottomAttachOffset };
    default:
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
}

function lineAttachPoint(labelRect, toPoint) {
  const centerX = labelRect.left + labelRect.width / 2;
  const centerY = labelRect.top + labelRect.height / 2;
  const dx = toPoint.x - centerX;
  const dy = toPoint.y - centerY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx >= 0 ? labelRect.right : labelRect.left,
      y: clamp(toPoint.y, labelRect.top + LAYOUT.sideClampY, labelRect.bottom - LAYOUT.sideClampY),
    };
  }

  return {
    x: clamp(toPoint.x, labelRect.left + LAYOUT.verticalClampX, labelRect.right - LAYOUT.verticalClampX),
    y: dy >= 0 ? labelRect.bottom : labelRect.top,
  };
}

function getArrowSourcePoint(labelRect, mode) {
  if (mode === "bottom-center") {
    return { x: labelRect.left + labelRect.width / 2, y: labelRect.bottom };
  }
  if (mode === "top-center") {
    return { x: labelRect.left + labelRect.width / 2, y: labelRect.top };
  }
  return null;
}

function expandRect(rect, padding = 0) {
  if (!rect) return null;
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function createHelpOverlay(options) {
  const { helpButton, ensureSliderOpen, isSliderOpen, onOpened, onClosed } = options;

  const state = {
    open: false,
    autoOpenedSlider: false,
    renderFrame: 0,
    domReady: false,
  };

  const targetCache = new Map();
  const dom = {
    rootEl: null,
    dimmerEl: null,
    svgEl: null,
    labelsLayer: null,
    centerDivider: null,
  };

  function getElementBySelector(selector) {
    if (!selector) return null;
    const key = SELECTOR_TO_TARGET_KEY[selector];
    if (!key) return document.querySelector(selector);
    const cached = targetCache.get(key);
    if (cached?.isConnected) return cached;
    const found = document.querySelector(selector);
    if (found) targetCache.set(key, found);
    return found;
  }

  function getRect(selectorOrElement) {
    const element = typeof selectorOrElement === "string"
      ? getElementBySelector(selectorOrElement)
      : selectorOrElement;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return rect;
  }

  function makeTopbarIcon(iconSelector) {
    const source = getElementBySelector(iconSelector);
    const icon = document.createElement("span");
    icon.className = "helpOverlay__inlineIcon";

    if (iconSelector === TARGET_SELECTORS.autoScaleButton) {
      icon.classList.add("is-autoscale");
    }

    if (!source) {
      icon.textContent = "?";
      return icon;
    }

    const svg = source.querySelector("svg");
    if (svg) {
      icon.innerHTML = svg.outerHTML;
      return icon;
    }

    const helpChar = source.querySelector(".helpIcon");
    if (helpChar) {
      icon.textContent = helpChar.textContent?.trim() || "?";
      return icon;
    }

    icon.textContent = (source.textContent || "").trim().replace(/\s+/g, " ") || "•";
    return icon;
  }

  function makeTilePreviewIcon(style = "solid") {
    const tile = document.createElement("span");
    tile.className = `helpOverlay__tilePreview helpOverlay__tilePreview--${style}`;
    return tile;
  }

  function buildGroupLabel(group) {
    const el = document.createElement("div");
    el.className = `helpOverlay__label helpOverlay__label--${group.group}`;
    if (group.variant === "canvasSplit") {
      el.classList.add("helpOverlay__label--canvasSplit");
    }

    for (const row of group.lines) {
      const rowEl = document.createElement("div");
      rowEl.className = "helpOverlay__row";

      if (row.iconSelector) rowEl.append(makeTopbarIcon(row.iconSelector));
      if (row.tilePreview) rowEl.append(makeTilePreviewIcon(row.tilePreview));

      const textWrap = document.createElement("div");
      textWrap.className = "helpOverlay__rowText";

      if (row.heading) {
        const headingEl = document.createElement("strong");
        const headingDelimiter = row.delimiter ?? ":";
        headingEl.textContent = `${row.action}${headingDelimiter}`;
        textWrap.append(headingEl);
        rowEl.append(textWrap);
        el.append(rowEl);
        continue;
      }

      const hasAction = !row.noAction && Boolean(row.action);
      if (hasAction) {
        const actionEl = document.createElement("strong");
        const delimiter = row.delimiter ?? ":";
        actionEl.textContent = `${row.action}${delimiter}`;
        textWrap.append(actionEl);
      }

      const bodyEl = document.createElement("span");
      bodyEl.textContent = row.body;
      textWrap.append(bodyEl);
      rowEl.append(textWrap);
      el.append(rowEl);
    }

    return el;
  }

  function ensureDom() {
    if (state.domReady) return;

    const rootEl = document.createElement("div");
    rootEl.id = "helpOverlay";
    rootEl.setAttribute("aria-hidden", "true");

    const dimmerEl = document.createElement("div");
    dimmerEl.className = "helpOverlay__dimmer";

    const svgEl = document.createElementNS(SVG_NS, "svg");
    svgEl.classList.add("helpOverlay__lines");
    svgEl.setAttribute("preserveAspectRatio", "none");

    const defs = document.createElementNS(SVG_NS, "defs");
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", "helpArrowHead");
    marker.setAttribute("markerWidth", String(LAYOUT.markerWidth));
    marker.setAttribute("markerHeight", String(LAYOUT.markerHeight));
    marker.setAttribute("refX", String(LAYOUT.markerRefX));
    marker.setAttribute("refY", String(LAYOUT.markerRefY));
    marker.setAttribute("orient", "auto");

    const markerPath = document.createElementNS(SVG_NS, "path");
    markerPath.setAttribute("d", "M0,0 L6,3 L0,6 Z");
    markerPath.setAttribute("fill", "rgba(255,255,255,0.95)");
    marker.append(markerPath);
    defs.append(marker);
    svgEl.append(defs);

    const labelsLayer = document.createElement("div");
    labelsLayer.className = "helpOverlay__labels";

    const centerDivider = document.createElement("div");
    centerDivider.className = "helpOverlay__centerDivider";

    rootEl.append(dimmerEl, svgEl, centerDivider, labelsLayer);
    document.body.append(rootEl);

    dom.rootEl = rootEl;
    dom.dimmerEl = dimmerEl;
    dom.svgEl = svgEl;
    dom.labelsLayer = labelsLayer;
    dom.centerDivider = centerDivider;
    state.domReady = true;
  }

  function cacheTargetElements() {
    for (const [key, selector] of Object.entries(TARGET_SELECTORS)) {
      const existing = targetCache.get(key);
      if (existing?.isConnected) continue;
      const found = document.querySelector(selector);
      if (found) {
        targetCache.set(key, found);
      } else {
        targetCache.delete(key);
      }
    }
  }

  function resolveTargetRects() {
    const rects = new Map();
    for (const [key, selector] of Object.entries(TARGET_SELECTORS)) {
      const rect = getRect(selector);
      if (rect) rects.set(key, rect);
    }
    return rects;
  }

  function clearGraphics() {
    dom.labelsLayer.innerHTML = "";
    dom.svgEl.querySelectorAll("line,path:not(defs path)").forEach((node) => node.remove());
  }

  function drawArrow(from, to) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("stroke", "rgba(255,255,255,0.93)");
    line.setAttribute("stroke-width", "1.15");
    line.setAttribute("marker-end", "url(#helpArrowHead)");
    dom.svgEl.append(line);
  }

  function drawBracket(rect, side = "top", forcedTopY = null) {
    if (side === "left") {
      const x = rect.left - LAYOUT.bracketLeftOffset;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", `M ${x + LAYOUT.bracketStub} ${rect.top} L ${x} ${rect.top} L ${x} ${rect.bottom} L ${x + LAYOUT.bracketStub} ${rect.bottom}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(255,255,255,0.92)");
      path.setAttribute("stroke-width", "1");
      dom.svgEl.append(path);
      return { x, y: rect.top + (rect.bottom - rect.top) / 2 };
    }

    const y = Number.isFinite(forcedTopY) ? forcedTopY : rect.top - LAYOUT.bracketTopOffset;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", `M ${rect.left} ${y + LAYOUT.bracketStub} L ${rect.left} ${y} L ${rect.right} ${y} L ${rect.right} ${y + LAYOUT.bracketStub}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,0.92)");
    path.setAttribute("stroke-width", "1");
    dom.svgEl.append(path);
    return { x: rect.left + (rect.right - rect.left) / 2, y };
  }

function overlapArea(a, b) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (width <= 0 || height <= 0) return 0;
  return width * height;
}

function layoutRect(layout) {
  return {
    left: layout.x,
    top: layout.y,
    right: layout.x + layout.width,
    bottom: layout.y + layout.height,
  };
}

const HELP_PLACEMENT_POLICY = {
  topbar: {
    priority: 1,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["topRightActions"],
    constraints: {
      lockAxis: { axis: "x", lockToSourceType: "anchor", lockToSourceKey: "topbarRight", lockToEdge: "right" },
    },
    preferredPlacement: {
      primitive: "targetAligned",
      targetKey: "topRightActions",
      alignment: { sourceType: "target", sourceEdge: "right", selfEdge: "right", offset: 0 },
      vertical: { sourceEdge: "bottom", offset: LAYOUT.topbarGap },
    },
    fallbackPlacements: [
      {
        primitive: "targetAligned",
        targetKey: "topRightActions",
        alignment: { sourceType: "target", sourceEdge: "right", selfEdge: "right", offset: 0 },
        vertical: { sourceEdge: "bottom", offset: 4 },
      },
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "topbarRight", sourceEdge: "x", selfEdge: "right", offset: 0 },
        band: { sourceType: "viewport", position: "top", offset: 0 },
      },
    ],
  },
  "tile-border-legend": {
    priority: 2,
    wrappingAllowed: true,
    shrinkAllowed: true,
    preferredPlacement: {
      primitive: "anchorBand",
      alignment: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
      band: { sourceType: "group", sourceGroup: "topbar", position: "alignTop", offset: 0 },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToGroup",
        groupId: "topbar",
        relation: {
          x: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
          y: { sourceEdge: "bottom", selfEdge: "top", offset: 8 },
        },
      },
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
        band: { sourceType: "viewport", position: "top", offset: 0 },
      },
    ],
  },
  "canvas-left": {
    priority: 3,
    wrappingAllowed: true,
    maxLines: 2,
    shrinkAllowed: true,
    constraints: { preserveSideOfCenter: "left" },
    preferredPlacement: {
      primitive: "centerSplit",
      centerAnchorKey: "viewportCenter",
      side: "left",
      gap: LAYOUT.dividerTapGap,
      band: { sourceType: "between", sourceGroup: "topbar", position: "center", minY: 8, bottomPadding: 180 },
    },
    fallbackPlacements: [
      {
        primitive: "centerSplit",
        centerAnchorKey: "viewportCenter",
        side: "left",
        gap: LAYOUT.dividerTapGap,
        band: { sourceType: "between", sourceGroup: "topbar", position: "center", minY: 8, bottomPadding: 180 },
      },
    ],
  },
  "canvas-right": {
    priority: 3,
    wrappingAllowed: true,
    maxLines: 2,
    shrinkAllowed: true,
    dependencyIds: ["canvas-left"],
    constraints: { preserveSideOfCenter: "right" },
    preferredPlacement: {
      primitive: "centerSplit",
      centerAnchorKey: "viewportCenter",
      side: "right",
      gap: LAYOUT.dividerTapGap,
      band: { sourceType: "group", sourceGroup: "canvas-left", position: "alignTop", offset: 0 },
    },
    fallbackPlacements: [
      {
        primitive: "centerSplit",
        centerAnchorKey: "viewportCenter",
        side: "right",
        gap: LAYOUT.dividerTapGap,
        band: { sourceType: "group", sourceGroup: "canvas-left", position: "alignTop", offset: 0 },
      },
    ],
  },
  params: {
    priority: 4,
    wrappingAllowed: true,
    shrinkAllowed: true,
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "canvas-left",
      relation: {
        x: { sourceType: "anchor", sourceKey: "viewportCenter", sourceEdge: "x", selfEdge: "left", offset: 16 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 20 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToGroup",
        groupId: "canvas-left",
        relation: {
          x: { sourceType: "anchor", sourceKey: "viewportCenter", sourceEdge: "x", selfEdge: "center", offset: -120 },
          y: { sourceEdge: "bottom", selfEdge: "top", offset: 20 },
        },
      },
      {
        primitive: "relativeToTarget",
        targetKey: "quickSlider",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "bottom", offset: 12 },
        },
      },
    ],
  },
  slider: {
    priority: 5,
    wrappingAllowed: true,
    shrinkAllowed: true,
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "params",
      relation: {
        x: { sourceEdge: "left", selfEdge: "right", offset: -16 },
        y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToGroup",
        groupId: "params",
        relation: {
          x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
          y: { sourceEdge: "bottom", selfEdge: "top", offset: 20 },
        },
      },
      {
        primitive: "viewportBand",
        alignment: { sourceType: "viewport", sourceEdge: "center", selfEdge: "center", offset: -120 },
        band: { sourceType: "viewport", position: "top", y: 250, offset: 0 },
      },
    ],
  },
  "formula-cmap": {
    priority: 6,
    wrappingAllowed: true,
    shrinkAllowed: true,
    constraints: {
      lockAxis: { axis: "x", lockToSourceType: "anchor", lockToSourceKey: "leftBottomTile", lockToEdge: "left" },
    },
    preferredPlacement: {
      primitive: "anchorBand",
      alignment: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
      band: { sourceType: "group", sourceGroup: "params", position: "above", offset: 12 },
    },
    fallbackPlacements: [
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
        band: { sourceType: "uiTop", position: "above", offset: 14 },
      },
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "leftBottomTile", sourceEdge: "x", selfEdge: "left", offset: 0 },
        band: { sourceType: "groupOrViewportRatio", sourceGroup: "topbar", position: "alignTop", ratio: 0.5, offset: 0 },
      },
    ],
  },
  random: {
    priority: 7,
    wrappingAllowed: true,
    shrinkAllowed: true,
    constraints: {
      lockAxis: { axis: "x", lockToSourceType: "anchor", lockToSourceKey: "rightBottomTile", lockToEdge: "right" },
    },
    preferredPlacement: {
      primitive: "anchorBand",
      alignment: { sourceType: "anchor", sourceKey: "rightBottomTile", sourceEdge: "x", selfEdge: "right", offset: 0 },
      band: { sourceType: "group", sourceGroup: "params", position: "above", offset: 12 },
    },
    fallbackPlacements: [
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "rightBottomTile", sourceEdge: "x", selfEdge: "right", offset: 0 },
        band: { sourceType: "uiTop", position: "above", offset: 14 },
      },
      {
        primitive: "anchorBand",
        alignment: { sourceType: "anchor", sourceKey: "rightBottomTile", sourceEdge: "x", selfEdge: "right", offset: 0 },
        band: { sourceType: "groupOrViewportRatio", sourceGroup: "topbar", position: "alignTop", ratio: 0.5, offset: 0 },
      },
    ],
  },
  "panel-formula-choose": {
    priority: 3,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["formulaPickerOption"],
    dependencyIds: ["panel-formula-settings"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-formula-settings",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "formulaPickerOption",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-formula-settings": {
    priority: 2,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["formulaPickerSettings"],
    dependencyIds: ["panel-formula-close"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-formula-close",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "formulaPickerSettings",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-formula-close": {
    priority: 1,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["pickerClose"],
    preferredPlacement: {
      primitive: "relativeToTarget",
      targetKey: "pickerClose",
      relation: {
        x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
        y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "pickerPanel",
        relation: {
          x: { sourceEdge: "left", selfEdge: "right", offset: -14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 12 },
        },
      },
    ],
  },
  "panel-color-choose": {
    priority: 3,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["colorPickerOption"],
    dependencyIds: ["panel-color-settings"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-color-settings",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "colorPickerOption",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-color-settings": {
    priority: 2,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["colorPickerSettings"],
    dependencyIds: ["panel-color-close"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-color-close",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "colorPickerSettings",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-color-close": {
    priority: 1,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["pickerClose"],
    preferredPlacement: {
      primitive: "relativeToTarget",
      targetKey: "pickerClose",
      relation: {
        x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
        y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "pickerPanel",
        relation: {
          x: { sourceEdge: "left", selfEdge: "right", offset: -14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 12 },
        },
      },
    ],
  },
  "panel-settings-color": {
    priority: 2,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["rangesEditorPanel", "settingsTabColor"],
    dependencyIds: ["panel-settings-close"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-settings-close",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "settingsTabColor",
        relation: {
          x: { sourceEdge: "left", selfEdge: "right", offset: -14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-settings-general": {
    priority: 3,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["settingsTabGeneral"],
    dependencyIds: ["panel-settings-color"],
    preferredPlacement: {
      primitive: "relativeToGroup",
      groupId: "panel-settings-color",
      relation: {
        x: { sourceEdge: "left", selfEdge: "left", offset: 0 },
        y: { sourceEdge: "bottom", selfEdge: "top", offset: 10 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "settingsTabGeneral",
        relation: {
          x: { sourceEdge: "left", selfEdge: "right", offset: -14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
        },
      },
    ],
  },
  "panel-settings-close": {
    priority: 1,
    wrappingAllowed: true,
    shrinkAllowed: true,
    requiredTargets: ["rangesEditorClose"],
    preferredPlacement: {
      primitive: "relativeToTarget",
      targetKey: "rangesEditorClose",
      relation: {
        x: { sourceEdge: "left", selfEdge: "right", offset: -14 },
        y: { sourceEdge: "top", selfEdge: "top", offset: 0 },
      },
    },
    fallbackPlacements: [
      {
        primitive: "relativeToTarget",
        targetKey: "rangesEditorPanel",
        relation: {
          x: { sourceEdge: "right", selfEdge: "left", offset: 14 },
          y: { sourceEdge: "top", selfEdge: "top", offset: 12 },
        },
      },
    ],
  },
};

const ANCHOR_RESOLVERS = {
  leftBottomTile: ({ rects, margin }) => ({ x: rects.get("formulaTile")?.left ?? margin }),
  rightBottomTile: ({ rects, viewportWidth }) => ({ x: rects.get("randomTile")?.right ?? viewportWidth }),
  topbarRight: ({ rects, viewportWidth, margin }) => ({ x: rects.get("topRightActions")?.right ?? (viewportWidth - margin) }),
  viewportCenter: ({ viewportWidth }) => ({ x: viewportWidth / 2 }),
};

function resolveAnchors(ctx) {
  const anchors = new Map();
  for (const [key, resolver] of Object.entries(ANCHOR_RESOLVERS)) {
    anchors.set(key, resolver(ctx));
  }
  return anchors;
}

function buildHelpItemRegistry(groups) {
  return groups.map((group) => {
    const policy = HELP_PLACEMENT_POLICY[group.id] || {
      priority: 50,
      wrappingAllowed: true,
      shrinkAllowed: true,
      preferredPlacement: { primitive: "viewportBand", xAlign: "center", band: "middle" },
      fallbackPlacements: [{ primitive: "viewportBand", xAlign: "center", band: "middle" }],
    };
    return {
      id: group.id,
      group,
      policy,
      dependencyIds: policy.dependencyIds || [],
      visibleWhen: policy.visibleWhen || (() => true),
    };
  });
}

function resolveVisibleHelpContexts() {
  const activeContexts = options.getActiveHelpContexts?.() || [];
  if (!activeContexts.length) {
    return ["main"];
  }

  const visibleContexts = [];
  for (const context of activeContexts) {
    const panelRect = getRect(HELP_CONTEXT_PANEL_SELECTORS[context]);
    if (!panelRect) continue;
    const overlapsVisibleContext = visibleContexts.some(
      (visible) => overlapArea(panelRect, visible.rect) > 0,
    );
    if (!overlapsVisibleContext) {
      visibleContexts.push({ context, rect: panelRect });
    }
  }

  return visibleContexts.length
    ? visibleContexts.map((item) => item.context)
    : ["main"];
}

function resolveHelpContent() {
  const activeContexts = resolveVisibleHelpContexts();
  if (activeContexts.length === 1 && activeContexts[0] === "main") {
    return { groups: MAIN_HELP_ITEMS, brackets: HELP_GROUP_BRACKETS, activeContexts: [] };
  }

  return {
    groups: activeContexts.flatMap((context) => PANEL_HELP_ITEMS[context] || []),
    brackets: [],
    activeContexts,
  };
}

function buildPanelForbiddenRegions(activeContexts) {
  return activeContexts
    .map((context) => expandRect(getRect(HELP_CONTEXT_PANEL_SELECTORS[context]), 8))
    .filter(Boolean);
}

function resolveActiveItems(registry, rects) {
  const initiallyActive = registry.filter((item) => {
    if (!item.visibleWhen({ rects })) return false;
    const requiredTargets = item.policy.requiredTargets || [];
    if (requiredTargets.some((key) => !rects.has(key))) return false;
    const directTargetSelector = item.group.target?.selector;
    if (directTargetSelector) {
      const targetKey = SELECTOR_TO_TARGET_KEY[directTargetSelector];
      if (!rects.has(targetKey)) return false;
    }
    return true;
  });

  const activeIds = new Set(initiallyActive.map((item) => item.id));
  return initiallyActive.filter((item) => item.dependencyIds.every((depId) => activeIds.has(depId)));
}

function buildLabelModels(activeItems) {
  return activeItems.map((item) => ({ item, group: item.group }));
}

function createOrMeasureLabels({ models, viewportWidth, margin }) {
  const layouts = [];

  for (const model of models) {
    const { group, item } = model;
    const labelEl = buildGroupLabel(group);
    dom.labelsLayer.append(labelEl);

    const measured = labelEl.getBoundingClientRect();
    const x = clamp(group.label.x * viewportWidth - measured.width / 2, margin, viewportWidth - measured.width - margin);

    layouts.push({
      item,
      group,
      labelEl,
      x: Math.round(x),
      y: margin,
      width: measured.width,
      height: measured.height,
      fontScale: 1,
      wrapped: false,
    });
  }

  return layouts;
}

function setLabelMeasureStyle(layout, variant, viewportWidth) {
  const { labelEl, item } = layout;
  labelEl.style.maxWidth = "";
  labelEl.style.fontSize = "";

  if (variant.wrapped) {
    const wrapFactor = layout.group.variant === "canvasSplit" ? 0.16 : 0.25;
    const minWidth = layout.group.variant === "canvasSplit" ? 110 : 170;
    const maxLines = item.policy.maxLines || 4;
    const widthForLines = Math.floor(viewportWidth * wrapFactor);
    const wrapWidth = Math.max(minWidth, Math.floor(widthForLines * (maxLines <= 2 ? 0.9 : 1)));
    labelEl.style.maxWidth = `${wrapWidth}px`;
  }

  if (variant.fontScale < 1) {
    labelEl.style.fontSize = `${Math.max(11, Math.round(13 * variant.fontScale))}px`;
  }

  const measured = labelEl.getBoundingClientRect();
  layout.width = measured.width;
  layout.height = measured.height;
  layout.wrapped = variant.wrapped;
  layout.fontScale = variant.fontScale;
}

function buildUiForbiddenRegions(rects, uiTop, viewportWidth, margin) {
  const keys = [
    "topRightActions", "paramOverlay", "quickSlider", "formulaTile", "colorMapTile", "alphaTile",
    "betaTile", "gammaTile", "deltaTile", "iterTile", "randomTile", "quickSliderLabel",
  ];

  const regions = [];
  for (const key of keys) {
    const rect = rects.get(key);
    if (rect) regions.push(rect);
  }

  regions.push({
    left: margin,
    top: uiTop,
    right: viewportWidth - margin,
    bottom: uiTop + 1,
    width: viewportWidth - margin * 2,
    height: 1,
  });

  return regions;
}

function placementVariants(layout) {
  const variants = [{ wrapped: false, fontScale: 1 }];
  if (layout.item.policy.wrappingAllowed) variants.push({ wrapped: true, fontScale: 1 });
  if (layout.item.policy.shrinkAllowed) {
    variants.push({ wrapped: false, fontScale: 0.92 });
    variants.push({ wrapped: true, fontScale: 0.92 });
    variants.push({ wrapped: true, fontScale: 0.86 });
  }
  return variants;
}

function candidateRect(x, y, width, height) {
  return {
    x: Math.round(x),
    y: Math.round(y),
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
  };
}

function getRectEdge(rect, edge) {
  if (!rect) return null;
  if (edge === "left") return rect.left;
  if (edge === "right") return rect.right;
  if (edge === "top") return rect.top;
  if (edge === "bottom") return rect.bottom;
  if (edge === "centerX" || edge === "center") return rect.left + rect.width / 2;
  if (edge === "centerY") return rect.top + rect.height / 2;
  return null;
}

function getSelfEdgeOffset(layout, selfEdge) {
  if (selfEdge === "left" || selfEdge === "top") return 0;
  if (selfEdge === "right") return layout.width;
  if (selfEdge === "bottom") return layout.height;
  if (selfEdge === "center" || selfEdge === "centerX") return layout.width / 2;
  if (selfEdge === "centerY") return layout.height / 2;
  return 0;
}

// Generic interpreter for policy-defined vertical band parameters; avoid item-specific rules here.
function resolveBandY(layout, bandSpec = {}, ctx) {
  const { margin, uiTop, placed } = ctx;
  const sourceType = bandSpec.sourceType || "viewport";
  const position = bandSpec.position || "top";
  const offset = bandSpec.offset || 0;

  if (sourceType === "viewport") {
    if (position === "middle") return Math.max(margin, uiTop - layout.height - 12) + offset;
    return margin + offset + (bandSpec.y || 0);
  }

  if (sourceType === "uiTop") {
    return uiTop - layout.height - offset;
  }

  if (sourceType === "group") {
    const group = placed.get(bandSpec.sourceGroup || "");
    if (position === "above") return Math.max((group?.y ?? uiTop) - layout.height - offset, margin);
    return (group ? group.y : margin) + offset;
  }

  if (sourceType === "groupOrViewportRatio") {
    const group = placed.get(bandSpec.sourceGroup || "");
    const fallback = uiTop * (bandSpec.ratio ?? 0.4);
    return Math.max(group?.y ?? fallback, margin) + offset;
  }

  if (sourceType === "between") {
    const avoidGroup = placed.get(bandSpec.sourceGroup || "");
    const minY = avoidGroup ? avoidGroup.y + avoidGroup.height + 8 : margin + (bandSpec.minY || 34);
    const maxY = Math.max(minY, uiTop - layout.height - (bandSpec.bottomPadding || 10));
    return clamp((minY + maxY) / 2, minY, maxY) + offset;
  }

  return margin;
}

// Generic interpreter for policy-defined horizontal alignment parameters; avoid item-specific rules here.
function resolveAlignedX(layout, alignment = {}, ctx, refs = {}) {
  const { viewportWidth, margin, anchors } = ctx;
  const { targetRect = null, groupRect = null } = refs;

  const sourceType = alignment.sourceType || "viewport";
  const sourceEdge = alignment.sourceEdge || "left";
  const selfEdge = alignment.selfEdge || "left";
  const offset = alignment.offset || 0;

  let sourceValue = null;
  if (sourceType === "anchor") sourceValue = anchors.get(alignment.sourceKey || "")?.x ?? null;
  if (sourceType === "target") sourceValue = getRectEdge(targetRect, sourceEdge);
  if (sourceType === "group") {
    const rect = groupRect
      ? { left: groupRect.x, top: groupRect.y, width: groupRect.width, height: groupRect.height, right: groupRect.x + groupRect.width, bottom: groupRect.y + groupRect.height }
      : null;
    sourceValue = getRectEdge(rect, sourceEdge);
  }
  if (sourceType === "viewport") {
    if (sourceEdge === "right") sourceValue = viewportWidth - margin;
    else if (sourceEdge === "center") sourceValue = viewportWidth / 2;
    else sourceValue = margin;
  }

  if (!Number.isFinite(sourceValue)) sourceValue = margin;
  return sourceValue - getSelfEdgeOffset(layout, selfEdge) + offset;
}

// Generic interpreter for policy-defined axis-lock constraints; avoid item-specific rules here.
function resolveAxisLock(layout, ctx) {
  const lock = layout.item.policy.constraints?.lockAxis;
  if (!lock || lock.axis !== "x") return null;

  const sourceType = lock.lockToSourceType || "anchor";
  let sourceValue = null;
  if (sourceType === "anchor") sourceValue = ctx.anchors.get(lock.lockToSourceKey || "")?.x ?? null;
  if (sourceType === "viewportCenter") sourceValue = ctx.anchors.get("viewportCenter")?.x ?? (ctx.viewportWidth / 2);

  if (!Number.isFinite(sourceValue)) return null;
  return sourceValue - getSelfEdgeOffset(layout, lock.lockToEdge || "left") + (lock.lockOffset || 0);
}

function resolveRelationAxis(layout, relationAxis = {}, sourceRect, ctx) {
  if (!sourceRect) return null;
  const sourceEdge = relationAxis.sourceEdge || "left";
  const selfEdge = relationAxis.selfEdge || "left";
  const sourceValue = getRectEdge(sourceRect, sourceEdge);
  if (!Number.isFinite(sourceValue)) return null;
  return sourceValue - getSelfEdgeOffset(layout, selfEdge) + (relationAxis.offset || 0);
}

function buildCandidate(layout, placement, ctx) {
  const { rects, placed, anchors, viewportWidth, margin } = ctx;
  const targetRect = placement.targetKey ? rects.get(placement.targetKey) : null;
  const groupRect = placement.groupId ? placed.get(placement.groupId) : null;
  const centerX = anchors.get(placement.centerAnchorKey || "viewportCenter")?.x ?? (viewportWidth / 2);

  if (placement.primitive === "targetAligned") {
    if (!targetRect) return null;
    const x = resolveAlignedX(layout, placement.alignment, ctx, { targetRect });
    const vertical = placement.vertical || { sourceEdge: "bottom", offset: 0 };
    const y = getRectEdge(targetRect, vertical.sourceEdge || "bottom") + (vertical.offset || 0) - getSelfEdgeOffset(layout, vertical.selfEdge || "top");
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "anchorBand" || placement.primitive === "viewportBand") {
    const x = resolveAlignedX(layout, placement.alignment, ctx, { targetRect, groupRect });
    const y = resolveBandY(layout, placement.band, ctx);
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "relativeToTarget") {
    if (!targetRect) return null;
    const relation = placement.relation || {};
    const x = resolveRelationAxis(layout, relation.x, targetRect, ctx);
    const y = resolveRelationAxis(layout, relation.y, targetRect, ctx);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "relativeToGroup") {
    if (!groupRect) return null;
    const relation = placement.relation || {};
    const sourceRect = {
      left: groupRect.x,
      right: groupRect.x + groupRect.width,
      top: groupRect.y,
      bottom: groupRect.y + groupRect.height,
      width: groupRect.width,
      height: groupRect.height,
    };
    const x = relation.x?.sourceType === "anchor"
      ? resolveAlignedX(layout, relation.x, ctx)
      : resolveRelationAxis(layout, relation.x, sourceRect, ctx);
    const y = resolveRelationAxis(layout, relation.y, sourceRect, ctx);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "centerSplit") {
    const x = placement.side === "left"
      ? centerX - (placement.gap || LAYOUT.dividerTapGap) - layout.width
      : centerX + (placement.gap || LAYOUT.dividerTapGap);
    const y = resolveBandY(layout, placement.band, ctx);
    return candidateRect(x, y, layout.width, layout.height);
  }

  return null;
}

function generateCandidates(layout, ctx) {
  const { preferredPlacement, fallbackPlacements = [] } = layout.item.policy;
  const ordered = [preferredPlacement, ...fallbackPlacements];
  return ordered.map((placement) => buildCandidate(layout, placement, ctx)).filter(Boolean);
}

function getStrictX(layout, ctx) {
  return resolveAxisLock(layout, ctx);
}

function scoreCandidate(layout, candidate, ctx, preferredCandidate) {
  const { forbiddenRegions, viewportWidth, margin, uiTop, placedRects } = ctx;
  const rect = {
    left: candidate.x,
    top: candidate.y,
    right: candidate.x + layout.width,
    bottom: candidate.y + layout.height,
  };

  const strictX = getStrictX(layout, ctx);
  const minX = Number.isFinite(strictX) ? 0 : margin;
  const maxX = Number.isFinite(strictX) ? viewportWidth : viewportWidth - margin;
  if (rect.left < minX || rect.right > maxX || rect.top < margin || rect.bottom > uiTop - margin) {
    return { valid: false, score: Number.POSITIVE_INFINITY };
  }

  for (const region of forbiddenRegions) {
    if (overlapArea(rect, region) > 0) return { valid: false, score: Number.POSITIVE_INFINITY };
  }
  for (const placedRect of placedRects) {
    if (overlapArea(rect, placedRect.rect) > 0) return { valid: false, score: Number.POSITIVE_INFINITY };
  }

  const side = layout.item.policy.constraints?.preserveSideOfCenter;
  const centerX = ctx.anchors.get("viewportCenter")?.x ?? (viewportWidth / 2);
  if (side === "left" && rect.right > centerX) return { valid: false, score: Number.POSITIVE_INFINITY };
  if (side === "right" && rect.left < centerX) return { valid: false, score: Number.POSITIVE_INFINITY };

  let score = 0;
  if (preferredCandidate) score += Math.abs(candidate.x - preferredCandidate.x) + Math.abs(candidate.y - preferredCandidate.y);

  const targetSelector = layout.group.target?.selector;
  const targetRect = targetSelector ? ctx.rects.get(SELECTOR_TO_TARGET_KEY[targetSelector]) : null;
  if (targetRect) {
    const to = pointFromRect(targetRect, layout.group.target.attach || "center");
    const from = { x: rect.left + layout.width / 2, y: rect.top + layout.height / 2 };
    score += Math.hypot(to.x - from.x, to.y - from.y) * 0.08;
  }

  if (layout.wrapped) score += 45;
  if (layout.fontScale < 1) score += (1 - layout.fontScale) * 850;
  if (Number.isFinite(strictX)) score += Math.abs(rect.left - strictX) * 2;

  return { valid: true, score };
}

function findFirstFreeSpot(layout, ctx, placedRects, lockX = null) {
  const step = 10;
  const maxY = Math.max(ctx.margin, ctx.uiTop - layout.height - ctx.margin);
  const xStart = Number.isFinite(lockX) ? lockX : ctx.margin;
  const xEnd = Number.isFinite(lockX) ? lockX : (ctx.viewportWidth - layout.width - ctx.margin);

  for (let y = ctx.margin; y <= maxY; y += step) {
    for (let x = xStart; x <= xEnd; x += step) {
      const rect = { left: x, top: y, right: x + layout.width, bottom: y + layout.height };
      if (ctx.forbiddenRegions.some((region) => overlapArea(rect, region) > 0)) continue;
      if (placedRects.some((placedRect) => overlapArea(rect, placedRect.rect) > 0)) continue;
      return { x, y };
    }
  }

  return null;
}

function placeGroupsInPriorityOrder(ctx) {
  const sorted = [...ctx.layouts].sort((a, b) => a.item.policy.priority - b.item.policy.priority || a.group.id.localeCompare(b.group.id));
  const placed = new Map();
  const placedRects = [];

  for (const layout of sorted) {
    if (!layout.item.dependencyIds.every((id) => placed.has(id))) continue;

    let best = null;
    const preferredCandidate = buildCandidate(layout, layout.item.policy.preferredPlacement, { ...ctx, placed });

    for (const variant of placementVariants(layout)) {
      setLabelMeasureStyle(layout, variant, ctx.viewportWidth);
      const candidates = generateCandidates(layout, { ...ctx, placed });
      for (const candidate of candidates) {
        const scored = scoreCandidate(layout, candidate, { ...ctx, placedRects, placed }, preferredCandidate);
        if (!scored.valid) continue;
        if (!best || scored.score < best.score) best = { ...candidate, score: scored.score };
      }
      if (best && variant.fontScale === 1) break;
    }

    if (!best) {
      setLabelMeasureStyle(layout, { wrapped: true, fontScale: 0.86 }, ctx.viewportWidth);
      const lockX = getStrictX(layout, ctx);
      const free = findFirstFreeSpot(layout, ctx, placedRects, lockX);
      if (free) {
        best = free;
      } else {
        best = {
          x: Number.isFinite(lockX) ? lockX : clamp(layout.x, ctx.margin, ctx.viewportWidth - layout.width - ctx.margin),
          y: clamp(ctx.margin, ctx.margin, ctx.uiTop - layout.height - ctx.margin),
        };
      }
    }

    layout.x = Math.round(best.x);
    layout.y = Math.round(best.y);
    placed.set(layout.group.id, layout);
    placedRects.push({ id: layout.group.id, rect: layoutRect(layout) });
  }
}

function clampPlacedGroupsToViewport(ctx) {
  for (const layout of ctx.layouts) {
    const strictX = getStrictX(layout, ctx);
    const minX = Number.isFinite(strictX) ? 0 : ctx.margin;
    const maxX = Number.isFinite(strictX)
      ? ctx.viewportWidth - layout.width
      : ctx.viewportWidth - layout.width - ctx.margin;
    layout.x = clamp(layout.x, minX, maxX);
    layout.y = clamp(layout.y, ctx.margin, ctx.uiTop - layout.height - ctx.margin);
  }
}

function renderCanvasDivider({ viewportHeight, layouts }) {
    const leftTap = layouts.find((item) => item.group.id === "canvas-left");
    const rightTap = layouts.find((item) => item.group.id === "canvas-right");
    if (!leftTap || !rightTap) {
      dom.centerDivider.style.display = "none";
      return;
    }
    dom.centerDivider.style.display = "";
    const tapLineCenterY = leftTap && rightTap
      ? Math.round((leftTap.y + leftTap.height / 2 + rightTap.y + rightTap.height / 2) / 2)
      : Math.round(viewportHeight * LAYOUT.dividerYOffsetFactor);

    const tapLineHeight = leftTap && rightTap
      ? Math.round(Math.max(leftTap.height, rightTap.height) * 2)
      : LAYOUT.dividerHeightFallback;

    dom.centerDivider.style.top = `${Math.round(tapLineCenterY - tapLineHeight / 2)}px`;
    dom.centerDivider.style.height = `${tapLineHeight}px`;
  }

  function renderLabels(layouts) {
    for (const layout of layouts) {
      layout.labelEl.style.left = `${layout.x}px`;
      layout.labelEl.style.top = `${layout.y}px`;
    }
  }

  function renderArrows(ctx) {
    const { layouts, bracketMidpoints, tileTopEdge, alignedBottomGuideY } = ctx;

    for (const layout of layouts) {
      if (layout.group.noArrow) continue;

      const labelRect = layout.labelEl.getBoundingClientRect();
      let targetPoint = null;

      if (layout.group.target?.bracketId) {
        targetPoint = bracketMidpoints.get(layout.group.target.bracketId) || null;
      } else if (layout.group.target?.selector) {
        const targetRect = getRect(layout.group.target.selector);
        if (targetRect) {
          targetPoint = pointFromRect(targetRect, layout.group.target.attach);
          if (layout.group.id !== "slider" && layout.group.target.attach === "top" && targetRect.top >= tileTopEdge - 2) {
            targetPoint.y = alignedBottomGuideY;
          }
          if (layout.group.id === "slider") {
            targetPoint.x -= LAYOUT.sliderArrowXOffset;
            targetPoint.y += LAYOUT.sliderArrowYOffset;
          }
        }
      }

      if (!targetPoint) continue;
      const forcedSource = getArrowSourcePoint(labelRect, layout.group.arrowFrom);
      drawArrow(forcedSource || lineAttachPoint(labelRect, targetPoint), targetPoint);
    }
  }

  function render() {
    if (!state.open) return;

    ensureDom();
    cacheTargetElements();
    clearGraphics();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = LAYOUT.marginDesktop;
    const rects = resolveTargetRects();

    dom.svgEl.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);
    dom.centerDivider.style.left = `${Math.round(viewportWidth / 2)}px`;

    const paramOverlayRect = rects.get("paramOverlay") || null;
    const quickSliderRect = rects.get("quickSlider") || null;
    const uiTop = Math.min(
      Number.isFinite(paramOverlayRect?.top) ? paramOverlayRect.top : viewportHeight,
      Number.isFinite(quickSliderRect?.top) ? quickSliderRect.top : viewportHeight,
    );
    const tileTopEdge = Number.isFinite(paramOverlayRect?.top) ? paramOverlayRect.top : uiTop;
    const alignedBottomGuideY = Math.round(tileTopEdge - LAYOUT.alignedTileGuideOffset);

    const { groups, brackets, activeContexts = [] } = resolveHelpContent();
    const registry = buildHelpItemRegistry(groups);
    const activeItems = resolveActiveItems(registry, rects);
    const models = buildLabelModels(activeItems);
    const layouts = createOrMeasureLabels({ models, viewportWidth, margin });

    const forbiddenRegions = buildUiForbiddenRegions(rects, uiTop, viewportWidth, margin);
    forbiddenRegions.push(...buildPanelForbiddenRegions(activeContexts));
    const anchors = resolveAnchors({ rects, viewportWidth, viewportHeight, margin, uiTop });

    placeGroupsInPriorityOrder({
      layouts,
      rects,
      viewportWidth,
      viewportHeight,
      margin,
      uiTop,
      forbiddenRegions,
      anchors,
    });

    clampPlacedGroupsToViewport({ layouts, viewportWidth, margin, uiTop, rects, anchors });

    const bracketMidpoints = new Map();
    for (const bracket of brackets) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getRect(selector)));
      if (!rect) continue;
      const midpoint = drawBracket(rect, bracket.side, bracket.side === "top" ? alignedBottomGuideY : null);
      bracketMidpoints.set(bracket.id, midpoint);
    }

    renderLabels(layouts);
    renderCanvasDivider({ viewportHeight, layouts });
    renderArrows({ layouts, bracketMidpoints, tileTopEdge, alignedBottomGuideY });
  }

  function scheduleRender() {
    if (!state.open || state.renderFrame) return;
    state.renderFrame = window.requestAnimationFrame(() => {
      state.renderFrame = 0;
      render();
    });
  }

  function setButtonState(active) {
    helpButton?.classList.toggle("is-active", active);
    helpButton?.setAttribute("aria-pressed", active ? "true" : "false");
  }


  const onKeyDown = (event) => {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
  };

  const onResize = () => scheduleRender();

  function bindEvents() {
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
  }

  function unbindEvents() {
    document.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
  }

  function open() {
    if (state.open) return;

    if (!isSliderOpen()) {
      ensureSliderOpen();
      state.autoOpenedSlider = true;
    } else {
      state.autoOpenedSlider = false;
    }

    ensureDom();
    state.open = true;
    dom.rootEl.classList.add("is-open");
    dom.rootEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("helpOverlay-active");
    setButtonState(true);
    render();
    onOpened?.();
  }

  function close() {
    if (!state.open) return;

    state.open = false;
    if (state.renderFrame) {
      window.cancelAnimationFrame(state.renderFrame);
      state.renderFrame = 0;
    }

    dom.rootEl?.classList.remove("is-open");
    dom.rootEl?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("helpOverlay-active");
    setButtonState(false);

    if (state.autoOpenedSlider) options.closeSlider?.();
    onClosed?.();
  }

  function toggle() {
    if (state.open) {
      close();
    } else {
      open();
    }
  }

  function destroy() {
    close();
    unbindEvents();
    targetCache.clear();
    dom.rootEl?.remove();
    state.domReady = false;
  }

  ensureDom();
  cacheTargetElements();
  bindEvents();

  return {
    open,
    close,
    toggle,
    isOpen: () => state.open,
    render,
    scheduleRender,
    destroy,
  };
}
