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
      return { x: rect.left + rect.width / 2, y: rect.top - 10 };
    case "top-left":
      return { x: rect.left + 8, y: rect.top - 10 };
    case "top-right":
      return { x: rect.right - 8, y: rect.top - 10 };
    case "left":
      return { x: rect.left - 10, y: rect.top + rect.height / 2 };
    case "right":
      return { x: rect.right + 10, y: rect.top + rect.height / 2 };
    case "bottom":
      return { x: rect.left + rect.width / 2, y: rect.bottom + 10 };
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
      y: clamp(toPoint.y, labelRect.top + 10, labelRect.bottom - 10),
    };
  }

  return {
    x: clamp(toPoint.x, labelRect.left + 10, labelRect.right - 10),
    y: dy >= 0 ? labelRect.bottom : labelRect.top,
  };
}

function buildGroupLabel(group) {
  const el = document.createElement("div");
  el.className = `helpOverlay__label helpOverlay__label--${group.group}`;

  for (const row of group.lines) {
    const rowEl = document.createElement("div");
    rowEl.className = "helpOverlay__row";
    const actionEl = document.createElement("strong");
    actionEl.textContent = `${row.action};`;
    const bodyEl = document.createElement("span");
    bodyEl.textContent = row.body;
    rowEl.append(actionEl, bodyEl);
    el.append(rowEl);
  }

  return el;
}

function resolveTargetPoint(target, viewportWidth, viewportHeight) {
  if (target.point) {
    return {
      x: target.point.x * viewportWidth,
      y: target.point.y * viewportHeight,
    };
  }
  if (!target.selector) return null;
  const rect = getRect(target.selector);
  if (!rect) return null;
  return pointFromRect(rect, target.attach);
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

  function drawBracket(rect) {
    const y = rect.top - 16;
    const left = rect.left;
    const right = rect.right;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", `M ${left} ${y + 10} L ${left} ${y} L ${right} ${y} L ${right} ${y + 10}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(255,255,255,0.92)");
    path.setAttribute("stroke-width", "1");
    svgEl.append(path);
  }

  function resolveGroupLabelPosition(group, labelEl, viewportWidth, viewportHeight) {
    const lr = labelEl.getBoundingClientRect();
    const x = clamp(group.label.x * viewportWidth - lr.width / 2, 12, viewportWidth - lr.width - 12);
    const y = clamp(group.label.y * viewportHeight - lr.height / 2, 12, viewportHeight - lr.height - 12);
    return { x: Math.round(x), y: Math.round(y), width: lr.width, height: lr.height };
  }

  function preventLabelOverlap(layouts, viewportWidth, viewportHeight) {
    for (let i = 0; i < layouts.length; i += 1) {
      const current = layouts[i];
      let moved = true;
      let safety = 0;
      while (moved && safety < 18) {
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
            current.x = clamp(current.x + 10, 12, viewportWidth - current.width - 12);
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
    centerDivider.style.top = `${Math.round(viewportHeight * 0.14)}px`;
    centerDivider.style.height = `${Math.round(viewportHeight * 0.15)}px`;

    for (const bracket of HELP_GROUP_BRACKETS) {
      const rect = unionRects(bracket.targetSelectors.map((selector) => getRect(selector)));
      if (rect) drawBracket(rect);
    }

    const layouts = [];
    for (const group of HELP_OVERLAY_GROUPS) {
      const labelEl = buildGroupLabel(group);
      labelsLayer.append(labelEl);
      const layout = resolveGroupLabelPosition(group, labelEl, viewportWidth, viewportHeight);
      layouts.push({ ...layout, group, labelEl });
    }

    preventLabelOverlap(layouts, viewportWidth, viewportHeight);

    for (const layout of layouts) {
      layout.labelEl.style.left = `${layout.x}px`;
      layout.labelEl.style.top = `${layout.y}px`;
      const labelRect = layout.labelEl.getBoundingClientRect();

      for (const target of layout.group.targets) {
        const targetPoint = resolveTargetPoint(target, viewportWidth, viewportHeight);
        if (!targetPoint) continue;
        const fromPoint = lineAttachPoint(labelRect, targetPoint);
        drawArrow(fromPoint, targetPoint);
      }
    }
  }

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
