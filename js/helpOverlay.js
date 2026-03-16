import { HELP_GROUP_BRACKETS, HELP_OVERLAY_GROUPS } from "./helpOverlayConfig.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const LAYOUT = {
  mobileBreakpoint: 430,
  marginDesktop: 12,
  marginMobile: 8,
  labelGapDesktop: 10,
  labelGapMobile: 8,
  minLabelWidthMobile: 180,
  topAttachYOffset: 18,
  sideAttachOffset: 12,
  bottomAttachOffset: 12,
  sideClampY: 12,
  verticalClampX: 14,
  dividerTapGap: 15,
  dividerHeightFallback: 108,
  dividerYOffsetFactor: 0.22,
  canvasSplitGap: 56,
  bracketTopOffset: 24,
  bracketLeftOffset: 18,
  bracketStub: 10,
  collisionPad: 8,
  collisionSafetyLimit: 40,
  collisionFallbackPad: 6,
  sliderArrowXOffset: 14,
  sliderArrowYOffset: 14,
  alignedTileGuideOffset: 5,
  topbarDesktopGap: 10,
  topbarMobileGap: 6,
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

function buildHelpItemRegistry() {
  const placements = {
    topbar: { priority: 1, wrap: true, shrink: true },
    'tile-border-legend': { priority: 2, wrap: true, shrink: true },
    'canvas-left': { priority: 3, wrap: true, maxLines: 2, shrink: true },
    'canvas-right': { priority: 3, wrap: true, maxLines: 2, shrink: true },
    params: { priority: 4, wrap: true, shrink: true },
    slider: { priority: 5, wrap: true, shrink: true },
    'formula-cmap': { priority: 6, wrap: true, shrink: true },
    random: { priority: 7, wrap: true, shrink: true },
  };

  return HELP_OVERLAY_GROUPS.map((group) => ({
    id: group.id,
    group,
    placement: placements[group.id] || { priority: 50, wrap: true, shrink: true },
    visibleWhen: () => true,
  }));
}

function resolveActiveItems(registry, rects) {
  return registry.filter((item) => {
    if (!item.visibleWhen?.({ rects })) return false;
    const targetSelector = item.group.target?.selector;
    if (!targetSelector) return true;
    return true;
  });
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
    let x = clamp(group.label.x * viewportWidth - measured.width / 2, margin, viewportWidth - measured.width - margin);
    if (group.align === "leftPinned") x = margin;

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
  const { labelEl, group } = layout;
  labelEl.style.maxWidth = '';
  labelEl.style.fontSize = '';
  if (variant.wrapped) {
    const wrapWidth = group.variant === 'canvasSplit'
      ? Math.max(110, Math.floor(viewportWidth * 0.17))
      : Math.max(170, Math.floor(viewportWidth * 0.24));
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
    'topRightActions', 'paramOverlay', 'quickSlider', 'formulaTile', 'colorMapTile', 'alphaTile',
    'betaTile', 'gammaTile', 'deltaTile', 'iterTile', 'randomTile', 'quickSliderLabel',
  ];
  const regions = [];
  for (const key of keys) {
    const rect = rects.get(key);
    if (rect) regions.push(rect);
  }
  regions.push({ left: margin, top: uiTop, right: viewportWidth - margin, bottom: uiTop + 1, width: viewportWidth - margin * 2, height: 1 });
  return regions;
}

function candidateRect(x, y, width, height) {
  return { x: Math.round(x), y: Math.round(y), width, height, left: x, top: y, right: x + width, bottom: y + height };
}

