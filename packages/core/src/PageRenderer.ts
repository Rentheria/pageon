import type { PDFDocumentProxy, PDFRenderTask } from 'pdfjs-dist';
import { PageonError } from './PageonError';
import type { RenderedPage } from './types';

export class PageRenderer {
  private renderTask: PDFRenderTask | null = null;
  private activeRenderId = 0;
  private scale: number;

  constructor(scale: number) {
    this.scale = scale;
  }

  setScale(scale: number): void {
    this.scale = scale;
  }

  getScale(): number {
    return this.scale;
  }

  async getPageDimensions(pdfDocument: PDFDocumentProxy, pageNumber: number): Promise<{ width: number; height: number }> {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    return { width: viewport.width, height: viewport.height };
  }

  async render(pdfDocument: PDFDocumentProxy, pageNumber: number, rotation = 0): Promise<RenderedPage> {
    const renderId = ++this.activeRenderId;
    this.cancel();

    const pdfPage = await pdfDocument.getPage(pageNumber);
    const viewport = pdfPage.getViewport({ scale: this.scale, rotation });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new PageonError({ code: 'RENDER_FAILED', message: 'Unable to acquire 2D canvas context.' });
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    this.renderTask = pdfPage.render({
      canvasContext: context,
      viewport
    });

    try {
      await this.renderTask.promise;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } catch (error) {
      if ((error as { name?: string }).name === 'RenderingCancelledException') {
        throw new PageonError({ code: 'RENDER_CANCELLED', message: 'Render cancelled.', cause: error });
      }
      throw new PageonError({
        code: 'RENDER_FAILED',
        message: `Error rendering page ${pageNumber}.`,
        cause: error
      });
    }

    if (renderId !== this.activeRenderId) {
      throw new PageonError({ code: 'RENDER_CANCELLED', message: 'Stale render result ignored.' });
    }

    return {
      pageNumber,
      canvas,
      pdfPage,
      scale: this.scale,
      rotation
    };
  }

  cancel(): void {
    this.renderTask?.cancel();
    this.renderTask = null;
  }
}
