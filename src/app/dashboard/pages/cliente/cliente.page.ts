// src/app/dashboard/pages/cliente/cliente.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ClienteFormComponent } from '../../components/cliente/cliente-form/cliente-form.component';
import { ClienteListComponent } from '../../components/cliente/cliente-list/cliente-list.component';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, ClienteListComponent],
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.css']
})
export class ClientePage {

  constructor(private dialog: MatDialog) {}

  openNuevoCliente(clienteList: ClienteListComponent) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '500px',
      data: {} // Objeto vacío → crear nuevo cliente
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        clienteList.loadClientes(); // Recargar la lista al guardar
      }
    });
  }
}
