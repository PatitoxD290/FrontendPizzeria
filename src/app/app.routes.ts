import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './core/guards/auth-guard';

import { IniciarComponent } from './components/iniciar/iniciar.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { MenuComponent } from './components/menu/menu.component';
import { PagoComponent } from './components/pago/pago.component';

export const routes: Routes = [
  { path: '', redirectTo: 'iniciar', pathMatch: 'full' },

  // ❌ No protegido
  { path: 'login', component: LoginComponent },

  // ❌ NO protegido para que cualquiera pueda acceder sin estar logueado
  { path: 'iniciar', component: IniciarComponent, data: { title: '' } },

  // 🔐 Protegido
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  // 🔐 Protegidos
  { path: 'registrar', component: RegistrarComponent, canActivate: [authGuard], data: { title: 'Ingresar DNI' } },

  // ❌ NO protegido
  {
    path: 'menu',
    component: MenuComponent,
    data: {
      title: 'BIENVENIDO AITA PIZZA',
      subtitle: 'Seleccione su pizza favorita'
    }
  },

  // 🔐 Protegido
  { path: 'pago', component: PagoComponent, canActivate: [authGuard] },

  // Redirección comodín
  { path: '**', redirectTo: 'iniciar' }
];
