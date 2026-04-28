import { Pageon, type PageonAnimation, type PageonFitMode, type PageonViewMode } from '@pageon/core';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import testPdfUrl from '../../../assets/Libro-completo-Introduccion-a-la-programacion.pdf?url';

const resolvedPdfWorkerSrc =
  typeof pdfWorkerUrl === 'string' ? pdfWorkerUrl : (pdfWorkerUrl as { default?: string }).default ?? '';

const statusNode = document.querySelector<HTMLDivElement>('#status');
const errorNode = document.querySelector<HTMLDivElement>('#error');
const pageLabel = document.querySelector<HTMLSpanElement>('#pageLabel');
const pageInput = document.querySelector<HTMLInputElement>('#pageInput');
const animationSelect = document.querySelector<HTMLSelectElement>('#animation');
const viewModeSelect = document.querySelector<HTMLSelectElement>('#viewMode');
const prevButton = document.querySelector<HTMLButtonElement>('#prev');
const nextButton = document.querySelector<HTMLButtonElement>('#next');
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoomIn');
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoomOut');
const zoomResetButton = document.querySelector<HTMLButtonElement>('#zoomReset');
const fitWidthButton = document.querySelector<HTMLButtonElement>('#fitWidth');
const fitHeightButton = document.querySelector<HTMLButtonElement>('#fitHeight');
const fitPageButton = document.querySelector<HTMLButtonElement>('#fitPage');
const toggleKeyboardButton = document.querySelector<HTMLButtonElement>('#toggleKeyboard');
const toggleGesturesButton = document.querySelector<HTMLButtonElement>('#toggleGestures');
const pdfFileInput = document.querySelector<HTMLInputElement>('#pdfFile');
const useDefaultPdfButton = document.querySelector<HTMLButtonElement>('#useDefaultPdf');
const enterFullscreenButton = document.querySelector<HTMLButtonElement>('#enterFullscreen');
const readOverlay = document.querySelector<HTMLDivElement>('#readOverlay');
const readPrevButton = document.querySelector<HTMLButtonElement>('#readPrev');
const readNextButton = document.querySelector<HTMLButtonElement>('#readNext');
const readPageLabel = document.querySelector<HTMLSpanElement>('#readPageLabel');
const exitFullscreenButton = document.querySelector<HTMLButtonElement>('#exitFullscreen');
const zoomLabel = document.querySelector<HTMLSpanElement>('#zoomLabel');
const fitLabel = document.querySelector<HTMLSpanElement>('#fitLabel');
const loadingLabel = document.querySelector<HTMLSpanElement>('#loadingLabel');

if (
  !statusNode ||
  !errorNode ||
  !pageLabel ||
  !pageInput ||
  !animationSelect ||
  !viewModeSelect ||
  !prevButton ||
  !nextButton ||
  !zoomInButton ||
  !zoomOutButton ||
  !zoomResetButton ||
  !fitWidthButton ||
  !fitHeightButton ||
  !fitPageButton ||
  !toggleKeyboardButton ||
  !toggleGesturesButton ||
  !pdfFileInput ||
  !useDefaultPdfButton ||
  !enterFullscreenButton ||
  !readOverlay ||
  !readPrevButton ||
  !readNextButton ||
  !readPageLabel ||
  !exitFullscreenButton ||
  !zoomLabel ||
  !fitLabel ||
  !loadingLabel
) {
  throw new Error('UI not initialized correctly.');
}

let keyboardEnabled = true;
let gesturesEnabled = true;
let currentPdfSrc = testPdfUrl;
let currentBlobUrl: string | null = null;
let currentAnimation = animationSelect.value as PageonAnimation;
let currentViewMode = viewModeSelect.value as PageonViewMode;
let isReadMode = false;
let previousAnimation: PageonAnimation | null = null;
let overlayHideTimer: number | null = null;

let viewer = createViewer(currentAnimation, currentPdfSrc);

