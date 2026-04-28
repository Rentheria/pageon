import { Pageon, type PageonAnimation, type PageonFitMode } from '@pageon/core';

const statusNode = document.querySelector<HTMLDivElement>('#status');
const errorNode = document.querySelector<HTMLDivElement>('#error');
const pageLabel = document.querySelector<HTMLSpanElement>('#pageLabel');
const pageInput = document.querySelector<HTMLInputElement>('#pageInput');
const animationSelect = document.querySelector<HTMLSelectElement>('#animation');
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
const zoomLabel = document.querySelector<HTMLSpanElement>('#zoomLabel');
const fitLabel = document.querySelector<HTMLSpanElement>('#fitLabel');
const loadingLabel = document.querySelector<HTMLSpanElement>('#loadingLabel');

if (!statusNode || !errorNode || !pageLabel || !pageInput || !animationSelect || !prevButton || !nextButton || !zoomInButton || !zoomOutButton || !zoomResetButton || !fitWidthButton || !fitHeightButton || !fitPageButton || !toggleKeyboardButton || !toggleGesturesButton || !zoomLabel || !fitLabel || !loadingLabel) {
  throw new Error('UI not initialized correctly.');
}

let keyboardEnabled = true;
let gesturesEnabled = true;

let viewer = createViewer(animationSelect.value as PageonAnimation);

function createViewer(animation: PageonAnimation): Pageon {
  const instance = new Pageon({
    container: '#viewer',
    src: '/sample.pdf',
    animation,
    initialPage: 1,
    scale: 1,
    preload: 1,
    showPageIndicator: true,
    minScale: 0.5,
    maxScale: 3,
    zoomStep: 0.25,
    fitMode: 'none',
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
  pageLabel.textContent = `Página ${instance.currentPage} de ${instance.totalPages}`;
  zoomLabel.textContent = `Zoom: ${instance.state.scale.toFixed(2)}x`;
  fitLabel.textContent = `Fit: ${instance.state.fitMode}`;
  loadingLabel.textContent = `Loading: ${instance.state.loadingState}`;
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
  const current = viewer.currentPage;
  const fitMode = viewer.state.fitMode;
  await viewer.destroy();
  viewer = createViewer(animationSelect.value as PageonAnimation);
  if (fitMode !== 'none') {
    void viewer.setFitMode(fitMode as PageonFitMode);
  }
  void viewer.goToPage(current);
});
