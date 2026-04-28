# Pageon

Librería moderna y extensible para visualizar PDFs con experiencia de lectura avanzada.

## Monorepo

- `packages/core`: librería principal `@pageon/core`.
- `examples/vanilla-js`: demo con Vite y JavaScript/TypeScript.

## Uso básico

```ts
import { Pageon } from '@pageon/core';

const viewer = new Pageon({
  container: '#viewer',
  src: '/sample.pdf',
  security: {
    allowRemote: true,
    allowedDomains: ['example.com'],
    allowBlob: true,
    allowDataUrl: false,
    maxFileSize: 25 * 1024 * 1024
  },
  performance: {
    maxCachedPages: 8,
    maxCanvasPixels: 4_000_000,
    enableAutoCleanup: true,
    mobileMemoryMode: 'normal'
  },
  debug: false,
  pdfWorkerSrc: '/pdf.worker.min.mjs',
  useWorker: true
});
```

## Arquitectura interna

- `Pageon`: orquestación y estado.
- `RenderQueue`: cola de render por prioridad.
- `MemoryManager`: control de memoria/canvas.
- `SourceValidator`: seguridad de fuentes.
- `PdfLoader`: integración con PDF.js worker.

Más detalle: `docs/architecture.md`.

## Seguridad

- Validación estricta del `src`.
- Bloqueo de esquemas peligrosos (`javascript:`, `file:`).
- `allowedDomains` para restringir origen remoto.
- Validación de tamaño y MIME en fuentes binarias.

Más detalle: `docs/security.md`.

## Performance

- Límite de páginas cacheadas y límite por píxeles por canvas.
- Limpieza automática de páginas lejanas.
- Cancelación de renders obsoletos y priorización de página actual.
- Evento `performance` cuando `debug: true`.

Más detalle: `docs/performance.md`.

## Worker PDF.js

Configurable con:

- `pdfWorkerSrc?: string`
- `useWorker?: boolean`

### Vite

Configura `pdfWorkerSrc` con un asset servido públicamente o usa el valor default del paquete.

### Angular / Ionic

Asegura que el worker sea copiado a assets estáticos y referencia la URL final en `pdfWorkerSrc`.

## Errores comunes

Códigos soportados:

- `CONTAINER_NOT_FOUND`
- `INVALID_SOURCE`
- `SOURCE_NOT_ALLOWED`
- `PDF_LOAD_FAILED`
- `PAGE_NOT_FOUND`
- `RENDER_FAILED`
- `RENDER_CANCELLED`
- `UNSUPPORTED_BROWSER`
- `MEMORY_LIMIT_EXCEEDED`

Más detalle: `docs/troubleshooting.md`.

## Mejores prácticas

- Restringir dominios en producción.
- Mantener `allowDataUrl` desactivado por defecto.
- Reducir `maxCachedPages` en móvil.
- Suscribirse a `error` y `performance` para diagnósticos.

## Límites conocidos

- Pageon no implementa DRM ni cifrado propietario.
- Pageon no hace bypass de CORS.
- Pageon no ejecuta JavaScript embebido en PDF.
