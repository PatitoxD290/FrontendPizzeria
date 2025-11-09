import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { PedidoListComponent } from '../../../components/pedido/pedido-list/pedido-list.component';
import { PedidoEsperaListComponent } from '../../../components/pedido/pedido-espera-list/pedido-espera-list.component';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTabsModule,
    PedidoListComponent,
    PedidoEsperaListComponent
  ],
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.css']
})
export class PedidoPage {
  selectedTab = 0; // 0 = Pedidos en Espera, 1 = Historial de Pedidos

  onTabChange(event: number): void {
    this.selectedTab = event;
  }
}