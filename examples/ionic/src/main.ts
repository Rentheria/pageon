import { bootstrapApplication } from '@angular/platform-browser';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app.component';

import '@ionic/angular/css/core.css';
import '@ionic/angular/css/normalize.css';
import '@ionic/angular/css/structure.css';
import '@ionic/angular/css/typography.css';

bootstrapApplication(AppComponent, {
  providers: [provideIonicAngular()]
}).catch((error) => console.error(error));
