import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageonAngularModule, PageonViewerComponent } from '@pageon/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PageonAngularModule],
  template: `
    <main>
      <h1>Pageon Angular Demo</h1>
      <div class="controls">
        <button (click)="prev()">Anterior</button>
        <button (click)="next()">Siguiente</button>
        <button (click)="zoomIn()">Zoom in</button>
        <button (click)="zoomOut()">Zoom out</button>
        <button (click)="fitWidth()">Fit width</button>
        <button (click)="fitPage()">Fit page</button>
      </div>

      <pageon-viewer
        [src]="pdfUrl"
        [animation]="'slide'"
        [scale]="1"
        [fitMode]="'width'"
        [keyboard]="true"
        [gestures]="true"
        (loaded)="onLoaded($event)"
        (pageChange)="onPageChange($event)"
        (zoomChange)="onZoomChange($event)"
        (loading)="onLoading($event)"
        (error)="onError($event)">
      </pageon-viewer>

      <section class="status">
        <p>Página: {{ currentPage }} / {{ totalPages }}</p>
        <p>Zoom: {{ zoom.toFixed(2) }}x</p>
        <p>Loading: {{ loadingState }}</p>
        <p *ngIf="errorMessage">Error: {{ errorMessage }}</p>
      </section>
    </main>
  `,
  styles: [
    `
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 16px;
        font-family: system-ui, sans-serif;
      }
      .controls {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .status {
        margin-top: 12px;
      }
    `
  ]
})
export class AppComponent {
  @ViewChild(PageonViewerComponent) viewer!: PageonViewerComponent;

  pdfUrl = '/sample.pdf';
  currentPage = 1;
  totalPages = 0;
  zoom = 1;
  loadingState = 'idle';
  errorMessage = '';

  prev(): void {
    void this.viewer?.prevPage();
  }

  next(): void {
    void this.viewer?.nextPage();
  }

  zoomIn(): void {
    void this.viewer?.zoomIn();
  }

  zoomOut(): void {
    void this.viewer?.zoomOut();
  }

  fitWidth(): void {
    void this.viewer?.fitWidth();
  }

  fitPage(): void {
    void this.viewer?.setFitMode('page');
  }

  onLoaded(event: { totalPages: number }): void {
    this.totalPages = event.totalPages;
  }

  onPageChange(event: { currentPage: number; totalPages: number }): void {
    this.currentPage = event.currentPage;
    this.totalPages = event.totalPages;
  }

  onZoomChange(event: { scale: number }): void {
    this.zoom = event.scale;
  }

  onLoading(event: { state: string }): void {
    this.loadingState = event.state;
  }

  onError(event: { error: Error }): void {
    this.errorMessage = event.error.message;
  }
}
