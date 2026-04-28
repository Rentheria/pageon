import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Pageon, type PageonAnimation, type PageonEvents, type PageonFitMode } from '@pageon/core';

@Component({
  selector: 'pageon-viewer',
  templateUrl: './pageon-viewer.component.html',
  styleUrls: ['./pageon-viewer.component.scss']
})
export class PageonViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() src = '';
  @Input() animation: PageonAnimation = 'none';
  @Input() initialPage = 1;
  @Input() scale = 1;
  @Input() preload = 1;
  @Input() showPageIndicator = true;
  @Input() minScale = 0.5;
  @Input() maxScale = 3;
  @Input() zoomStep = 0.25;
  @Input() fitMode: PageonFitMode = 'none';
  @Input() keyboard = true;
  @Input() gestures = true;
  @Input() responsive = true;

  @Output() loaded = new EventEmitter<PageonEvents['loaded']>();
  @Output() pageChange = new EventEmitter<PageonEvents['pageChange']>();
  @Output() error = new EventEmitter<PageonEvents['error']>();
  @Output() rendering = new EventEmitter<PageonEvents['rendering']>();
  @Output() zoomChange = new EventEmitter<PageonEvents['zoomChange']>();
  @Output() fitModeChange = new EventEmitter<PageonEvents['fitModeChange']>();
  @Output() resize = new EventEmitter<PageonEvents['resize']>();
  @Output() gesture = new EventEmitter<PageonEvents['gesture']>();
  @Output() loading = new EventEmitter<PageonEvents['loading']>();

  private viewer: Pageon | null = null;
  private unsubscribers: Array<() => void> = [];

  ngAfterViewInit(): void {
    this.createViewer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.viewer) {
      if (changes['src'] && this.src) {
        this.createViewer();
      }
      return;
    }

    this.viewer.updateOptions({
      animation: this.animation,
      initialPage: this.initialPage,
      scale: this.scale,
      preload: this.preload,
      showPageIndicator: this.showPageIndicator,
      minScale: this.minScale,
      maxScale: this.maxScale,
      zoomStep: this.zoomStep,
      fitMode: this.fitMode,
      keyboard: this.keyboard,
      gestures: this.gestures,
      responsive: this.responsive
    });

    if (changes['src'] && !changes['src'].firstChange) {
      void this.reload();
      return;
    }

    if (changes['scale'] && !changes['scale'].firstChange) {
      void this.setZoom(this.scale);
    }

    if (changes['fitMode'] && !changes['fitMode'].firstChange) {
      void this.setFitMode(this.fitMode);
    }

    if (changes['animation'] && !changes['animation'].firstChange) {
      this.viewer.updateOptions({ animation: this.animation });
    }
  }

  ngOnDestroy(): void {
    void this.destroy();
  }

  async nextPage(): Promise<void> {
    await this.viewer?.nextPage();
  }

  async prevPage(): Promise<void> {
    await this.viewer?.prevPage();
  }

  async goToPage(page: number): Promise<void> {
    await this.viewer?.goToPage(page);
  }

  async zoomIn(): Promise<void> {
    await this.viewer?.zoomIn();
  }

  async zoomOut(): Promise<void> {
    await this.viewer?.zoomOut();
  }

  async setZoom(scale: number): Promise<void> {
    await this.viewer?.setZoom(scale);
  }

  async resetZoom(): Promise<void> {
    await this.viewer?.resetZoom();
  }

  async fitWidth(): Promise<void> {
    await this.viewer?.fitWidth();
  }

  async fitHeight(): Promise<void> {
    await this.viewer?.fitHeight();
  }

  async setFitMode(mode: PageonFitMode): Promise<void> {
    await this.viewer?.setFitMode(mode);
  }

  async refresh(): Promise<void> {
    await this.viewer?.refresh();
  }

  async reload(): Promise<void> {
    if (!this.viewer) {
      return;
    }

    this.viewer.updateOptions({ src: this.src });
    await this.viewer.reload();
  }

  async destroy(): Promise<void> {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];

    if (this.viewer) {
      await this.viewer.destroy();
      this.viewer = null;
    }
  }

  private createViewer(): void {
    if (!this.src) {
      return;
    }

    this.viewer = new Pageon({
      container: this.containerRef.nativeElement,
      src: this.src,
      animation: this.animation,
      initialPage: this.initialPage,
      scale: this.scale,
      preload: this.preload,
      showPageIndicator: this.showPageIndicator,
      minScale: this.minScale,
      maxScale: this.maxScale,
      zoomStep: this.zoomStep,
      fitMode: this.fitMode,
      keyboard: this.keyboard,
      gestures: this.gestures,
      responsive: this.responsive
    });

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.viewer) {
      return;
    }

    this.unsubscribers = [
      this.viewer.on('loaded', (payload) => this.loaded.emit(payload)),
      this.viewer.on('pageChange', (payload) => this.pageChange.emit(payload)),
      this.viewer.on('error', (payload) => this.error.emit(payload)),
      this.viewer.on('rendering', (payload) => this.rendering.emit(payload)),
      this.viewer.on('zoomChange', (payload) => this.zoomChange.emit(payload)),
      this.viewer.on('fitModeChange', (payload) => this.fitModeChange.emit(payload)),
      this.viewer.on('resize', (payload) => this.resize.emit(payload)),
      this.viewer.on('gesture', (payload) => this.gesture.emit(payload)),
      this.viewer.on('loading', (payload) => this.loading.emit(payload))
    ];
  }
}
