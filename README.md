# Pageon

Librería moderna y extensible para visualizar PDFs con experiencia de lectura avanzada (zoom, fit modes, teclado, gestos y responsive).

## Monorepo

- `packages/core`: librería principal `@pageon/core`.
- `examples/vanilla-js`: demo con Vite y JavaScript/TypeScript.

## Requisitos

- Node.js 20+
- pnpm 10+

## Instalación

```bash
pnpm install
```

## Uso básico

```ts
import { Pageon } from '@pageon/core';

const viewer = new Pageon({
  container: '#viewer',
  src: '/sample.pdf',
  animation: 'slide',
  initialPage: 1,
  scale: 1,
  preload: 1,
  showPageIndicator: true,
  minScale: 0.5,
  maxScale: 3,
  zoomStep: 0.25,
  fitMode: 'none',
  keyboard: true,
  gestures: true,
  responsive: true
});
```

## Opciones

- `animation`: `none | fade | slide`
- `fitMode`: `none | width | height | page`
- `scale`, `minScale`, `maxScale`, `zoomStep`
- `keyboard`, `gestures`, `responsive`
- `preload`, `initialPage`, `showPageIndicator`

## Métodos

### Navegación

- `nextPage()`
- `prevPage()`
- `goToPage(page)`

### Zoom

- `zoomIn()`
- `zoomOut()`
- `setZoom(scale)`
- `resetZoom()`

### Fit modes

- `fitWidth()`
- `fitHeight()`
- `setFitMode(mode)`

### Controles

- `enableKeyboard()` / `disableKeyboard()`
- `enableGestures()` / `disableGestures()`

### Ciclo de render

- `refresh()`
- `reload()`
- `destroy()`

## Eventos

- `loaded`
- `pageChange`
- `rendering`
- `zoomChange`
- `fitModeChange`
- `resize`
- `gesture`
- `loading`
- `error`

## Estado público

`viewer.state` expone:

- `currentPage`, `totalPages`
- `isLoading`, `isRendering`
- `loadingState`: `idle | loading-document | rendering-page | preloading | error`
- `scale`, `fitMode`

## Ejemplo completo

La demo `examples/vanilla-js` incluye:

- Navegación (anterior/siguiente/ir a página)
- Selector de animación
- Zoom in/out/reset
- Fit width/height/page
- Toggle keyboard y gestures
- Indicadores de página, zoom, fit mode y loading state
- Manejo de errores visible

## Scripts

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
```
