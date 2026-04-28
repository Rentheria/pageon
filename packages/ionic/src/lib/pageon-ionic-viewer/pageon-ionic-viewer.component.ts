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
import type { Gesture } from '@ionic/angular';
import { GestureController } from '@ionic/angular';
import { PageonViewerComponent } from '@pageon/angular';
import type { PageonAnimation, PageonEvents, PageonFitMode } from '@pageon/core';

@Component({
  selector: 'pageon-ionic-viewer',
  templateUrl: './pageon-ionic-viewer.component.html',
  styleUrls: ['./pageon-ionic-viewer.component.scss']
})
export class PageonIonicViewerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('viewer', { static: true }) viewerRef!: PageonViewerComponent;
  @ViewChild('gestureSurface', { static: true }) gestureSurfaceRef!: ElementRef<HTMLDivElement>;

  @Input() src = '';
  @Input() animation: PageonAnimation = 'none';
  @Input() initialPage = 1;
  @Input() scale = 1;
  @Input() preload = 1;
  @Input() minScale = 0.5;
  @Input() maxScale = 3;
  @Input() zoomStep = 0.25;
  @Input() fitMode: PageonFitMode = 'none';
  @Input() keyboard = false;
  @Input() gestures = true;
  @Input() responsive = true;
  @Input() showToolbar = false;
  @Input() showPageIndicator = true;
  @Input() showZoomControls = false;

  @Output() loaded = new EventEmitter<PageonEvents['loaded']>();
  @Output() pageChange = new EventEmitter<PageonEvents['pageChange']>();
  @Output() error = new EventEmitter<PageonEvents['error']>();
  @Output() rendering = new EventEmitter<PageonEvents['rendering']>();
  @Output() zoomChange = new EventEmitter<PageonEvents['zoomChange']>();
  @Output() fitModeChange = new EventEmitter<PageonEvents['fitModeChange']>();
  @Output() resize = new EventEmitter<PageonEvents['resize']>();
  @Output() gesture = new EventEmitter<PageonEvents['gesture']>();
  @Output() loading = new EventEmitter<PageonEvents['loading']>();

  totalPages = 0;
  currentPage = 1;
  currentZoom = 1;
  isLoading = true;
  loadingState: PageonEvents['loading']['state'] = 'loading-document';
  errorMessage = '';

  private ionGesture: Gesture | null = null;
  private orientationTimer: ReturnType<typeof setTimeout> | null = null;
  private activePointers = new Map<number, PointerEvent>();
  private pinchDistance = 0;
  private lastTapAt = 0;

  constructor(private readonly gestureController: GestureController) {}

  ngAfterViewInit(): void {
    this.setupOrientationHandler();
    this.setupGestures();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gestures'] && !changes['gestures'].firstChange) {
      this.teardownGestures();
      this.setupGestures();
    }
  }

  ngOnDestroy(): void {
    this.teardownGestures();
    window.removeEventListener('orientationchange', this.onOrientationChange);
    if (this.orientationTimer) {
      clearTimeout(this.orientationTimer);
      this.orientationTimer = null;
    }
  }

  async nextPage(): Promise<void> { await this.viewerRef.nextPage(); }
  async prevPage(): Promise<void> { await this.viewerRef.prevPage(); }
  async goToPage(page: number): Promise<void> { await this.viewerRef.goToPage(page); }
  async zoomIn(): Promise<void> { await this.viewerRef.zoomIn(); }
  async zoomOut(): Promise<void> { await this.viewerRef.zoomOut(); }
  async setZoom(scale: number): Promise<void> { await this.viewerRef.setZoom(scale); }
  async resetZoom(): Promise<void> { await this.viewerRef.resetZoom(); }
  async fitWidth(): Promise<void> { await this.viewerRef.fitWidth(); }
  async fitHeight(): Promise<void> { await this.viewerRef.fitHeight(); }
  async setFitMode(mode: PageonFitMode): Promise<void> { await this.viewerRef.setFitMode(mode); }
  async refresh(): Promise<void> { await this.viewerRef.refresh(); }
  async reload(): Promise<void> { await this.viewerRef.reload(); }
  async destroy(): Promise<void> { await this.viewerRef.destroy(); }

  onLoaded(event: PageonEvents['loaded']): void {
    this.totalPages = event.totalPages;
    this.errorMessage = '';
    this.loaded.emit(event);
  }

  onPageChange(event: PageonEvents['pageChange']): void {
    this.currentPage = event.currentPage;
    this.totalPages = event.totalPages;
    this.pageChange.emit(event);
  }

  onError(event: PageonEvents['error']): void {
    this.errorMessage = event.error.message;
    this.error.emit(event);
  }

  onRendering(event: PageonEvents['rendering']): void {
    this.rendering.emit(event);
  }

  onZoomChange(event: PageonEvents['zoomChange']): void {
    this.currentZoom = event.scale;
    this.zoomChange.emit(event);
  }

  onFitModeChange(event: PageonEvents['fitModeChange']): void {
    this.fitModeChange.emit(event);
  }

  onResize(event: PageonEvents['resize']): void {
    this.resize.emit(event);
  }

  onLoading(event: PageonEvents['loading']): void {
    this.isLoading = event.state !== 'idle';
    this.loadingState = event.state;
    this.loading.emit(event);
  }

  private setupOrientationHandler(): void {
    window.addEventListener('orientationchange', this.onOrientationChange, { passive: true });
  }

  private readonly onOrientationChange = (): void => {
    if (!this.responsive) {
      return;
    }

    if (this.orientationTimer) {
      clearTimeout(this.orientationTimer);
    }

    this.orientationTimer = setTimeout(() => {
      void this.refresh();
    }, 140);
  };

  private setupGestures(): void {
    if (!this.gestures || !this.gestureSurfaceRef) {
      return;
    }

    const element = this.gestureSurfaceRef.nativeElement;

    this.ionGesture = this.gestureController.create({
      el: element,
      threshold: 10,
      gestureName: 'pageon-swipe',
      direction: 'x',
      onEnd: (detail) => {
        const horizontal = Math.abs(detail.deltaX) > 52;
        const verticalDominant = Math.abs(detail.deltaY) > Math.abs(detail.deltaX);
        const zoomed = this.currentZoom > 1.01;

        if (zoomed || verticalDominant || !horizontal) {
          return;
        }

        if (detail.deltaX < 0) {
          void this.nextPage();
          this.gesture.emit({ type: 'swipe-left' });
        } else {
          void this.prevPage();
          this.gesture.emit({ type: 'swipe-right' });
        }
      }
    });

    this.ionGesture.enable(true);
    element.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    element.addEventListener('pointermove', this.onPointerMove, { passive: true });
    element.addEventListener('pointerup', this.onPointerEnd, { passive: true });
    element.addEventListener('pointercancel', this.onPointerEnd, { passive: true });
  }

  private teardownGestures(): void {
    const element = this.gestureSurfaceRef?.nativeElement;
    if (element) {
      element.removeEventListener('pointerdown', this.onPointerDown);
      element.removeEventListener('pointermove', this.onPointerMove);
      element.removeEventListener('pointerup', this.onPointerEnd);
      element.removeEventListener('pointercancel', this.onPointerEnd);
    }

    this.activePointers.clear();
    this.pinchDistance = 0;

    if (this.ionGesture) {
      this.ionGesture.destroy();
      this.ionGesture = null;
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.activePointers.set(event.pointerId, event);

    if (this.activePointers.size !== 1) {
      return;
    }

    const now = Date.now();
    if (now - this.lastTapAt < 260) {
      void this.resetZoom();
      this.gesture.emit({ type: 'double-tap' });
      this.lastTapAt = 0;
      return;
    }

    this.lastTapAt = now;
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.activePointers.has(event.pointerId)) {
      return;
    }

    this.activePointers.set(event.pointerId, event);

    if (this.activePointers.size !== 2) {
      return;
    }

    const [first, second] = [...this.activePointers.values()];
    const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);

    if (this.pinchDistance === 0) {
      this.pinchDistance = distance;
      return;
    }

    const delta = distance - this.pinchDistance;
    if (Math.abs(delta) < 8) {
      return;
    }

    this.pinchDistance = distance;
    const targetZoom = Math.min(this.maxScale, Math.max(this.minScale, this.currentZoom + delta * 0.0024));
    void this.setZoom(targetZoom);
    this.gesture.emit({ type: 'pinch', scale: targetZoom });
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    this.activePointers.delete(event.pointerId);
    if (this.activePointers.size < 2) {
      this.pinchDistance = 0;
    }
  };
}
