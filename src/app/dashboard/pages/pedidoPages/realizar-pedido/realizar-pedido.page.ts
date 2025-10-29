import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MenuPedidoComponent } from '../../../components/pedido/menu-pedido/menu-pedido.component';
import { DetallePedidoComponent } from '../../../components/pedido/detalle-pedido/detalle-pedido.component';
import { PedidoListComponent } from '../../../components/pedido/pedido-list/pedido-list.component';

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, MatIconModule, MenuPedidoComponent, DetallePedidoComponent, PedidoListComponent],
  templateUrl: './realizar-pedido.page.html',
  styleUrls: ['./realizar-pedido.page.css']
})
export class RealizarPedidoPage {
  vistaActual: 'realizar' | 'registro' = 'realizar'; // vista por defecto

  cambiarVista(vista: 'realizar' | 'registro') {
    this.vistaActual = vista;
  }
}
