export interface BrowserSupport {
  canvas: boolean;
  promise: boolean;
  resizeObserver: boolean;
  pointerEvent: boolean;
  worker: boolean;
  offscreenCanvas: boolean;
}

export function detectBrowserSupport(): BrowserSupport {
  return {
    canvas: typeof HTMLCanvasElement !== 'undefined',
    promise: typeof Promise !== 'undefined',
    resizeObserver: typeof ResizeObserver !== 'undefined',
    pointerEvent: typeof PointerEvent !== 'undefined',
    worker: typeof Worker !== 'undefined',
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined'
  };
}
