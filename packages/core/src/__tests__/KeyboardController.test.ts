import { describe, expect, it, vi } from 'vitest';
import { KeyboardController } from '../KeyboardController';

describe('KeyboardController', () => {
  it('navega y hace zoom cuando no hay input activo', () => {
    const handlers = {
      nextPage: vi.fn(),
      prevPage: vi.fn(),
      firstPage: vi.fn(),
      lastPage: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetZoom: vi.fn()
    };

    const keyboard = new KeyboardController(handlers);
    keyboard.enable();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));

    expect(handlers.nextPage).toHaveBeenCalledTimes(1);
    expect(handlers.zoomOut).toHaveBeenCalledTimes(1);
    expect(handlers.resetZoom).toHaveBeenCalledTimes(1);

    keyboard.destroy();
  });

  it('ignora teclas cuando el foco está en un input', () => {
    const handlers = {
      nextPage: vi.fn(),
      prevPage: vi.fn(),
      firstPage: vi.fn(),
      lastPage: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetZoom: vi.fn()
    };
    const keyboard = new KeyboardController(handlers);
    keyboard.enable();

    const input = document.createElement('input');
    document.body.appendChild(input);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    input.dispatchEvent(event);

    expect(handlers.nextPage).not.toHaveBeenCalled();

    keyboard.destroy();
    input.remove();
  });
});
