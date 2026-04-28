import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock primitives — referenced by vi.mock factories below
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => ({
  // BrowserSupport
  detectBrowserSupport: vi.fn(() => ({ canvas: true, promise: true })),

  // SourceValidator
  validateSource: vi.fn((src: unknown) => ({ input: src })),

  // PdfLoader instance methods
  loaderConfigure: vi.fn(),
  loaderLoad: vi.fn(),
  loaderDestroy: vi.fn().mockResolvedValue(undefined),

  // PageRenderer instance methods
  rendererRender: vi.fn(),
  rendererSetScale: vi.fn(),
  rendererGetPageDimensions: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
  rendererCancel: vi.fn(),

  // PageCache instance methods
  cacheGet: vi.fn().mockReturnValue(undefined),
  cacheSet: vi.fn(),
  cacheHas: vi.fn().mockReturnValue(false),
  cacheRemove: vi.fn(),
  cacheClear: vi.fn(),
  cacheKeys: vi.fn().mockReturnValue([]),
  cacheValues: vi.fn().mockReturnValue([]),
  cacheKey: vi.fn((page: number, scale: number) => `${page}:${scale}`),

  // MemoryManager instance methods
  memoryCanCache: vi.fn().mockReturnValue(false),
  memoryReleaseCanvas: vi.fn(),
  memoryEvictCandidates: vi.fn().mockReturnValue([]),
  memorySummarize: vi.fn().mockReturnValue({ cachedPages: 3, memoryEstimate: 1024 }),

  // RenderQueue instance methods
  queueEnqueue: vi.fn(),
  queueCancel: vi.fn(),
  queueActiveRenders: 0,

  // AnimationController instance methods
  animatorTransition: vi.fn().mockResolvedValue(undefined),

  // KeyboardController instance methods
  keyboardEnable: vi.fn(),
  keyboardDisable: vi.fn(),
  keyboardDestroy: vi.fn(),

  // GestureController instance methods
  gestureEnable: vi.fn(),
  gestureDisable: vi.fn(),
  gestureDestroy: vi.fn(),

  // ResponsiveController instance methods
  responsiveStart: vi.fn(),
  responsiveDestroy: vi.fn()
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock('../BrowserSupport', () => ({ detectBrowserSupport: mocks.detectBrowserSupport }));
vi.mock('../SourceValidator', () => ({ validateSource: mocks.validateSource }));

vi.mock('../PdfLoader', () => ({
  PdfLoader: vi.fn(() => ({
    configure: mocks.loaderConfigure,
    load: mocks.loaderLoad,
    destroy: mocks.loaderDestroy
  }))
}));

vi.mock('../PageRenderer', () => ({
  PageRenderer: vi.fn(() => ({
    render: mocks.rendererRender,
    setScale: mocks.rendererSetScale,
    getScale: vi.fn().mockReturnValue(1),
    getPageDimensions: mocks.rendererGetPageDimensions,
    cancel: mocks.rendererCancel
  }))
}));

vi.mock('../PageCache', () => {
  const MockPageCache = Object.assign(
    vi.fn(() => ({
      get: mocks.cacheGet,
      set: mocks.cacheSet,
      has: mocks.cacheHas,
      remove: mocks.cacheRemove,
      clear: mocks.cacheClear,
      keys: mocks.cacheKeys,
      values: mocks.cacheValues
    })),
    { key: mocks.cacheKey }
  );
  return { PageCache: MockPageCache };
});

vi.mock('../MemoryManager', () => ({
  MemoryManager: vi.fn(() => ({
    canCache: mocks.memoryCanCache,
    releaseCanvas: mocks.memoryReleaseCanvas,
    evictCandidates: mocks.memoryEvictCandidates,
    summarize: mocks.memorySummarize
  }))
}));

vi.mock('../RenderQueue', () => ({
  RenderQueue: vi.fn(() => ({
    enqueue: mocks.queueEnqueue,
    cancel: mocks.queueCancel,
    get activeRenders() { return mocks.queueActiveRenders; }
  }))
}));

vi.mock('../AnimationController', () => ({
  AnimationController: vi.fn(() => ({ transition: mocks.animatorTransition }))
}));

vi.mock('../KeyboardController', () => ({
  KeyboardController: vi.fn(() => ({
    enable: mocks.keyboardEnable,
    disable: mocks.keyboardDisable,
    destroy: mocks.keyboardDestroy
  }))
}));

vi.mock('../GestureController', () => ({
  GestureController: vi.fn(() => ({
    enable: mocks.gestureEnable,
    disable: mocks.gestureDisable,
    destroy: mocks.gestureDestroy
  }))
}));

vi.mock('../ResponsiveController', () => ({
  ResponsiveController: vi.fn(() => ({
    start: mocks.responsiveStart,
    destroy: mocks.responsiveDestroy
  }))
}));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------
import { Pageon } from '../Pageon';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  return canvas;
}

function makeRendered(page = 1, scale = 1) {
  return { pageNumber: page, canvas: makeCanvas(), pdfPage: {}, scale, rotation: 0 };
}

const mockDoc = { numPages: 5, destroy: vi.fn() };

function makeContainer(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

function defaultOptions(container: HTMLElement, overrides: Record<string, unknown> = {}) {
  return { container, src: 'https://example.com/test.pdf', ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Pageon', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = makeContainer();
    mocks.loaderLoad.mockResolvedValue({ document: mockDoc, totalPages: 5 });
    mocks.rendererRender.mockResolvedValue(makeRendered());
    mocks.queueEnqueue.mockImplementation(
      async (_key: unknown, _priority: unknown, fn: () => unknown) => fn()
    );
  });

  afterEach(() => {
    container.remove();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Constructor / DOM setup
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('mounts a stage element inside the container', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(container.querySelector('.pageon-stage')).not.toBeNull();
    });

    it('renders a page indicator by default', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(container.querySelector('.pageon-indicator')).not.toBeNull();
    });

    it('hides the page indicator when showPageIndicator is false', async () => {
      new Pageon(defaultOptions(container, { showPageIndicator: false }));
      await flushPromises();
      expect(container.querySelector('.pageon-indicator')).toBeNull();
    });

    it('resolves container from a CSS selector string', async () => {
      container.id = 'pdf-host';
      new Pageon(defaultOptions('#pdf-host'));
      await flushPromises();
      expect(container.querySelector('.pageon-stage')).not.toBeNull();
    });

    it('throws CONTAINER_NOT_FOUND for an unknown selector', () => {
      let err: unknown;
      try { new Pageon(defaultOptions('#does-not-exist')); } catch (e) { err = e; }
      expect((err as { code: string }).code).toBe('CONTAINER_NOT_FOUND');
    });

    it('throws UNSUPPORTED_BROWSER when canvas is not supported', () => {
      mocks.detectBrowserSupport.mockReturnValueOnce({ canvas: false, promise: true });
      let err: unknown;
      try { new Pageon(defaultOptions(container)); } catch (e) { err = e; }
      expect((err as { code: string }).code).toBe('UNSUPPORTED_BROWSER');
    });

    it('throws UNSUPPORTED_BROWSER when Promise is not supported', () => {
      mocks.detectBrowserSupport.mockReturnValueOnce({ canvas: true, promise: false });
      let err: unknown;
      try { new Pageon(defaultOptions(container)); } catch (e) { err = e; }
      expect((err as { code: string }).code).toBe('UNSUPPORTED_BROWSER');
    });

    it('enables keyboard by default', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(mocks.keyboardEnable).toHaveBeenCalledOnce();
    });

    it('skips keyboard when keyboard:false', async () => {
      new Pageon(defaultOptions(container, { keyboard: false }));
      await flushPromises();
      expect(mocks.keyboardEnable).not.toHaveBeenCalled();
    });

    it('enables gestures by default', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(mocks.gestureEnable).toHaveBeenCalledOnce();
    });

    it('skips gestures when gestures:false', async () => {
      new Pageon(defaultOptions(container, { gestures: false }));
      await flushPromises();
      expect(mocks.gestureEnable).not.toHaveBeenCalled();
    });

    it('starts responsive controller by default', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(mocks.responsiveStart).toHaveBeenCalledOnce();
    });

    it('skips responsive when responsive:false', async () => {
      new Pageon(defaultOptions(container, { responsive: false }));
      await flushPromises();
      expect(mocks.responsiveStart).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('initialize()', () => {
    it('loads the document and emits loaded event', async () => {
      const viewer = new Pageon(defaultOptions(container));
      const onLoaded = vi.fn();
      viewer.on('loaded', onLoaded);
      await flushPromises();
      expect(mocks.loaderLoad).toHaveBeenCalledOnce();
      expect(onLoaded).toHaveBeenCalledWith({ totalPages: 5 });
    });

    it('sets totalPages and isLoading=false after load', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      expect(viewer.totalPages).toBe(5);
      expect(viewer.isLoading).toBe(false);
    });

    it('renders the initial page', async () => {
      new Pageon(defaultOptions(container));
      await flushPromises();
      expect(mocks.queueEnqueue).toHaveBeenCalled();
    });

    it('clamps initialPage to valid range (too high)', async () => {
      const viewer = new Pageon(defaultOptions(container, { initialPage: 99 }));
      await flushPromises();
      expect(viewer.currentPage).toBe(5);
    });

    it('clamps initialPage to valid range (too low)', async () => {
      const viewer = new Pageon(defaultOptions(container, { initialPage: -5 }));
      await flushPromises();
      expect(viewer.currentPage).toBe(1);
    });

    it('emits error and sets loadingState to error when load fails', async () => {
      mocks.loaderLoad.mockRejectedValueOnce(new Error('network error'));
      const viewer = new Pageon(defaultOptions(container));
      const onError = vi.fn();
      viewer.on('error', onError);
      await flushPromises();
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0].error.code).toBe('PDF_LOAD_FAILED');
      expect(viewer.loadingState).toBe('error');
    });

    it('sets loadingState to error when source validation fails', async () => {
      // validateSource is called synchronously in initialize(), so the error is
      // emitted before we can register a listener — check observable state instead.
      mocks.validateSource.mockImplementationOnce(() => { throw new Error('blocked'); });
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      expect(viewer.loadingState).toBe('error');
    });
  });

  // -------------------------------------------------------------------------
  // state getter
  // -------------------------------------------------------------------------
  describe('state', () => {
    it('returns a snapshot of the current public state', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const state = viewer.state;
      expect(state.currentPage).toBe(1);
      expect(state.totalPages).toBe(5);
      expect(state.isLoading).toBe(false);
      expect(state.scale).toBe(1);
      expect(state.fitMode).toBe('none');
    });
  });

  // -------------------------------------------------------------------------
  // getStats()
  // -------------------------------------------------------------------------
  describe('getStats()', () => {
    it('returns stats with values from memory and queue', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const stats = viewer.getStats();
      expect(stats.totalPages).toBe(5);
      expect(stats.cachedPages).toBe(3);
      expect(stats.memoryEstimate).toBe(1024);
      expect(stats.scale).toBe(1);
      expect(stats.fitMode).toBe('none');
    });
  });

  // -------------------------------------------------------------------------
  // on() / event subscriptions
  // -------------------------------------------------------------------------
  describe('on()', () => {
    it('returns an unsubscribe function that stops the listener', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const cb = vi.fn();
      const off = viewer.on('pageChange', cb);
      await viewer.nextPage();
      expect(cb).toHaveBeenCalledOnce();
      off();
      await viewer.nextPage();
      expect(cb).toHaveBeenCalledOnce(); // still once
    });
  });

  // -------------------------------------------------------------------------
  // goToPage()
  // -------------------------------------------------------------------------
  describe('goToPage()', () => {
    it('navigates to a valid page and emits pageChange', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onPageChange = vi.fn();
      viewer.on('pageChange', onPageChange);
      await viewer.goToPage(3);
      expect(viewer.currentPage).toBe(3);
      expect(onPageChange).toHaveBeenCalledWith({ currentPage: 3, totalPages: 5 });
    });

    it('emits error when page < 1', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onError = vi.fn();
      viewer.on('error', onError);
      await viewer.goToPage(0);
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0].error.code).toBe('PAGE_NOT_FOUND');
    });

    it('emits error when page > totalPages', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onError = vi.fn();
      viewer.on('error', onError);
      await viewer.goToPage(6);
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0].error.code).toBe('PAGE_NOT_FOUND');
    });

    it('does nothing when destroyed', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.destroy();
      const onPageChange = vi.fn();
      viewer.on('pageChange', onPageChange);
      await viewer.goToPage(2);
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // nextPage() / prevPage()
  // -------------------------------------------------------------------------
  describe('nextPage() / prevPage()', () => {
    it('increments currentPage via nextPage', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.nextPage();
      expect(viewer.currentPage).toBe(2);
    });

    it('nextPage emits error at last page (out of bounds)', async () => {
      mocks.loaderLoad.mockResolvedValueOnce({ document: mockDoc, totalPages: 1 });
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onError = vi.fn();
      viewer.on('error', onError);
      await viewer.nextPage();
      expect(onError).toHaveBeenCalledOnce();
    });

    it('decrements currentPage via prevPage after navigating forward', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.goToPage(3);
      await viewer.prevPage();
      expect(viewer.currentPage).toBe(2);
    });

    it('prevPage emits error at first page (out of bounds)', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onError = vi.fn();
      viewer.on('error', onError);
      await viewer.prevPage();
      expect(onError).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // setZoom() / zoomIn() / zoomOut() / resetZoom()
  // -------------------------------------------------------------------------
  describe('zoom controls', () => {
    it('setZoom updates scale and emits zoomChange', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onZoom = vi.fn();
      viewer.on('zoomChange', onZoom);
      await viewer.setZoom(1.5);
      expect(viewer.state.scale).toBe(1.5);
      expect(onZoom).toHaveBeenCalledWith({ scale: 1.5, previousScale: 1 });
    });

    it('setZoom resets fitMode to none and emits fitModeChange', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onFitMode = vi.fn();
      viewer.on('fitModeChange', onFitMode);
      await viewer.setZoom(1.5);
      expect(viewer.state.fitMode).toBe('none');
      expect(onFitMode).toHaveBeenCalledWith({ mode: 'none' });
    });

    it('setZoom clamps to maxScale (default 3)', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.setZoom(10);
      expect(viewer.state.scale).toBe(3);
    });

    it('setZoom clamps to minScale (default 0.5)', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.setZoom(0.1);
      expect(viewer.state.scale).toBe(0.5);
    });

    it('setZoom no-ops when clamped value equals current scale', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onZoom = vi.fn();
      viewer.on('zoomChange', onZoom);
      await viewer.setZoom(1); // same as default
      expect(onZoom).not.toHaveBeenCalled();
    });

    it('zoomIn increases scale by zoomStep', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.zoomIn();
      expect(viewer.state.scale).toBeCloseTo(1.25);
    });

    it('zoomOut decreases scale by zoomStep', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.zoomOut();
      expect(viewer.state.scale).toBeCloseTo(0.75);
    });

    it('resetZoom restores initial scale', async () => {
      const viewer = new Pageon(defaultOptions(container, { scale: 1.5 }));
      await flushPromises();
      await viewer.zoomIn();
      await viewer.resetZoom();
      expect(viewer.state.scale).toBeCloseTo(1.5);
    });
  });

  // -------------------------------------------------------------------------
  // setFitMode()
  // -------------------------------------------------------------------------
  describe('setFitMode()', () => {
    it('sets fitMode and emits fitModeChange', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const onFit = vi.fn();
      viewer.on('fitModeChange', onFit);
      await viewer.fitWidth();
      expect(viewer.state.fitMode).toBe('width');
      expect(onFit).toHaveBeenCalledWith({ mode: 'width' });
    });

    it('fitHeight sets mode to height', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.fitHeight();
      expect(viewer.state.fitMode).toBe('height');
    });

    it('stores fitMode before document loads when called early', () => {
      mocks.loaderLoad.mockReturnValue(new Promise(() => {})); // never resolves
      const viewer = new Pageon(defaultOptions(container));
      void viewer.setFitMode('width');
      expect(viewer.state.fitMode).toBe('width');
    });
  });

  // -------------------------------------------------------------------------
  // reload()
  // -------------------------------------------------------------------------
  describe('reload()', () => {
    it('clears cache and reinitializes', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      vi.clearAllMocks();
      mocks.loaderLoad.mockResolvedValue({ document: mockDoc, totalPages: 5 });
      mocks.rendererRender.mockResolvedValue(makeRendered());
      mocks.queueEnqueue.mockImplementation(
        async (_k: unknown, _p: unknown, fn: () => unknown) => fn()
      );
      await viewer.reload();
      await flushPromises();
      expect(mocks.cacheClear).toHaveBeenCalled();
      expect(mocks.loaderLoad).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // destroy()
  // -------------------------------------------------------------------------
  describe('destroy()', () => {
    it('cancels the render queue and renderer', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.destroy();
      expect(mocks.queueCancel).toHaveBeenCalled();
      expect(mocks.rendererCancel).toHaveBeenCalled();
    });

    it('clears the cache', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.destroy();
      expect(mocks.cacheClear).toHaveBeenCalled();
    });

    it('destroys all controllers', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.destroy();
      expect(mocks.keyboardDestroy).toHaveBeenCalled();
      expect(mocks.gestureDestroy).toHaveBeenCalled();
      expect(mocks.responsiveDestroy).toHaveBeenCalled();
    });

    it('destroys the PDF loader', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      await viewer.destroy();
      expect(mocks.loaderDestroy).toHaveBeenCalled();
    });

    it('clears stage innerHTML', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const stage = container.querySelector('.pageon-stage') as HTMLElement;
      stage.innerHTML = '<canvas></canvas>';
      await viewer.destroy();
      expect(stage.innerHTML).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // updateOptions()
  // -------------------------------------------------------------------------
  describe('updateOptions()', () => {
    it('merges new options without replacing unspecified fields', async () => {
      const viewer = new Pageon(defaultOptions(container, { debug: false, preload: 2 }));
      await flushPromises();
      viewer.updateOptions({ debug: true });
      // If internal state checks aren't exposed, just verify no throw
      expect(viewer.state.scale).toBe(1); // unrelated field intact
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard / gesture controls
  // -------------------------------------------------------------------------
  describe('keyboard and gesture controls', () => {
    it('enableKeyboard delegates to KeyboardController', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      vi.clearAllMocks();
      viewer.enableKeyboard();
      expect(mocks.keyboardEnable).toHaveBeenCalledOnce();
    });

    it('disableKeyboard delegates to KeyboardController', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      viewer.disableKeyboard();
      expect(mocks.keyboardDisable).toHaveBeenCalledOnce();
    });

    it('enableGestures delegates to GestureController', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      vi.clearAllMocks();
      viewer.enableGestures();
      expect(mocks.gestureEnable).toHaveBeenCalledOnce();
    });

    it('disableGestures delegates to GestureController', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      viewer.disableGestures();
      expect(mocks.gestureDisable).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // refresh()
  // -------------------------------------------------------------------------
  describe('refresh()', () => {
    it('re-renders the current page', async () => {
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const callsBefore = mocks.queueEnqueue.mock.calls.length;
      await viewer.refresh();
      expect(mocks.queueEnqueue.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });

  // -------------------------------------------------------------------------
  // Debug mode
  // -------------------------------------------------------------------------
  describe('debug mode', () => {
    it('emits performance event when debug is true', async () => {
      const viewer = new Pageon(defaultOptions(container, { debug: true }));
      const onPerf = vi.fn();
      viewer.on('performance', onPerf);
      await flushPromises();
      expect(onPerf).toHaveBeenCalledOnce();
      expect(onPerf.mock.calls[0][0]).toMatchObject({
        pageNumber: 1,
        scale: 1,
        cacheHit: false
      });
    });

    it('does not emit performance event when debug is false', async () => {
      const viewer = new Pageon(defaultOptions(container, { debug: false }));
      const onPerf = vi.fn();
      viewer.on('performance', onPerf);
      await flushPromises();
      expect(onPerf).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Cache hit path
  // -------------------------------------------------------------------------
  describe('cache hit', () => {
    it('uses cached canvas without calling renderer again', async () => {
      const cached = makeRendered(1, 1);
      mocks.cacheGet.mockReturnValue(cached);
      mocks.cacheHas.mockReturnValue(true);
      const viewer = new Pageon(defaultOptions(container));
      await flushPromises();
      const renderCallCount = mocks.rendererRender.mock.calls.length;
      await viewer.refresh();
      // renderer should not be called again since cache returns a hit
      expect(mocks.rendererRender.mock.calls.length).toBe(renderCallCount);
    });
  });

  // -------------------------------------------------------------------------
  // Loading state transitions
  // -------------------------------------------------------------------------
  describe('loading state transitions', () => {
    it('emits loading events during initialization sequence', async () => {
      const viewer = new Pageon(defaultOptions(container));
      const states: string[] = [];
      viewer.on('loading', ({ state }) => states.push(state));
      await flushPromises();
      expect(states).toContain('rendering-page');
      expect(states).toContain('idle');
    });
  });
});
