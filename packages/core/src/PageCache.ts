import type { RenderedPage } from './types';

export class PageCache {
  private readonly cache = new Map<string, RenderedPage>();

  constructor(private readonly limit = 5) {}

  static key(pageNumber: number, scale: number, rotation = 0): string {
    return `${pageNumber}:${scale.toFixed(3)}:${rotation}`;
  }

  get(key: string): RenderedPage | undefined {
    const cached = this.cache.get(key);
    if (!cached) {
      return undefined;
    }

    this.cache.delete(key);
    this.cache.set(key, cached);
    return cached;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  set(key: string, rendered: RenderedPage): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, rendered);

    while (this.cache.size > this.limit) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.cache.delete(oldestKey);
      }
    }
  }

  remove(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
