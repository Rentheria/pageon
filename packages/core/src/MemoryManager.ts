import type { RenderedPage } from './types';

export interface MemoryOptions {
  maxCachedPages: number;
  maxCanvasPixels: number;
  enableAutoCleanup: boolean;
  mobileMemoryMode: 'normal' | 'low';
}

export interface MemoryStats {
  cachedPages: number;
  memoryEstimate: number;
}

export class MemoryManager {
  private readonly pageOrder: string[] = [];

  constructor(private readonly options: MemoryOptions) {}

  estimateCanvasPixels(rendered: RenderedPage): number {
    return rendered.canvas.width * rendered.canvas.height;
  }

  canCache(rendered: RenderedPage): boolean {
    return this.estimateCanvasPixels(rendered) <= this.options.maxCanvasPixels;
  }

  track(key: string): void {
    const idx = this.pageOrder.indexOf(key);
    if (idx >= 0) {
      this.pageOrder.splice(idx, 1);
    }
    this.pageOrder.push(key);
  }

  evictCandidates(currentPage: number, keys: string[]): string[] {
    const max = this.options.mobileMemoryMode === 'low' ? Math.max(1, Math.floor(this.options.maxCachedPages / 2)) : this.options.maxCachedPages;
    if (keys.length <= max) {
      return [];
    }

    const keyDistance = (key: string): number => {
      const page = Number.parseInt(key.split(':')[0] ?? '0', 10);
      return Math.abs(page - currentPage);
    };

    return [...keys]
      .sort((a, b) => keyDistance(b) - keyDistance(a))
      .slice(0, Math.max(0, keys.length - max));
  }

  releaseCanvas(rendered?: RenderedPage): void {
    if (!rendered) return;
    rendered.canvas.width = 0;
    rendered.canvas.height = 0;
  }

  summarize(keys: string[], pages: Iterable<RenderedPage>): MemoryStats {
    let pixels = 0;
    for (const page of pages) {
      pixels += this.estimateCanvasPixels(page);
    }

    return { cachedPages: keys.length, memoryEstimate: pixels };
  }
}