function createViewer(animation: PageonAnimation, src: string): Pageon {
  const instance = new Pageon({
    container: '#viewer',
    src,
    pdfWorkerSrc: resolvedPdfWorkerSrc,
    animation,
    initialPage: 1,
    scale: 1,
    preload: 1,
    showPageIndicator: true,
    minScale: 0.5,
    maxScale: 3,
    zoomStep: 0.25,
    fitMode: 'none',
    viewMode: currentViewMode,
    keyboard: keyboardEnabled,
    gestures: gesturesEnabled,
    responsive: true
  });

  instance.on('loaded', ({ totalPages }) => {
    statusNode.textContent = 'PDF cargado correctamente';
    pageInput.max = String(totalPages);
    syncState(instance);
  });

  instance.on('rendering', ({ page }) => {
    statusNode.textContent = `Renderizando página ${page}...`;
  });

  instance.on('pageChange', () => {
    statusNode.textContent = 'Listo';
    errorNode.textContent = '';
    syncState(instance);
  });

  instance.on('zoomChange', () => syncState(instance));
  instance.on('fitModeChange', () => syncState(instance));

  instance.on('loading', ({ state }) => {
    loadingLabel.textContent = `Loading: ${state}`;
  });

  instance.on('gesture', ({ type }) => {
    statusNode.textContent = `Gesto detectado: ${type}`;
  });

  instance.on('error', ({ error }) => {
    statusNode.textContent = 'Error';
    errorNode.textContent = error.message;
    syncState(instance);
  });

  return instance;
}

function syncState(instance: Pageon): void {
  pageInput.value = String(instance.currentPage);
  const pageText = getPageText(instance);
  pageLabel.textContent = pageText;
  zoomLabel.textContent = `Zoom: ${instance.state.scale.toFixed(2)}x`;
  fitLabel.textContent = `Fit: ${instance.state.fitMode}`;
  loadingLabel.textContent = `Loading: ${instance.state.loadingState}`;
  readPageLabel.textContent = pageText.replace('Página ', '').replace('Páginas ', '');
}

function getPageText(instance: Pageon): string {
  if (instance.state.viewMode !== 'spread' || instance.currentPage >= instance.totalPages) {
    return `Página ${instance.currentPage} de ${instance.totalPages}`;
  }

  return `Páginas ${instance.currentPage}-${Math.min(instance.currentPage + 1, instance.totalPages)} de ${instance.totalPages}`;
}

async function rebuildViewer(animation: PageonAnimation, page?: number): Promise<void> {
  const targetPage = page ?? viewer.currentPage;
  const fitMode = viewer.state.fitMode;
  await viewer.destroy();
  currentAnimation = animation;
  viewer = createViewer(animation, currentPdfSrc);
  if (fitMode !== 'none') {
    void viewer.setFitMode(fitMode as PageonFitMode);
  }
  if (targetPage > 1) {
    void viewer.goToPage(targetPage);
  }
}

prevButton.addEventListener('click', () => void viewer.prevPage());
nextButton.addEventListener('click', () => void viewer.nextPage());
zoomInButton.addEventListener('click', () => void viewer.zoomIn());
zoomOutButton.addEventListener('click', () => void viewer.zoomOut());
zoomResetButton.addEventListener('click', () => void viewer.resetZoom());
fitWidthButton.addEventListener('click', () => void viewer.fitWidth());
fitHeightButton.addEventListener('click', () => void viewer.fitHeight());
fitPageButton.addEventListener('click', () => void viewer.setFitMode('page'));

pageInput.addEventListener('change', () => {
  const page = Number(pageInput.value);
  void viewer.goToPage(page);
});

toggleKeyboardButton.addEventListener('click', () => {
  keyboardEnabled = !keyboardEnabled;
  if (keyboardEnabled) {
    viewer.enableKeyboard();
  } else {
    viewer.disableKeyboard();
  }
  toggleKeyboardButton.textContent = `Keyboard: ${keyboardEnabled ? 'on' : 'off'}`;
});

toggleGesturesButton.addEventListener('click', () => {
  gesturesEnabled = !gesturesEnabled;
  if (gesturesEnabled) {
    viewer.enableGestures();
  } else {
    viewer.disableGestures();
  }
  toggleGesturesButton.textContent = `Gestures: ${gesturesEnabled ? 'on' : 'off'}`;
});

animationSelect.addEventListener('change', async () => {
  const next = animationSelect.value as PageonAnimation;
  if (isReadMode) {
    previousAnimation = next;
    return;
  }
  await rebuildViewer(next);
});

