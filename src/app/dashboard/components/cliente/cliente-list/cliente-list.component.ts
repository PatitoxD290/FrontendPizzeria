// src/app/dashboard/components/cliente-list/cliente-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/auth/cliente.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit {

  displayedColumns: string[] = ['cliente_id', 'nombre_completo', 'dni', 'telefono', 'fecha_registro', 'acciones'];
  clientes: Cliente[] = [];
  loading = false;
  searchTerm: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes() {
    this.loading = true;
    this.clienteService.getClientes().subscribe({
      next: data => {
        this.clientes = data;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) {
            this.paginator.length = this.filteredClientes.length;
          }
        });
      },
      error: err => {
        console.error('Error al cargar clientes', err);
        this.loading = false;
      }
    });
  }

  get filteredClientes(): Cliente[] {
    if (!this.searchTerm.trim()) return this.clientes;
    const term = this.searchTerm.toLowerCase();
    return this.clientes.filter(c =>
      (c.nombre?.toLowerCase().includes(term)) ||
      (c.dni?.toLowerCase().includes(term)) ||
      (c.telefono?.toLowerCase().includes(term))
    );
  }

  deleteCliente(id: number) {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El cliente fue eliminado', 'success');
            this.loadClientes();
          },
          error: () => {
            Swal.fire('Error', 'No se pudo eliminar el cliente', 'error');
          }
        });
      }
    });
  }

  openClienteForm(cliente?: Cliente) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '400px',
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadClientes();
    });
  }
}
