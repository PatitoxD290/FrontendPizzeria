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
      {        
        path: 'cliente',
        loadComponent: () =>
          import('./pages/cliente/cliente.page').then(m => m.ClientePage)
      },
      {        
        path: 'usuario',
        loadComponent: () =>
          import('./pages/usuario/usuario.page').then(m => m.UsuarioPage)
      },
       {        
        path: 'proveedor',
        loadComponent: () =>
          import('./pages/proveedor/proveedor.page').then(m => m.ProveedorPage)
      },
      {        
        path: 'categoria',
        loadComponent: () =>
          import('./pages/categoria/categoria.page').then(m => m.CategoriaPage)
      },
      {        
        path: 'receta',
        loadComponent: () =>
          import('./pages/receta/receta.page').then(m => m.RecetaPage)
      },
      {        
        path: 'producto',
        loadComponent: () =>
          import('./pages/producto/producto.page').then(m => m.ProductoPage)
      },
       {        
        path: 'ingrediente',
        loadComponent: () =>
          import('./pages/ingrediente/ingrediente.page').then(m => m.IngredientePage)
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
