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
      host.appendChild(next);
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
}
