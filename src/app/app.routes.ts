import { Routes } from '@angular/router';
import { LoginComponent } from './dashboard/pages/login/login.component';
import { HomeComponent } from './dashboard/pages/home/home.component';
import { DniGuard } from './core/guards/dni-guard';
import { authGuard } from './core/guards/auth-guard';

import { IniciarComponent } from './kiosko/pages/iniciar/iniciar.component';
import { RegistrarComponent } from './kiosko/pages/registrar/registrar.component';
import { MenuComponent } from './kiosko/pages/menu/menu.component';
import { PagoComponent } from './kiosko/pages/pago/pago.component';

export const routes: Routes = [
  { path: '', redirectTo: 'iniciar', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  { path: 'iniciar', component: IniciarComponent, data: { title: '' } },

  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  { path: 'registrar', component: RegistrarComponent, data: { title: 'Ingresar DNI' } },

  {
    path: 'menu',
    component: MenuComponent,
    data: {
      title: 'BIENVENIDO AITA PIZZA',
      subtitle: 'Seleccione su pizza favorita'
    }
  },

  { path: 'pago', component: PagoComponent},

  { path: '**', redirectTo: 'iniciar' }
];
