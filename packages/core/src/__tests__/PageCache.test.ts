import { describe, expect, it } from 'vitest';
import { PageCache } from '../PageCache';

function fakeRendered(pageNumber: number, scale: number) {
  return {
    pageNumber,
    scale,
    rotation: 0,
    canvas: document.createElement('canvas'),
    pdfPage: {} as never
  };
}

describe('PageCache', () => {
  it('usa claves por página/scale/rotation y respeta clear/remove/has/get/set', () => {
    const cache = new PageCache(2);
    const key1 = PageCache.key(1, 1);
    const key2 = PageCache.key(1, 1.25);
    cache.set(key1, fakeRendered(1, 1));
    cache.set(key2, fakeRendered(1, 1.25));

    expect(cache.has(key1)).toBe(true);
    expect(cache.get(key2)?.scale).toBe(1.25);

    cache.remove(key1);
    expect(cache.has(key1)).toBe(false);

    cache.clear();
    expect(cache.has(key2)).toBe(false);
  });
});
