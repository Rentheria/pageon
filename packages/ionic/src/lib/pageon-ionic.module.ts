import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { PageonAngularModule } from '@pageon/angular';
import { PageonIonicViewerComponent } from './pageon-ionic-viewer/pageon-ionic-viewer.component';

@NgModule({
  declarations: [PageonIonicViewerComponent],
  imports: [CommonModule, IonicModule, PageonAngularModule],
  exports: [PageonIonicViewerComponent]
})
export class PageonIonicModule {}
