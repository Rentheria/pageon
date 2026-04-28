# Pageon

Librería moderna y extensible para visualizar PDFs con transiciones animadas entre páginas.

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

## Scripts

```bash
pnpm dev
pnpm build
pnpm typecheck
```

## API rápida

```ts
import { Pageon } from '@pageon/core';

const viewer = new Pageon({
  container: '#viewer',
  src: '/sample.pdf',
  animation: 'slide',
  initialPage: 1,
  scale: 1,
  preload: 1,
  showPageIndicator: true
});

await viewer.nextPage();
await viewer.prevPage();
await viewer.goToPage(3);
await viewer.destroy();
```
