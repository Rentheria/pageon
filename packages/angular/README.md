# @pageon/angular

Adaptador oficial de Angular para `@pageon/core`.

## Instalación

```bash
pnpm add @pageon/angular @pageon/core
```

## Importación del módulo

```ts
import { PageonAngularModule } from '@pageon/angular';
```

## Uso básico

```html
<pageon-viewer [src]="pdfUrl"></pageon-viewer>
```

## Inputs

- `src: string`
- `animation: 'none' | 'fade' | 'slide'`
- `initialPage: number`
- `scale: number`
- `preload: number`
- `showPageIndicator: boolean`
- `minScale: number`
- `maxScale: number`
- `zoomStep: number`
- `fitMode: 'none' | 'width' | 'height' | 'page'`
- `keyboard: boolean`
- `gestures: boolean`
- `responsive: boolean`

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

## Métodos públicos (ViewChild)

```ts
@ViewChild(PageonViewerComponent)
viewer!: PageonViewerComponent;

this.viewer.nextPage();
this.viewer.prevPage();
this.viewer.goToPage(10);

this.viewer.zoomIn();
this.viewer.zoomOut();
this.viewer.setZoom(1.5);
this.viewer.resetZoom();

this.viewer.fitWidth();
this.viewer.fitHeight();
this.viewer.setFitMode('page');

this.viewer.refresh();
this.viewer.reload();
this.viewer.destroy();
```

## Ejemplo completo

```ts
import { Component, ViewChild } from '@angular/core';
import { PageonAngularModule, PageonViewerComponent } from '@pageon/angular';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [PageonAngularModule],
  template: `
    <pageon-viewer
      [src]="pdfUrl"
      [animation]="'slide'"
      [scale]="1"
      [fitMode]="'width'"
      [keyboard]="true"
      [gestures]="true"
      (loaded)="onLoaded($event)"
      (pageChange)="onPageChange($event)"
      (error)="onError($event)">
    </pageon-viewer>
  `
})
export class ReaderComponent {
  @ViewChild(PageonViewerComponent)
  viewer!: PageonViewerComponent;

  pdfUrl = '/sample.pdf';

  onLoaded(event: { totalPages: number }): void {
    console.log(event.totalPages);
  }

  onPageChange(event: { currentPage: number }): void {
    console.log(event.currentPage);
  }

  onError(event: { error: Error }): void {
    console.error(event.error);
  }
}
```
