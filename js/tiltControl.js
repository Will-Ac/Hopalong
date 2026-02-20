const FULL_SCALE_DEGREES = 30;
const DEFAULT_TAU_SECONDS = 0.25;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

export function createTiltControl({
  button,
  overlay,
  closeButton,
  backdrop,
  xSelect,
  ySelect,
  statusEl,
  calibrateEnableButton,
  disableButton,
  recalibrateButton,
  readoutEl,
  helpEl,
  getParamOptions,
  getParamValue,
  setParamValue,
  isDebugEnabled,
}) {
  const state = {
    isEnabled: false,
    isModalOpen: false,
    hasOrientationData: false,
    permissionState: "unknown",
    latestBeta: 0,
    latestGamma: 0,
    beta0: 0,
    gamma0: 0,
    centerX: 0,
    centerY: 0,
    smoothedX: 0,
    smoothedY: 0,
    lastFrameTs: 0,
    rafId: 0,
    xKey: "alpha",
    yKey: "beta",
  };

  const detachOrientationListener = () => {
    window.removeEventListener("deviceorientation", onDeviceOrientation);
  };

  const logDebug = (...parts) => {
    if (!isDebugEnabled()) {
      return;
    }
    console.log("[TiltControl]", ...parts);
  };

  function updateStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
  }

  function refreshSelectOptions() {
    const options = getParamOptions();
    xSelect.innerHTML = "";
    ySelect.innerHTML = "";

    for (const item of options) {
      const xOption = document.createElement("option");
      xOption.value = item.key;
      xOption.textContent = item.label;
      xSelect.append(xOption);

      const yOption = document.createElement("option");
      yOption.value = item.key;
      yOption.textContent = item.label;
      ySelect.append(yOption);
    }

    if (!options.find((item) => item.key === state.xKey)) {
      state.xKey = options[0]?.key || "";
    }
    if (!options.find((item) => item.key === state.yKey)) {
      state.yKey = options[1]?.key || options[0]?.key || "";
    }

    xSelect.value = state.xKey;
    ySelect.value = state.yKey;
  }

  function updateReadout(values) {
    readoutEl.textContent = [
      `beta: ${formatNumber(values.beta, 2)}   gamma: ${formatNumber(values.gamma, 2)}`,
      `dBeta: ${formatNumber(values.dBeta, 2)}   dGamma: ${formatNumber(values.dGamma, 2)}`,
      `normalized X: ${formatNumber(values.normX, 3)}   normalized Y: ${formatNumber(values.normY, 3)}`,
      `param X: ${formatNumber(values.paramX, 4)}   param Y: ${formatNumber(values.paramY, 4)}`,
    ].join("\n");
  }

  function resetReadout() {
    updateReadout({
      beta: NaN,
      gamma: NaN,
      dBeta: NaN,
      dGamma: NaN,
      normX: NaN,
      normY: NaN,
      paramX: getParamValue(state.xKey),
      paramY: getParamValue(state.yKey),
    });
  }

  function updateUiState() {
    calibrateEnableButton.disabled = false;
    disableButton.disabled = !state.isEnabled;
    recalibrateButton.disabled = !state.isEnabled;
    button.classList.toggle("is-active", state.isEnabled);
  }

  function normalizeDelta(deltaDegrees) {
    const clamped = clamp(deltaDegrees, -FULL_SCALE_DEGREES, FULL_SCALE_DEGREES);
    return clamped / FULL_SCALE_DEGREES;
  }

  function stopAnimationLoop() {
    if (state.rafId) {
      window.cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
    state.lastFrameTs = 0;
  }

  function disableTilt(reason = "Tilt disabled.") {
    state.isEnabled = false;
    stopAnimationLoop();
    detachOrientationListener();
    updateStatus(reason, false);
    updateUiState();
  }

  function onDeviceOrientation(event) {
    if (typeof event.beta === "number" && typeof event.gamma === "number") {
      state.hasOrientationData = true;
      state.latestBeta = event.beta;
      state.latestGamma = event.gamma;
    }
  }

  function tick(timestampMs) {
    if (!state.isEnabled) {
      return;
    }

    const dtMs = state.lastFrameTs > 0 ? timestampMs - state.lastFrameTs : 16.7;
    state.lastFrameTs = timestampMs;
    const dtSeconds = Math.max(0.001, dtMs / 1000);
    const alpha = 1 - Math.exp(-dtSeconds / DEFAULT_TAU_SECONDS);

    const dGamma = state.latestGamma - state.gamma0;
    const dBeta = state.latestBeta - state.beta0;
    const targetX = normalizeDelta(dGamma);
    const targetY = normalizeDelta(dBeta);

    state.smoothedX += alpha * (targetX - state.smoothedX);
    state.smoothedY += alpha * (targetY - state.smoothedY);

    const xResult = setParamValue(state.xKey, state.centerX, state.smoothedX);
    const yResult = setParamValue(state.yKey, state.centerY, state.smoothedY);

    updateReadout({
      beta: state.latestBeta,
      gamma: state.latestGamma,
      dBeta,
      dGamma,
      normX: state.smoothedX,
      normY: state.smoothedY,
      paramX: xResult.value,
      paramY: yResult.value,
    });

    state.rafId = window.requestAnimationFrame(tick);
  }

  function recalibrateNeutralPoint() {
    if (!state.hasOrientationData) {
      updateStatus("Cannot calibrate yet. Move device so orientation data starts streaming.", true);
      return false;
    }

    state.beta0 = state.latestBeta;
    state.gamma0 = state.latestGamma;
    state.centerX = getParamValue(state.xKey);
    state.centerY = getParamValue(state.yKey);
    state.smoothedX = 0;
    state.smoothedY = 0;
    updateStatus("Tilt calibrated at current orientation.");
    logDebug("calibrated", {
      beta0: state.beta0,
      gamma0: state.gamma0,
      xKey: state.xKey,
      yKey: state.yKey,
      centerX: state.centerX,
      centerY: state.centerY,
    });
    return true;
  }

  async function requestOrientationPermissionIfNeeded() {
    if (!window.isSecureContext) {
      updateStatus("Tilt control requires HTTPS (secure context).", true);
      return false;
    }

    if (typeof DeviceOrientationEvent === "undefined") {
      updateStatus("Device orientation is not supported on this browser/device.", true);
      return false;
    }

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        state.permissionState = permission;
        if (permission !== "granted") {
          updateStatus("Motion permission was denied. Tilt remains disabled.", true);
          return false;
        }
      } catch (error) {
        updateStatus(`Permission request failed: ${error.message}`, true);
        return false;
      }
    }

    return true;
  }

  async function handleCalibrateAndEnable() {
    state.xKey = xSelect.value;
    state.yKey = ySelect.value;

    const granted = await requestOrientationPermissionIfNeeded();
    if (!granted) {
      state.isEnabled = false;
      stopAnimationLoop();
      detachOrientationListener();
      updateUiState();
      return;
    }

    detachOrientationListener();
    state.hasOrientationData = false;
    window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });

    if (!state.isEnabled) {
      state.isEnabled = true;
    }

    updateStatus("Waiting for orientation data... hold neutral, then data will calibrate.");
    updateUiState();

    window.setTimeout(() => {
      if (!state.isEnabled) {
        return;
      }
      const calibrated = recalibrateNeutralPoint();
      if (calibrated && !state.rafId) {
        state.rafId = window.requestAnimationFrame(tick);
      }
    }, 120);
  }

  function openModal() {
    refreshSelectOptions();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    state.isModalOpen = true;
    helpEl.textContent = "Tilt control uses device motion and may require permission. Hold the device in a neutral pose, then press Calibrate & Enable. ±30° from neutral reaches full modulation. Use Disable to stop tilt input.";
    if (!window.isSecureContext) {
      updateStatus("This page is not running on HTTPS, so tilt cannot be enabled here.", true);
    } else if (typeof DeviceOrientationEvent === "undefined") {
      updateStatus("This browser does not expose DeviceOrientation sensors.", true);
    } else if (state.isEnabled) {
      updateStatus("Tilt is enabled. You can recalibrate any time.", false);
    } else {
      updateStatus("Tilt is idle. Pick parameters and press Calibrate & Enable.", false);
    }
    resetReadout();
    updateUiState();
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    state.isModalOpen = false;
  }

  button.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  xSelect.addEventListener("change", () => {
    state.xKey = xSelect.value;
  });
  ySelect.addEventListener("change", () => {
    state.yKey = ySelect.value;
  });

  calibrateEnableButton.addEventListener("click", () => {
    // NOTE: Must stay in user gesture handler for iOS requestPermission.
    handleCalibrateAndEnable();
  });
  disableButton.addEventListener("click", () => disableTilt("Tilt disabled by user."));
  recalibrateButton.addEventListener("click", recalibrateNeutralPoint);

  resetReadout();
  updateUiState();

  return {
    closeModal,
    disableTilt,
  };
}
