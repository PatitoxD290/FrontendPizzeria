import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { authGuard } from '../core/guards/auth-guard';

// rutas del dashboard: http://localhost:4200/dashboard/

export const DASHBOARD_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'pedido',
        loadComponent: () =>
          import('./pages/pedido/pedido.page').then(m => m.PedidoPage)
      },
      // 404 interno del dashboard
      {
        path: '**',
        loadComponent: () =>
          import('../shared/not-found/not-found.component').then(m => m.NotFoundComponent)
      }
    ]
  }
];
