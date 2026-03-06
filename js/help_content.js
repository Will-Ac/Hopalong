(function () {
  const HELP_CONTENT = {
    version: 2,
    title: "Help",
    sections: [
      {
        id: "quickstart",
        title: "Quick start",
        items: [
          { type: "bullet", text: "Tap Randomize to explore new shapes." },
          { type: "bullet", text: "Tap a parameter tile (a/b/c/d/iter) to open its quick slider." },
          { type: "bullet", text: "Press and hold +/− in the quick slider to accelerate changes." },
          { type: "bullet", text: "Set parameters to ManX/ManY to modulate values using manual movement." },
        ],
      },
      {
        id: "controls",
        title: "Controls & gestures",
        items: [
          { type: "subheading", text: "Touch / trackpad" },
          { type: "bullet", text: "One finger drag: manual modulation when enabled." },
          { type: "bullet", text: "Two finger pan/zoom: move and scale the view." },
          { type: "subheading", text: "Mouse / keyboard" },
          { type: "bullet", text: "Drag on canvas to modulate when manual mode is active." },
          { type: "bullet", text: "Arrow keys: ManX (left/right), ManY (up/down)." },
        ],
      },
      {
        id: "param_modes",
        title: "Parameter modes",
        items: [
          { type: "bullet", text: "Rand: parameter randomizes when moving forward/randomizing." },
          { type: "bullet", text: "Fix: parameter stays constant." },
          { type: "bullet", text: "ManX / ManY: parameter is driven by manual modulation axis." },
        ],
      },
      {
        id: "sliders",
        title: "Sliders & stepping",
        items: [
          { type: "bullet", text: "Tap +/− for a single small step." },
          { type: "bullet", text: "Press and hold +/− to accelerate." },
          { type: "bullet", text: "Use Hold speed and timing settings in General settings to tune acceleration." },
        ],
      },
      {
        id: "export",
        title: "Export / screenshot / QR",
        items: [
          { type: "bullet", text: "Use the camera button to save an image." },
          { type: "bullet", text: "The export image includes a QR code that recreates current state." },
        ],
      },
    ],
    shortcuts: [
      { keys: ["←", "→"], action: "Adjust ManX parameter" },
      { keys: ["↑", "↓"], action: "Adjust ManY parameter" },
      { keys: ["Esc"], action: "Close help" },
    ],
    glossary: [
      { term: "ManX / ManY", text: "Manual modulation axes driven by pointer position or movement." },
    ],
    topics: {
      help: {
        title: "Help",
        text: "Open Help to review controls, gestures, parameter modes, and sharing/export tips.",
        interaction: "Click/tap to open the full Help modal.",
      },
      settings: {
        title: "Settings",
        text: "Open settings for color, render tuning, hold-speed behavior, and debug controls.",
        interaction: "Click/tap to open or close the settings panel.",
      },
      export: {
        title: "Screenshot / Export",
        text: "Capture the current image. Export includes state details and QR support.",
        interaction: "Click/tap for screenshot. Long-press may include richer overlay data.",
      },
      scale_mode: {
        title: "Scale mode",
        text: "Toggle between auto-scaling and fixed view scaling.",
        interaction: "Click/tap to switch mode.",
      },
      randomize: {
        title: "Randomize mode",
        text: "Switches between randomizing all eligible parameters and fixing current values.",
        interaction: "Double-tap/click quickly to toggle mode.",
      },
      param_tile: {
        title: "Parameter tile",
        text: "Displays one active formula/color/parameter control at a glance.",
        interaction: "Tap for quick action. Long-press/swipe can change mode or history behavior.",
      },
      slider_step: {
        title: "Step controls (+/−)",
        text: "Nudge the selected parameter in small increments.",
        interaction: "Click/tap for one step; press-and-hold to accelerate.",
      },
      slider_range: {
        title: "Quick slider",
        text: "Continuously adjusts the currently selected parameter value.",
        interaction: "Drag the slider thumb to adjust smoothly.",
      },
      picker_option: {
        title: "Picker option",
        text: "Selects the highlighted formula or color map.",
        interaction: "Click/tap to preview/apply selection.",
      },
      picker_settings: {
        title: "Picker settings",
        text: "Opens detailed editor for the selected formula or color map.",
        interaction: "Click/tap the gear icon.",
      },
      color_stop: {
        title: "Color stop control",
        text: "Adjust stop position, color, transparency, or remove it from the active map.",
        interaction: "Use slider/buttons for edits; changes update the preview live.",
      },
      input: {
        title: "Input control",
        text: "This control edits a numeric or text value used by the renderer.",
        interaction: "Click/tap to edit, then type or drag as supported.",
      },
      button: {
        title: "Button",
        text: "Triggers an action in the app.",
        interaction: "Click/tap to run the action once.",
      },
      select: {
        title: "Selection list",
        text: "Choose one of multiple modes/options.",
        interaction: "Click/tap and pick an option from the list.",
      },
      settings_info: {
        title: "Info hint",
        text: "Shows a short explanation of this setting.",
        interaction: "Click/tap the i button.",
      },
    },
  };

  window.HELP_CONTENT = HELP_CONTENT;
})();