function generateCandidates(layout, ctx) {
  const { id } = layout.group;
  const { rects, viewportWidth, margin, uiTop, anchorLeft, anchorRight, placed } = ctx;
  const candidates = [];
  const topbarRect = rects.get('topRightActions');
  const quickSliderRect = rects.get('quickSlider');
  const topbarPlaced = placed.get('topbar');
  const legendPlaced = placed.get('tile-border-legend');
  const paramsPlaced = placed.get('params');
  const sliderPlaced = placed.get('slider');
  const centerX = viewportWidth / 2;
  const yTop = margin;

  if (id === 'topbar') {
    if (topbarRect) {
      candidates.push(candidateRect(topbarRect.right - layout.width, topbarRect.bottom + LAYOUT.topbarDesktopGap, layout.width, layout.height));
      candidates.push(candidateRect(topbarRect.left - layout.width - 8, topbarRect.bottom + 4, layout.width, layout.height));
    }
    candidates.push(candidateRect(viewportWidth - margin - layout.width, yTop, layout.width, layout.height));
  } else if (id === 'tile-border-legend') {
    const preferredY = topbarPlaced ? topbarPlaced.y : yTop;
    candidates.push(candidateRect(anchorLeft, preferredY, layout.width, layout.height));
    if (topbarPlaced) candidates.push(candidateRect(anchorLeft, topbarPlaced.y + topbarPlaced.height + 8, layout.width, layout.height));
    candidates.push(candidateRect(anchorLeft, yTop, layout.width, layout.height));
  } else if (id === 'canvas-left') {
    const minY = legendPlaced ? legendPlaced.y + legendPlaced.height + 8 : yTop + 34;
    const maxY = Math.max(minY, uiTop - layout.height - 10);
    const y = clamp((minY + maxY) / 2, minY, maxY);
    candidates.push(candidateRect(centerX - LAYOUT.dividerTapGap - layout.width, y, layout.width, layout.height));
  } else if (id === 'canvas-right') {
    const left = placed.get('canvas-left');
    const y = left ? left.y : yTop + 30;
    candidates.push(candidateRect(centerX + LAYOUT.dividerTapGap, y, layout.width, layout.height));
  } else if (id === 'params') {
    if (quickSliderRect) {
      candidates.push(candidateRect(quickSliderRect.right + 14, quickSliderRect.top - layout.height - 12, layout.width, layout.height));
      candidates.push(candidateRect(centerX - layout.width / 2 + 20, quickSliderRect.top - layout.height - 12, layout.width, layout.height));
      candidates.push(candidateRect(centerX - layout.width / 2 + 20, quickSliderRect.bottom + 12, layout.width, layout.height));
    }
    candidates.push(candidateRect(centerX - layout.width / 2 + 24, uiTop - layout.height - 14, layout.width, layout.height));
  } else if (id === 'slider') {
    if (paramsPlaced) {
      candidates.push(candidateRect(paramsPlaced.x - layout.width - 14, paramsPlaced.y + paramsPlaced.height + 8, layout.width, layout.height));
      candidates.push(candidateRect(paramsPlaced.x - layout.width - 14, paramsPlaced.y - layout.height - 8, layout.width, layout.height));
    }
    if (quickSliderRect) {
      candidates.push(candidateRect(quickSliderRect.left - layout.width - 8, quickSliderRect.top - layout.height - 8, layout.width, layout.height));
    }
  } else if (id === 'formula-cmap') {
    const yBase = Math.max((paramsPlaced?.y || uiTop) - layout.height - 10, yTop);
    candidates.push(candidateRect(anchorLeft, yBase, layout.width, layout.height));
    if (sliderPlaced) candidates.push(candidateRect(anchorLeft, sliderPlaced.y, layout.width, layout.height));
    if (legendPlaced) candidates.push(candidateRect(anchorLeft, legendPlaced.y + legendPlaced.height + 8, layout.width, layout.height));
    candidates.push(candidateRect(anchorLeft, uiTop - layout.height - 8, layout.width, layout.height));
  } else if (id === 'random') {
    const yBase = Math.max((paramsPlaced?.y || uiTop) - layout.height - 10, yTop);
    candidates.push(candidateRect(anchorRight - layout.width, yBase, layout.width, layout.height));
    if (sliderPlaced) candidates.push(candidateRect(anchorRight - layout.width, sliderPlaced.y, layout.width, layout.height));
    if (topbarPlaced) candidates.push(candidateRect(anchorRight - layout.width, topbarPlaced.y + topbarPlaced.height + 8, layout.width, layout.height));
    candidates.push(candidateRect(anchorRight - layout.width, uiTop - layout.height - 8, layout.width, layout.height));
  }

  return candidates;
}

function scoreCandidate(layout, candidate, ctx) {
  const { forbiddenRegions, viewportWidth, viewportHeight, margin, uiTop, placedRects, placed } = ctx;
  const rect = { left: candidate.x, top: candidate.y, right: candidate.x + layout.width, bottom: candidate.y + layout.height };

  if (rect.left < margin || rect.right > viewportWidth - margin || rect.top < margin || rect.bottom > uiTop - margin) {
    return { valid: false, score: Number.POSITIVE_INFINITY };
  }

  for (const region of forbiddenRegions) {
    if (overlapArea(rect, region) > 0) return { valid: false, score: Number.POSITIVE_INFINITY };
  }
  for (const placedRect of placedRects) {
    if (placedRect.id === layout.group.id) continue;
    if (overlapArea(rect, placedRect.rect) > 0) return { valid: false, score: Number.POSITIVE_INFINITY };
  }

  let score = 0;
  const pref = generateCandidates(layout, { ...ctx, placed }).at(0);
  if (pref) score += Math.abs(candidate.x - pref.x) + Math.abs(candidate.y - pref.y);

  const targetRect = layout.group.target?.selector ? ctx.rects.get(SELECTOR_TO_TARGET_KEY[layout.group.target.selector]) : null;
  if (targetRect) {
    const from = { x: candidate.x + layout.width / 2, y: candidate.y + layout.height / 2 };
    const to = pointFromRect(targetRect, layout.group.target.attach || 'center');
    score += Math.hypot(to.x - from.x, to.y - from.y) * 0.08;
  }

  if (layout.wrapped) score += 40;
  if (layout.fontScale < 1) score += (1 - layout.fontScale) * 800;

  if (layout.group.id === 'canvas-left' || layout.group.id === 'canvas-right') {
    const centerX = viewportWidth / 2;
    const onWrongSide = layout.group.id === 'canvas-left' ? rect.right > centerX : rect.left < centerX;
    if (onWrongSide) return { valid: false, score: Number.POSITIVE_INFINITY };
  }

  return { valid: true, score };
}

