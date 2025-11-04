import { Routes } from '@angular/router';
import { KioskoLayoutComponent } from './layouts/kiosko-layout/kiosko-layout.component';
import { IniciarComponent } from './pages/iniciar/iniciar.component';
import { MenuComponent } from './pages/menu/menu.component';
import { PagoComponent } from './pages/pago/pago.component';
// rutas del kiosko: http://localhost:4200/kiosko/

export const KIOSKO_ROUTES: Routes = [
  {
    path: '',
    component: KioskoLayoutComponent,
    children: [
      { path: '', redirectTo: 'iniciar', pathMatch: 'full' },
      { path: 'iniciar', component: IniciarComponent },
      { 
        path: 'menu', 
        component: MenuComponent,
        data: {
          title: 'Bienvenido a AITA PIZZA',
          subtitle: 'Selecciona tu pizza favorita'
        }
      },
      { 
        path: 'pago', 
        component: PagoComponent,
        data: {
          title: 'Confirmar tu pedido',
          subtitle: 'Revisa y confirma tu compra'
        }
      },
    ]
  }
];