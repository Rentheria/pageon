import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AnimationController } from './AnimationController';
import { detectBrowserSupport } from './BrowserSupport';
import { EventEmitter } from './EventEmitter';
import { GestureController } from './GestureController';
import { KeyboardController } from './KeyboardController';
import { MemoryManager } from './MemoryManager';
import { PageCache } from './PageCache';
import { PageonError, toPageonError } from './PageonError';
import { PdfLoader } from './PdfLoader';
import { PageRenderer } from './PageRenderer';
import { PageTurnController } from './PageTurnController';
import { RenderQueue } from './RenderQueue';
import { ResponsiveController } from './ResponsiveController';
import { validateSource } from './SourceValidator';
import type {
  PageonEvents,
  PageonFitMode,
  PageonLoadingState,
  PageonOptions,
  PageonPerformanceOptions,
  PageonPublicState,
  PageonSecurityOptions,
  PageonStats,
  PageonViewMode,
  RenderedPage
} from './types';

const DEFAULT_SECURITY: Required<PageonSecurityOptions> = {
  allowRemote: true,
  allowedDomains: [],
  allowBlob: true,
  allowDataUrl: false,
  maxFileSize: Number.POSITIVE_INFINITY
};

const DEFAULT_PERFORMANCE: Required<PageonPerformanceOptions> = {
  maxCachedPages: 8,
  maxCanvasPixels: 4_000_000,
  enableAutoCleanup: true,
  mobileMemoryMode: 'normal'
};

const DEFAULT_OPTIONS: Required<Omit<PageonOptions, 'container' | 'src' | 'security' | 'performance'>> = {
  animation: 'none',
  initialPage: 1,
  scale: 1,
  preload: 1,
  showPageIndicator: true,
  minScale: 0.5,
  maxScale: 3,
  zoomStep: 0.25,
  fitMode: 'none',
  viewMode: 'single',
  keyboard: true,
  gestures: true,
  responsive: true,
  debug: false,
  pdfWorkerSrc: '',
  useWorker: true
};

export class Pageon {
  public currentPage = 1;
  public totalPages = 0;
  public isLoading = true;
  public isRendering = false;
  public loadingState: PageonLoadingState = 'loading-document';

  private options: Required<PageonOptions>;
  private readonly emitter = new EventEmitter<PageonEvents>();
  private readonly loader = new PdfLoader();
  private readonly renderer: PageRenderer;
  private readonly memory: MemoryManager;
  private readonly queue = new RenderQueue();
  private readonly cache: PageCache;
  private readonly animator = new AnimationController();
  private readonly container: HTMLElement;
  private readonly stage: HTMLDivElement;
  private readonly indicator: HTMLDivElement;
  private readonly keyboardController: KeyboardController;
  private readonly gestureController: GestureController;
  private readonly responsiveController: ResponsiveController;
  private readonly pageTurnController: PageTurnController;

  private document: PDFDocumentProxy | null = null;
  private mountedCanvas: HTMLCanvasElement | null = null;
  private destroyed = false;
  private scale: number;
  private fitMode: PageonFitMode;
  private viewMode: PageonViewMode;
  private lastRenderTimeMs = 0;
  private suppressNextTransition = false;

  constructor(options: PageonOptions) {
    this.ensureBrowserCompatibility();
    const resolvedContainer = this.resolveContainer(options.container);
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      security: {
        ...DEFAULT_SECURITY,
        ...options.security
      },
      performance: {
        ...DEFAULT_PERFORMANCE,
        ...options.performance
      },
      container: resolvedContainer
    };
    this.container = resolvedContainer;
    this.scale = this.clampScale(this.options.scale);
    this.fitMode = this.options.fitMode;
    this.viewMode = this.options.viewMode;
    this.renderer = new PageRenderer(this.scale);
    this.loader.configure({
      ...(typeof this.options.pdfWorkerSrc === 'string' && this.options.pdfWorkerSrc.trim().length > 0 ? { workerSrc: this.options.pdfWorkerSrc } : {}),
      useWorker: this.options.useWorker
    });
    this.memory = new MemoryManager(this.options.performance);
    this.cache = new PageCache(this.options.performance.maxCachedPages, (rendered) => this.memory.releaseCanvas(rendered));

