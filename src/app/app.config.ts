import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),
    {
      provide: TINYMCE_SCRIPT_SRC,
      useValue: 'assets/tinymce/tinymce.min.js',
    },
  ]
};