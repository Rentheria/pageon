import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import defaultWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { toPageonError } from './PageonError';
import type { PdfLoaderResult, PageonSource } from './types';

export interface PdfLoaderOptions {
  workerSrc?: string;
  useWorker?: boolean;
}

function normalizeWorkerSrc(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (value && typeof value === 'object' && 'default' in value) {
    const nested = (value as { default?: unknown }).default;
    if (typeof nested === 'string' && nested.length > 0) {
      return nested;
    }
  }

  return '';
}

export class PdfLoader {
  private document: PDFDocumentProxy | null = null;
  private options: Required<PdfLoaderOptions> = {
    workerSrc: normalizeWorkerSrc(defaultWorkerSrc),
    useWorker: true
  };

  configure(options?: PdfLoaderOptions): void {
    if (!options) return;

    if (options.useWorker !== undefined) {
      this.options.useWorker = options.useWorker;
    }

    // Do not overwrite the bundled default worker URL when callers pass `undefined`
    // (e.g. `pdfWorkerSrc: ''` → `workerSrc` omitted in Pageon).
    if (options.workerSrc !== undefined) {
      this.options.workerSrc = normalizeWorkerSrc(options.workerSrc);
    }

    const hasValidWorkerSrc = typeof this.options.workerSrc === 'string' && this.options.workerSrc.length > 0;
    if (this.options.useWorker && hasValidWorkerSrc) {
      GlobalWorkerOptions.workerSrc = this.options.workerSrc;
      return;
    }

    // Fallback: run without worker when bundler cannot provide a valid worker URL string.
    this.options.useWorker = false;
  }

  async load(src: PageonSource | Uint8Array): Promise<PdfLoaderResult> {
    try {
      const source =
        typeof src === 'string'
          ? { url: src }
          : src instanceof Uint8Array || src instanceof ArrayBuffer
            ? { data: src }
            : { data: new Uint8Array(await src.arrayBuffer()) };
      const loadingTask = getDocument(source);

      this.document = await loadingTask.promise;
      return {
        document: this.document,
        totalPages: this.document.numPages
      };
    } catch (error) {
      throw toPageonError(error, {
        code: 'PDF_LOAD_FAILED',
        message: 'Unable to load PDF document.'
      });
    }
  }

  async destroy(): Promise<void> {
    if (this.document) {
      await this.document.destroy();
      this.document = null;
    }
  }
}
