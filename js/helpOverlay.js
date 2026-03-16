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
};

const SELECTOR_TO_TARGET_KEY = Object.fromEntries(
  Object.entries(TARGET_SELECTORS).map(([key, selector]) => [selector, key]),
);

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
      strictHorizontalFromAnchor: "topbarRight",
    },
    preferredPlacement: { primitive: "targetAligned", targetKey: "topRightActions", xAlign: "right", yFrom: "bottom", offsetY: LAYOUT.topbarGap },
    fallbackPlacements: [
      { primitive: "targetAligned", targetKey: "topRightActions", xAlign: "right", yFrom: "bottom", offsetY: 4 },
      { primitive: "anchorBand", anchorKey: "topbarRight", xAlign: "right", band: "top", offsetY: 0 },
    ],
  },
  "tile-border-legend": {
    priority: 2,
    wrappingAllowed: true,
    shrinkAllowed: true,
    anchors: { primary: "leftBottomTile" },
    preferredPlacement: { primitive: "anchorBand", anchorKey: "leftBottomTile", xAlign: "left", band: "alignWithGroup", groupId: "topbar" },
    fallbackPlacements: [
      { primitive: "relativeToGroup", groupId: "topbar", relation: "below", xFromAnchor: "leftBottomTile", xAlign: "left", gap: 8 },
      { primitive: "anchorBand", anchorKey: "leftBottomTile", xAlign: "left", band: "top" },
    ],
  },
  "canvas-left": {
    priority: 3,
    wrappingAllowed: true,
    maxLines: 2,
    shrinkAllowed: true,
    constraints: { preserveSideOfCenter: "left" },
    preferredPlacement: { primitive: "centerSplit", side: "left", yMode: "betweenTopAndUi", avoidAboveGroupId: "tile-border-legend" },
    fallbackPlacements: [
      { primitive: "centerSplit", side: "left", yMode: "betweenTopAndUi", avoidAboveGroupId: "tile-border-legend" },
    ],
  },
  "canvas-right": {
    priority: 3,
    wrappingAllowed: true,
    maxLines: 2,
    shrinkAllowed: true,
    dependencyIds: ["canvas-left"],
    constraints: { preserveSideOfCenter: "right" },
    preferredPlacement: { primitive: "centerSplit", side: "right", yMode: "matchGroup", groupId: "canvas-left" },
    fallbackPlacements: [
      { primitive: "centerSplit", side: "right", yMode: "matchGroup", groupId: "canvas-left" },
    ],
  },
  params: {
    priority: 4,
    wrappingAllowed: true,
    shrinkAllowed: true,
    preferredPlacement: { primitive: "relativeToTarget", targetKey: "quickSlider", relation: "aboveRight", offsetX: 14, offsetY: 12 },
    fallbackPlacements: [
      { primitive: "relativeToGroup", groupId: "slider", relation: "aboveRight", gap: 10 },
      { primitive: "viewportBand", xAlign: "center", band: "middle", offsetX: 24 },
      { primitive: "relativeToGroup", groupId: "slider", relation: "below", gap: 10 },
    ],
  },
  slider: {
    priority: 5,
    wrappingAllowed: true,
    shrinkAllowed: true,
    preferredPlacement: { primitive: "relativeToGroup", groupId: "params", relation: "leftBelow", gap: 8 },
    fallbackPlacements: [
      { primitive: "relativeToGroup", groupId: "params", relation: "leftAbove", gap: 8 },
      { primitive: "relativeToTarget", targetKey: "quickSlider", relation: "leftAbove", offsetX: 8, offsetY: 8 },
    ],
  },
  "formula-cmap": {
    priority: 6,
    wrappingAllowed: true,
    shrinkAllowed: true,
    anchors: { primary: "leftBottomTile" },
    constraints: { strictHorizontalFromAnchor: "leftBottomTile" },
    preferredPlacement: { primitive: "anchorBand", anchorKey: "leftBottomTile", xAlign: "left", band: "nearRefGroupTop", bandRefGroupId: "params" },
    fallbackPlacements: [
      { primitive: "anchorBand", anchorKey: "leftBottomTile", xAlign: "left", band: "higherRefGroup", bandRefGroupId: "topbar" },
      { primitive: "anchorBand", anchorKey: "leftBottomTile", xAlign: "left", band: "uiTop" },
    ],
  },
  random: {
    priority: 7,
    wrappingAllowed: true,
    shrinkAllowed: true,
    anchors: { primary: "rightBottomTile" },
    constraints: { strictHorizontalFromAnchor: "rightBottomTile" },
    preferredPlacement: { primitive: "anchorBand", anchorKey: "rightBottomTile", xAlign: "right", band: "nearRefGroupTop", bandRefGroupId: "params" },
    fallbackPlacements: [
      { primitive: "anchorBand", anchorKey: "rightBottomTile", xAlign: "right", band: "higherRefGroup", bandRefGroupId: "topbar" },
      { primitive: "anchorBand", anchorKey: "rightBottomTile", xAlign: "right", band: "uiTop" },
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

function buildHelpItemRegistry() {
  return HELP_OVERLAY_GROUPS.map((group) => {
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

function resolveBandY(layout, placement, ctx) {
  const { margin, uiTop, placed } = ctx;

  if (placement.band === "top") return margin + (placement.offsetY || 0);
  if (placement.band === "middle") return Math.max(margin, uiTop - layout.height - 12) + (placement.offsetY || 0);
  if (placement.band === "uiTop") return uiTop - layout.height - 8 + (placement.offsetY || 0);
  if (placement.band === "nearRefGroupTop") {
    const ref = placed.get(placement.bandRefGroupId || "");
    return Math.max((ref?.y || uiTop) - layout.height - 10, margin) + (placement.offsetY || 0);
  }
  if (placement.band === "higherRefGroup") {
    const ref = placed.get(placement.bandRefGroupId || "");
    return Math.max(margin, (ref?.y || uiTop * 0.4)) + (placement.offsetY || 0);
  }
  if (placement.band === "alignWithGroup") {
    const group = placed.get(placement.groupId || "");
    return (group ? group.y : margin) + (placement.offsetY || 0);
  }

  return margin;
}

function resolveAlignedX(layout, placement, ctx, anchorX = null, targetRect = null, groupRect = null) {
  const { viewportWidth, margin } = ctx;
  if (placement.xAlign === "left") return (anchorX ?? targetRect?.left ?? groupRect?.x ?? margin) + (placement.offsetX || 0);
  if (placement.xAlign === "right") {
    const rightRef = anchorX ?? targetRect?.right ?? (groupRect ? groupRect.x + groupRect.width : viewportWidth - margin);
    return rightRef - layout.width + (placement.offsetX || 0);
  }
  return (targetRect ? targetRect.left + (targetRect.width - layout.width) / 2 : viewportWidth / 2 - layout.width / 2) + (placement.offsetX || 0);
}

function buildCandidate(layout, placement, ctx) {
  const { rects, placed, anchors, viewportWidth, margin, uiTop } = ctx;
  const targetRect = placement.targetKey ? rects.get(placement.targetKey) : null;
  const groupRect = placement.groupId ? placed.get(placement.groupId) : null;
  const anchor = placement.anchorKey ? anchors.get(placement.anchorKey) : null;
  const anchorX = anchor?.x;
  const centerX = anchors.get("viewportCenter")?.x ?? (viewportWidth / 2);

  if (placement.primitive === "targetAligned") {
    if (!targetRect) return null;
    const x = resolveAlignedX(layout, placement, ctx, anchorX, targetRect, null);
    const yBase = placement.yFrom === "bottom" ? targetRect.bottom : targetRect.top;
    const y = yBase + (placement.offsetY || 0);
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "anchorBand") {
    const x = resolveAlignedX(layout, placement, ctx, anchorX, null, null);
    const y = resolveBandY(layout, placement, ctx);
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "viewportBand") {
    const x = resolveAlignedX(layout, placement, ctx, null, null, null);
    const y = resolveBandY(layout, placement, ctx);
    return candidateRect(x, y, layout.width, layout.height);
  }

  if (placement.primitive === "relativeToTarget") {
    if (!targetRect) return null;
    const rel = placement.relation;
    const relationMap = {
      aboveRight: { x: targetRect.right + (placement.offsetX || 0), y: targetRect.top - layout.height - (placement.offsetY || 0) },
      leftAbove: { x: targetRect.left - layout.width - (placement.offsetX || 0), y: targetRect.top - layout.height - (placement.offsetY || 0) },
    };
    const pos = relationMap[rel];
    return pos ? candidateRect(pos.x, pos.y, layout.width, layout.height) : null;
  }

  if (placement.primitive === "relativeToGroup") {
    if (!groupRect) return null;
    const gap = placement.gap || 8;
    const anchorAlignedX = placement.xFromAnchor ? resolveAlignedX(layout, { ...placement, xAlign: placement.xAlign || "left" }, ctx, anchors.get(placement.xFromAnchor)?.x) : null;
    const relationMap = {
      below: { x: anchorAlignedX ?? groupRect.x, y: groupRect.y + groupRect.height + gap },
      aboveRight: { x: groupRect.x + groupRect.width + gap, y: groupRect.y - layout.height - gap },
      leftBelow: { x: groupRect.x - layout.width - gap, y: groupRect.y + groupRect.height + gap },
      leftAbove: { x: groupRect.x - layout.width - gap, y: groupRect.y - layout.height - gap },
    };
    const pos = relationMap[placement.relation];
    return pos ? candidateRect(pos.x, pos.y, layout.width, layout.height) : null;
  }

  if (placement.primitive === "centerSplit") {
    const side = placement.side;
    const y = placement.yMode === "matchGroup"
      ? (groupRect ? groupRect.y : margin)
      : (() => {
        const avoidGroup = placed.get(placement.avoidAboveGroupId || "");
        const minY = avoidGroup ? avoidGroup.y + avoidGroup.height + 8 : margin + 34;
        const maxY = Math.max(minY, uiTop - layout.height - 10);
        return clamp((minY + maxY) / 2, minY, maxY);
      })();
    const x = side === "left"
      ? centerX - LAYOUT.dividerTapGap - layout.width
      : centerX + LAYOUT.dividerTapGap;
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
  const strictAnchor = layout.item.policy.constraints?.strictHorizontalFromAnchor;
  if (!strictAnchor) return null;
  const anchor = ctx.anchors.get(strictAnchor);
  if (!anchor) return null;
  const preferred = layout.item.policy.preferredPlacement;
  if (preferred?.xAlign === "right") return anchor.x - layout.width;
  if (preferred?.xAlign === "left") return anchor.x;
  return null;
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

    const registry = buildHelpItemRegistry();
    const activeItems = resolveActiveItems(registry, rects);
    const models = buildLabelModels(activeItems);
    const layouts = createOrMeasureLabels({ models, viewportWidth, margin });

    const forbiddenRegions = buildUiForbiddenRegions(rects, uiTop, viewportWidth, margin);
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
    for (const bracket of HELP_GROUP_BRACKETS) {
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

  function isHelpButtonEvent(event) {
    if (!helpButton || !event) return false;
    const target = event.target;
    if (target instanceof Element && target.closest(TARGET_SELECTORS.helpButton)) return true;
    if (typeof event.composedPath === "function") return event.composedPath().includes(helpButton);
    return false;
  }

  const blockers = ["pointerdown", "pointerup", "click", "dblclick", "contextmenu", "touchstart", "touchmove", "touchend", "wheel"];

  const blockEvents = (event) => {
    if (!state.open) return;
    if (isHelpButtonEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  };

  const onKeyDown = (event) => {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (isHelpButtonEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  const onResize = () => scheduleRender();

  function bindEvents() {
    blockers.forEach((eventName) => document.addEventListener(eventName, blockEvents, true));
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
  }

  function unbindEvents() {
    blockers.forEach((eventName) => document.removeEventListener(eventName, blockEvents, true));
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
