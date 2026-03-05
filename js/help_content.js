(function () {
  const HELP_CONTENT = {
    version: 1,
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
      randomize: "Randomize/next explores a new point in parameter history.",
      settings: "Open detailed settings for color, rendering, and controls.",
      export: "Capture a screenshot. Long-press may include overlay info.",
      slider_step: "Use +/− for precise nudges. Hold to accelerate.",
    },
  };

  window.HELP_CONTENT = HELP_CONTENT;
})();