viewModeSelect.addEventListener('change', async () => {
  currentViewMode = viewModeSelect.value as PageonViewMode;
  await rebuildViewer(currentAnimation);
});

pdfFileInput.addEventListener('change', async () => {
  const selectedFile = pdfFileInput.files?.[0];
  if (!selectedFile) return;

  const mime = selectedFile.type;
  const acceptsEmptyMime = mime === '' && /\.pdf$/i.test(selectedFile.name);
  const isPdfMime = mime === 'application/pdf';
  const isOctPdf = mime === 'application/octet-stream' && /\.pdf$/i.test(selectedFile.name);

  if (!isPdfMime && !acceptsEmptyMime && !isOctPdf) {
    errorNode.textContent = 'Selecciona un archivo PDF valido.';
    statusNode.textContent = 'Error';
    pdfFileInput.value = '';
    return;
  }

  const nextBlobUrl = URL.createObjectURL(selectedFile);
  const previousBlobUrl = currentBlobUrl;
  currentBlobUrl = nextBlobUrl;
  currentPdfSrc = nextBlobUrl;

  await viewer.destroy();
  viewer = createViewer(currentAnimation, currentPdfSrc);
  statusNode.textContent = `Cargando ${selectedFile.name}...`;
  errorNode.textContent = '';

  if (previousBlobUrl) {
    URL.revokeObjectURL(previousBlobUrl);
  }
});

useDefaultPdfButton.addEventListener('click', async () => {
  const previousBlobUrl = currentBlobUrl;
  currentBlobUrl = null;
  currentPdfSrc = testPdfUrl;

  await viewer.destroy();
  viewer = createViewer(currentAnimation, currentPdfSrc);
  statusNode.textContent = 'Volviendo al PDF por defecto...';
  errorNode.textContent = '';
  pdfFileInput.value = '';

  if (previousBlobUrl) {
    URL.revokeObjectURL(previousBlobUrl);
  }
});

function clearOverlayTimer(): void {
  if (overlayHideTimer !== null) {
    window.clearTimeout(overlayHideTimer);
    overlayHideTimer = null;
  }
}

function showOverlayBriefly(): void {
  if (!isReadMode) return;
  document.body.classList.add('overlay-visible');
  clearOverlayTimer();
  overlayHideTimer = window.setTimeout(() => {
    document.body.classList.remove('overlay-visible');
    overlayHideTimer = null;
  }, 2500);
}

function handleReadActivity(): void {
  showOverlayBriefly();
}

function attachReadListeners(): void {
  window.addEventListener('mousemove', handleReadActivity);
  window.addEventListener('keydown', handleReadActivity);
  window.addEventListener('touchstart', handleReadActivity, { passive: true });
}

function detachReadListeners(): void {
  window.removeEventListener('mousemove', handleReadActivity);
  window.removeEventListener('keydown', handleReadActivity);
  window.removeEventListener('touchstart', handleReadActivity);
}

async function enterReadMode(): Promise<void> {
  if (isReadMode) return;
  isReadMode = true;
  previousAnimation = currentAnimation;
  document.body.classList.add('read-mode');

  await rebuildViewer('page-flip');

  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    // Fullscreen API can be denied; we still keep the read-mode layout.
  }

  attachReadListeners();
  showOverlayBriefly();
}

async function exitReadMode(): Promise<void> {
  if (!isReadMode) return;
  isReadMode = false;
  document.body.classList.remove('read-mode', 'overlay-visible');
  clearOverlayTimer();
  detachReadListeners();

  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      // best effort
    }
  }

  const restoreAnimation = (previousAnimation ?? currentAnimation) as PageonAnimation;
  previousAnimation = null;
  if (restoreAnimation !== 'page-flip') {
    animationSelect.value = restoreAnimation;
    await rebuildViewer(restoreAnimation);
  }
}

enterFullscreenButton.addEventListener('click', () => void enterReadMode());
exitFullscreenButton.addEventListener('click', () => void exitReadMode());
readPrevButton.addEventListener('click', () => {
  showOverlayBriefly();
  void viewer.prevPage();
});
readNextButton.addEventListener('click', () => {
  showOverlayBriefly();
  void viewer.nextPage();
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && isReadMode) {
    void exitReadMode();
  }
});
