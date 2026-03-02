import { renderToPixelBuffer } from "./renderer.js";

self.onmessage = (event) => {
  const { id, payload } = event.data || {};
  if (!id || !payload) {
    return;
  }

  const startedAt = performance.now();
  const frame = renderToPixelBuffer(payload);
  const renderMs = performance.now() - startedAt;

  self.postMessage(
    {
      id,
      width: payload.width,
      height: payload.height,
      pixels: frame.pixels.buffer,
      world: frame.world,
      view: frame.view,
      renderMs,
    },
    [frame.pixels.buffer],
  );
};
