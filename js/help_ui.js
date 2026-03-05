(function () {
  const HELP_MODE_KEY = "helpModeEnabled";
  const HELP_SEEN_KEY = "helpSeen";

  let helpModeEnabled = false;
  let modalRoot = null;
  let lastFocusedElement = null;
  let initialized = false;

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
              Help mode: Tap on controls to see what they do.
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

  function syncModeToggleUi() {
    const modeToggle = modalRoot?.querySelector("#helpModeToggle");
    if (modeToggle) {
      modeToggle.checked = helpModeEnabled;
    }
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
        <button id="settingsHelpBtn" class="rangeActionBtn" type="button">Open help</button>
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

    if (settingsContainerSelector) {
      buildSettingsHelpRow(settingsContainerSelector);
    }

    const openBtn = openButtonSelector ? document.querySelector(openButtonSelector) : null;
    const settingsHelpBtn = document.querySelector("#settingsHelpBtn");
    openBtn?.addEventListener("click", openHelp);
    settingsHelpBtn?.addEventListener("click", openHelp);
  }

  window.initHelpUI = initHelpUI;
  window.openHelp = openHelp;
  window.closeHelp = closeHelp;
  window.setHelpModeEnabled = setHelpModeEnabled;
})();
