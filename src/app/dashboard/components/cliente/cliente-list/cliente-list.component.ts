// src/app/dashboard/components/cliente-list/cliente-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf  } from '@angular/common';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../services/cliente.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit {

  displayedColumns: string[] = ['cliente_id', 'nombre_completo', 'dni', 'fecha_registro', 'acciones'];
  clientes: Cliente[] = [];
  loading = false;

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
            this.paginator.length = this.clientes.length;
          }
        });
      },
      error: err => {
        console.error('Error al cargar clientes', err);
        this.loading = false;
      }
    });
  }

  deleteCliente(id: number) {
    if (!confirm('¿Eliminar este cliente?')) return;
    this.clienteService.deleteCliente(id).subscribe({
      next: () => this.loadClientes(),
      error: err => console.error('Error al eliminar cliente', err)
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
