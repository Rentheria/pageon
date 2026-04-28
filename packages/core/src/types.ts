import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export type PageonAnimation = 'none' | 'fade' | 'slide';

export interface PageonOptions {
  container: string | HTMLElement;
  src: string;
  animation?: PageonAnimation;
  initialPage?: number;
  scale?: number;
  preload?: number;
  showPageIndicator?: boolean;
}

export interface PageonPublicState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isRendering: boolean;
}

export interface PageonEvents {
  loaded: { totalPages: number };
  pageChange: { currentPage: number; totalPages: number };
  rendering: { page: number };
  error: { error: Error };
}

export interface PdfLoaderResult {
  document: PDFDocumentProxy;
  totalPages: number;
}

export interface RenderedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  pdfPage: PDFPageProxy;
}
