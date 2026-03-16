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

function boxesOverlap(a, b, pad = LAYOUT.collisionPad) {
  return !(a.right + pad < b.left || a.left > b.right + pad || a.bottom + pad < b.top || a.top > b.bottom + pad);
}

function layoutOverlapsAny(layout, layouts, index, pad = LAYOUT.collisionPad) {
  const currentRect = {
    left: layout.x,
    top: layout.y,
    right: layout.x + layout.width,
    bottom: layout.y + layout.height,
  };

  for (let i = 0; i < layouts.length; i += 1) {
    if (i === index) continue;
    const other = layouts[i];
    const otherRect = {
      left: other.x,
      top: other.y,
      right: other.x + other.width,
      bottom: other.y + other.height,
    };
    if (boxesOverlap(currentRect, otherRect, pad)) return true;
  }

  return false;
}

function doLayoutsOverlap(a, b, gap = 4) {
  if (!a || !b) return false;
  return !(a.x + a.width + gap < b.x
    || a.x > b.x + b.width + gap
    || a.y + a.height + gap < b.y
    || a.y > b.y + b.height + gap);
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
  const labelCache = new Map();
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

  function preventLabelOverlap(layouts, viewportWidth, viewportHeight, options = {}) {
    const {
      startY = 12,
      bottomLimit = viewportHeight - 12,
      horizontalMargin = 12,
      gap = 10,
    } = options;
    const usableBottom = Math.max(startY + 24, bottomLimit);

    layouts.sort((a, b) => (a.y - b.y) || (a.x - b.x));

    for (let i = 0; i < layouts.length; i += 1) {
      const current = layouts[i];
      if (current.group.variant === "canvasSplit") continue;

      let targetX = clamp(current.x, horizontalMargin, viewportWidth - current.width - horizontalMargin);
      let targetY = clamp(current.y, startY, usableBottom - current.height);

      let adjusted = false;
      let safety = 0;
      while (safety < LAYOUT.collisionSafetyLimit) {
        safety += 1;
        let collisionIndex = -1;
        const candidateRect = {
          left: targetX,
          top: targetY,
          right: targetX + current.width,
          bottom: targetY + current.height,
        };

        for (let j = 0; j < i; j += 1) {
          const previous = layouts[j];
          if (previous.group.variant === "canvasSplit") continue;
          const prevRect = {
            left: previous.x,
            top: previous.y,
            right: previous.x + previous.width,
            bottom: previous.y + previous.height,
          };
          if (boxesOverlap(candidateRect, prevRect, LAYOUT.collisionPad)) {
            collisionIndex = j;
            break;
          }
        }

        if (collisionIndex === -1) break;

        const blocker = layouts[collisionIndex];
        const nextY = blocker.y + blocker.height + gap;
        if (nextY + current.height <= usableBottom) {
          targetY = nextY;
          targetX = clamp(targetX + 4, horizontalMargin, viewportWidth - current.width - horizontalMargin);
          adjusted = true;
          continue;
        }

        targetY = startY;
        targetX = clamp(targetX + current.width + gap, horizontalMargin, viewportWidth - current.width - horizontalMargin);
        adjusted = true;
      }

      current.x = Math.round(targetX);
      current.y = Math.round(targetY);

      if (adjusted && layoutOverlapsAny(current, layouts, i, LAYOUT.collisionFallbackPad)) {
        current.x = Math.round(clamp(horizontalMargin, horizontalMargin, viewportWidth - current.width - horizontalMargin));
        current.y = Math.round(clamp(startY + i * (current.height + gap), startY, usableBottom - current.height));
      }
    }
  }

  function buildLabelModels() {
    return HELP_OVERLAY_GROUPS.map((group) => ({ group }));
  }

  function createOrMeasureLabels({ models, viewportWidth, viewportHeight, margin, isMobile }) {
    const layouts = [];

    for (const model of models) {
      const { group } = model;
      const labelEl = buildGroupLabel(group);
      labelCache.set(group.id, labelEl);
      dom.labelsLayer.append(labelEl);

      if (isMobile) {
        labelEl.style.maxWidth = `${Math.max(LAYOUT.minLabelWidthMobile, viewportWidth - margin * 2)}px`;
      }
      if (group.variant === "canvasSplit") {
        labelEl.style.width = "auto";
      }

      const measured = labelEl.getBoundingClientRect();
      let x = clamp(group.label.x * viewportWidth - measured.width / 2, margin, viewportWidth - measured.width - margin);
      if (group.align === "leftPinned") x = margin;
      const y = clamp(group.label.y * viewportHeight - measured.height / 2, margin, viewportHeight - measured.height - margin);

      layouts.push({ group, labelEl, x: Math.round(x), y: Math.round(y), width: measured.width, height: measured.height });
    }

    return layouts;
  }

  function computeBaseLayout(ctx) {
    const { layouts, viewportWidth, viewportHeight, margin, isMobile, uiTop } = ctx;

    const dividerX = viewportWidth / 2;
    const canvasLayouts = layouts.filter((item) => item.group.variant === "canvasSplit");
    if (canvasLayouts.length) {
      const maxCanvasWidth = Math.max(...canvasLayouts.map((item) => item.width));
      for (const item of canvasLayouts) {
        item.labelEl.style.width = `${maxCanvasWidth}px`;
        const resized = item.labelEl.getBoundingClientRect();
        item.width = resized.width;
        item.height = resized.height;
      }

      for (const item of layouts) {
        let x = clamp(item.group.label.x * viewportWidth - item.width / 2, margin, viewportWidth - item.width - margin);
        if (item.group.align === "leftPinned") x = margin;
        item.x = Math.round(x);
      }

      const leftTap = canvasLayouts.find((item) => item.group.id === "canvas-left");
      const rightTap = canvasLayouts.find((item) => item.group.id === "canvas-right");
      if (leftTap) {
        leftTap.x = clamp(Math.floor(dividerX - LAYOUT.canvasSplitGap / 2 - leftTap.width), margin, viewportWidth - leftTap.width - margin);
      }
      if (rightTap) {
        rightTap.x = clamp(Math.ceil(dividerX + LAYOUT.canvasSplitGap / 2), margin, viewportWidth - rightTap.width - margin);
      }
    }

    preventLabelOverlap(layouts, viewportWidth, viewportHeight, {
      startY: margin,
      bottomLimit: uiTop - margin,
      horizontalMargin: margin,
      gap: isMobile ? LAYOUT.labelGapMobile : LAYOUT.labelGapDesktop,
    });

    for (const layout of layouts) {
      const maxY = Math.max(margin, uiTop - layout.height - margin);
      layout.y = Math.min(layout.y, maxY);
    }

    const topRightActionsRect = ctx.rects.get("topRightActions") || null;
    const topbarLayout = layouts.find((item) => item.group.id === "topbar");
    const legendLayout = layouts.find((item) => item.group.id === "tile-border-legend");
    if (topRightActionsRect && topbarLayout) {
      const topbarY = Math.round(clamp(
        topRightActionsRect.bottom + (isMobile ? LAYOUT.topbarMobileGap : LAYOUT.topbarDesktopGap),
        margin,
        uiTop - topbarLayout.height - margin,
      ));
      topbarLayout.y = topbarY;
      if (legendLayout) legendLayout.y = topbarY;
    }

    const formulaTileRect = ctx.rects.get("formulaTile") || null;
    if (formulaTileRect) {
      const alignedLeft = clamp(Math.round(formulaTileRect.left), margin, viewportWidth - 24);
      const formulaLayout = layouts.find((item) => item.group.id === "formula-cmap");
      if (formulaLayout) {
        formulaLayout.x = clamp(alignedLeft, margin, viewportWidth - formulaLayout.width - margin);
      }
    }

    const minLeftBound = formulaTileRect
      ? clamp(Math.round(formulaTileRect.left), margin, viewportWidth - margin)
      : margin;

    const randomLayout = layouts.find((item) => item.group.id === "random");
    const randomTileRect = ctx.rects.get("randomTile") || null;
    if (randomLayout && randomTileRect) {
      randomLayout.x = clamp(
        Math.round(randomTileRect.right - randomLayout.width),
        minLeftBound,
        viewportWidth - randomLayout.width,
      );
    }

    return { topbarLayout, legendLayout, minLeftBound };
  }

  function applyMobileLayoutAdjustments(ctx) {
    const { layouts, viewportWidth, viewportHeight, margin, uiTop, minLeftBound, rects } = ctx;
    const topbar = layouts.find((item) => item.group.id === "topbar");
    const legend = layouts.find((item) => item.group.id === "tile-border-legend");
    const formula = layouts.find((item) => item.group.id === "formula-cmap");
    const params = layouts.find((item) => item.group.id === "params");
    const iter = layouts.find((item) => item.group.id === "iter");
    const random = layouts.find((item) => item.group.id === "random");
    const slider = layouts.find((item) => item.group.id === "slider");
    const leftTapLayout = layouts.find((item) => item.group.id === "canvas-left");
    const rightTapLayout = layouts.find((item) => item.group.id === "canvas-right");

    const topRightActionsRect = rects.get("topRightActions") || null;
    const cameraRect = rects.get("cameraButton") || null;
    const rightEdge = cameraRect?.right ?? topRightActionsRect?.right ?? (viewportWidth - margin);
    const topStart = topRightActionsRect ? clamp(topRightActionsRect.bottom + 3, margin, uiTop - margin) : margin;

    let stackY = topStart;
    if (topbar) {
      topbar.x = clamp(Math.round(rightEdge - topbar.width), minLeftBound, viewportWidth - topbar.width);
      topbar.y = topStart;
      stackY = topbar.y + topbar.height + 8;
    }
    if (legend) {
      legend.x = minLeftBound;
      legend.y = topbar ? topbar.y : clamp(stackY, margin, uiTop - legend.height - margin);
      stackY = Math.max(stackY, legend.y + legend.height + 8, (topbar ? topbar.y + topbar.height : stackY) + 8);
    }
    if (leftTapLayout && rightTapLayout) {
      const tapY = clamp(stackY, margin, uiTop - Math.max(leftTapLayout.height, rightTapLayout.height) - margin);
      leftTapLayout.x = clamp(leftTapLayout.x, minLeftBound, viewportWidth - leftTapLayout.width - margin);
      rightTapLayout.x = clamp(rightTapLayout.x, minLeftBound, viewportWidth - rightTapLayout.width - margin);
      leftTapLayout.y = tapY;
      rightTapLayout.y = tapY;
      stackY = tapY + Math.max(leftTapLayout.height, rightTapLayout.height) + 8;
    }

    if (random) {
      random.x = clamp(viewportWidth - random.width - margin, minLeftBound, viewportWidth - random.width - margin);
      random.y = clamp(stackY, margin, uiTop - random.height - margin);
      const randomTileRect = rects.get("randomTile") || null;
      if (randomTileRect) {
        random.x = clamp(Math.round(randomTileRect.right - random.width), minLeftBound, viewportWidth - random.width);
      }
    }

    if (formula) {
      formula.x = minLeftBound;
      formula.y = clamp((random ? random.y + random.height + 8 : stackY), margin, uiTop - formula.height - margin);
    }

    if (params) {
      const paramsTop = formula ? formula.y + formula.height + 8 : stackY;
      params.y = clamp(paramsTop, margin, uiTop - params.height - margin);
      const availableWidth = viewportWidth - margin - minLeftBound;
      const centeredParamsX = minLeftBound + Math.max(0, Math.floor((availableWidth - params.width) / 2));
      params.x = clamp(centeredParamsX, minLeftBound, viewportWidth - params.width - margin);
    }

    if (iter) {
      iter.x = clamp(viewportWidth - iter.width - margin, minLeftBound, viewportWidth - iter.width - margin);
      const iterTop = params ? params.y + params.height + 8 : (formula ? formula.y + formula.height + 8 : stackY);
      iter.y = clamp(iterTop, margin, uiTop - iter.height - margin);
    }

    if (slider) {
      const availableWidth = viewportWidth - margin - minLeftBound;
      const centeredSliderX = minLeftBound + Math.max(0, Math.floor((availableWidth - slider.width) / 2));
      slider.x = clamp(centeredSliderX - 12, minLeftBound, viewportWidth - slider.width - margin);
      const sliderTop = Math.max((iter ? iter.y + iter.height + 8 : stackY), (params ? params.y + params.height + 8 : stackY));
      slider.y = clamp(sliderTop, margin, uiTop - slider.height - margin);
    }

    if (leftTapLayout && params && doLayoutsOverlap(leftTapLayout, params, 4)) {
      leftTapLayout.x = clamp(params.x - leftTapLayout.width - 8, minLeftBound, viewportWidth - leftTapLayout.width - margin);
    }
    if (rightTapLayout && params && doLayoutsOverlap(rightTapLayout, params, 4)) {
      rightTapLayout.x = clamp(params.x - rightTapLayout.width - 8, minLeftBound, viewportWidth - rightTapLayout.width - margin);
    }

    if (viewportWidth > viewportHeight && topbar && legend && leftTapLayout && rightTapLayout) {
      const horizontalGap = topbar.x - (legend.x + legend.width);
      const requiredGap = leftTapLayout.width + rightTapLayout.width + 16;
      if (horizontalGap >= requiredGap) {
        const tapRowY = clamp(
          topbar.y + topbar.height - Math.max(leftTapLayout.height, rightTapLayout.height),
          margin,
          uiTop - Math.max(leftTapLayout.height, rightTapLayout.height) - margin,
        );
        const leftTargetX = clamp(legend.x + legend.width + 6, minLeftBound, viewportWidth - leftTapLayout.width - margin);
        const rightTargetX = clamp(topbar.x - rightTapLayout.width - 6, minLeftBound, viewportWidth - rightTapLayout.width - margin);

        const prevLeft = { x: leftTapLayout.x, y: leftTapLayout.y };
        const prevRight = { x: rightTapLayout.x, y: rightTapLayout.y };
        leftTapLayout.x = leftTargetX;
        leftTapLayout.y = tapRowY;
        rightTapLayout.x = rightTargetX;
        rightTapLayout.y = tapRowY;

        const tapOverlapOthers = layouts.some((item) => {
          if (item === leftTapLayout || item === rightTapLayout) return false;
          return doLayoutsOverlap(leftTapLayout, item) || doLayoutsOverlap(rightTapLayout, item);
        });

        if (tapOverlapOthers || doLayoutsOverlap(leftTapLayout, rightTapLayout, 10)) {
          leftTapLayout.x = prevLeft.x;
          leftTapLayout.y = prevLeft.y;
          rightTapLayout.x = prevRight.x;
          rightTapLayout.y = prevRight.y;
        }
      }
    }
  }

  function applyDesktopLayoutAdjustments(ctx) {
    const { layouts, viewportWidth, viewportHeight, margin, uiTop } = ctx;
    preventLabelOverlap(layouts, viewportWidth, viewportHeight, {
      startY: margin,
      bottomLimit: uiTop - margin,
      horizontalMargin: margin,
      gap: LAYOUT.labelGapDesktop,
    });
  }

  function resolveCollisions(ctx) {
    const { layouts, viewportWidth, viewportHeight, margin, uiTop, minLeftBound, isMobile } = ctx;
    if (!isMobile) return;

    for (const layout of layouts) {
      const maxX = (layout.group.id === "topbar" || layout.group.id === "random")
        ? viewportWidth - layout.width
        : viewportWidth - layout.width - margin;
      layout.x = clamp(layout.x, minLeftBound, maxX);
    }

    const paramsLayout = layouts.find((item) => item.group.id === "params");
    const sliderLayout = layouts.find((item) => item.group.id === "slider");
    if (paramsLayout && sliderLayout && doLayoutsOverlap(sliderLayout, paramsLayout, 2)) {
      const maxSliderY = uiTop - sliderLayout.height - margin;
      const desiredSliderY = paramsLayout.y + paramsLayout.height + 10;
      if (desiredSliderY > maxSliderY) {
        const requiredShiftUp = desiredSliderY - maxSliderY;
        const maxParamsY = uiTop - margin - paramsLayout.height - sliderLayout.height - 10;
        paramsLayout.y = clamp(paramsLayout.y - requiredShiftUp, margin, Math.max(margin, maxParamsY));
      }

      sliderLayout.y = clamp(paramsLayout.y + paramsLayout.height + 10, margin, maxSliderY);
      if (doLayoutsOverlap(sliderLayout, paramsLayout, 2)) {
        sliderLayout.x = clamp(paramsLayout.x - sliderLayout.width - 10, minLeftBound, viewportWidth - sliderLayout.width - margin);
      }
      if (doLayoutsOverlap(sliderLayout, paramsLayout, 2)) {
        sliderLayout.x = clamp(paramsLayout.x + paramsLayout.width + 10, minLeftBound, viewportWidth - sliderLayout.width - margin);
      }
    }

    const formulaLayout = layouts.find((item) => item.group.id === "formula-cmap");
    if (formulaLayout && sliderLayout && doLayoutsOverlap(formulaLayout, sliderLayout, 2)) {
      sliderLayout.x = clamp(formulaLayout.x + formulaLayout.width + 10, minLeftBound, viewportWidth - sliderLayout.width - margin);
    }
  }

  function clampLabelsToViewport(ctx) {
    const { layouts, viewportWidth, margin, uiTop, minLeftBound } = ctx;
    for (const layout of layouts) {
      const maxX = viewportWidth - layout.width - margin;
      layout.x = clamp(layout.x, minLeftBound ?? margin, maxX);
      const maxY = Math.max(margin, uiTop - layout.height - margin);
      layout.y = clamp(layout.y, margin, maxY);
    }
  }

  function placeCanvasTapLabels(ctx) {
    const { layouts, viewportWidth, viewportHeight, margin, uiTop, isMobile, topbarLayout, legendLayout } = ctx;
    const leftTap = layouts.find((item) => item.group.id === "canvas-left");
    const rightTap = layouts.find((item) => item.group.id === "canvas-right");
    const lowerLayouts = layouts.filter((item) => !["topbar", "canvas-left", "canvas-right", "tile-border-legend"].includes(item.group.id));
    const lowerTop = lowerLayouts.length ? Math.min(...lowerLayouts.map((item) => item.y)) : Math.round(viewportHeight * 0.55);
    const upperBottom = topbarLayout ? topbarLayout.y + topbarLayout.height : Math.round(viewportHeight * 0.2);
    const tapCenterY = Math.round((upperBottom + lowerTop) / 2);

    if (leftTap && rightTap) {
      const dividerCenterX = Math.round(viewportWidth / 2);
      leftTap.x = dividerCenterX - LAYOUT.dividerTapGap - leftTap.width;
      rightTap.x = dividerCenterX + LAYOUT.dividerTapGap;

      let targetCenterY = tapCenterY;
      if (isMobile && viewportWidth > viewportHeight && topbarLayout && legendLayout) {
        const roomBetween = (legendLayout.x + legendLayout.width + 8 <= leftTap.x)
          && (rightTap.x + rightTap.width + 8 <= topbarLayout.x);
        if (roomBetween) targetCenterY = topbarLayout.y + topbarLayout.height / 2;
      }

      const y = clamp(
        targetCenterY - Math.max(leftTap.height, rightTap.height) / 2,
        margin,
        uiTop - Math.max(leftTap.height, rightTap.height) - margin,
      );
      leftTap.y = Math.round(y);
      rightTap.y = Math.round(y);
    }

    return { leftTap, rightTap };
  }

  function renderCanvasDivider({ viewportHeight, leftTap, rightTap }) {
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
    const isMobile = Math.min(viewportWidth, viewportHeight) <= LAYOUT.mobileBreakpoint;
    const margin = isMobile ? LAYOUT.marginMobile : LAYOUT.marginDesktop;
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

    const bracketMidpoints = new Map();
    for (const bracket of HELP_GROUP_BRACKETS) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getRect(selector)));
      if (!rect) continue;
      const midpoint = drawBracket(rect, bracket.side, bracket.side === "top" ? alignedBottomGuideY : null);
      bracketMidpoints.set(bracket.id, midpoint);
    }

    const models = buildLabelModels();
    const layouts = createOrMeasureLabels({ models, viewportWidth, viewportHeight, margin, isMobile });

    const base = computeBaseLayout({
      layouts,
      viewportWidth,
      viewportHeight,
      margin,
      isMobile,
      uiTop,
      rects,
    });

    const sharedCtx = {
      layouts,
      viewportWidth,
      viewportHeight,
      margin,
      uiTop,
      isMobile,
      rects,
      minLeftBound: base.minLeftBound,
      topbarLayout: base.topbarLayout,
      legendLayout: base.legendLayout,
    };

    if (isMobile) {
      applyMobileLayoutAdjustments(sharedCtx);
    } else {
      applyDesktopLayoutAdjustments(sharedCtx);
    }

    resolveCollisions(sharedCtx);
    clampLabelsToViewport(sharedCtx);

    const taps = placeCanvasTapLabels(sharedCtx);
    renderCanvasDivider({ viewportHeight, ...taps });

    renderLabels(layouts);
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
    labelCache.clear();
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
