import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { DniGuard } from './core/guards/dni-guard'; // Importar el dniGuard
import { authGuard } from './core/guards/auth-guard';

import { IniciarComponent } from './components/iniciar/iniciar.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { MenuComponent } from './components/menu/menu.component';
import { PagoComponent } from './components/pago/pago.component';

export const routes: Routes = [
  { path: '', redirectTo: 'iniciar', pathMatch: 'full' },

  // ❌ No protegido
  { path: 'login', component: LoginComponent },

  // ❌ Ruta 'iniciar', solo se mostrará el contenido sin navbar, sidebar ni footer
  { path: 'iniciar', component: IniciarComponent, data: { title: '' } },

  // 🔐 Ruta protegida para 'home'
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  // 🔐 Ruta protegida para 'registrar'
  { path: 'registrar', component: RegistrarComponent, data: { title: 'Ingresar DNI' } },

  // ❌ Ruta 'menu', accesible sin login
  {
    path: 'menu',
    component: MenuComponent,
    data: {
      title: 'BIENVENIDO AITA PIZZA',
      subtitle: 'Seleccione su pizza favorita'
    }
  },

  // 🔐 Ruta protegida para 'pago', ahora con dniGuard
  { path: 'pago', component: PagoComponent, canActivate: [DniGuard] },

  // Redirección comodín
  { path: '**', redirectTo: 'iniciar' }
];