function placementVariants(layout) {
  const variants = [{ wrapped: false, fontScale: 1 }];
  if (layout.item.placement.wrap) variants.push({ wrapped: true, fontScale: 1 });
  if (layout.item.placement.shrink) {
    variants.push({ wrapped: false, fontScale: 0.92 });
    variants.push({ wrapped: true, fontScale: 0.92 });
    variants.push({ wrapped: true, fontScale: 0.86 });
  }
  return variants;
}


function findFirstFreeSpot(layout, ctx, placedRects) {
  const step = 10;
  const maxY = Math.max(ctx.margin, ctx.uiTop - layout.height - ctx.margin);
  for (let y = ctx.margin; y <= maxY; y += step) {
    for (let x = ctx.margin; x <= ctx.viewportWidth - layout.width - ctx.margin; x += step) {
      const rect = { left: x, top: y, right: x + layout.width, bottom: y + layout.height };
      const blockedByUi = ctx.forbiddenRegions.some((region) => overlapArea(rect, region) > 0);
      if (blockedByUi) continue;
      const blockedByLabels = placedRects.some((placedRect) => overlapArea(rect, placedRect.rect) > 0);
      if (blockedByLabels) continue;
      return { x, y };
    }
  }
  return null;
}

function placeGroupsInPriorityOrder(ctx) {
  const sorted = [...ctx.layouts].sort((a, b) => a.item.placement.priority - b.item.placement.priority || a.group.id.localeCompare(b.group.id));
  const placed = new Map();
  const placedRects = [];

  const placeOne = (layout) => {
    let best = null;
    for (const variant of placementVariants(layout)) {
      setLabelMeasureStyle(layout, variant, ctx.viewportWidth);
      const candidates = generateCandidates(layout, { ...ctx, placed });
      for (const c of candidates) {
        const scored = scoreCandidate(layout, c, { ...ctx, placedRects, placed });
        if (!scored.valid) continue;
        if (!best || scored.score < best.score) best = { ...c, score: scored.score, variant };
      }
      if (best && variant.fontScale === 1) break;
    }

    if (!best) {
      setLabelMeasureStyle(layout, { wrapped: true, fontScale: 0.86 }, ctx.viewportWidth);
      const free = findFirstFreeSpot(layout, ctx, placedRects);
      if (free) {
        best = { x: free.x, y: free.y, score: 9e5 };
      } else {
        const fallbackX = clamp(layout.x, ctx.margin, ctx.viewportWidth - layout.width - ctx.margin);
        const fallbackY = clamp(ctx.margin, ctx.margin, ctx.uiTop - layout.height - ctx.margin);
        best = { x: fallbackX, y: fallbackY, score: 1e6 };
      }
    }

    layout.x = Math.round(best.x);
    layout.y = Math.round(best.y);
    placed.set(layout.group.id, layout);
    placedRects.push({ id: layout.group.id, rect: layoutRect(layout) });
  };

  for (const layout of sorted) {
    if (layout.group.id === 'canvas-right' && !placed.has('canvas-left')) continue;
    placeOne(layout);
  }

  const rightTap = sorted.find((it) => it.group.id === 'canvas-right');
  const leftTap = placed.get('canvas-left');
  if (rightTap && leftTap) {
    setLabelMeasureStyle(rightTap, { wrapped: leftTap.wrapped, fontScale: leftTap.fontScale }, ctx.viewportWidth);
    rightTap.x = Math.round(ctx.viewportWidth / 2 + LAYOUT.dividerTapGap);
    rightTap.y = leftTap.y;
    const collision = ctx.forbiddenRegions.some((region) => overlapArea(layoutRect(rightTap), region) > 0)
      || placedRects.some((r) => r.id !== 'canvas-left' && overlapArea(layoutRect(rightTap), r.rect) > 0);
    if (collision || rightTap.x + rightTap.width > ctx.viewportWidth - ctx.margin) {
      rightTap.x = clamp(rightTap.x, ctx.margin, ctx.viewportWidth - rightTap.width - ctx.margin);
    }
    placed.set('canvas-right', rightTap);
  }
}

function clampPlacedGroupsToViewport(ctx) {
  for (const layout of ctx.layouts) {
    layout.x = clamp(layout.x, ctx.margin, ctx.viewportWidth - layout.width - ctx.margin);
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

    const anchorLeft = clamp(Math.round((rects.get('formulaTile')?.left ?? margin)), margin, viewportWidth - margin);
    const anchorRight = clamp(Math.round((rects.get('randomTile')?.right ?? (viewportWidth - margin))), margin, viewportWidth - margin);

    const forbiddenRegions = buildUiForbiddenRegions(rects, uiTop, viewportWidth, margin);

    placeGroupsInPriorityOrder({
      layouts,
      rects,
      viewportWidth,
      viewportHeight,
      margin,
      uiTop,
      anchorLeft,
      anchorRight,
      forbiddenRegions,
    });

    clampPlacedGroupsToViewport({ layouts, viewportWidth, margin, uiTop });

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
