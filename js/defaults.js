// Bundled user defaults extracted from data/defaults.json
export const DEFAULTS = {
  "cmapName": "Turbo",
  "scaleMode": "auto",
  "sliders": {
    "a": 50.0,
    "b": 50.0,
    "c": 50.0,
    "d": 50.0,
    "iters": 500000.0,
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
  "iterationStartupDefault": 500000,
  "maxRandomIters": 1000000,
  "historyCacheSize": 6,
  "renderColorMode": "iteration_order",
  "renderLogStrength": 9,
  "renderDensityGamma": 0.6,
  "renderHybridBlend": 0.3,
  "backgroundColor": "#05070c",
  "colorMapStopOverrides": {},
  "overlayAlpha": 0.5,
  "holdSpeedScale": 50.0,
  "holdRepeatMs": 300,
  "holdAccelStartMs": 5000,
  "holdAccelEndMs": 8000,
  "touchZoomDeadbandPx": 2.5,
  "touchZoomRatioMin": 0.01,
  "rotationActivationThresholdDegrees": 15,
  "interestOverlayEnabled": false,
  "interestGridSize": 256,
  "interestScanIterations": 500,
  "interestLyapunovEnabled": true,
  "interestLyapunovMinExponent": 0.0,
  "interestLyapunovDelta0": 1e-06,
  "interestLyapunovRescale": true,
  "interestLyapunovMaxDistance": 1000000,
  "interestHighThreshold": 0.1,
  "interestOverlayOpacity": 0.2
};


export const DEFAULT_BURN = Math.round(DEFAULTS.sliders.burn);
