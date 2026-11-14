export function createInteractiveRenderer() {
  let worker = null;
  let available = typeof Worker === "function" && typeof OffscreenCanvas === "function";
  let pending = null;
  let nextId = 0;

  function disableWorker() {
    available = false;
    worker?.terminate();
    worker = null;
    const job = pending;
    pending = null;
    job?.resolve(null);
  }

  function ensureWorker() {
    if (!worker) {
      worker = new Worker(new URL("./interactiveRenderWorker.js", import.meta.url), { type: "module" });
      worker.onerror = (event) => {
        event.preventDefault();
        disableWorker();
      };
      worker.onmessageerror = disableWorker;
      worker.onmessage = ({ data }) => {
        if (data.id !== pending?.id) {
          data.bitmap?.close();
          return;
        }
        if (data.type === "progress") {
          pending.onProgress(data.percent, data.complete);
          return;
        }
        if (data.type === "failed") {
          disableWorker();
          return;
        }
        const job = pending;
        pending = null;
        job.resolve(data.type === "frame" ? data : null);
      };
    }
  }

  return {
    // The draw scheduler awaits one request at a time and coalesces later changes.
    render({ width, height, options, paletteOverrides, onProgress }) {
      if (!available) return Promise.resolve(null);
      return new Promise((resolve) => {
        const id = ++nextId;
        pending = { id, resolve, onProgress };
        try {
          ensureWorker();
          worker.postMessage({ type: "render", id, width, height, options, paletteOverrides });
        } catch {
          disableWorker();
        }
      });
    },

    cancel() {
      if (pending && !pending.cancelled) {
        pending.cancelled = true;
        try {
          worker.postMessage({ type: "cancel", id: pending.id });
        } catch {
          disableWorker();
        }
      }
    },
  };
}
