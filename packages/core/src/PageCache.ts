import type { RenderedPage } from './types';

export class PageCache {
  private readonly cache = new Map<string, RenderedPage>();

  constructor(
    private readonly limit = 5,
    private readonly onEvict?: (rendered: RenderedPage) => void
  ) {}

  static key(pageNumber: number, scale: number, rotation = 0): string {
    return `${pageNumber}:${scale.toFixed(3)}:${rotation}`;
  }

  keys(): string[] {
    return [...this.cache.keys()];
  }

  values(): RenderedPage[] {
    return [...this.cache.values()];
  }

  get size(): number {
    return this.cache.size;
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
      const existing = this.cache.get(key);
      if (existing) {
        this.onEvict?.(existing);
      }
      this.cache.delete(key);
    }

    this.cache.set(key, rendered);

    while (this.cache.size > this.limit) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey === 'string') {
        const oldest = this.cache.get(oldestKey);
        if (oldest) {
          this.onEvict?.(oldest);
        }
        this.cache.delete(oldestKey);
      }
    }
  }

  remove(key: string): void {
    const rendered = this.cache.get(key);
    if (rendered) {
      this.onEvict?.(rendered);
    }
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.forEach((rendered) => this.onEvict?.(rendered));
    this.cache.clear();
  }
}
