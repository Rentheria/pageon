import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { PageonIonicModule, PageonIonicViewerComponent } from '@pageon/ionic';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonicModule, PageonIonicModule],
  template: `
    <ion-app>
      <ion-header>
        <ion-toolbar>
          <ion-title>Pageon Ionic Demo</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content [fullscreen]="true">
        <pageon-ionic-viewer
          [src]="pdfUrl"
          [animation]="'slide'"
          [fitMode]="'width'"
          [gestures]="true"
          [showToolbar]="false"
          [showZoomControls]="false"
          (loaded)="onLoaded($event)"
          (pageChange)="onPageChange($event)"
          (zoomChange)="onZoomChange($event)"
          (loading)="onLoading($event)"
          (error)="onError($event)">
        </pageon-ionic-viewer>
      </ion-content>

      <ion-footer>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="prev()">Anterior</ion-button>
            <ion-button (click)="next()">Siguiente</ion-button>
          </ion-buttons>
          <ion-buttons slot="end">
            <ion-button (click)="zoomOut()">-</ion-button>
            <ion-button (click)="zoomIn()">+</ion-button>
            <ion-button (click)="fitPage()">Fit</ion-button>
          </ion-buttons>
        </ion-toolbar>
        <ion-toolbar>
          <ion-title size="small">
            Página {{ currentPage }} / {{ totalPages }} · Zoom {{ zoom.toFixed(2) }}x · {{ loadingState }}
          </ion-title>
        </ion-toolbar>
        <ion-toolbar *ngIf="errorMessage">
          <ion-title size="small" color="danger">Error: {{ errorMessage }}</ion-title>
        </ion-toolbar>
      </ion-footer>
    </ion-app>
  `
})
export class AppComponent {
  @ViewChild(PageonIonicViewerComponent)
  viewer!: PageonIonicViewerComponent;

  pdfUrl = '/sample.pdf';
  currentPage = 1;
  totalPages = 0;
  zoom = 1;
  loadingState = 'idle';
  errorMessage = '';

  prev(): void { void this.viewer?.prevPage(); }
  next(): void { void this.viewer?.nextPage(); }
  zoomIn(): void { void this.viewer?.zoomIn(); }
  zoomOut(): void { void this.viewer?.zoomOut(); }
  fitPage(): void { void this.viewer?.setFitMode('page'); }

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
