import { HELP_GROUP_BRACKETS, HELP_OVERLAY_ITEMS } from "./helpOverlayConfig.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getElementRect(selector) {
  const element = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function unionRects(rects) {
  const valid = rects.filter(Boolean);
  if (!valid.length) return null;
  const left = Math.min(...valid.map((rect) => rect.left));
  const top = Math.min(...valid.map((rect) => rect.top));
  const right = Math.max(...valid.map((rect) => rect.right));
  const bottom = Math.max(...valid.map((rect) => rect.bottom));
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function targetPointFromRect(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function placeLabel(labelEl, rect, placement, viewportWidth, viewportHeight) {
  const margin = 12;
  const gap = 12;
  const labelRect = labelEl.getBoundingClientRect();
  let x = rect.left;
  let y = rect.top;

  switch (placement) {
    case "top":
      x = rect.left + (rect.width - labelRect.width) / 2;
      y = rect.top - labelRect.height - gap;
      break;
    case "top-left":
      x = rect.left;
      y = rect.top - labelRect.height - gap;
      break;
    case "top-right":
      x = rect.right - labelRect.width;
      y = rect.top - labelRect.height - gap;
      break;
    case "left":
      x = rect.left - labelRect.width - gap;
      y = rect.top + (rect.height - labelRect.height) / 2;
      break;
    case "right":
      x = rect.right + gap;
      y = rect.top + (rect.height - labelRect.height) / 2;
      break;
    case "bottom-left":
      x = rect.left;
      y = rect.bottom + gap;
      break;
    case "bottom-right":
      x = rect.right - labelRect.width;
      y = rect.bottom + gap;
      break;
    case "bottom":
    default:
      x = rect.left + (rect.width - labelRect.width) / 2;
      y = rect.bottom + gap;
      break;
  }

  x = clamp(x, margin, viewportWidth - labelRect.width - margin);
  y = clamp(y, margin, viewportHeight - labelRect.height - margin);
  labelEl.style.left = `${Math.round(x)}px`;
  labelEl.style.top = `${Math.round(y)}px`;
}

function lineAttachPoint(fromRect, toPoint) {
  const centerX = fromRect.left + fromRect.width / 2;
  const centerY = fromRect.top + fromRect.height / 2;
  const dx = toPoint.x - centerX;
  const dy = toPoint.y - centerY;
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx > 0 ? fromRect.right : fromRect.left,
      y: clamp(toPoint.y, fromRect.top + 6, fromRect.bottom - 6),
    };
  }
  return {
    x: clamp(toPoint.x, fromRect.left + 6, fromRect.right - 6),
    y: dy > 0 ? fromRect.bottom : fromRect.top,
  };
}

function buildLabel(item) {
  const labelEl = document.createElement("div");
  labelEl.className = `helpOverlay__label helpOverlay__label--${item.group}`;

  const actionEl = document.createElement("strong");
  actionEl.textContent = item.action;
  const bodyEl = document.createElement("span");
  bodyEl.textContent = ` ${item.body}`;

  labelEl.append(actionEl, bodyEl);
  return labelEl;
}