    this.stage = document.createElement('div');
    this.stage.className = 'pageon-stage';
    this.stage.style.width = '100%';
    this.stage.style.height = '100%';
    this.stage.style.minHeight = '320px';
    this.stage.style.position = 'relative';
    this.stage.style.overflow = 'auto';

    this.indicator = document.createElement('div');
    this.indicator.className = 'pageon-indicator';
    this.indicator.style.marginTop = '8px';
    this.indicator.style.fontFamily = 'system-ui, sans-serif';
    this.indicator.style.fontSize = '14px';

    this.keyboardController = new KeyboardController({
      nextPage: () => void this.nextPage(),
      prevPage: () => void this.prevPage(),
      firstPage: () => void this.goToPage(1),
      lastPage: () => void this.goToPage(this.totalPages),
      zoomIn: () => void this.zoomIn(),
      zoomOut: () => void this.zoomOut(),
      resetZoom: () => void this.resetZoom()
    });

    this.gestureController = new GestureController(this.stage, {
      onSwipeLeft: () => void this.nextPage(),
      onSwipeRight: () => void this.prevPage(),
      onDoubleTap: () => void this.resetZoom(),
      onGesture: (type) => this.emitter.emit('gesture', { type })
    });

    this.pageTurnController = new PageTurnController(this.stage, {
      canTurn: (direction) =>
        direction === 'forward' ? this.currentPage + this.getPageStep() <= this.totalPages : this.currentPage > 1,
      getCurrentCanvas: () => this.mountedCanvas,
      getNeighborCanvas: (direction) => {
        const targetPage = direction === 'forward' ? this.currentPage + this.getPageStep() : this.currentPage - this.getPageStep();
        return this.getRenderedCanvasForPage(targetPage);
      },
      commit: async (direction) => {
        this.suppressNextTransition = true;
        try {
          if (direction === 'forward') {
            await this.nextPage();
          } else {
            await this.prevPage();
          }
        } finally {
          this.suppressNextTransition = false;
        }
      }
    });

    this.responsiveController = new ResponsiveController(this.container, (size) => {
      if (!this.document || this.destroyed) {
        return;
      }

      void this.handleResponsiveResize(size.width, size.height);
    });

    this.container.innerHTML = '';
    this.container.appendChild(this.stage);
    if (this.options.showPageIndicator) {
      this.container.appendChild(this.indicator);
    }

    if (this.options.keyboard) this.keyboardController.enable();
    if (this.options.gestures) this.gestureController.enable();
    if (this.options.responsive) this.responsiveController.start();
    if (this.options.animation === 'page-flip') this.pageTurnController.enable();

