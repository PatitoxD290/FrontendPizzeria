import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { PedidoFormComponent } from '../../components/pedido/pedido-form/pedido-form.component';
import { PedidoListComponent } from '../../components/pedido/pedido-list/pedido-list.component';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PedidoListComponent],
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.css']
})
export class PedidoPage {

  constructor(private dialog: MatDialog) {}

  openNuevoPedido(pedidoList: PedidoListComponent) {
    const dialogRef = this.dialog.open(PedidoFormComponent, {
      width: '600px',
      data: {} // para crear nuevo, enviar objeto vacío
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        pedidoList.loadPedidos(); // recarga la tabla
      }
    });
  }
}
