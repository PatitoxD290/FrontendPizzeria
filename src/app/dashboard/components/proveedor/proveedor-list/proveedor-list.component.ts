import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Proveedor } from '../../../../core/models/proveedor.model';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { ProveedorFormComponent } from '../proveedor-form/proveedor-form.component';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-list',
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
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrls: ['./proveedor-list.component.css']
})
export class ProveedorListComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<Proveedor>([]);
  loading = false;
  changingState: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private proveedorService: ProveedorService, 
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProveedores();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // 📥 Cargar datos
  loadProveedores() {
    this.loading = true;
    this.proveedorService.getProveedores().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading = false;
        
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: err => { 
        console.error('Error al cargar proveedores', err); 
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
      }
    });
  }

  // 🔍 Filtro
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🧹 Limpiar filtros
  limpiarFiltros() {
    const input = document.querySelector('.search-input-compact') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.dataSource.filter = '';
  }

  // 🗑️ Eliminar
  deleteProveedor(proveedor: Proveedor) {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Se eliminará a "${proveedor.Nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedorService.deleteProveedor(proveedor.ID_Proveedor).subscribe({ 
          next: () => {
            Swal.fire('Eliminado', 'Proveedor eliminado correctamente', 'success');
            this.loadProveedores();
          }, 
          error: err => {
            console.error(err);
            if (err.status === 400 || err.status === 409) {
              Swal.fire('No se puede eliminar', err.error.error || 'El proveedor tiene stock asociado.', 'warning');
            } else {
              Swal.fire('Error', 'Ocurrió un error al eliminar.', 'error');
            }
          }
        });
      }
    });
  }

  // 🔄 Cambiar Estado
  cambiarEstadoProveedor(proveedor: Proveedor) {
    const nuevoEstado = proveedor.Estado === 'A' ? 'I' : 'A';
    const accion = nuevoEstado === 'A' ? 'activar' : 'desactivar';
    const colorBtn = nuevoEstado === 'A' ? '#28a745' : '#ffc107';
    
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`,
      text: `El proveedor cambiará a estado ${nuevoEstado === 'A' ? 'Activo' : 'Inactivo'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: colorBtn,
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`
    }).then((result) => {
      if (result.isConfirmed) {
        this.changingState = proveedor.ID_Proveedor;
        
        this.proveedorService.statusProveedor(proveedor.ID_Proveedor, nuevoEstado).subscribe({
          next: () => {
            proveedor.Estado = nuevoEstado;
            this.changingState = null;
            Swal.fire('Actualizado', `Proveedor ${accion}do correctamente`, 'success');
          },
          error: (error) => {
            console.error(error);
            this.changingState = null;
            Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
          }
        });
      }
    });
  }

  // 📝 Abrir Modal
  openProveedorForm(proveedor?: Proveedor) {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { 
      width: '700px', 
      disableClose: true,
      data: { proveedor } 
    });
    dialogRef.afterClosed().subscribe(result => { 
      if (result) this.loadProveedores(); 
    });
  }

  // 🔧 Helpers Visuales
  getEstadoClass(estado: string): string {
    return estado === 'A' ? 'estado-activo' : 'estado-inactivo';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  // Propiedad computada para filteredData
  get filteredData(): Proveedor[] {
    return this.dataSource.filteredData;
  }
}