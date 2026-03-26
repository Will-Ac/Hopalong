export function initUIPanels({
  rangesEditorPanelEl,
  rangesEditorToggleEl,
  formulaSettingsPanelEl,
  colorSettingsPanelEl,
  modeSettingsPanelEl,
  backgroundSettingsSectionEl,
  modeSettingsSectionEls,
  pickerPanel,
  renderHelpOverlay,
  scheduleHelpOverlayRender,
  syncDetailedSettingsControls,
  hideSettingsInfo,
  getSelectedRangesEditorFormulaId,
  loadFormulaRangesIntoEditor,
  syncSeedEditorInputs,
  setActiveColorSettingsMap,
  setColorSettingsName,
  setColorSettingsPreview,
  buildColorMapGradient,
  renderColorStopsEditor,
  saveDefaultsToStorage,
  getSettingsPanelMode,
}) {
  let activeColourPanelSettings = "mode";

  function isPanelOpen(panelEl) {
    return Boolean(panelEl && !panelEl.classList.contains("is-hidden"));
  }

  function syncColourPanelSettingsSections() {
    backgroundSettingsSectionEl?.classList.toggle("is-hidden", activeColourPanelSettings !== "background");
    for (const sectionEl of modeSettingsSectionEls) {
      sectionEl.classList.toggle("is-hidden", activeColourPanelSettings !== "mode");
    }
  }

  function layoutFormulaSettingsPanel() {
    if (!formulaSettingsPanelEl || formulaSettingsPanelEl.classList.contains("is-hidden")) {
      return;
    }

    const margin = 8;
    const viewportWidth = window.innerWidth;
    const pickerRect = pickerPanel?.getBoundingClientRect();
    const panelWidth = formulaSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
    const targetLeft = pickerRect
      ? Math.max(margin, pickerRect.left - panelWidth - 8)
      : margin;
    formulaSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
    formulaSettingsPanelEl.style.right = "auto";
    scheduleHelpOverlayRender?.();
  }

  function layoutColorSettingsPanel() {
    if (!colorSettingsPanelEl || colorSettingsPanelEl.classList.contains("is-hidden")) {
      return;
    }

    const margin = 8;
    const viewportWidth = window.innerWidth;
    const pickerRect = pickerPanel?.getBoundingClientRect();
    const panelWidth = colorSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
    const targetLeft = pickerRect
      ? Math.max(margin, pickerRect.left - panelWidth - 8)
      : margin;
    colorSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
    colorSettingsPanelEl.style.right = "auto";
    scheduleHelpOverlayRender?.();
  }

  function layoutModeSettingsPanel() {
    if (!modeSettingsPanelEl || modeSettingsPanelEl.classList.contains("is-hidden")) {
      return;
    }

    const margin = 8;
    const viewportWidth = window.innerWidth;
    const anchorId = activeColourPanelSettings === "background"
      ? "pickerBackgroundSettingsProxy"
      : "pickerModeSettingsProxy";
    const anchorRect = document.getElementById(anchorId)?.getBoundingClientRect();
    const parentRect = anchorRect ? pickerPanel?.getBoundingClientRect() : colorSettingsPanelEl?.getBoundingClientRect();
    const panelWidth = modeSettingsPanelEl.getBoundingClientRect().width || Math.min(380, viewportWidth - margin * 2);
    const targetLeft = parentRect && anchorRect
      ? Math.max(margin, parentRect.left - panelWidth - 8)
      : margin;
    modeSettingsPanelEl.style.left = `${Math.round(Math.min(targetLeft, viewportWidth - panelWidth - margin))}px`;
    modeSettingsPanelEl.style.right = "auto";
    modeSettingsPanelEl.style.top = parentRect ? `${Math.round(parentRect.top)}px` : `${margin}px`;
  }

  function closeModeSettingsPanel() {
    modeSettingsPanelEl?.classList.add("is-hidden");
    renderHelpOverlay?.();
  }

  function closeRangesEditor() {
    rangesEditorPanelEl?.classList.add("is-hidden");
    rangesEditorToggleEl?.classList.remove("is-active");
    rangesEditorToggleEl?.setAttribute("aria-pressed", "false");
    hideSettingsInfo?.();
    renderHelpOverlay?.();
  }

  function closeFormulaSettingsPanel() {
    formulaSettingsPanelEl?.classList.add("is-hidden");
    renderHelpOverlay?.();
  }

  function closeColorSettingsPanel() {
    closeModeSettingsPanel();
    setActiveColorSettingsMap(null);
    colorSettingsPanelEl?.classList.add("is-hidden");
    saveDefaultsToStorage?.();
    renderHelpOverlay?.();
  }

  function openRangesEditor() {
    if (!rangesEditorPanelEl) {
      return;
    }

    closeFormulaSettingsPanel();
    closeColorSettingsPanel();
    closeModeSettingsPanel();
    rangesEditorPanelEl.classList.remove("is-hidden");
    rangesEditorToggleEl?.classList.add("is-active");
    rangesEditorToggleEl?.setAttribute("aria-pressed", "true");
    syncDetailedSettingsControls?.();
    hideSettingsInfo?.();
    renderHelpOverlay?.();
  }

  function openFormulaSettingsPanel(formulaId = null) {
    if (!formulaSettingsPanelEl) {
      return;
    }

    closeRangesEditor();
    closeColorSettingsPanel();
    closeModeSettingsPanel();
    formulaSettingsPanelEl.classList.remove("is-hidden");
    const targetFormulaId = formulaId || getSelectedRangesEditorFormulaId?.();
    loadFormulaRangesIntoEditor?.(targetFormulaId);
    syncSeedEditorInputs?.(targetFormulaId);
    layoutFormulaSettingsPanel();
    renderHelpOverlay?.();
  }

  function openModeSettingsPanel(sectionKey = "mode") {
    if (!modeSettingsPanelEl) {
      return;
    }

    activeColourPanelSettings = sectionKey;
    syncColourPanelSettingsSections();
    modeSettingsPanelEl.classList.remove("is-hidden");
    layoutModeSettingsPanel();
    renderHelpOverlay?.();
  }

  function openColorSettingsPanel(cmapName) {
    setActiveColorSettingsMap(cmapName);
    setColorSettingsName(cmapName);
    setColorSettingsPreview(buildColorMapGradient(cmapName));
    closeRangesEditor();
    closeFormulaSettingsPanel();
    colorSettingsPanelEl.classList.remove("is-hidden");
    renderColorStopsEditor?.();
    layoutColorSettingsPanel();
    renderHelpOverlay?.();
  }

  function closeDismissablePanelsForTarget(target) {
    if (!(target instanceof Element)) {
      return;
    }

    if (isPanelOpen(modeSettingsPanelEl) && !target.closest("#modeSettingsPanel, #pickerModeSettingsProxy, #pickerBackgroundSettingsProxy, #settingsInfoPopup")) {
      closeModeSettingsPanel();
    }
    if (isPanelOpen(colorSettingsPanelEl) && !target.closest("#colorSettingsPanel, #pickerOverlay, #settingsInfoPopup")) {
      closeColorSettingsPanel();
    }
    if (isPanelOpen(formulaSettingsPanelEl) && !target.closest("#formulaSettingsPanel, #pickerOverlay")) {
      closeFormulaSettingsPanel();
    }
    if (isPanelOpen(rangesEditorPanelEl)
      && !target.closest("#rangesEditorPanel, #rangesEditorToggle, #settingsInfoPopup")
      && (getSettingsPanelMode?.() || "simple") !== "full") {
      closeRangesEditor();
    }
  }

  return {
    openRangesEditor,
    closeRangesEditor,
    openFormulaSettingsPanel,
    closeFormulaSettingsPanel,
    openColorSettingsPanel,
    closeColorSettingsPanel,
    openModeSettingsPanel,
    closeModeSettingsPanel,
    closeDismissablePanelsForTarget,
    layoutFormulaSettingsPanel,
    layoutColorSettingsPanel,
    layoutModeSettingsPanel,
    isPanelOpen,
    getActiveColourPanelSettings: () => activeColourPanelSettings,
  };
}
