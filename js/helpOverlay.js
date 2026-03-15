import { HELP_GROUP_BRACKETS, HELP_OVERLAY_GROUPS } from "./helpOverlayConfig.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRect(selector) {
  const element = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return rect;
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
      return { x: rect.left + rect.width / 2, y: rect.top - 18 };
    case "left":
      return { x: rect.left - 12, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.right + 12, y: rect.top + rect.height / 2 };
    case "bottom":
      return { x: rect.left + rect.width / 2, y: rect.bottom + 12 };
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
      y: clamp(toPoint.y, labelRect.top + 12, labelRect.bottom - 12),
    };
  }

  return {
    x: clamp(toPoint.x, labelRect.left + 14, labelRect.right - 14),
    y: dy >= 0 ? labelRect.bottom : labelRect.top,
  };
}

function makeTopbarIcon(iconSelector) {
  const source = iconSelector ? document.querySelector(iconSelector) : null;
  const icon = document.createElement("span");
  icon.className = "helpOverlay__inlineIcon";
  if (iconSelector === "#scaleModeBtn") {
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

    if (row.iconSelector) {
      rowEl.append(makeTopbarIcon(row.iconSelector));
    }
    if (row.tilePreview) {
      rowEl.append(makeTilePreviewIcon(row.tilePreview));
    }

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


function getArrowSourcePoint(labelRect, mode) {
  if (mode === "bottom-center") {
    return { x: labelRect.left + labelRect.width / 2, y: labelRect.bottom };
  }
  if (mode === "top-center") {
    return { x: labelRect.left + labelRect.width / 2, y: labelRect.top };
  }
  return null;
}
function boxesOverlap(a, b, pad = 8) {
  return !(a.right + pad < b.left || a.left > b.right + pad || a.bottom + pad < b.top || a.top > b.bottom + pad);
}

function layoutOverlapsAny(layout, layouts, index, pad = 8) {
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
    if (boxesOverlap(currentRect, otherRect, pad)) {
      return true;
    }
  }

  return false;
}

export function createHelpOverlay(options) {
  const { helpButton, ensureSliderOpen, isSliderOpen, onOpened, onClosed } = options;

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
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
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

  let open = false;
  let autoOpenedSlider = false;

  function setButtonState(active) {
    helpButton?.classList.toggle("is-active", active);
    helpButton?.setAttribute("aria-pressed", active ? "true" : "false");
  }


  function isHelpButtonEvent(event) {
    if (!helpButton || !event) return false;
    const target = event.target;
    if (target instanceof Element && target.closest("#helpBtn")) return true;
    if (typeof event.composedPath === "function") {
      return event.composedPath().includes(helpButton);
    }
    return false;
  }
  function clearGraphics() {
    labelsLayer.innerHTML = "";
    svgEl.querySelectorAll("line,path:not(defs path)").forEach((node) => node.remove());
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
    svgEl.append(line);
  }

  function drawBracket(rect, side = "top", forcedTopY = null) {
    if (side === "left") {
      const x = rect.left - 18;
      const top = rect.top;
      const bottom = rect.bottom;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", `M ${x + 10} ${top} L ${x} ${top} L ${x} ${bottom} L ${x + 10} ${bottom}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(255,255,255,0.92)");
      path.setAttribute("stroke-width", "1");
      svgEl.append(path);
      return { x, y: top + (bottom - top) / 2 };
    }

    const y = Number.isFinite(forcedTopY) ? forcedTopY : rect.top - 24;
    const left = rect.left;
    const right = rect.right;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", `M ${left} ${y + 10} L ${left} ${y} L ${right} ${y} L ${right} ${y + 10}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,0.92)");
    path.setAttribute("stroke-width", "1");
    svgEl.append(path);
    return { x: left + (right - left) / 2, y };
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
      while (safety < 40) {
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
          if (boxesOverlap(candidateRect, prevRect, 8)) {
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

      if (adjusted && layoutOverlapsAny(current, layouts, i, 6)) {
        current.x = Math.round(clamp(horizontalMargin, horizontalMargin, viewportWidth - current.width - horizontalMargin));
        current.y = Math.round(clamp(startY + i * (current.height + gap), startY, usableBottom - current.height));
      }
    }
  }


  function render() {
    if (!open) return;

    clearGraphics();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = Math.min(viewportWidth, viewportHeight) <= 430;
    const margin = isMobile ? 8 : 12;
    svgEl.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    centerDivider.style.left = `${Math.round(viewportWidth / 2)}px`;

    const paramOverlayRect = getRect("#paramOverlay");
    const quickSliderRect = getRect("#quickSlider");
    const uiTop = Math.min(
      Number.isFinite(paramOverlayRect?.top) ? paramOverlayRect.top : viewportHeight,
      Number.isFinite(quickSliderRect?.top) ? quickSliderRect.top : viewportHeight,
    );
    const tileTopEdge = Number.isFinite(paramOverlayRect?.top) ? paramOverlayRect.top : uiTop;
    const alignedBottomGuideY = Math.round(tileTopEdge - 5);

    const bracketMidpoints = new Map();
    for (const bracket of HELP_GROUP_BRACKETS) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getRect(selector)));
      if (!rect) continue;
      const useAlignedTop = bracket.side === "top";
      const midpoint = drawBracket(rect, bracket.side, useAlignedTop ? alignedBottomGuideY : null);
      bracketMidpoints.set(bracket.id, midpoint);
    }

    const layouts = [];
    for (const group of HELP_OVERLAY_GROUPS) {
      const labelEl = buildGroupLabel(group);
      labelsLayer.append(labelEl);

      if (isMobile) {
        labelEl.style.maxWidth = `${Math.max(180, viewportWidth - margin * 2)}px`;
      }
      if (group.variant === "canvasSplit") {
        labelEl.style.width = "auto";
      }
      const measured = labelEl.getBoundingClientRect();
      let x = clamp(group.label.x * viewportWidth - measured.width / 2, margin, viewportWidth - measured.width - margin);
      if (group.align === "leftPinned") {
        x = margin;
      }
      const y = clamp(group.label.y * viewportHeight - measured.height / 2, margin, viewportHeight - measured.height - margin);
      layouts.push({ group, labelEl, x: Math.round(x), y: Math.round(y), width: measured.width, height: measured.height });
    }

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
      const dividerGap = 56;
      if (leftTap) {
        leftTap.x = clamp(Math.floor(dividerX - dividerGap / 2 - leftTap.width), margin, viewportWidth - leftTap.width - margin);
      }
      if (rightTap) {
        rightTap.x = clamp(Math.ceil(dividerX + dividerGap / 2), margin, viewportWidth - rightTap.width - margin);
      }
    }

    preventLabelOverlap(layouts, viewportWidth, viewportHeight, {
      startY: margin,
      bottomLimit: uiTop - margin,
      horizontalMargin: margin,
      gap: isMobile ? 8 : 10,
    });

    for (const layout of layouts) {
      const maxY = Math.max(margin, uiTop - layout.height - margin);
      layout.y = Math.min(layout.y, maxY);
    }

    const topRightActionsRect = getRect("#topRightActions");
    const topbarLayout = layouts.find((item) => item.group.id === "topbar");
    const legendLayout = layouts.find((item) => item.group.id === "tile-border-legend");
    if (topRightActionsRect && topbarLayout) {
      const topbarY = Math.round(clamp(topRightActionsRect.bottom + (isMobile ? 6 : 10), margin, uiTop - topbarLayout.height - margin));
      topbarLayout.y = topbarY;
      if (legendLayout) {
        legendLayout.y = topbarY;
      }
    }

    const formulaTileRect = getRect("#formulaBtn");
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

    const randomLayoutGlobal = layouts.find((item) => item.group.id === "random");
    const randomTileRectGlobal = getRect("#randomModeTile");
    if (randomLayoutGlobal && randomTileRectGlobal) {
      randomLayoutGlobal.x = clamp(Math.round(randomTileRectGlobal.right - randomLayoutGlobal.width), minLeftBound, viewportWidth - randomLayoutGlobal.width);
    }

    const doLayoutsOverlap = (a, b, gap = 4) => {
      if (!a || !b) return false;
      return !(a.x + a.width + gap < b.x
        || a.x > b.x + b.width + gap
        || a.y + a.height + gap < b.y
        || a.y > b.y + b.height + gap);
    };

    if (isMobile) {
      const topbar = layouts.find((item) => item.group.id === "topbar");
      const legend = layouts.find((item) => item.group.id === "tile-border-legend");
      const formula = layouts.find((item) => item.group.id === "formula-cmap");
      const params = layouts.find((item) => item.group.id === "params");
      const iter = layouts.find((item) => item.group.id === "iter");
      const random = layouts.find((item) => item.group.id === "random");
      const slider = layouts.find((item) => item.group.id === "slider");
      const leftTapLayout = layouts.find((item) => item.group.id === "canvas-left");
      const rightTapLayout = layouts.find((item) => item.group.id === "canvas-right");

      const cameraRect = getRect("#cameraBtn");
      const rightEdge = cameraRect?.right ?? topRightActionsRect?.right ?? (viewportWidth - margin);
      const topStart = topRightActionsRect
        ? clamp(topRightActionsRect.bottom + 3, margin, uiTop - margin)
        : margin;
      let stackY = topStart;
      if (topbar) {
        topbar.x = clamp(Math.round(rightEdge - topbar.width), minLeftBound, viewportWidth - topbar.width);
        topbar.y = topStart;
        stackY = topbar.y + topbar.height + 8;
      }
      if (legend) {
        legend.x = minLeftBound;
        legend.y = topbar ? topbar.y : clamp(stackY, margin, uiTop - legend.height - margin);
        const legendBottom = legend.y + legend.height;
        const topbarBottom = topbar ? topbar.y + topbar.height : stackY;
        stackY = Math.max(stackY, legendBottom + 8, topbarBottom + 8);
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
        const randomTileRect = getRect("#randomModeTile");
        if (randomTileRect) {
          random.x = clamp(Math.round(randomTileRect.right - random.width), minLeftBound, viewportWidth - random.width);
        }
      }
      if (formula) {
        formula.x = minLeftBound;
        formula.y = clamp((random ? random.y + random.height + 8 : stackY), margin, uiTop - formula.height - margin);
      }
      if (params) {
        params.x = minLeftBound;
        const paramsTop = formula ? formula.y + formula.height + 8 : stackY;
        params.y = clamp(paramsTop, margin, uiTop - params.height - margin);
        if (viewportHeight <= 380) {
          params.x = clamp(viewportWidth - params.width - margin, minLeftBound, viewportWidth - params.width - margin);
        }
        if (slider) {
          const rightParamsX = viewportWidth - params.width - margin;
          const hasRoomForLeftSlider = rightParamsX - slider.width - 8 >= minLeftBound;
          if (hasRoomForLeftSlider) {
            params.x = clamp(rightParamsX, minLeftBound, viewportWidth - params.width - margin);
          }
        }
      }
      if (iter) {
        iter.x = clamp(viewportWidth - iter.width - margin, minLeftBound, viewportWidth - iter.width - margin);
        const iterTop = params ? params.y + params.height + 8 : (formula ? formula.y + formula.height + 8 : stackY);
        iter.y = clamp(iterTop, margin, uiTop - iter.height - margin);
      }
      if (slider) {
        slider.x = clamp(viewportWidth - slider.width - margin, minLeftBound, viewportWidth - slider.width - margin);
        const sliderTop = Math.max((iter ? iter.y + iter.height + 8 : stackY), (params ? params.y + params.height + 8 : stackY));
        slider.y = clamp(sliderTop, margin, uiTop - slider.height - margin);
      }
      if (leftTapLayout && params) {
        const overlapsLeft = !(leftTapLayout.x + leftTapLayout.width + 4 < params.x
          || leftTapLayout.x > params.x + params.width + 4
          || leftTapLayout.y + leftTapLayout.height + 4 < params.y
          || leftTapLayout.y > params.y + params.height + 4);
        if (overlapsLeft) {
          leftTapLayout.x = clamp(params.x - leftTapLayout.width - 8, minLeftBound, viewportWidth - leftTapLayout.width - margin);
        }
      }
      if (rightTapLayout && params) {
        const overlapsRight = !(rightTapLayout.x + rightTapLayout.width + 4 < params.x
          || rightTapLayout.x > params.x + params.width + 4
          || rightTapLayout.y + rightTapLayout.height + 4 < params.y
          || rightTapLayout.y > params.y + params.height + 4);
        if (overlapsRight) {
          rightTapLayout.x = clamp(params.x - rightTapLayout.width - 8, minLeftBound, viewportWidth - rightTapLayout.width - margin);
        }
      }

      if (viewportWidth > viewportHeight && topbar && legend && leftTapLayout && rightTapLayout) {
        const horizontalGap = topbar.x - (legend.x + legend.width);
        const requiredGap = leftTapLayout.width + rightTapLayout.width + 16;
        if (horizontalGap >= requiredGap) {
          const tapRowY = clamp(topbar.y + topbar.height - Math.max(leftTapLayout.height, rightTapLayout.height), margin, uiTop - Math.max(leftTapLayout.height, rightTapLayout.height) - margin);
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

      if (slider && params) {
        const baseTop = Math.max(
          formula ? formula.y + formula.height + 8 : stackY,
          random ? random.y + random.height + 8 : stackY,
        );
        const availableWidth = viewportWidth - margin - minLeftBound;
        const sideBySideWidth = slider.width + 8 + params.width;
        const hasSideBySideRoom = availableWidth >= sideBySideWidth;

        const canPlacePair = (sliderX, sliderY, paramsX, paramsY) => {
          const prevSlider = { x: slider.x, y: slider.y };
          const prevParams = { x: params.x, y: params.y };
          slider.x = clamp(sliderX, minLeftBound, viewportWidth - slider.width - margin);
          slider.y = clamp(sliderY, margin, uiTop - slider.height - margin);
          params.x = clamp(paramsX, minLeftBound, viewportWidth - params.width - margin);
          params.y = clamp(paramsY, margin, uiTop - params.height - margin);

          const overlaps = layouts.some((item) => {
            if (item === slider || item === params || item === random) return false;
            return doLayoutsOverlap(slider, item) || doLayoutsOverlap(params, item);
          }) || doLayoutsOverlap(slider, params, 6);

          if (overlaps) {
            slider.x = prevSlider.x;
            slider.y = prevSlider.y;
            params.x = prevParams.x;
            params.y = prevParams.y;
            return false;
          }

          return true;
        };

        let pairPlaced = false;
        const isLandscape = viewportWidth > viewportHeight;

        if (isLandscape) {
          const diagonalGapX = 10;
          const diagonalGapY = 8;
          const diagonalWidth = slider.width + diagonalGapX + params.width;
          const hasDiagonalRoom = availableWidth >= diagonalWidth;
          const maxParamsTop = uiTop - margin - params.height - diagonalGapY - slider.height;
          const paramsTop = clamp(baseTop, margin, maxParamsTop);

          if (hasDiagonalRoom && maxParamsTop >= margin) {
            const centeredSliderX = minLeftBound + Math.max(0, Math.floor((availableWidth - diagonalWidth) / 2));
            const candidateShifts = [0, -24, 24, -40, 40];
            for (const shift of candidateShifts) {
              const sliderX = centeredSliderX + shift;
              const paramsX = sliderX + slider.width + diagonalGapX;
              if (canPlacePair(sliderX, paramsTop + params.height + diagonalGapY, paramsX, paramsTop)) {
                pairPlaced = true;
                break;
              }
            }
          }

          if (!pairPlaced) {
            const centeredParamsX = minLeftBound + Math.max(0, Math.floor((availableWidth - params.width) / 2));
            const sliderTop = paramsTop + params.height + diagonalGapY;
            const sliderX = centeredParamsX - Math.max(12, Math.round(slider.width * 0.1));
            pairPlaced = canPlacePair(sliderX, sliderTop, centeredParamsX, paramsTop);
          }
        }

        if (!pairPlaced && hasSideBySideRoom) {
          const centeredSliderX = minLeftBound + Math.max(0, Math.floor((availableWidth - sideBySideWidth) / 2));
          const centeredParamsX = centeredSliderX + slider.width + 8;
          pairPlaced = canPlacePair(centeredSliderX, baseTop, centeredParamsX, baseTop);
        }

        if (!pairPlaced) {
          const centeredX = minLeftBound + Math.max(0, Math.floor((availableWidth - Math.max(slider.width, params.width)) / 2));
          const sliderTop = baseTop + params.height + 8;
          pairPlaced = canPlacePair(centeredX, sliderTop, centeredX, baseTop);
        }

        if (pairPlaced && random && (doLayoutsOverlap(random, params, 4) || doLayoutsOverlap(random, slider, 4))) {
          const minRandomY = topbar ? Math.round(topbar.y + topbar.height + 4) : margin;
          while ((doLayoutsOverlap(random, params, 4) || doLayoutsOverlap(random, slider, 4)) && random.y > minRandomY) {
            random.y = Math.max(minRandomY, random.y - 2);
          }
        }
      }

      for (const layout of layouts) {
        const maxX = (layout.group.id === "topbar" || layout.group.id === "random")
          ? viewportWidth - layout.width
          : viewportWidth - layout.width - margin;
        layout.x = clamp(layout.x, minLeftBound, maxX);
      }
    } else {
      preventLabelOverlap(layouts, viewportWidth, viewportHeight, {
        startY: margin,
        bottomLimit: uiTop - margin,
        horizontalMargin: margin,
        gap: 10,
      });
    }

    if (viewportWidth > viewportHeight) {
      const slider = layouts.find((item) => item.group.id === "slider");
      const params = layouts.find((item) => item.group.id === "params");
      if (slider && params) {
        const diagonalGapX = 10;
        const diagonalGapY = 8;
        const availableWidth = viewportWidth - margin - minLeftBound;
        const diagonalWidth = slider.width + diagonalGapX + params.width;
        const maxParamsTop = uiTop - margin - params.height - diagonalGapY - slider.height;
        if (availableWidth >= diagonalWidth && maxParamsTop >= margin) {
          const baseParamsTop = clamp(params.y, margin, maxParamsTop);
          const centeredSliderX = minLeftBound + Math.max(0, Math.floor((availableWidth - diagonalWidth) / 2));
          const shifts = [0, -24, 24, -40, 40, -56, 56];
          const prevSlider = { x: slider.x, y: slider.y };
          const prevParams = { x: params.x, y: params.y };
          let placed = false;
          for (const shift of shifts) {
            slider.x = clamp(centeredSliderX + shift, minLeftBound, viewportWidth - slider.width - margin);
            slider.y = clamp(baseParamsTop + params.height + diagonalGapY, margin, uiTop - slider.height - margin);
            params.x = clamp(slider.x + slider.width + diagonalGapX, minLeftBound, viewportWidth - params.width - margin);
            params.y = clamp(baseParamsTop, margin, uiTop - params.height - margin);

            const overlaps = layouts.some((item) => {
              if (item === slider || item === params) return false;
              return doLayoutsOverlap(slider, item) || doLayoutsOverlap(params, item);
            }) || doLayoutsOverlap(slider, params, 6);

            if (!overlaps && slider.x < params.x && slider.y > params.y) {
              placed = true;
              break;
            }
          }
          if (!placed) {
            slider.x = prevSlider.x;
            slider.y = prevSlider.y;
            params.x = prevParams.x;
            params.y = prevParams.y;
          }
        }
      }
    }

    const leftTap = layouts.find((item) => item.group.id === "canvas-left");
    const rightTap = layouts.find((item) => item.group.id === "canvas-right");
    const lowerLayouts = layouts.filter((item) => !["topbar", "canvas-left", "canvas-right", "tile-border-legend"].includes(item.group.id));
    const lowerTop = lowerLayouts.length ? Math.min(...lowerLayouts.map((item) => item.y)) : Math.round(viewportHeight * 0.55);
    const upperBottom = topbarLayout ? topbarLayout.y + topbarLayout.height : Math.round(viewportHeight * 0.2);
    const tapCenterY = Math.round((upperBottom + lowerTop) / 2);
    if (leftTap && rightTap) {
      const dividerCenterX = Math.round(viewportWidth / 2);
      leftTap.x = dividerCenterX - 15 - leftTap.width;
      rightTap.x = dividerCenterX + 15;

      let targetCenterY = tapCenterY;
      if (isMobile && viewportWidth > viewportHeight && topbarLayout && legendLayout) {
        const roomBetween = (legendLayout.x + legendLayout.width + 8 <= leftTap.x)
          && (rightTap.x + rightTap.width + 8 <= topbarLayout.x);
        if (roomBetween) {
          targetCenterY = topbarLayout.y + topbarLayout.height / 2;
        }
      }

      const y = clamp(targetCenterY - Math.max(leftTap.height, rightTap.height) / 2, margin, uiTop - Math.max(leftTap.height, rightTap.height) - margin);
      leftTap.y = Math.round(y);
      rightTap.y = Math.round(y);
    }

    const tapLineCenterY = leftTap && rightTap
      ? Math.round((leftTap.y + leftTap.height / 2 + rightTap.y + rightTap.height / 2) / 2)
      : Math.round(viewportHeight * 0.22);
    const tapLineHeight = leftTap && rightTap
      ? Math.round(Math.max(leftTap.height, rightTap.height) * 2)
      : 108;
    centerDivider.style.top = `${Math.round(tapLineCenterY - tapLineHeight / 2)}px`;
    centerDivider.style.height = `${tapLineHeight}px`;

    for (const layout of layouts) {
      layout.labelEl.style.left = `${layout.x}px`;
      layout.labelEl.style.top = `${layout.y}px`;

      if (layout.group.noArrow) {
        continue;
      }

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
            targetPoint.x -= 14;
            targetPoint.y += 14;
          }
        }
      }

      if (!targetPoint) continue;

      const forcedSource = getArrowSourcePoint(labelRect, layout.group.arrowFrom);
      const from = forcedSource || lineAttachPoint(labelRect, targetPoint);
      drawArrow(from, targetPoint);
    }
  }

  const blockers = ["pointerdown", "pointerup", "click", "dblclick", "contextmenu", "touchstart", "touchmove", "touchend", "wheel"];
  const blockEvents = (event) => {
    if (!open) return;
    if (isHelpButtonEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
  };

  const onKeyDown = (event) => {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (isHelpButtonEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  blockers.forEach((eventName) => document.addEventListener(eventName, blockEvents, true));
  document.addEventListener("keydown", onKeyDown, true);

  function openOverlay() {
    if (open) return;

    if (!isSliderOpen()) {
      ensureSliderOpen();
      autoOpenedSlider = true;
    } else {
      autoOpenedSlider = false;
    }

    open = true;
    rootEl.classList.add("is-open");
    rootEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("helpOverlay-active");
    setButtonState(true);
    render();
    onOpened?.();
  }

  function close() {
    if (!open) return;

    open = false;
    rootEl.classList.remove("is-open");
    rootEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("helpOverlay-active");
    setButtonState(false);

    if (autoOpenedSlider) {
      options.closeSlider?.();
    }

    onClosed?.();
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    openOverlay();
  }

  const onResize = () => render();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  return {
    open: openOverlay,
    close,
    toggle,
    render,
    isOpen: () => open,
    destroy: () => {
      close();
      blockers.forEach((eventName) => document.removeEventListener(eventName, blockEvents, true));
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      rootEl.remove();
    },
  };
}