    void this.initialize();
  }

  on<K extends keyof PageonEvents>(event: K, callback: (payload: PageonEvents[K]) => void): () => void {
    return this.emitter.on(event, callback);
  }

  get state(): PageonPublicState {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      isLoading: this.isLoading,
      isRendering: this.isRendering,
      loadingState: this.loadingState,
      scale: this.scale,
      fitMode: this.fitMode,
      viewMode: this.viewMode
    };
  }

  getStats(): PageonStats {
    const memory = this.memory.summarize(this.cache.keys(), this.cache.values());
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      cachedPages: memory.cachedPages,
      activeRenders: this.queue.activeRenders,
      lastRenderTimeMs: this.lastRenderTimeMs,
      memoryEstimate: memory.memoryEstimate,
      scale: this.scale,
      fitMode: this.fitMode,
      viewMode: this.viewMode
    };
  }

  async nextPage(): Promise<void> { await this.goToPage(this.currentPage + this.getPageStep()); }
  async prevPage(): Promise<void> { await this.goToPage(this.currentPage - this.getPageStep()); }

  async goToPage(page: number): Promise<void> {
    if (!this.document || this.destroyed) return;
    if (page < 1 || page > this.totalPages) {
      this.emitError(new PageonError({ code: 'PAGE_NOT_FOUND', message: `Invalid page ${page}. Allowed range: 1-${this.totalPages}.` }));
      return;
    }

    const previousPage = this.currentPage;
    const targetPage = this.normalizeDisplayPage(page);
    this.currentPage = targetPage;
    await this.renderCurrentPage(targetPage, targetPage >= previousPage);
    this.updateIndicator();
    this.emitter.emit('pageChange', { currentPage: this.currentPage, totalPages: this.totalPages });
    void this.preloadNearbyPages(targetPage);
  }

  async zoomIn(): Promise<void> { await this.setZoom(this.scale + this.options.zoomStep); }
  async zoomOut(): Promise<void> { await this.setZoom(this.scale - this.options.zoomStep); }

  async setZoom(scale: number): Promise<void> {
    const nextScale = this.clampScale(scale);
    if (nextScale === this.scale) return;
    const previousScale = this.scale;
    this.fitMode = 'none';
    this.scale = nextScale;
    this.renderer.setScale(this.scale);
    this.emitter.emit('zoomChange', { scale: this.scale, previousScale });
    this.emitter.emit('fitModeChange', { mode: this.fitMode });
    await this.renderCurrentPage(this.currentPage, true);
    this.updateIndicator();
  }

  async resetZoom(): Promise<void> { await this.setZoom(this.options.scale); }
  async fitWidth(): Promise<void> { await this.setFitMode('width'); }
  async fitHeight(): Promise<void> { await this.setFitMode('height'); }

  async setFitMode(mode: PageonFitMode): Promise<void> {
    if (!this.document) { this.fitMode = mode; return; }
    this.fitMode = mode;
    this.emitter.emit('fitModeChange', { mode: this.fitMode });
    await this.applyFitMode();
    await this.renderCurrentPage(this.currentPage, true);
    this.updateIndicator();
  }

  enableKeyboard(): void { this.keyboardController.enable(); }
  disableKeyboard(): void { this.keyboardController.disable(); }
  enableGestures(): void { this.gestureController.enable(); }
  disableGestures(): void { this.gestureController.disable(); }
  async refresh(): Promise<void> { await this.renderCurrentPage(this.currentPage, true); }

  async reload(): Promise<void> {
    this.cache.clear();
    this.queue.cancel();
    await this.loader.destroy();
    this.document = null;
    this.totalPages = 0;
    await this.initialize();
  }

  updateOptions(nextOptions: Partial<Omit<PageonOptions, 'container'>>): void {
    this.options = { ...this.options, ...nextOptions };
    if (nextOptions.viewMode) {
      this.viewMode = nextOptions.viewMode;
    }
    if (this.options.animation === 'page-flip') {
      this.pageTurnController.enable();
    } else {
      this.pageTurnController.disable();
    }
  }

  getRenderedCanvasForPage(page: number): HTMLCanvasElement | null {
    if (page < 1 || page > this.totalPages) return null;
    const cacheKey = this.getDisplayCacheKey(this.normalizeDisplayPage(page));
    return this.cache.has(cacheKey) ? this.cache.get(cacheKey)?.canvas ?? null : null;
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    this.queue.cancel();
    this.renderer.cancel();
    this.cache.clear();
    this.keyboardController.destroy();
    this.gestureController.destroy();
    this.responsiveController.destroy();
    this.pageTurnController.destroy();
    this.emitter.removeAll();
    this.stage.innerHTML = '';
    this.indicator.remove();
    await this.loader.destroy();
  }

  private ensureBrowserCompatibility(): void {
    const support = detectBrowserSupport();
    if (!support.canvas || !support.promise) {
      throw new PageonError({ code: 'UNSUPPORTED_BROWSER', message: 'Canvas and Promise support are required.' });
    }
  }

  private async initialize(): Promise<void> {
    try {
      this.updateLoadingState('loading-document');
      const source = validateSource(this.options.src, this.options.security);
      const { document, totalPages } = await this.loader.load(source.input);
      if (this.destroyed) return;

      this.document = document;
      this.totalPages = totalPages;
      this.isLoading = false;
      this.currentPage = this.normalizeDisplayPage(Math.min(Math.max(this.options.initialPage, 1), this.totalPages));
      if (this.fitMode !== 'none') await this.applyFitMode();
      this.emitter.emit('loaded', { totalPages: this.totalPages });
      await this.renderCurrentPage(this.currentPage, true);
      this.updateIndicator();
      void this.preloadNearbyPages(this.currentPage);
    } catch (error) {
      this.isLoading = false;
      this.updateLoadingState('error');
      this.emitError(toPageonError(error, { code: 'PDF_LOAD_FAILED', message: 'Unable to initialize viewer.' }));
    }
  }

  private getPriority(origin: number, page: number): 1 | 2 | 3 | 4 {
    if (page === origin) return 1;
    if (page === origin + 1) return 2;
    if (page === origin - 1) return 3;
    return 4;
  }

  private async renderCurrentPage(page: number, forward: boolean): Promise<void> {
    if (!this.document) return;

    const displayPage = this.normalizeDisplayPage(page);
    this.isRendering = true;
    this.updateLoadingState('rendering-page');
    this.emitter.emit('rendering', { page: displayPage, scale: this.scale });
    const renderStart = performance.now();

    try {
      const cacheKey = this.getDisplayCacheKey(displayPage);
      const cached = this.cache.get(cacheKey);
      const cacheHit = Boolean(cached);
      const rendered = cached ?? (await this.queue.enqueue(cacheKey, 1, () => this.renderDisplay(displayPage)));
      const pixels = rendered.canvas.width * rendered.canvas.height;

      if (!cacheHit && this.memory.canCache(rendered)) {
        this.cache.set(cacheKey, rendered);
      }

      if (this.destroyed) return;

      const effectiveAnimation = this.suppressNextTransition ? 'none' : this.options.animation;
      await this.animator.transition(this.stage, this.mountedCanvas, rendered.canvas, effectiveAnimation, forward);
      this.mountedCanvas = rendered.canvas;

      this.lastRenderTimeMs = Math.round(performance.now() - renderStart);
      if (this.options.debug) {
        this.emitter.emit('performance', {
          pageNumber: displayPage,
          renderTimeMs: this.lastRenderTimeMs,
          cacheHit,
          scale: this.scale,
          canvasPixels: pixels
        });
      }

      if (this.options.performance.enableAutoCleanup) {
        this.cleanupFarPages(displayPage);
      }
    } catch (error) {
      const normalized = toPageonError(error, { code: 'RENDER_FAILED', message: 'Failed to render page.' });
      if (normalized.code !== 'RENDER_CANCELLED') {
        this.updateLoadingState('error');
        this.emitError(normalized);
      }
    } finally {
      this.isRendering = false;
      if (!this.destroyed) {
        this.updateLoadingState('idle');
      }
    }
  }

  private cleanupFarPages(currentPage: number): void {
    const keys = this.cache.keys();
    const toEvict = this.memory.evictCandidates(currentPage, keys);
    toEvict.forEach((key) => this.cache.remove(key));
  }

  private async preloadNearbyPages(origin: number): Promise<void> {
    if (!this.document || this.options.preload < 1) return;
    this.updateLoadingState('preloading');

    const candidates = new Set<number>();
    const pageStep = this.getPageStep();
    for (let step = 1; step <= this.options.preload; step += 1) {
      candidates.add(origin + step * pageStep);
      candidates.add(origin - step * pageStep);
    }

    for (const page of candidates) {
      const displayPage = this.normalizeDisplayPage(page);
      const cacheKey = this.getDisplayCacheKey(displayPage);
      if (page < 1 || page > this.totalPages || this.cache.has(cacheKey)) continue;

      try {
        const rendered: RenderedPage = await this.queue.enqueue(cacheKey, this.getPriority(origin, page), () =>
          this.renderDisplay(displayPage)
        );
        if (this.memory.canCache(rendered)) {
          this.cache.set(cacheKey, rendered);
        } else {
          this.memory.releaseCanvas(rendered);
        }
      } catch {
        // best effort preload
      }
    }

    if (!this.isRendering) this.updateLoadingState('idle');
  }

  private async applyFitMode(): Promise<void> {
    if (!this.document || this.fitMode === 'none') return;

    const dimensions = this.viewMode === 'spread'
      ? await this.renderer.getSpreadDimensions(this.document, this.normalizeDisplayPage(this.currentPage), this.totalPages)
      : await this.renderer.getPageDimensions(this.document, this.currentPage);
    const availableWidth = Math.max(this.stage.clientWidth - 4, 1);
    const availableHeight = Math.max(this.stage.clientHeight - 4, 1);

    let calculatedScale = this.scale;
    if (this.fitMode === 'width') calculatedScale = availableWidth / dimensions.width;
    else if (this.fitMode === 'height') calculatedScale = availableHeight / dimensions.height;
    else if (this.fitMode === 'page') calculatedScale = Math.min(availableWidth / dimensions.width, availableHeight / dimensions.height);

    const previousScale = this.scale;
    this.scale = this.clampScale(calculatedScale);
    this.renderer.setScale(this.scale);
    if (previousScale !== this.scale) this.emitter.emit('zoomChange', { scale: this.scale, previousScale });
  }

  private async handleResponsiveResize(width: number, height: number): Promise<void> {
    if (this.fitMode !== 'none') {
      await this.applyFitMode();
      await this.renderCurrentPage(this.currentPage, true);
    }

    this.emitter.emit('resize', { width, height, scale: this.scale, mode: this.fitMode });
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container !== 'string') return container;
    const node = document.querySelector<HTMLElement>(container);
    if (!node) {
      throw new PageonError({ code: 'CONTAINER_NOT_FOUND', message: `Container not found for selector: ${container}` });
    }
    return node;
  }

  private updateIndicator(): void {
    if (!this.options.showPageIndicator) return;
    this.indicator.textContent = `${this.getPageLabel()} · Zoom ${this.scale.toFixed(2)}x · Fit ${this.fitMode}`;
  }

  private getPageStep(): number {
    return this.viewMode === 'spread' ? 2 : 1;
  }

  private normalizeDisplayPage(page: number): number {
    const clamped = Math.min(Math.max(page, 1), this.totalPages || 1);
    if (this.viewMode !== 'spread') return clamped;
    const odd = clamped % 2 === 0 ? clamped - 1 : clamped;
    return Math.max(1, odd);
  }

  private getDisplayCacheKey(page: number): string {
    return this.viewMode === 'spread'
      ? `spread:${PageCache.key(page, this.scale)}`
      : PageCache.key(page, this.scale);
  }

  private renderDisplay(page: number): Promise<RenderedPage> {
    if (!this.document) {
      throw new PageonError({ code: 'RENDER_FAILED', message: 'PDF document is not loaded.' });
    }

    return this.viewMode === 'spread'
      ? this.renderer.renderSpread(this.document, page, this.totalPages)
      : this.renderer.render(this.document, page);
  }

  private getPageLabel(): string {
    if (this.viewMode !== 'spread' || this.currentPage >= this.totalPages) {
      return `Página ${this.currentPage} de ${this.totalPages}`;
    }

    return `Páginas ${this.currentPage}-${Math.min(this.currentPage + 1, this.totalPages)} de ${this.totalPages}`;
  }

  private clampScale(scale: number): number {
    return Math.min(this.options.maxScale, Math.max(this.options.minScale, Number(scale.toFixed(3))));
  }

  private updateLoadingState(state: PageonLoadingState): void {
    this.loadingState = state;
    this.emitter.emit('loading', { state, isLoading: this.isLoading, isRendering: this.isRendering });
  }

  private emitError(error: PageonError): void {
    this.emitter.emit('error', { error });
  }
}
