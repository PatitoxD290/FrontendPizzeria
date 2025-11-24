import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Cliente } from '../../../../core/models/cliente.model';
import { ClienteService } from '../../../../core/services/cliente.service';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatFormFieldModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'ID_Cliente', 
    'nombre_completo', 
    'documento', 
    'Telefono', 
    'Fecha_Registro', 
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Cliente>([]);
  loading = false;
  
  // Filtros
  searchTerm: string = '';
  fechaInicio?: Date;
  fechaFin?: Date;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupFilterPredicate();
  }

  // 📥 Cargar Clientes
  loadClientes() {
    this.loading = true;
    this.clienteService.getClientes().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading = false;
        
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: err => {
        console.error('Error al cargar clientes', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
      }
    });
  }

  // 🔍 Configuración de Filtros
  setupFilterPredicate() {
    this.dataSource.filterPredicate = (cliente: Cliente, filter: string) => {
      // 1. Filtro de Texto
      const term = this.searchTerm.trim().toLowerCase();
      const matchText =
        (cliente.Nombre?.toLowerCase().includes(term) || false) ||
        (cliente.Apellido?.toLowerCase().includes(term) || false) ||
        (cliente.Numero_Documento?.toLowerCase().includes(term) || false) ||
        (cliente.Telefono?.toLowerCase().includes(term) || false);

      // 2. Filtro de Fechas
      let matchDate = true;
      if (this.fechaInicio || this.fechaFin) {
        const fechaCliente = new Date(cliente.Fecha_Registro);
        fechaCliente.setHours(0, 0, 0, 0);
        
        if (this.fechaInicio) {
          const inicio = new Date(this.fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          if (fechaCliente < inicio) matchDate = false;
        }
        
        if (this.fechaFin) {
          const fin = new Date(this.fechaFin);
          fin.setHours(23, 59, 59, 999);
          if (fechaCliente > fin) matchDate = false;
        }
      }
      
      return matchText && matchDate;
    };
  }

  applyFilters() {
    this.dataSource.filter = 'trigger'; // Disparar el predicado
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.applyFilters();
  }

  // 📝 Abrir Formulario
  openClienteForm(cliente?: Cliente) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '550px',
      disableClose: true,
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) this.loadClientes();
    });
  }

 

  // 🌟 Ver Puntos
  verPuntos(cliente: Cliente) {
    if (cliente.ID_Cliente === 1) {
        Swal.fire('Información', 'El cliente genérico no acumula puntos.', 'info');
        return;
    }

    this.clienteService.getPuntosCliente(cliente.ID_Cliente).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Puntos de Fidelidad',
          html: `
            <div style="margin-bottom: 15px;">
              <div style="font-size: 1.1em; color: #555;">Cliente: <b>${data.Nombre_Completo}</b></div>
            </div>
            <div style="background: #fff3e0; padding: 15px; border-radius: 10px; display: inline-block;">
              <div style="color: #ff9800; font-size: 3.5em; font-weight: bold; line-height: 1;">
                ${data.Puntos}
              </div>
              <div style="color: #f57c00; font-weight: 500; margin-top: 5px;">PUNTOS ACUMULADOS</div>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Genial',
          confirmButtonColor: '#ff9800'
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudieron obtener los puntos', 'error');
      }
    });
  }

  // ✅ Métodos para la paginación personalizada
  getStartIndex(): number {
    return this.paginator ? this.paginator.pageIndex * this.paginator.pageSize : 0;
  }

  getEndIndex(): number {
    if (!this.paginator) return 0;
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    return Math.min(endIndex, this.dataSource.filteredData.length);
  }

  getCurrentPage(): number {
    return this.paginator ? this.paginator.pageIndex + 1 : 1;
  }

  getTotalPages(): number {
    return this.paginator ? this.paginator.getNumberOfPages() : 1;
  }

  getPageSize(): number {
    return this.paginator ? this.paginator.pageSize : 5;
  }

  hasPreviousPage(): boolean {
    return this.paginator ? this.paginator.hasPreviousPage() : false;
  }

  hasNextPage(): boolean {
    return this.paginator ? this.paginator.hasNextPage() : false;
  }

  previousPage(): void {
    if (this.paginator) {
      this.paginator.previousPage();
    }
  }

  nextPage(): void {
    if (this.paginator) {
      this.paginator.nextPage();
    }
  }

  onPageSizeChange(event: any) {
    const newSize = parseInt(event.target.value);
    if (this.paginator) {
      this.paginator.pageSize = newSize;
      this.paginator.pageIndex = 0;
    }
  }
}