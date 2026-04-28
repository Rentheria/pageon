import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import defaultWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { toPageonError } from './PageonError';
import type { PdfLoaderResult, PageonSource } from './types';

export interface PdfLoaderOptions {
  workerSrc?: string;
  useWorker?: boolean;
}

export class PdfLoader {
  private document: PDFDocumentProxy | null = null;
  private options: Required<PdfLoaderOptions> = {
    workerSrc: defaultWorkerSrc,
    useWorker: true
  };

  configure(options?: PdfLoaderOptions): void {
    this.options = {
      ...this.options,
      ...options
    };

    if (this.options.useWorker) {
      GlobalWorkerOptions.workerSrc = this.options.workerSrc;
    }
  }

  async load(src: PageonSource | Uint8Array): Promise<PdfLoaderResult> {
    try {
      const loadingTask = getDocument(
        typeof src === 'string' || src instanceof Uint8Array || src instanceof ArrayBuffer
          ? (typeof src === 'string'
              ? ({ url: src, disableWorker: !this.options.useWorker } as const)
              : ({ data: src, disableWorker: !this.options.useWorker } as const))
          : ({ data: new Uint8Array(await src.arrayBuffer()), disableWorker: !this.options.useWorker } as const)
      );

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
