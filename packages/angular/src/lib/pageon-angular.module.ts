import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageonViewerComponent } from './pageon-viewer/pageon-viewer.component';

@NgModule({
  declarations: [PageonViewerComponent],
  imports: [CommonModule],
  exports: [PageonViewerComponent]
})
export class PageonAngularModule {}
