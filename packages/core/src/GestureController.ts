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
  private lastGestureAt = 0;

  private readonly onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent): void => {
    const { x, y } = this.pointFromEvent(event);
    this.startX = x;
    this.startY = y;
    this.startAt = Date.now();
  };

  private readonly onPointerUp = (event: PointerEvent | MouseEvent | TouchEvent): void => {
    const now = Date.now();
    if (now - this.lastGestureAt < 60) {
      return;
    }
    this.lastGestureAt = now;

    const { x, y } = this.pointFromEvent(event);
    const deltaX = x - this.startX;
    const deltaY = y - this.startY;
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
      const tapNow = Date.now();
      if (tapNow - this.lastTapAt < 350) {
        this.handlers.onDoubleTap();
        this.handlers.onGesture('double-tap');
      }
      this.lastTapAt = tapNow;
    }
  };

  constructor(
    private readonly element: HTMLElement,
    private readonly handlers: GestureControllerHandlers
  ) {}

  private pointFromEvent(event: PointerEvent | MouseEvent | TouchEvent): { x: number; y: number } {
    if ('changedTouches' in event && event.changedTouches[0]) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }

    return { x: (event as PointerEvent | MouseEvent).clientX, y: (event as PointerEvent | MouseEvent).clientY };
  }

  enable(): void {
    if (this.enabled) {
      return;
    }

    if (typeof PointerEvent !== 'undefined') {
      this.element.addEventListener('pointerdown', this.onPointerDown, { passive: true });
      this.element.addEventListener('pointerup', this.onPointerUp, { passive: true });
    } else {
      this.element.addEventListener('mousedown', this.onPointerDown, { passive: true });
      this.element.addEventListener('mouseup', this.onPointerUp, { passive: true });
      this.element.addEventListener('touchstart', this.onPointerDown, { passive: true });
      this.element.addEventListener('touchend', this.onPointerUp, { passive: true });
    }

    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    this.element.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    this.element.removeEventListener('pointerup', this.onPointerUp as EventListener);
    this.element.removeEventListener('mousedown', this.onPointerDown as EventListener);
    this.element.removeEventListener('mouseup', this.onPointerUp as EventListener);
    this.element.removeEventListener('touchstart', this.onPointerDown as EventListener);
    this.element.removeEventListener('touchend', this.onPointerUp as EventListener);
    this.enabled = false;
  }

  destroy(): void {
    this.disable();
  }
}
