import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from '../EventEmitter';

describe('EventEmitter', () => {
  it('emite y desuscribe listeners', () => {
    const emitter = new EventEmitter<{ hello: { value: number } }>();
    const listener = vi.fn();
    const off = emitter.on('hello', listener);

    emitter.emit('hello', { value: 2 });
    expect(listener).toHaveBeenCalledWith({ value: 2 });

    off();
    emitter.emit('hello', { value: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
