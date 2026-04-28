export interface PageTurnHandlers {
  canTurn(direction: 'forward' | 'back'): boolean;
  getCurrentCanvas(): HTMLCanvasElement | null;
  getNeighborCanvas(direction: 'forward' | 'back'): HTMLCanvasElement | null;
  commit(direction: 'forward' | 'back'): Promise<void>;
}

interface ActiveTurn {
  pointerId: number;
  direction: 'forward' | 'back';
  startX: number;
  hostWidth: number;
  flipper: HTMLDivElement;
  shadow: HTMLDivElement;
  incoming: HTMLCanvasElement | null;
  raf: number | null;
  pendingProgress: number;
  active: boolean;
}

const COMMIT_THRESHOLD = 0.4;
const ACTIVATION_DELTA = 8;
const EDGE_RATIO = 0.45;

export class PageTurnController {
  private enabled = false;
  private active: ActiveTurn | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly handlers: PageTurnHandlers
  ) {}

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.host.addEventListener('pointerdown', this.onPointerDown);
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.host.removeEventListener('pointerdown', this.onPointerDown);
    this.cancelActiveTurn();
  }

  destroy(): void {
    this.disable();
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.active) return;
    if (event.button !== undefined && event.button !== 0) return;

    const rect = this.host.getBoundingClientRect();
    if (rect.width <= 0) return;

    const localX = event.clientX - rect.left;
    const ratio = localX / rect.width;
    const fromRight = ratio >= 1 - EDGE_RATIO;
    const fromLeft = ratio <= EDGE_RATIO;
    if (!fromRight && !fromLeft) return;

    const direction: 'forward' | 'back' = fromRight ? 'forward' : 'back';
    if (!this.handlers.canTurn(direction)) return;

    this.armTurn(event, direction, rect.width);
  };

  private armTurn(event: PointerEvent, direction: 'forward' | 'back', hostWidth: number): void {
    const pendingActive: ActiveTurn = {
      pointerId: event.pointerId,
      direction,
      startX: event.clientX,
      hostWidth,
      flipper: null as unknown as HTMLDivElement,
      shadow: null as unknown as HTMLDivElement,
      incoming: null,
      raf: null,
      pendingProgress: 0,
      active: false
    };
    this.active = pendingActive;

    const onMove = (moveEvent: PointerEvent) => {
      if (!this.active || moveEvent.pointerId !== pendingActive.pointerId) return;
      const dx = moveEvent.clientX - pendingActive.startX;
      const expectedSign = direction === 'forward' ? -1 : 1;
      const movedRight = dx > ACTIVATION_DELTA;
      const movedLeft = dx < -ACTIVATION_DELTA;

      if (!pendingActive.active) {
        const beganValidDirection = (expectedSign === -1 && movedLeft) || (expectedSign === 1 && movedRight);
        if (!beganValidDirection) return;
        if (!this.beginVisualTurn(pendingActive)) {
          this.cleanupListeners();
          this.active = null;
          return;
        }
        try {
          this.host.setPointerCapture?.(pendingActive.pointerId);
        } catch {
          // ignore
        }
      }

      const progress = clamp(Math.abs(dx) / pendingActive.hostWidth, 0, 1);
      this.scheduleProgress(pendingActive, progress);
    };

    const onUp = (upEvent: PointerEvent) => {
      if (!this.active || upEvent.pointerId !== pendingActive.pointerId) return;
      this.cleanupListeners();
      try {
        this.host.releasePointerCapture?.(pendingActive.pointerId);
      } catch {
        // ignore
      }
      if (!pendingActive.active) {
        this.active = null;
        return;
      }
      void this.finishTurn(pendingActive);
    };

    const onCancel = () => {
      this.cleanupListeners();
      if (this.active === pendingActive && pendingActive.active) {
        void this.revertTurn(pendingActive);
      } else {
        this.active = null;
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };

    this.cleanupListeners = cleanup;

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  private cleanupListeners: () => void = () => {};

  private beginVisualTurn(turn: ActiveTurn): boolean {
    const currentCanvas = this.handlers.getCurrentCanvas();
    if (!currentCanvas) return false;

    const flipperHost = ensureFlipHost(this.host);
    const flipper = document.createElement('div');
    flipper.style.position = 'absolute';
    flipper.style.inset = '0';
    flipper.style.transformStyle = 'preserve-3d';
    flipper.style.transformOrigin = turn.direction === 'forward' ? 'left center' : 'right center';
    flipper.style.willChange = 'transform';
    flipper.style.pointerEvents = 'none';
    flipper.style.zIndex = '5';

    const leaf = cloneCanvasBitmap(currentCanvas);
    leaf.style.position = 'absolute';
    leaf.style.inset = '0';
    leaf.style.width = '100%';
    leaf.style.height = '100%';
    leaf.style.objectFit = 'contain';
    leaf.style.backfaceVisibility = 'hidden';
    (leaf.style as CSSStyleDeclaration & { webkitBackfaceVisibility?: string }).webkitBackfaceVisibility = 'hidden';
    leaf.style.boxShadow = '0 12px 32px rgba(0,0,0,0.35)';

    const back = document.createElement('div');
    back.style.position = 'absolute';
    back.style.inset = '0';
    back.style.background = turn.direction === 'forward'
      ? 'linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 30%, rgba(255,255,255,0.92) 100%)'
      : 'linear-gradient(to left, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 30%, rgba(255,255,255,0.92) 100%)';
    back.style.transform = 'rotateY(180deg)';
    back.style.backfaceVisibility = 'hidden';
    (back.style as CSSStyleDeclaration & { webkitBackfaceVisibility?: string }).webkitBackfaceVisibility = 'hidden';
    back.style.boxShadow = 'inset 0 0 24px rgba(0,0,0,0.18)';

    const shadow = document.createElement('div');
    shadow.style.position = 'absolute';
    shadow.style.inset = '0';
    shadow.style.pointerEvents = 'none';
    shadow.style.background = turn.direction === 'forward'
      ? 'linear-gradient(to right, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)'
      : 'linear-gradient(to left, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)';
    shadow.style.opacity = '0';

    flipper.appendChild(leaf);
    flipper.appendChild(back);
    flipper.appendChild(shadow);

    const neighbor = this.handlers.getNeighborCanvas(turn.direction);
    let incoming: HTMLCanvasElement | null = null;
    if (neighbor) {
      incoming = cloneCanvasBitmap(neighbor);
      incoming.style.position = 'absolute';
      incoming.style.inset = '0';
      incoming.style.width = '100%';
      incoming.style.height = '100%';
      incoming.style.objectFit = 'contain';
      incoming.style.zIndex = '4';
      flipperHost.appendChild(incoming);
    }

    flipperHost.appendChild(flipper);

    turn.flipper = flipper;
    turn.shadow = shadow;
    turn.incoming = incoming;
    turn.active = true;

    flipper.style.transition = '';
    flipper.style.transform = 'rotateY(0deg)';
    return true;
  }

  private scheduleProgress(turn: ActiveTurn, progress: number): void {
    turn.pendingProgress = progress;
    if (turn.raf !== null) return;
    turn.raf = window.requestAnimationFrame(() => {
      turn.raf = null;
      const angle = turn.direction === 'forward' ? -180 * turn.pendingProgress : 180 * turn.pendingProgress;
      turn.flipper.style.transform = `rotateY(${angle}deg)`;
      turn.shadow.style.opacity = String(turn.pendingProgress);
    });
  }

  private async finishTurn(turn: ActiveTurn): Promise<void> {
    if (turn.pendingProgress >= COMMIT_THRESHOLD) {
      await this.snapTo(turn, 1);
      const direction = turn.direction;
      this.teardown(turn);
      this.active = null;
      try {
        await this.handlers.commit(direction);
      } catch {
        // commit failure should not break UI
      }
    } else {
      await this.revertTurn(turn);
    }
  }

  private async revertTurn(turn: ActiveTurn): Promise<void> {
    await this.snapTo(turn, 0);
    this.teardown(turn);
    this.active = null;
  }

  private snapTo(turn: ActiveTurn, target: number): Promise<void> {
    const targetAngle = turn.direction === 'forward' ? -180 * target : 180 * target;
    return new Promise((resolve) => {
      turn.flipper.style.transition = 'transform 320ms cubic-bezier(0.4, 0.0, 0.2, 1)';
      turn.shadow.style.transition = 'opacity 320ms ease';
      void turn.flipper.offsetWidth;
      turn.flipper.style.transform = `rotateY(${targetAngle}deg)`;
      turn.shadow.style.opacity = String(target);

      const timeout = window.setTimeout(() => resolve(), 360);
      turn.flipper.addEventListener(
        'transitionend',
        (event) => {
          if (event.propertyName !== 'transform') return;
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });
  }

  private teardown(turn: ActiveTurn): void {
    if (turn.raf !== null) {
      window.cancelAnimationFrame(turn.raf);
      turn.raf = null;
    }
    if (turn.flipper && turn.flipper.parentElement) {
      turn.flipper.parentElement.removeChild(turn.flipper);
    }
    if (turn.incoming && turn.incoming.parentElement) {
      turn.incoming.parentElement.removeChild(turn.incoming);
    }
    restoreFlipHost(this.host);
  }

  private cancelActiveTurn(): void {
    this.cleanupListeners();
    if (this.active) {
      this.teardown(this.active);
      this.active = null;
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function cloneCanvasBitmap(source: HTMLCanvasElement): HTMLCanvasElement {
  const clone = document.createElement('canvas');
  clone.width = source.width;
  clone.height = source.height;
  const ctx = clone.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0);
  }
  return clone;
}

function ensureFlipHost(host: HTMLElement): HTMLElement {
  host.style.perspective = host.style.perspective || '1800px';
  host.style.transformStyle = 'preserve-3d';
  return host;
}

function restoreFlipHost(host: HTMLElement): void {
  host.style.perspective = '';
  host.style.transformStyle = '';
}
