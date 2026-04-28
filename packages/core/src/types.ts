import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export type PageonAnimation = 'none' | 'fade' | 'slide';
export type PageonFitMode = 'none' | 'width' | 'height' | 'page';
export type PageonLoadingState = 'idle' | 'loading-document' | 'rendering-page' | 'preloading' | 'error';

export interface PageonOptions {
  container: string | HTMLElement;
  src: string;
  animation?: PageonAnimation;
  initialPage?: number;
  scale?: number;
  preload?: number;
  showPageIndicator?: boolean;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  fitMode?: PageonFitMode;
  keyboard?: boolean;
  gestures?: boolean;
  responsive?: boolean;
}

export interface PageonPublicState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isRendering: boolean;
  loadingState: PageonLoadingState;
  scale: number;
  fitMode: PageonFitMode;
}

export interface PageonEvents {
  loaded: { totalPages: number };
  pageChange: { currentPage: number; totalPages: number };
  rendering: { page: number; scale: number };
  zoomChange: { scale: number; previousScale: number };
  fitModeChange: { mode: PageonFitMode };
  resize: { width: number; height: number; scale: number; mode: PageonFitMode };
  gesture: { type: 'swipe-left' | 'swipe-right' | 'double-tap' | 'pinch'; scale?: number };
  loading: { state: PageonLoadingState; isLoading: boolean; isRendering: boolean };
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
  scale: number;
  rotation: number;
}
