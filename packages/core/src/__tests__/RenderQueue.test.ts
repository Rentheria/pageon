import { describe, expect, it } from 'vitest';
import { RenderQueue } from '../RenderQueue';

describe('RenderQueue', () => {
  it('prioriza tareas por prioridad', async () => {
    const queue = new RenderQueue();
    const out: number[] = [];

    const p1 = queue.enqueue('a', 4, async () => {
      out.push(4);
      return 4;
    });
    const p2 = queue.enqueue('b', 1, async () => {
      out.push(1);
      return 1;
    });

    await Promise.all([p1, p2]);
    expect(out[0]).toBe(1);
  });
});
