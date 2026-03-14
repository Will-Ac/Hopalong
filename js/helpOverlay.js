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

    const textWrap = document.createElement("div");
    textWrap.className = "helpOverlay__rowText";

    const actionEl = document.createElement("strong");
    const delimiter = row.delimiter ?? ";";
    actionEl.textContent = `${row.action}${delimiter}`;

    if (row.heading) {
      textWrap.append(actionEl);
      rowEl.append(textWrap);
      el.append(rowEl);
      continue;
    }

    const bodyEl = document.createElement("span");
    bodyEl.textContent = row.body;

    textWrap.append(actionEl, bodyEl);

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

  function drawBracket(rect, side = "top") {
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

    const y = rect.top - 24;
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

  function preventLabelOverlap(layouts, viewportWidth, viewportHeight) {
    for (let i = 0; i < layouts.length; i += 1) {
      const current = layouts[i];
      if (current.group.variant === "canvasSplit") continue;

      let moved = true;
      let safety = 0;
      while (moved && safety < 22) {
        moved = false;
        safety += 1;
        const currentRect = {
          left: current.x,
          top: current.y,
          right: current.x + current.width,
          bottom: current.y + current.height,
        };

        for (let j = 0; j < i; j += 1) {
          const previous = layouts[j];
          const prevRect = {
            left: previous.x,
            top: previous.y,
            right: previous.x + previous.width,
            bottom: previous.y + previous.height,
          };
          if (boxesOverlap(currentRect, prevRect, 8)) {
            current.y = clamp(previous.y + previous.height + 10, 12, viewportHeight - current.height - 12);
            current.x = clamp(current.x + 8, 12, viewportWidth - current.width - 12);
            moved = true;
          }
        }
      }
    }
  }

  function render() {
    if (!open) return;

    clearGraphics();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    svgEl.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    centerDivider.style.left = `${Math.round(viewportWidth / 2)}px`;

    const bracketMidpoints = new Map();
    for (const bracket of HELP_GROUP_BRACKETS) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getRect(selector)));
      if (!rect) continue;
      const midpoint = drawBracket(rect, bracket.side);
      bracketMidpoints.set(bracket.id, midpoint);
    }

    const layouts = [];
    for (const group of HELP_OVERLAY_GROUPS) {
      const labelEl = buildGroupLabel(group);
      labelsLayer.append(labelEl);

      const rect = labelEl.getBoundingClientRect();
      if (group.variant === "canvasSplit") {
        labelEl.style.width = "auto";
      }
      const measured = labelEl.getBoundingClientRect();
      let x = clamp(group.label.x * viewportWidth - measured.width / 2, 12, viewportWidth - measured.width - 12);
      if (group.align === "leftPinned") {
        x = 16;
      }
      const y = clamp(group.label.y * viewportHeight - measured.height / 2, 12, viewportHeight - measured.height - 12);
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
        let x = clamp(item.group.label.x * viewportWidth - item.width / 2, 12, viewportWidth - item.width - 12);
        if (item.group.align === "leftPinned") x = 16;
        item.x = Math.round(x);
      }
      const leftTap = canvasLayouts.find((item) => item.group.id === "canvas-left");
      const rightTap = canvasLayouts.find((item) => item.group.id === "canvas-right");
      const dividerGap = 56;
      if (leftTap) {
        leftTap.x = clamp(Math.floor(dividerX - dividerGap / 2 - leftTap.width), 12, viewportWidth - leftTap.width - 12);
      }
      if (rightTap) {
        rightTap.x = clamp(Math.ceil(dividerX + dividerGap / 2), 12, viewportWidth - rightTap.width - 12);
      }
    }

    preventLabelOverlap(layouts, viewportWidth, viewportHeight);

    const paramOverlayRect = getRect("#paramOverlay");
    const quickSliderRect = getRect("#quickSlider");
    const uiTop = Math.min(
      Number.isFinite(paramOverlayRect?.top) ? paramOverlayRect.top : viewportHeight,
      Number.isFinite(quickSliderRect?.top) ? quickSliderRect.top : viewportHeight,
    );
    for (const layout of layouts) {
      const maxY = Math.max(12, uiTop - layout.height - 12);
      layout.y = Math.min(layout.y, maxY);
    }

    const leftTap = layouts.find((item) => item.group.id === "canvas-left");
    const rightTap = layouts.find((item) => item.group.id === "canvas-right");
    const lineCenterY = leftTap && rightTap
      ? Math.round((leftTap.y + leftTap.height / 2 + rightTap.y + rightTap.height / 2) / 2)
      : Math.round(viewportHeight * 0.22);
    const lineHeight = Math.max(108, Math.round(((leftTap?.height || 44) + (rightTap?.height || 44)) * 1.65));
    centerDivider.style.top = `${Math.round(lineCenterY - lineHeight / 2)}px`;
    centerDivider.style.height = `${lineHeight}px`;

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
