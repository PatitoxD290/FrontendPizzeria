import { Routes } from '@angular/router';
import { IniciarComponent } from './components/iniciar/iniciar.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { MenuComponent } from './components/menu/menu.component';

export const routes: Routes = [
  { path: '', component: IniciarComponent, data: { title: '' } },
  { path: 'registrar', component: RegistrarComponent, data: { title: 'Ingresar DNI' } },
  { 
    path: 'menu', 
    component: MenuComponent, 
    data: { 
      title: 'BIENVENIDO AITA PIZZA', 
      subtitle: 'Seleccione su pizza favorita' 
    } 
  },
];
