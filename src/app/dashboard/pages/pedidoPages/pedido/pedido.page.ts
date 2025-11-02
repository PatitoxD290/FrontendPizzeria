import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PedidoListComponent } from '../../../components/pedido/pedido-list/pedido-list.component';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PedidoListComponent],
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.css']
})
export class PedidoPage {
  // Ya no necesitamos MatDialog ni openNuevoPedido
}
