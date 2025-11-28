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
  filtroTexto: string = '';
  selectedPeriodo: string = 'todos';
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
      const term = this.filtroTexto.trim().toLowerCase();
      const matchText = term === '' || 
        (cliente.Nombre?.toLowerCase().includes(term) || false) ||
        (cliente.Apellido?.toLowerCase().includes(term) || false) ||
        (cliente.Numero_Documento?.toLowerCase().includes(term) || false) ||
        (cliente.Telefono?.toLowerCase().includes(term) || false) ||
        (cliente.ID_Cliente?.toString().includes(term) || false);

      // 2. Filtro de Periodo
      let matchPeriodo = true;
      if (this.selectedPeriodo !== 'todos') {
        const fechaCliente = new Date(cliente.Fecha_Registro);
        const hoy = new Date();
        
        switch (this.selectedPeriodo) {
          case 'hoy':
            matchPeriodo = this.esMismoDia(fechaCliente, hoy);
            break;
          case 'semana':
            matchPeriodo = this.esEstaSemana(fechaCliente);
            break;
          case 'mes':
            matchPeriodo = this.esEsteMes(fechaCliente);
            break;
          case 'mes_anterior':
            matchPeriodo = this.esMesAnterior(fechaCliente);
            break;
        }
      }
      
      return matchText && matchPeriodo;
    };
  }

  // 🗓️ Métodos para filtros de fecha
  private esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  private esEstaSemana(fecha: Date): boolean {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    return fecha >= inicioSemana && fecha <= finSemana;
  }

  private esEsteMes(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getMonth() === hoy.getMonth() && 
           fecha.getFullYear() === hoy.getFullYear();
  }

  private esMesAnterior(fecha: Date): boolean {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const inicioMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
    const finMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
  }

  // 🎛️ Aplicar Filtros
  aplicarFiltros() {
    this.dataSource.filter = 'trigger'; // Disparar el predicado
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🔄 Cambio de Periodo
  onPeriodoChange() {
    this.aplicarFiltros();
  }

  // 🧹 Limpiar Filtros
  limpiarFiltros() {
    this.filtroTexto = '';
    this.selectedPeriodo = 'todos';
    this.aplicarFiltros();
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

  // ✅ Método para obtener los datos paginados (CORREGIDO)
  getPaginatedData(): Cliente[] {
    // Si hay filtros aplicados, usa filteredData, sino usa data
    const dataToPaginate = this.dataSource.filteredData.length > 0 
      ? this.dataSource.filteredData 
      : this.dataSource.data;
    
    if (!this.dataSource.paginator) {
      return dataToPaginate;
    }
    
    const startIndex = this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize;
    const endIndex = startIndex + this.dataSource.paginator.pageSize;
    return dataToPaginate.slice(startIndex, endIndex);
  }

  // ✅ Métodos para la paginación personalizada (ACTUALIZADOS)
  getStartIndex(): number {
    const dataToCount = this.dataSource.filteredData.length > 0 
      ? this.dataSource.filteredData 
      : this.dataSource.data;
    return this.paginator ? this.paginator.pageIndex * this.paginator.pageSize + 1 : 1;
  }

  getEndIndex(): number {
    const dataToCount = this.dataSource.filteredData.length > 0 
      ? this.dataSource.filteredData 
      : this.dataSource.data;
    
    if (!this.paginator) return dataToCount.length;
    
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    const endIndex = startIndex + this.paginator.pageSize;
    return Math.min(endIndex, dataToCount.length);
  }

  getTotalItems(): number {
    const dataToCount = this.dataSource.filteredData.length > 0 
      ? this.dataSource.filteredData 
      : this.dataSource.data;
    return dataToCount.length;
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