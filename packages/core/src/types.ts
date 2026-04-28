import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { PageonError } from './PageonError';

export type PageonAnimation = 'none' | 'fade' | 'slide' | 'page-flip';
export type PageonFitMode = 'none' | 'width' | 'height' | 'page';
export type PageonLoadingState = 'idle' | 'loading-document' | 'rendering-page' | 'preloading' | 'error';
export type PageonSource = string | Blob | ArrayBuffer | File;
export type PageonViewMode = 'single' | 'spread';

export interface PageonSecurityOptions {
  allowRemote?: boolean;
  allowedDomains?: string[];
  allowBlob?: boolean;
  allowDataUrl?: boolean;
  maxFileSize?: number;
}

export interface PageonPerformanceOptions {
  maxCachedPages?: number;
  maxCanvasPixels?: number;
  enableAutoCleanup?: boolean;
  mobileMemoryMode?: 'normal' | 'low';
}

export interface PageonStats {
  currentPage: number;
  totalPages: number;
  cachedPages: number;
  activeRenders: number;
  lastRenderTimeMs: number;
  memoryEstimate: number;
  scale: number;
  fitMode: PageonFitMode;
  viewMode: PageonViewMode;
}

export interface PageonOptions {
  container: string | HTMLElement;
  src: PageonSource;
  animation?: PageonAnimation;
  initialPage?: number;
  scale?: number;
  preload?: number;
  showPageIndicator?: boolean;
  minScale?: number;
  maxScale?: number;
  zoomStep?: number;
  fitMode?: PageonFitMode;
  viewMode?: PageonViewMode;
  keyboard?: boolean;
  gestures?: boolean;
  responsive?: boolean;
  debug?: boolean;
  security?: PageonSecurityOptions;
  performance?: PageonPerformanceOptions;
  pdfWorkerSrc?: string;
  useWorker?: boolean;
}

export interface PageonPublicState {
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isRendering: boolean;
  loadingState: PageonLoadingState;
  scale: number;
  fitMode: PageonFitMode;
  viewMode: PageonViewMode;
}

export interface PageonPerformanceEvent {
  pageNumber: number;
  renderTimeMs: number;
  cacheHit: boolean;
  scale: number;
  canvasPixels: number;
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
  error: { error: PageonError };
  performance: PageonPerformanceEvent;
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
