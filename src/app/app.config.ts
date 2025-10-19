import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🧠 Optimiza la detección de cambios de Angular
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 🚦 Configura el enrutamiento principal de la aplicación
    provideRouter(routes),

    // 🌐 Configura el cliente HTTP con interceptores (por ejemplo, para tokens)
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    )
  ]
};
