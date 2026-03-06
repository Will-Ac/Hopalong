(function () {
  const HELP_MODE_KEY = "helpModeEnabled";
  const HELP_SEEN_KEY = "helpSeen";
  const TOOLTIP_OFFSET = 12;

  let helpModeEnabled = false;
  let modalRoot = null;
  let tooltipEl = null;
  let lastFocusedElement = null;
  let initialized = false;
  let activeHoverTarget = null;

  function safeGetHelpContent() {
    const fallback = {
      title: "Help",
      sections: [
        {
          id: "fallback",
          title: "Help unavailable",
          items: [{ type: "bullet", text: "Help content is not available right now." }],
        },
      ],
      shortcuts: [{ keys: ["Esc"], action: "Close help" }],
      glossary: [],
      topics: {},
    };

    if (!window.HELP_CONTENT || typeof window.HELP_CONTENT !== "object") {
      return fallback;
    }

    return window.HELP_CONTENT;
  }

  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.disabled && el.getAttribute("aria-hidden") !== "true");
  }

  function ensureModal() {
    if (!modalRoot) {
      modalRoot = document.getElementById("helpModalRoot");
      if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "helpModalRoot";
        document.body.appendChild(modalRoot);
      }
    }

    if (modalRoot.querySelector("#helpModalBackdrop")) {
      return;
    }

    const content = safeGetHelpContent();
    const sectionsHtml = (content.sections || []).map((section) => {
      const itemsHtml = (section.items || []).map((item) => {
        if (item.type === "subheading") {
          return `<h3 class="helpSubheading">${item.text}</h3>`;
        }
        return `<li>${item.text}</li>`;
      }).join("");
      return `
        <section class="helpSection" data-help-section="${section.id || ""}">
          <h2>${section.title || "Section"}</h2>
          <ul>${itemsHtml}</ul>
        </section>
      `;
    }).join("");

    const shortcutsRows = (content.shortcuts || []).map((row) => {
      const keys = (row.keys || []).map((key) => `<span class="helpKeycap">${key}</span>`).join(" ");
      return `<li><span class="helpShortcutKeys">${keys}</span><span class="helpShortcutAction">${row.action || ""}</span></li>`;
    }).join("");

    const glossaryRows = (content.glossary || []).map((entry) => (
      `<li><strong>${entry.term || "Term"}:</strong> ${entry.text || ""}</li>`
    )).join("");

    modalRoot.innerHTML = `
      <div id="helpModalBackdrop" class="helpModalBackdrop is-hidden" aria-hidden="true">
        <div id="helpModalPanel" class="helpModalPanel" role="dialog" aria-modal="true" aria-labelledby="helpModalTitle">
          <header class="helpModalHeader">
            <h1 id="helpModalTitle">${content.title || "Help"}</h1>
            <button id="helpCloseBtn" type="button" aria-label="Close help">✕</button>
          </header>
          <div class="helpModeRow">
            <label>
              <input id="helpModeToggle" type="checkbox" />
              Help mode (hover): move over controls to see what they do.
            </label>
          </div>
          <div id="helpModalBody" class="helpModalBody">
            ${sectionsHtml}
            <section class="helpSection">
              <h2>Keyboard shortcuts</h2>
              <ul class="helpShortcutList">${shortcutsRows || "<li>No shortcuts listed.</li>"}</ul>
            </section>
            <section class="helpSection">
              <h2>Glossary</h2>
              <ul>${glossaryRows || "<li>No glossary entries yet.</li>"}</ul>
            </section>
          </div>
        </div>
      </div>
    `;

    const backdrop = modalRoot.querySelector("#helpModalBackdrop");
    const panel = modalRoot.querySelector("#helpModalPanel");
    const closeBtn = modalRoot.querySelector("#helpCloseBtn");
    const modeToggle = modalRoot.querySelector("#helpModeToggle");

    closeBtn?.addEventListener("click", closeHelp);
    backdrop?.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeHelp();
      }
    });

    panel?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHelp();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(panel);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    modeToggle?.addEventListener("change", () => {
      setHelpModeEnabled(Boolean(modeToggle.checked));
    });
  }

  function ensureTooltip() {
    if (tooltipEl) {
      return;
    }
    tooltipEl = document.createElement("div");
    tooltipEl.id = "helpHoverTooltip";
    tooltipEl.className = "helpHoverTooltip is-hidden";
    tooltipEl.setAttribute("role", "status");
    tooltipEl.setAttribute("aria-live", "polite");
    document.body.appendChild(tooltipEl);
  }

  function syncModeToggleUi() {
    const modeToggle = modalRoot?.querySelector("#helpModeToggle");
    if (modeToggle) {
      modeToggle.checked = helpModeEnabled;
    }
  }

  function normalizeKey(raw) {
    if (!raw) {
      return "";
    }
    return String(raw).trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
  }

  function getTopicByKey(key) {
    const topics = safeGetHelpContent().topics || {};
    if (!key) {
      return null;
    }
    return topics[key] || null;
  }

  function normalizeTopic(topic, fallbackTitle) {
    if (!topic) {
      return null;
    }

    if (typeof topic === "string") {
      return {
        title: fallbackTitle || "Help",
        text: topic,
        interaction: "",
      };
    }

    return {
      title: topic.title || fallbackTitle || "Help",
      text: topic.text || "",
      interaction: topic.interaction || "",
    };
  }

  function findInteractiveTarget(node) {
    if (!(node instanceof Element)) {
      return null;
    }

    return node.closest('[data-help-id], button, input, select, textarea, label, .pickerOption, .rangeActionBtn, .perfInfoBtn');
  }

  function inferKeyFromElement(el) {
    if (!el) {
      return "";
    }

    const tag = (el.tagName || "").toLowerCase();
    if (tag === "input") {
      return "input";
    }
    if (tag === "select") {
      return "select";
    }

    const idKey = normalizeKey(el.id);
    if (idKey) {
      if (idKey.includes("info")) return "settings_info";
      if (idKey.includes("range") || idKey.includes("slider") || idKey.includes("qs")) return "slider_range";
      if (idKey.includes("help")) return "help";
      if (idKey.includes("camera") || idKey.includes("export")) return "export";
      if (idKey.includes("settings") || idKey.includes("rangeseditor")) return "settings";
      if (idKey.includes("random")) return "randomize";
    }

    const classText = Array.from(el.classList || []).join(" ").toLowerCase();
    if (classText.includes("pickeroption")) return "picker_option";
    if (classText.includes("pickersettings")) return "picker_settings";
    if (classText.includes("colorstop") || classText.includes("stoprow")) return "color_stop";
    if (classText.includes("perfinfobtn")) return "settings_info";

    if (tag === "button") return "button";
    return "";
  }

  function getTopicForElement(el) {
    if (!el) {
      return null;
    }

    const dataKey = normalizeKey(el.getAttribute("data-help-id"));
    const ariaKey = normalizeKey(el.getAttribute("aria-label"));
    const titleGuess = el.getAttribute("aria-label") || el.textContent?.trim() || "Control";

    let topic = normalizeTopic(getTopicByKey(dataKey), titleGuess);
    if (topic) {
      return topic;
    }

    topic = normalizeTopic(getTopicByKey(normalizeKey(el.id)), titleGuess);
    if (topic) {
      return topic;
    }

    topic = normalizeTopic(getTopicByKey(ariaKey), titleGuess);
    if (topic) {
      return topic;
    }

    const inferredKey = inferKeyFromElement(el);
    topic = normalizeTopic(getTopicByKey(inferredKey), titleGuess);
    if (topic) {
      return topic;
    }

    return {
      title: titleGuess,
      text: "This is an interactive control.",
      interaction: "Hover in Help mode to inspect controls, then click/tap to use them.",
    };
  }

  function positionTooltip(target, anchorPoint) {
    if (!tooltipEl || !target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const tipRect = tooltipEl.getBoundingClientRect();

    let left = anchorPoint?.x ?? (rect.left + rect.width * 0.5);
    let top = anchorPoint?.y ?? rect.top;

    left += TOOLTIP_OFFSET;
    top += TOOLTIP_OFFSET;

    const maxLeft = Math.max(8, viewportW - tipRect.width - 8);
    const maxTop = Math.max(8, viewportH - tipRect.height - 8);
    left = Math.min(Math.max(8, left), maxLeft);
    top = Math.min(Math.max(8, top), maxTop);

    tooltipEl.style.left = `${Math.round(left)}px`;
    tooltipEl.style.top = `${Math.round(top)}px`;
  }

  function showTooltipForTarget(target, anchorPoint) {
    if (!helpModeEnabled || !target) {
      return;
    }
    ensureTooltip();
    const topic = getTopicForElement(target);
    if (!topic) {
      hideTooltip();
      return;
    }

    activeHoverTarget = target;
    tooltipEl.innerHTML = `
      <div class="helpHoverTitle">${topic.title}</div>
      <div class="helpHoverText">${topic.text}</div>
      ${topic.interaction ? `<div class="helpHoverInteraction"><strong>How:</strong> ${topic.interaction}</div>` : ""}
    `;

    tooltipEl.classList.remove("is-hidden");
    positionTooltip(target, anchorPoint);
  }

  function hideTooltip() {
    activeHoverTarget = null;
    if (tooltipEl) {
      tooltipEl.classList.add("is-hidden");
    }
  }

  function onHelpModePointerOver(event) {
    if (!helpModeEnabled) {
      return;
    }
    const target = findInteractiveTarget(event.target);
    if (!target) {
      return;
    }
    showTooltipForTarget(target, { x: event.clientX, y: event.clientY });
  }

  function onHelpModePointerMove(event) {
    if (!helpModeEnabled || !activeHoverTarget || !tooltipEl || tooltipEl.classList.contains("is-hidden")) {
      return;
    }

    const hovered = findInteractiveTarget(event.target);
    if (hovered && hovered !== activeHoverTarget) {
      showTooltipForTarget(hovered, { x: event.clientX, y: event.clientY });
      return;
    }

    positionTooltip(activeHoverTarget, { x: event.clientX, y: event.clientY });
  }

  function onHelpModePointerOut(event) {
    if (!helpModeEnabled) {
      return;
    }

    const fromTarget = findInteractiveTarget(event.target);
    const toTarget = findInteractiveTarget(event.relatedTarget);
    if (fromTarget && fromTarget === activeHoverTarget && toTarget !== fromTarget) {
      hideTooltip();
    }
  }

  function onHelpModeFocusIn(event) {
    if (!helpModeEnabled) {
      return;
    }
    const target = findInteractiveTarget(event.target);
    if (!target) {
      return;
    }
    showTooltipForTarget(target, null);
  }

  function onHelpModeFocusOut(event) {
    if (!helpModeEnabled) {
      return;
    }
    const nextTarget = findInteractiveTarget(event.relatedTarget);
    if (!nextTarget) {
      hideTooltip();
    }
  }

  function onHelpModeKeyDown(event) {
    if (!helpModeEnabled) {
      return;
    }
    if (event.key === "Escape") {
      hideTooltip();
    }
  }

  function installGlobalHelpModeListeners() {
    document.addEventListener("pointerover", onHelpModePointerOver, true);
    document.addEventListener("pointermove", onHelpModePointerMove, true);
    document.addEventListener("pointerout", onHelpModePointerOut, true);
    document.addEventListener("focusin", onHelpModeFocusIn, true);
    document.addEventListener("focusout", onHelpModeFocusOut, true);
    document.addEventListener("keydown", onHelpModeKeyDown, true);
    window.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("resize", hideTooltip, { passive: true });
  }

  function openHelp() {
    ensureModal();
    const backdrop = modalRoot?.querySelector("#helpModalBackdrop");
    const panel = modalRoot?.querySelector("#helpModalPanel");
    if (!backdrop || !panel) {
      return;
    }

    localStorage.setItem(HELP_SEEN_KEY, "1");
    lastFocusedElement = document.activeElement;
    backdrop.classList.remove("is-hidden");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("help-modal-open");
    syncModeToggleUi();

    const firstFocusable = getFocusableElements(panel)[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      panel.setAttribute("tabindex", "-1");
      panel.focus();
    }
  }

  function closeHelp() {
    const backdrop = modalRoot?.querySelector("#helpModalBackdrop");
    if (!backdrop) {
      return;
    }

    backdrop.classList.add("is-hidden");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("help-modal-open");

    const fallback = document.querySelector("#helpBtn");
    const target = lastFocusedElement && typeof lastFocusedElement.focus === "function" ? lastFocusedElement : fallback;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }

  function setHelpModeEnabled(enabled) {
    helpModeEnabled = Boolean(enabled);
    localStorage.setItem(HELP_MODE_KEY, helpModeEnabled ? "1" : "0");
    syncModeToggleUi();
    if (!helpModeEnabled) {
      hideTooltip();
    }
  }

  function buildSettingsHelpRow(settingsContainerSelector) {
    const container = document.querySelector(settingsContainerSelector);
    if (!container || container.querySelector("#settingsHelpBtn")) {
      return;
    }

    const card = document.createElement("div");
    card.className = "perfSettingCard";
    card.innerHTML = `
      <div class="perfSettingHead"><span class="perfSettingLabel">Help</span></div>
      <div class="perfControlRow">
        <button id="settingsHelpBtn" class="rangeActionBtn" type="button" data-help-id="help">Open help</button>
      </div>
    `;
    container.appendChild(card);
  }

  function initHelpUI({ openButtonSelector, settingsContainerSelector } = {}) {
    if (initialized) {
      return;
    }

    initialized = true;
    helpModeEnabled = localStorage.getItem(HELP_MODE_KEY) === "1";
    ensureModal();
    ensureTooltip();
    installGlobalHelpModeListeners();

    if (settingsContainerSelector) {
      buildSettingsHelpRow(settingsContainerSelector);
    }

    const openBtn = openButtonSelector ? document.querySelector(openButtonSelector) : null;
    const settingsHelpBtn = document.querySelector("#settingsHelpBtn");
    openBtn?.setAttribute("data-help-id", "help");
    openBtn?.addEventListener("click", openHelp);
    settingsHelpBtn?.addEventListener("click", openHelp);
  }

  window.initHelpUI = initHelpUI;
  window.openHelp = openHelp;
  window.closeHelp = closeHelp;
  window.setHelpModeEnabled = setHelpModeEnabled;
})();
