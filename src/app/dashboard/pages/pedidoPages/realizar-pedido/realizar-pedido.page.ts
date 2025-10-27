import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuPedidoComponent } from '../../../components/pedido/menu-pedido/menu-pedido.component';
import { DetallePedidoComponent } from '../../../components/pedido/detalle-pedido/detalle-pedido.component';

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, MenuPedidoComponent, DetallePedidoComponent],
  templateUrl: './realizar-pedido.page.html',
  styleUrls: ['./realizar-pedido.page.css']
})
export class RealizarPedidoPage {}