export function createHelpOverlay(options) {
  const {
    helpButton,
    ensureSliderOpen,
    isSliderOpen,
    onOpened,
    onClosed,
  } = options;

  const rootEl = document.createElement("div");
  rootEl.id = "helpOverlay";
  rootEl.setAttribute("aria-hidden", "true");

  const dimmerEl = document.createElement("div");
  dimmerEl.className = "helpOverlay__dimmer";
  const canvasEl = document.createElementNS(SVG_NS, "svg");
  canvasEl.classList.add("helpOverlay__lines");
  canvasEl.setAttribute("viewBox", "0 0 100 100");
  canvasEl.setAttribute("preserveAspectRatio", "none");

  const defs = document.createElementNS(SVG_NS, "defs");
  const marker = document.createElementNS(SVG_NS, "marker");
  marker.setAttribute("id", "helpArrowHead");
  marker.setAttribute("markerWidth", "6");
  marker.setAttribute("markerHeight", "6");
  marker.setAttribute("refX", "5");
  marker.setAttribute("refY", "3");
  marker.setAttribute("orient", "auto");
  const arrowPath = document.createElementNS(SVG_NS, "path");
  arrowPath.setAttribute("d", "M0,0 L6,3 L0,6 Z");
  arrowPath.setAttribute("fill", "rgba(255,255,255,0.95)");
  marker.append(arrowPath);
  defs.append(marker);
  canvasEl.append(defs);

  const labelsLayer = document.createElement("div");
  labelsLayer.className = "helpOverlay__labels";

  const centerDivider = document.createElement("div");
  centerDivider.className = "helpOverlay__centerDivider";

  rootEl.append(dimmerEl, canvasEl, centerDivider, labelsLayer);
  document.body.append(rootEl);

  let open = false;
  let autoOpenedSlider = false;

  const blockers = ["pointerdown", "pointerup", "click", "dblclick", "contextmenu", "touchstart", "touchmove", "touchend", "wheel"];
  const blockEvents = (event) => {
    if (!open) return;
    if (event.target?.closest?.("#helpBtn")) return;
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
    if (event.target?.closest?.("#helpBtn")) return;
    event.preventDefault();
    event.stopPropagation();
  };

  blockers.forEach((name) => document.addEventListener(name, blockEvents, true));
  document.addEventListener("keydown", onKeyDown, true);

  function clearGraphics() {
    labelsLayer.innerHTML = "";
    const all = canvasEl.querySelectorAll("line,path");
    all.forEach((node) => node.remove());
  }

  function drawArrow(fromPoint, toPoint) {
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", String(fromPoint.x));
    line.setAttribute("y1", String(fromPoint.y));
    line.setAttribute("x2", String(toPoint.x));
    line.setAttribute("y2", String(toPoint.y));
    line.setAttribute("stroke", "rgba(255,255,255,0.93)");
    line.setAttribute("stroke-width", "1.2");
    line.setAttribute("marker-end", "url(#helpArrowHead)");
    canvasEl.append(line);
  }

  function drawBracket(rect) {
    const y = rect.top - 8;
    const left = rect.left;
    const right = rect.right;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", `M ${left} ${y + 8} L ${left} ${y} L ${right} ${y} L ${right} ${y + 8}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,0.92)");
    path.setAttribute("stroke-width", "1");
    canvasEl.append(path);
  }

  function relToViewport(point) {
    return { x: point.x * window.innerWidth, y: point.y * window.innerHeight };
  }

  function render() {
    if (!open) return;
    clearGraphics();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    canvasEl.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    centerDivider.style.left = `${Math.round(viewportWidth / 2)}px`;
    centerDivider.style.top = `${Math.round(viewportHeight * 0.15)}px`;
    centerDivider.style.height = `${Math.round(viewportHeight * 0.16)}px`;

    for (const bracket of HELP_GROUP_BRACKETS) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getElementRect(selector)));
      if (!rect) continue;
      drawBracket(rect);
    }

    for (const item of HELP_OVERLAY_ITEMS) {
      const labelEl = buildLabel(item);
      labelsLayer.append(labelEl);

      let targetRect = null;
      let targetPoint = null;
      if (item.targetSelector) {
        targetRect = getElementRect(item.targetSelector);
      }
      if (item.targetPoint) {
        targetPoint = relToViewport(item.targetPoint);
      } else if (targetRect) {
        targetPoint = targetPointFromRect(targetRect);
      }

      if (item.labelPlacement === "absolute" && item.absolute) {
        const lr = labelEl.getBoundingClientRect();
        const x = clamp(item.absolute.x * viewportWidth - lr.width / 2, 12, viewportWidth - lr.width - 12);
        const y = clamp(item.absolute.y * viewportHeight - lr.height / 2, 12, viewportHeight - lr.height - 12);
        labelEl.style.left = `${Math.round(x)}px`;
        labelEl.style.top = `${Math.round(y)}px`;
      } else if (targetRect) {
        placeLabel(labelEl, targetRect, item.labelPlacement, viewportWidth, viewportHeight);
      } else {
        labelEl.remove();
        continue;
      }

      if (!targetPoint) continue;
      const labelRect = labelEl.getBoundingClientRect();
      const fromPoint = lineAttachPoint(labelRect, targetPoint);
      drawArrow(fromPoint, targetPoint);
    }
  }

  function setButtonActive(active) {
    helpButton?.classList.toggle("is-active", active);
    helpButton?.setAttribute("aria-pressed", active ? "true" : "false");
  }

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
    setButtonActive(true);
    render();
    onOpened?.();
  }

  function close() {
    if (!open) return;
    open = false;
    rootEl.classList.remove("is-open");
    rootEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("helpOverlay-active");
    setButtonActive(false);
    if (autoOpenedSlider) {
      options.closeSlider?.();
    }
    onClosed?.();
  }

  function toggle() {
    if (open) {
      close();
    } else {
      openOverlay();
    }
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
      blockers.forEach((name) => document.removeEventListener(name, blockEvents, true));
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      rootEl.remove();
    },
  };
}
