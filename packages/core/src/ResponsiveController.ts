export class ResponsiveController {
  private observer: ResizeObserver | null = null;
  private debounceTimer: number | null = null;

  constructor(
    private readonly element: HTMLElement,
    private readonly onResize: (size: { width: number; height: number }) => void,
    private readonly debounceMs = 120
  ) {}

  start(): void {
    if (this.observer) {
      return;
    }

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      if (this.debounceTimer) {
        window.clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = window.setTimeout(() => {
        this.onResize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }, this.debounceMs);
    });

    this.observer.observe(this.element);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  destroy(): void {
    this.stop();
  }
}
