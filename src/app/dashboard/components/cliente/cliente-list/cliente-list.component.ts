import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatTooltipModule } from '@angular/material/tooltip';

import { ClienteFormComponent } from '../cliente-form/cliente-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
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
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.css']
})
export class ClienteListComponent implements OnInit {

  // 🟢 Actualizamos las columnas para usar 'documento' en vez de 'DNI'
  displayedColumns: string[] = ['ID_Cliente', 'nombre_completo', 'documento', 'Telefono', 'Fecha_Registro', 'acciones'];
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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadClientes() {
    this.loading = true;
    this.clienteService.getClientes().subscribe({
      next: data => {
        // Ordenar por ID descendente (más nuevos primero)
        const sortedData = data.sort((a, b) => b.ID_Cliente - a.ID_Cliente);
<<<<<<< HEAD
        
        this.dataSource = new MatTableDataSource(sortedData);
        this.dataSource.paginator = this.paginator;

        // ✅ Filtro combinado (Texto + Fechas)
=======
        this.dataSource.data = sortedData;
        
        // ✅ Filtro combinado (texto + fechas)
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
        this.dataSource.filterPredicate = (cliente: Cliente, filter: string) => {
          const term = filter.trim().toLowerCase();
          
          // 🟢 Buscamos en Numero_Documento en lugar de DNI
          const matchText =
            (cliente.Nombre?.toLowerCase().includes(term) || false) ||
            (cliente.Apellido?.toLowerCase().includes(term) || false) ||
            (cliente.Numero_Documento?.toLowerCase().includes(term) || false) ||
            (cliente.Telefono?.toLowerCase().includes(term) || false);

          // ✅ Filtrado por fecha
          if (this.fechaInicio && this.fechaFin) {
            const fechaCliente = new Date(cliente.Fecha_Registro);
            fechaCliente.setHours(0, 0, 0, 0);
            
            const fInicio = new Date(this.fechaInicio);
            fInicio.setHours(0, 0, 0, 0);
            
            const fFin = new Date(this.fechaFin);
            fFin.setHours(23, 59, 59, 999);

            return matchText && (fechaCliente >= fInicio && fechaCliente <= fFin);
          }
          
          return matchText;
        };

        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar clientes', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
      }
    });
  }

  // ✅ Aplicar filtros
  applyFilters() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // ✅ Limpiar filtros
  limpiarFiltros() {
    this.searchTerm = '';
    this.fechaInicio = undefined;
    this.fechaFin = undefined;
    this.applyFilters();
  }

  // ✅ Cambiar tamaño de página
  onPageSizeChange(event: any) {
    const newSize = parseInt(event.target.value);
    if (this.paginator) {
      this.paginator.pageSize = newSize;
      this.paginator.pageIndex = 0;
    }
  }

  // ✅ Métodos para la paginación
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

  // 📝 Abrir formulario (Crear/Editar)
  openClienteForm(cliente?: Cliente) {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '500px', // Un poco más ancho para el nuevo diseño
      disableClose: true,
      data: { cliente }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) this.loadClientes();
    });
  }

  // 🗑️ Eliminar cliente
  deleteCliente(cliente: Cliente) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Eliminarás al cliente "${cliente.Nombre} ${cliente.Apellido || ''}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(cliente.ID_Cliente).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Cliente eliminado correctamente', 'success');
            this.loadClientes();
          },
          error: (err) => {
            console.error(err);
            if (err.status === 400 || err.status === 409) {
              Swal.fire('No se puede eliminar', err.error.error || 'El cliente tiene ventas asociadas', 'error');
            } else {
              Swal.fire('Error', 'Ocurrió un problema al eliminar', 'error');
            }
          }
        });
      }
    });
  }

  // 🌟 Ver Puntos del Cliente
  verPuntos(cliente: Cliente) {
    // Evitar consultar para "Clientes Varios" si es ID 1
    if (cliente.ID_Cliente === 1) {
        Swal.fire('Información', 'El cliente genérico no acumula puntos.', 'info');
        return;
    }

    this.clienteService.getPuntosCliente(cliente.ID_Cliente).subscribe({
      next: (data) => {
        Swal.fire({
          title: 'Puntos de Fidelidad',
          html: `
            <div style="font-size: 1.2em; margin-bottom: 10px;">
              Cliente: <b>${data.Nombre_Completo}</b>
            </div>
            <div style="color: #ff9800; font-size: 3em; font-weight: bold;">
              <i class="fas fa-star"></i> ${data.Puntos}
            </div>
            <div style="color: #666; margin-top: 10px;">
              Puntos Acumulados
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
}