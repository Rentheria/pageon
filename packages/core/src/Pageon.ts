import type { PDFDocumentProxy } from 'pdfjs-dist';
import { AnimationController } from './AnimationController';
import { EventEmitter } from './EventEmitter';
import { PageCache } from './PageCache';
import { PdfLoader } from './PdfLoader';
import { PageRenderer } from './PageRenderer';
import type { PageonEvents, PageonOptions, PageonPublicState, RenderedPage } from './types';

const DEFAULT_OPTIONS: Required<Omit<PageonOptions, 'container' | 'src'>> = {
  animation: 'none',
  initialPage: 1,
  scale: 1,
  preload: 1,
  showPageIndicator: true
};

export class Pageon {
  public currentPage = 1;
  public totalPages = 0;
  public isLoading = true;
  public isRendering = false;

  private readonly options: Required<PageonOptions>;
  private readonly emitter = new EventEmitter<PageonEvents>();
  private readonly loader = new PdfLoader();
  private readonly renderer: PageRenderer;
  private readonly cache = new PageCache(5);
  private readonly animator = new AnimationController();
  private readonly container: HTMLElement;
  private readonly stage: HTMLDivElement;
  private readonly indicator: HTMLDivElement;

  private document: PDFDocumentProxy | null = null;
  private mountedCanvas: HTMLCanvasElement | null = null;
  private renderSequence = 0;
  private destroyed = false;

  constructor(options: PageonOptions) {
    const resolvedContainer = this.resolveContainer(options.container);
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      container: resolvedContainer
    };
    this.container = resolvedContainer;
    this.renderer = new PageRenderer(this.options.scale);

    this.stage = document.createElement('div');
    this.stage.className = 'pageon-stage';
    this.stage.style.width = '100%';
    this.stage.style.height = '100%';
    this.stage.style.minHeight = '320px';
    this.stage.style.position = 'relative';

    this.indicator = document.createElement('div');
    this.indicator.className = 'pageon-indicator';
    this.indicator.style.marginTop = '8px';
    this.indicator.style.fontFamily = 'system-ui, sans-serif';
    this.indicator.style.fontSize = '14px';

    this.container.innerHTML = '';
    this.container.appendChild(this.stage);
    if (this.options.showPageIndicator) {
      this.container.appendChild(this.indicator);
    }

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
      isRendering: this.isRendering
    };
  }

  async nextPage(): Promise<void> {
    await this.goToPage(this.currentPage + 1);
  }

  async prevPage(): Promise<void> {
    await this.goToPage(this.currentPage - 1);
  }

  async goToPage(page: number): Promise<void> {
    if (!this.document || this.destroyed) {
      return;
    }

    if (page < 1 || page > this.totalPages) {
      this.emitError(new Error(`Invalid page ${page}. Allowed range: 1-${this.totalPages}.`));
      return;
    }

    const previousPage = this.currentPage;
    this.currentPage = page;
    await this.renderCurrentPage(page, page >= previousPage);
    this.updateIndicator();

    this.emitter.emit('pageChange', {
      currentPage: this.currentPage,
      totalPages: this.totalPages
    });

    void this.preloadNearbyPages(page);
  }

  async destroy(): Promise<void> {
    this.destroyed = true;
    this.renderer.cancel();
    this.cache.clear();
    this.emitter.removeAll();
    this.stage.innerHTML = '';
    this.indicator.remove();
    await this.loader.destroy();
  }

  private async initialize(): Promise<void> {
    try {
      const { document, totalPages } = await this.loader.load(this.options.src);
      if (this.destroyed) {
        return;
      }

      this.document = document;
      this.totalPages = totalPages;
      this.isLoading = false;
      this.currentPage = Math.min(Math.max(this.options.initialPage, 1), this.totalPages);

      this.emitter.emit('loaded', { totalPages: this.totalPages });

      await this.renderCurrentPage(this.currentPage, true);
      this.updateIndicator();
      void this.preloadNearbyPages(this.currentPage);
    } catch (error) {
      this.isLoading = false;
      this.emitError(error as Error);
    }
  }

  private async renderCurrentPage(page: number, forward: boolean): Promise<void> {
    if (!this.document) {
      return;
    }

    const renderTicket = ++this.renderSequence;
    this.isRendering = true;
    this.emitter.emit('rendering', { page });

    try {
      const cached = this.cache.get(page);
      const rendered = cached ?? (await this.renderer.render(this.document, page));
      this.cache.set(rendered);

      if (renderTicket !== this.renderSequence || this.destroyed) {
        return;
      }

      await this.animator.transition(
        this.stage,
        this.mountedCanvas,
        rendered.canvas,
        this.options.animation,
        forward
      );
      this.mountedCanvas = rendered.canvas;
    } catch (error) {
      const name = (error as { name?: string }).name;
      if (name !== 'RenderingCancelledException' && (error as Error).message !== 'Stale render result ignored.') {
        this.emitError(error as Error);
      }
    } finally {
      if (renderTicket === this.renderSequence) {
        this.isRendering = false;
      }
    }
  }

  private async preloadNearbyPages(origin: number): Promise<void> {
    if (!this.document || this.options.preload < 1) {
      return;
    }

    const candidates = new Set<number>();
    for (let step = 1; step <= this.options.preload; step += 1) {
      candidates.add(origin + step);
      candidates.add(origin - step);
    }

    for (const page of candidates) {
      if (page < 1 || page > this.totalPages || this.cache.get(page)) {
        continue;
      }

      try {
        const rendered: RenderedPage = await this.renderer.render(this.document, page);
        this.cache.set(rendered);
      } catch {
        // Best effort preload.
      }
    }
  }

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container !== 'string') {
      return container;
    }

    const node = document.querySelector<HTMLElement>(container);
    if (!node) {
      throw new Error(`Container not found for selector: ${container}`);
    }

    return node;
  }

  private updateIndicator(): void {
    if (!this.options.showPageIndicator) {
      return;
    }

    this.indicator.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
  }

  private emitError(error: Error): void {
    this.emitter.emit('error', { error });
  }
}
