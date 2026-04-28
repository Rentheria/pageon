import type { PDFDocumentProxy, PDFRenderTask } from 'pdfjs-dist';
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
      throw new Error('Unable to acquire 2D canvas context.');
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    this.renderTask = pdfPage.render({
      canvasContext: context,
      viewport
    });

    try {
      await this.renderTask.promise;
    } catch (error) {
      if ((error as { name?: string }).name === 'RenderingCancelledException') {
        throw error;
      }
      throw new Error(`Error rendering page ${pageNumber}: ${(error as Error).message}`);
    }

    if (renderId !== this.activeRenderId) {
      throw new Error('Stale render result ignored.');
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
