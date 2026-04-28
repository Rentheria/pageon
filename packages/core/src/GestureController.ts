export interface GestureControllerHandlers {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onDoubleTap: () => void;
  onGesture: (gesture: 'swipe-left' | 'swipe-right' | 'double-tap') => void;
}

export class GestureController {
  private enabled = false;
  private startX = 0;
  private startY = 0;
  private startAt = 0;
  private lastTapAt = 0;

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startAt = Date.now();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    const deltaT = Date.now() - this.startAt;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaY) < 60 && deltaT < 500) {
      if (deltaX < 0) {
        this.handlers.onSwipeLeft();
        this.handlers.onGesture('swipe-left');
      } else {
        this.handlers.onSwipeRight();
        this.handlers.onGesture('swipe-right');
      }
      return;
    }

    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaT < 250) {
      const now = Date.now();
      if (now - this.lastTapAt < 350) {
        this.handlers.onDoubleTap();
        this.handlers.onGesture('double-tap');
      }
      this.lastTapAt = now;
    }
  };

  constructor(
    private readonly element: HTMLElement,
    private readonly handlers: GestureControllerHandlers
  ) {}

  enable(): void {
    if (this.enabled) {
      return;
    }

    this.element.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    this.element.addEventListener('pointerup', this.onPointerUp, { passive: true });
    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.enabled = false;
  }

  destroy(): void {
    this.disable();
  }
}
