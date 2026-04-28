import { Pageon, type PageonAnimation } from '@pageon/core';

const statusNode = document.querySelector<HTMLDivElement>('#status');
const errorNode = document.querySelector<HTMLDivElement>('#error');
const pageLabel = document.querySelector<HTMLSpanElement>('#pageLabel');
const pageInput = document.querySelector<HTMLInputElement>('#pageInput');
const animationSelect = document.querySelector<HTMLSelectElement>('#animation');
const prevButton = document.querySelector<HTMLButtonElement>('#prev');
const nextButton = document.querySelector<HTMLButtonElement>('#next');

if (!statusNode || !errorNode || !pageLabel || !pageInput || !animationSelect || !prevButton || !nextButton) {
  throw new Error('UI not initialized correctly.');
}

let viewer = createViewer(animationSelect.value as PageonAnimation);

function createViewer(animation: PageonAnimation): Pageon {
  const instance = new Pageon({
    container: '#viewer',
    src: '/sample.pdf',
    animation,
    initialPage: 1,
    scale: 1.25,
    preload: 1,
    showPageIndicator: true
  });

  instance.on('loaded', ({ totalPages }) => {
    statusNode.textContent = 'PDF cargado correctamente';
    pageInput.max = String(totalPages);
    pageLabel.textContent = `Página ${instance.currentPage} de ${totalPages}`;
  });

  instance.on('rendering', ({ page }) => {
    statusNode.textContent = `Renderizando página ${page}...`;
  });

  instance.on('pageChange', ({ currentPage, totalPages }) => {
    statusNode.textContent = 'Listo';
    pageInput.value = String(currentPage);
    pageLabel.textContent = `Página ${currentPage} de ${totalPages}`;
    errorNode.textContent = '';
  });

  instance.on('error', ({ error }) => {
    statusNode.textContent = 'Error';
    errorNode.textContent = error.message;
  });

  return instance;
}

prevButton.addEventListener('click', () => void viewer.prevPage());
nextButton.addEventListener('click', () => void viewer.nextPage());

pageInput.addEventListener('change', () => {
  const page = Number(pageInput.value);
  void viewer.goToPage(page);
});

animationSelect.addEventListener('change', async () => {
  const current = viewer.currentPage;
  await viewer.destroy();
  viewer = createViewer(animationSelect.value as PageonAnimation);
  void viewer.goToPage(current);
});
