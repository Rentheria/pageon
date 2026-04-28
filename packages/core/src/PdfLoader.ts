import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import type { PdfLoaderResult } from './types';

GlobalWorkerOptions.workerSrc = workerSrc;

export class PdfLoader {
  private document: PDFDocumentProxy | null = null;

  async load(src: string): Promise<PdfLoaderResult> {
    const loadingTask = getDocument(src);
    this.document = await loadingTask.promise;

    return {
      document: this.document,
      totalPages: this.document.numPages
    };
  }

  async destroy(): Promise<void> {
    if (this.document) {
      await this.document.destroy();
      this.document = null;
    }
  }
}
