# @pageon/ionic

Adaptador de Ionic + Angular para `@pageon/core` y `@pageon/angular` con foco en experiencia mobile.

## Instalación

```bash
pnpm add @pageon/ionic @pageon/angular @pageon/core @ionic/angular
```

## Configuración

Importa el módulo en tu feature module o componente standalone:

```ts
import { PageonIonicModule } from '@pageon/ionic';
```

## Uso básico

```html
<pageon-ionic-viewer
  [src]="pdfUrl"
  [animation]="'slide'"
  [fitMode]="'width'"
  [gestures]="true"
  [keyboard]="false"
  (pageChange)="onPageChange($event)"
  (loading)="onLoading($event)"
  (error)="onError($event)">
</pageon-ionic-viewer>
```

## Ejemplo dentro de ion-content

```html
<ion-header>
  <ion-toolbar>
    <ion-title>Pageon Ionic</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content fullscreen="true">
  <pageon-ionic-viewer
    [src]="'/sample.pdf'"
    [fitMode]="'page'"
    [showToolbar]="true"
    [showZoomControls]="true">
  </pageon-ionic-viewer>
</ion-content>
```

## Inputs

- `src: string`
- `animation: 'none' | 'fade' | 'slide'`
- `initialPage: number`
- `scale: number`
- `preload: number`
- `minScale: number`
- `maxScale: number`
- `zoomStep: number`
- `fitMode: 'none' | 'width' | 'height' | 'page'`
- `keyboard: boolean`
- `gestures: boolean`
- `responsive: boolean`
- `showToolbar: boolean`
- `showPageIndicator: boolean`
- `showZoomControls: boolean`

## Outputs

- `loaded`
- `pageChange`
- `error`
- `rendering`
- `zoomChange`
- `fitModeChange`
- `resize`
- `gesture`
- `loading`

## Métodos (ViewChild)

```ts
@ViewChild(PageonIonicViewerComponent) viewer!: PageonIonicViewerComponent;

this.viewer.nextPage();
this.viewer.prevPage();
this.viewer.goToPage(4);

this.viewer.zoomIn();
this.viewer.zoomOut();
this.viewer.setZoom(1.6);
this.viewer.resetZoom();

this.viewer.fitWidth();
this.viewer.fitHeight();
this.viewer.setFitMode('page');

this.viewer.refresh();
this.viewer.reload();
this.viewer.destroy();
```

## Recomendaciones mobile

- Activa `fitMode="width"` o `fitMode="page"` para primera carga.
- Mantén `preload` entre `1` y `2` para limitar memoria.
- Usa `gestures=true` para swipe, pinch y double-tap.
- Dentro de `ion-content`, deja el scroll vertical al contenedor padre.

## Problemas comunes

- **No responde al swipe:** verifica que `gestures` esté en `true` y que no exista un overlay capturando punteros.
- **Scroll bloqueado:** evita fijar `touch-action: none` en contenedores externos.
- **Zoom brusco:** reduce `maxScale` y/o `zoomStep` para controlar sensibilidad.
