// Bundled user defaults extracted from data/defaults.json
export const DEFAULTS = {
  "cmapName": "Sand → Coral → Rose",
  "formulaId": "classic_sqrt",
  "scaleMode": "auto",
  "sliders": {
    "a": 50.0,
    "b": 50.0,
    "c": 50.0,
    "d": 50.0,
    "iters": 754901.0,
    "burn": 120.0
  },
  "notes": [
    "a/b/c/d defaults are slider positions (0\u2013100).",
    "Actual a/b/c/d values must be derived from slider position using formula-specific ranges.",
    "debug controls whether the debug axis/tick/info overlay is shown."
  ],
  "debug": false,
  "debugText": false,
  "iterationAbsoluteMax": 100000000,
  "iterationStartupDefault": 754901,
  "maxRandomIters": 1000000,
  "historyCacheSize": 6,
  "renderColorMode": "iteration_order",
  "renderLogStrength": 9,
  "renderDensityGamma": 0.6,
  "renderHybridBlend": 0.3,
  "backgroundColor": "#05070c",
  "colorMapStopOverrides": {},
  "overlayAlpha": 0.8,
  "holdSpeedScale": 50.0,
  "holdRepeatMs": 300,
  "holdAccelStartMs": 5000,
  "holdAccelEndMs": 8000,
  "touchPanDeadbandPx": 2.0,
  "touchZoomDeadbandPx": 1.5,
  "touchZoomRatioMin": 0.003,
  "panZoomSettleMs": 200,
  "rotationActivationThresholdDegrees": 30,
  "interestOverlayEnabled": false,
  "interestGridSize": 256,
  "interestScanIterations": 300,
  "interestLyapunovEnabled": true,
  "interestLyapunovMinExponent": 0.0,
  "interestLyapunovDelta0": 1e-06,
  "interestLyapunovRescale": true,
  "interestLyapunovMaxDistance": 1000000,
  "interestHighThreshold": 0.2,
  "interestOverlayOpacity": 0.35
};


export const DEFAULT_BURN = Math.round(DEFAULTS.sliders.burn);
