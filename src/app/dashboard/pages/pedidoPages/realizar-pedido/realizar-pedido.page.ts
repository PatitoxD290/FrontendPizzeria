import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MenuPedidoComponent } from '../../../components/pedido/menu-pedido/menu-pedido.component';
import { DetallePedidoComponent } from '../../../components/pedido/detalle-pedido/detalle-pedido.component';

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, MatIconModule, MenuPedidoComponent, DetallePedidoComponent],
  templateUrl: './realizar-pedido.page.html',
  styleUrls: ['./realizar-pedido.page.css']
})
export class RealizarPedidoPage {}
