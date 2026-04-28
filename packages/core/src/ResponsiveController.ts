export class ResponsiveController {
  private observer: ResizeObserver | null = null;
  private debounceTimer: number | null = null;
  private listeningWindow = false;

  constructor(
    private readonly element: HTMLElement,
    private readonly onResize: (size: { width: number; height: number }) => void,
    private readonly debounceMs = 120
  ) {}

  start(): void {
    if (this.observer || this.listeningWindow) {
      return;
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        this.queueResize(entry.contentRect.width, entry.contentRect.height);
      });

      this.observer.observe(this.element);
      return;
    }

    this.listeningWindow = true;
    window.addEventListener('resize', this.onWindowResize, { passive: true });
    this.onWindowResize();
  }

  private readonly onWindowResize = (): void => {
    this.queueResize(this.element.clientWidth, this.element.clientHeight);
  };

  private queueResize(width: number, height: number): void {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.onResize({ width, height });
    }, this.debounceMs);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.listeningWindow) {
      window.removeEventListener('resize', this.onWindowResize);
      this.listeningWindow = false;
    }

    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  destroy(): void {
    this.stop();
  }
}
