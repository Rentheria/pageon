export interface KeyboardControllerHandlers {
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export class KeyboardController {
  private enabled = false;
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.shouldIgnore(event)) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
      case 'PageDown':
        event.preventDefault();
        this.handlers.nextPage();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        event.preventDefault();
        this.handlers.prevPage();
        break;
      case 'Home':
        event.preventDefault();
        this.handlers.firstPage();
        break;
      case 'End':
        event.preventDefault();
        this.handlers.lastPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.handlers.zoomIn();
        break;
      case '-':
      case '_':
        event.preventDefault();
        this.handlers.zoomOut();
        break;
      case '0':
        event.preventDefault();
        this.handlers.resetZoom();
        break;
      default:
        break;
    }
  };

  constructor(private readonly handlers: KeyboardControllerHandlers) {}

  enable(): void {
    if (this.enabled) {
      return;
    }

    window.addEventListener('keydown', this.onKeyDown);
    this.enabled = true;
  }

  disable(): void {
    if (!this.enabled) {
      return;
    }

    window.removeEventListener('keydown', this.onKeyDown);
    this.enabled = false;
  }

  destroy(): void {
    this.disable();
  }

  private shouldIgnore(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return false;
    }

    const tagName = target.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
  }
}
