import type { RenderedPage } from './types';

export class PageCache {
  private readonly cache = new Map<number, RenderedPage>();

  constructor(private readonly limit = 5) {}

  get(page: number): RenderedPage | undefined {
    const cached = this.cache.get(page);
    if (!cached) {
      return undefined;
    }

    this.cache.delete(page);
    this.cache.set(page, cached);
    return cached;
  }

  set(rendered: RenderedPage): void {
    if (this.cache.has(rendered.pageNumber)) {
      this.cache.delete(rendered.pageNumber);
    }

    this.cache.set(rendered.pageNumber, rendered);

    while (this.cache.size > this.limit) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey === 'number') {
        this.cache.delete(oldestKey);
      }
    }
  }

  delete(page: number): void {
    this.cache.delete(page);
  }

  clear(): void {
    this.cache.clear();
  }
}
