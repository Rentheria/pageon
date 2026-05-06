# @pageon/core

Modern, extensible PDF viewer with page-turn animations, gestures, keyboard navigation, and smart caching.

## Install

```bash
npm install @pageon/core
```

## Quick Start

```ts
import { Pageon } from '@pageon/core';

const viewer = new Pageon({
  container: '#viewer',
  src: '/sample.pdf',
  animation: 'slide',
  fitMode: 'width',
  keyboard: true,
  gestures: true,
});

viewer.on('loaded', ({ totalPages }) => {
  console.log(`Loaded ${totalPages} pages`);
});

viewer.on('pageChange', ({ currentPage }) => {
  console.log(`Page ${currentPage}`);
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | *required* | CSS selector or DOM element |
| `src` | `string \| Blob \| ArrayBuffer \| File` | *required* | PDF source |
| `animation` | `'none' \| 'fade' \| 'slide' \| 'page-flip'` | `'none'` | Page transition animation |
| `initialPage` | `number` | `1` | Starting page |
| `scale` | `number` | `1` | Initial zoom level |
| `fitMode` | `'none' \| 'width' \| 'height' \| 'page'` | `'none'` | Auto-fit strategy |
| `viewMode` | `'single' \| 'spread'` | `'single'` | Single or two-page spread |
| `keyboard` | `boolean` | `true` | Enable keyboard navigation |
| `gestures` | `boolean` | `true` | Enable swipe/pinch/double-tap |
| `responsive` | `boolean` | `true` | Auto-resize on container change |
| `preload` | `number` | `1` | Pages to preload ahead/behind |
| `minScale` | `number` | `0.5` | Minimum zoom |
| `maxScale` | `number` | `3` | Maximum zoom |
| `zoomStep` | `number` | `0.25` | Zoom increment per step |
| `showPageIndicator` | `boolean` | `true` | Show page/zoom indicator |
| `security` | `PageonSecurityOptions` | see below | Source validation rules |
| `performance` | `PageonPerformanceOptions` | see below | Caching and memory limits |
| `pdfWorkerSrc` | `string` | `''` | Custom PDF.js worker URL |
| `useWorker` | `boolean` | `true` | Use web worker for PDF parsing |
| `debug` | `boolean` | `false` | Emit `performance` events |

## Methods

```ts
await viewer.nextPage();
await viewer.prevPage();
await viewer.goToPage(5);

await viewer.zoomIn();
await viewer.zoomOut();
await viewer.setZoom(1.5);
await viewer.resetZoom();

await viewer.fitWidth();
await viewer.fitHeight();
await viewer.setFitMode('page');

await viewer.refresh();
await viewer.reload();
await viewer.destroy();

viewer.enableKeyboard();
viewer.disableKeyboard();
viewer.enableGestures();
viewer.disableGestures();

const state = viewer.state;   // PageonPublicState
const stats = viewer.getStats(); // PageonStats
```

## Events

```ts
viewer.on('loaded', ({ totalPages }) => {});
viewer.on('pageChange', ({ currentPage, totalPages }) => {});
viewer.on('rendering', ({ page, scale }) => {});
viewer.on('zoomChange', ({ scale, previousScale }) => {});
viewer.on('fitModeChange', ({ mode }) => {});
viewer.on('resize', ({ width, height, scale, mode }) => {});
viewer.on('gesture', ({ type }) => {});
viewer.on('loading', ({ state, isLoading, isRendering }) => {});
viewer.on('error', ({ error }) => {});
viewer.on('performance', ({ pageNumber, renderTimeMs, cacheHit, scale, canvasPixels }) => {});
```

## Security Options

```ts
{
  allowRemote: true,       // Allow remote URLs
  allowedDomains: [],      // Restrict to specific domains (empty = all)
  allowBlob: true,         // Allow Blob sources
  allowDataUrl: false,     // Allow data: URLs
  maxFileSize: Infinity,   // Max file size in bytes
}
```

## Performance Options

```ts
{
  maxCachedPages: 8,           // Max pages kept in cache
  maxCanvasPixels: 4_000_000,  // Max pixels per canvas
  enableAutoCleanup: true,     // Auto-evict distant pages
  mobileMemoryMode: 'normal',  // 'normal' | 'low'
}
```

## Framework Adapters

- **Angular**: [`@pageon/angular`](https://www.npmjs.com/package/@pageon/angular)
- **Ionic**: [`@pageon/ionic`](https://www.npmjs.com/package/@pageon/ionic)

## License

[MIT](./LICENSE)
