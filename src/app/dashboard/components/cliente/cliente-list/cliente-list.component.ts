import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

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
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit {

  displayedColumns: string[] = ['ID_Cliente', 'nombre_completo', 'DNI', 'Telefono', 'Fecha_Registro', 'acciones'];
  dataSource = new MatTableDataSource<Cliente>([]);
  loading = false;
  searchTerm: string = '';
  fechaInicio?: Date;
  fechaFin?: Date;

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
        const sortedData = data.sort((a, b) => b.ID_Cliente - a.ID_Cliente);
        this.dataSource = new MatTableDataSource(sortedData);
        this.dataSource.paginator = this.paginator;

        // ✅ Filtro combinado (texto + fechas)
        this.dataSource.filterPredicate = (cliente: Cliente, filter: string) => {
          const term = filter.trim().toLowerCase();
          const matchText =
            cliente.Nombre?.toLowerCase().includes(term) ||
            cliente.Apellido?.toLowerCase().includes(term) ||
            cliente.DNI?.toLowerCase().includes(term) ||
            cliente.Telefono?.toLowerCase().includes(term);

          // ✅ Filtrado por fecha si ambas fechas existen
          if (this.fechaInicio && this.fechaFin) {
            // Crear fechas sin hora para comparación
            const fechaCliente = new Date(cliente.Fecha_Registro);
            fechaCliente.setHours(0, 0, 0, 0);
            
            const fechaInicio = new Date(this.fechaInicio);
            fechaInicio.setHours(0, 0, 0, 0);
            
            const fechaFin = new Date(this.fechaFin);
            fechaFin.setHours(23, 59, 59, 999);

            return (
              matchText &&
              fechaCliente >= fechaInicio &&
              fechaCliente <= fechaFin
            );
          }
          return matchText;
        };

        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar clientes', err);
        this.loading = false;
      }
    });
  }

  // ✅ Filtro combinado
  applyFilters() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
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