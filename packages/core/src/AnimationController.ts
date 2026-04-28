import type { PageonAnimation } from './types';

export class AnimationController {
  constructor(private readonly durationMs = 250) {}

  async transition(
    host: HTMLElement,
    previous: HTMLCanvasElement | null,
    next: HTMLCanvasElement,
    animation: PageonAnimation,
    forward: boolean
  ): Promise<void> {
    if (!previous || animation === 'none') {
      host.innerHTML = '';
      this.resetHost(host);
      host.appendChild(next);
      return;
    }

    if (animation === 'page-flip') {
      await this.runPageFlip(host, previous, next, forward);
      return;
    }

    host.innerHTML = '';
    host.style.position = 'relative';
    host.style.overflow = 'hidden';

    const incoming = next;
    const outgoing = previous;

    this.prepareLayer(outgoing);
    this.prepareLayer(incoming);

    host.appendChild(outgoing);
    host.appendChild(incoming);

    if (animation === 'fade') {
      incoming.style.opacity = '0';
      outgoing.style.opacity = '1';
    }

    if (animation === 'slide') {
      incoming.style.transform = `translateX(${forward ? '100%' : '-100%'})`;
      outgoing.style.transform = 'translateX(0)';
    }

    void incoming.offsetWidth;

    incoming.style.transition = `opacity ${this.durationMs}ms ease, transform ${this.durationMs}ms ease`;
    outgoing.style.transition = `opacity ${this.durationMs}ms ease, transform ${this.durationMs}ms ease`;

    incoming.style.opacity = '1';
    outgoing.style.opacity = animation === 'fade' ? '0' : '1';

    if (animation === 'slide') {
      incoming.style.transform = 'translateX(0)';
      outgoing.style.transform = `translateX(${forward ? '-20%' : '20%'})`;
      outgoing.style.opacity = '0.4';
    }

    await new Promise((resolve) => {
      const timeout = window.setTimeout(resolve, this.durationMs + 40);
      incoming.addEventListener(
        'transitionend',
        () => {
          window.clearTimeout(timeout);
          resolve(undefined);
        },
        { once: true }
      );
    });

    host.innerHTML = '';
    incoming.style.transition = '';
    incoming.style.transform = '';
    incoming.style.opacity = '1';
    incoming.style.position = '';
    incoming.style.inset = '';
    host.appendChild(incoming);
  }

  private prepareLayer(canvas: HTMLCanvasElement): void {
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    canvas.style.willChange = 'transform, opacity';
  }

  private async runPageFlip(
    host: HTMLElement,
    previous: HTMLCanvasElement,
    next: HTMLCanvasElement,
    forward: boolean
  ): Promise<void> {
    const flipDuration = Math.max(this.durationMs * 2, 700);

    host.innerHTML = '';
    host.style.position = 'relative';
    host.style.overflow = 'hidden';
    host.style.perspective = '1800px';
    host.style.transformStyle = 'preserve-3d';

    const incoming = next;
    incoming.style.position = 'absolute';
    incoming.style.inset = '0';
    incoming.style.width = '100%';
    incoming.style.height = '100%';
    incoming.style.objectFit = 'contain';
    incoming.style.zIndex = '1';

    const flipper = document.createElement('div');
    flipper.style.position = 'absolute';
    flipper.style.inset = '0';
    flipper.style.transformStyle = 'preserve-3d';
    flipper.style.transformOrigin = forward ? 'left center' : 'right center';
    flipper.style.willChange = 'transform';
    flipper.style.zIndex = '2';
    flipper.style.transition = `transform ${flipDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`;

    const leaf = previous;
    leaf.style.position = 'absolute';
    leaf.style.inset = '0';
    leaf.style.width = '100%';
    leaf.style.height = '100%';
    leaf.style.objectFit = 'contain';
    leaf.style.backfaceVisibility = 'hidden';
    (leaf.style as CSSStyleDeclaration & { webkitBackfaceVisibility?: string }).webkitBackfaceVisibility = 'hidden';

    const back = document.createElement('div');
    back.style.position = 'absolute';
    back.style.inset = '0';
    back.style.background = forward
      ? 'linear-gradient(to right, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 30%, rgba(255,255,255,0.92) 100%)'
      : 'linear-gradient(to left, rgba(0,0,0,0.18), rgba(0,0,0,0.04) 30%, rgba(255,255,255,0.92) 100%)';
    back.style.transform = 'rotateY(180deg)';
    back.style.backfaceVisibility = 'hidden';
    (back.style as CSSStyleDeclaration & { webkitBackfaceVisibility?: string }).webkitBackfaceVisibility = 'hidden';
    back.style.borderRadius = '2px';
    back.style.boxShadow = 'inset 0 0 24px rgba(0,0,0,0.18)';

    const shadow = document.createElement('div');
    shadow.style.position = 'absolute';
    shadow.style.inset = '0';
    shadow.style.pointerEvents = 'none';
    shadow.style.background = forward
      ? 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)'
      : 'linear-gradient(to left, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25) 100%)';
    shadow.style.opacity = '0';
    shadow.style.transition = `opacity ${flipDuration}ms ease`;

    flipper.appendChild(leaf);
    flipper.appendChild(back);
    flipper.appendChild(shadow);

    host.appendChild(incoming);
    host.appendChild(flipper);

    void flipper.offsetWidth;

    const targetRotation = forward ? '-180deg' : '180deg';
    flipper.style.transform = `rotateY(${targetRotation})`;
    shadow.style.opacity = '1';

    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(() => resolve(), flipDuration + 80);
      flipper.addEventListener(
        'transitionend',
        (event) => {
          if (event.propertyName !== 'transform') return;
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });

    host.innerHTML = '';
    this.resetHost(host);
    incoming.style.zIndex = '';
    host.appendChild(incoming);
  }

  private resetHost(host: HTMLElement): void {
    host.style.perspective = '';
    host.style.transformStyle = '';
  }
}
