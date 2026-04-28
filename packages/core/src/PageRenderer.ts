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

  async getSpreadDimensions(pdfDocument: PDFDocumentProxy, leftPageNumber: number, totalPages: number): Promise<{ width: number; height: number }> {
    const leftPage = await pdfDocument.getPage(leftPageNumber);
    const leftViewport = leftPage.getViewport({ scale: 1 });
    const rightPageNumber = leftPageNumber + 1;

    if (rightPageNumber > totalPages) {
      return { width: leftViewport.width * 2, height: leftViewport.height };
    }

    const rightPage = await pdfDocument.getPage(rightPageNumber);
    const rightViewport = rightPage.getViewport({ scale: 1 });

    return {
      width: leftViewport.width + rightViewport.width,
      height: Math.max(leftViewport.height, rightViewport.height)
    };
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

  async renderSpread(pdfDocument: PDFDocumentProxy, leftPageNumber: number, totalPages: number, rotation = 0): Promise<RenderedPage> {
    const renderId = ++this.activeRenderId;
    this.cancel();

    const leftPage = await pdfDocument.getPage(leftPageNumber);
    const leftViewport = leftPage.getViewport({ scale: this.scale, rotation });
    const leftW = Math.ceil(leftViewport.width);
    const leftH = Math.ceil(leftViewport.height);

    const rightPageNumber = leftPageNumber + 1;
    const hasRightPage = rightPageNumber <= totalPages;
    const rightPage = hasRightPage ? await pdfDocument.getPage(rightPageNumber) : null;
    const rightViewport = rightPage?.getViewport({ scale: this.scale, rotation });
    const rightW = rightViewport ? Math.ceil(rightViewport.width) : leftW;
    const rightH = rightViewport ? Math.ceil(rightViewport.height) : leftH;

    const gutter = Math.max(4, Math.round(8 * this.scale));
    const spreadHeight = Math.max(leftH, rightH);

    const spreadCanvas = document.createElement('canvas');
    const spreadCtx = spreadCanvas.getContext('2d');
    if (!spreadCtx) {
      throw new PageonError({ code: 'RENDER_FAILED', message: 'Unable to acquire 2D canvas context.' });
    }

    spreadCanvas.width = leftW + gutter + rightW;
    spreadCanvas.height = spreadHeight;

    try {
      const leftTmp = document.createElement('canvas');
      leftTmp.width = leftW;
      leftTmp.height = leftH;
      const leftTmpCtx = leftTmp.getContext('2d')!;
      this.renderTask = leftPage.render({ canvasContext: leftTmpCtx, viewport: leftViewport });
      await this.renderTask.promise;

      const leftOffsetY = Math.round((spreadHeight - leftH) / 2);
      spreadCtx.drawImage(leftTmp, 0, leftOffsetY);

      if (rightPage && rightViewport) {
        const rightTmp = document.createElement('canvas');
        rightTmp.width = rightW;
        rightTmp.height = rightH;
        const rightTmpCtx = rightTmp.getContext('2d')!;
        this.renderTask = rightPage.render({ canvasContext: rightTmpCtx, viewport: rightViewport });
        await this.renderTask.promise;

        const rightOffsetY = Math.round((spreadHeight - rightH) / 2);
        spreadCtx.drawImage(rightTmp, leftW + gutter, rightOffsetY);
      } else {
        spreadCtx.fillStyle = '#f0f0ec';
        spreadCtx.fillRect(leftW + gutter, 0, rightW, spreadHeight);
      }

      const gutterGrad = spreadCtx.createLinearGradient(leftW, 0, leftW + gutter, 0);
      gutterGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
      gutterGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.04)');
      gutterGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
      spreadCtx.fillStyle = gutterGrad;
      spreadCtx.fillRect(leftW, 0, gutter, spreadHeight);

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } catch (error) {
      if ((error as { name?: string }).name === 'RenderingCancelledException') {
        throw new PageonError({ code: 'RENDER_CANCELLED', message: 'Render cancelled.', cause: error });
      }
      throw new PageonError({
        code: 'RENDER_FAILED',
        message: `Error rendering spread starting at page ${leftPageNumber}.`,
        cause: error
      });
    }

    if (renderId !== this.activeRenderId) {
      throw new PageonError({ code: 'RENDER_CANCELLED', message: 'Stale render result ignored.' });
    }

    return {
      pageNumber: leftPageNumber,
      canvas: spreadCanvas,
      pdfPage: leftPage,
      scale: this.scale,
      rotation
    };
  }

  cancel(): void {
    this.renderTask?.cancel();
    this.renderTask = null;
  }
}
