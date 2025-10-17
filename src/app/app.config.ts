import { ApplicationConfig, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // Handles global error listeners
    provideZoneChangeDetection({ eventCoalescing: true }), // Optimizes zone change detection
    provideRouter(routes), // Provides routes for the app
    provideHttpClient(withInterceptors([authInterceptor])) // Handles HTTP requests with interceptors (like authentication)
  ]
};
