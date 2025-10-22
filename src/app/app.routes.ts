import { Routes } from '@angular/router';
import { DASHBOARD_ROUTES } from './dashboard/dashboard.routes';
import { KIOSKO_ROUTES } from './kiosko/kiosko.routes';

export const routes: Routes = [
  // Kiosko libre
  { path: 'kiosko', children: KIOSKO_ROUTES },

  // Dashboard protegido
  { path: 'dashboard', children: DASHBOARD_ROUTES },

  // Raíz → kiosko/iniciar
  { path: '', redirectTo: 'kiosko/iniciar', pathMatch: 'full' }

  // ❌ No hay ** global, cada módulo maneja su 404
];