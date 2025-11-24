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

import Swal from 'sweetalert2';

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

  // Columnas coincidentes con el modelo
  displayedColumns: string[] = [
    'ID_Proveedor', 
    'Nombre', 
    'Ruc', 
    'Telefono', 
    'Persona_Contacto', 
    'Estado', 
    'Fecha_Registro', 
    'acciones'
  ];

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
<<<<<<< HEAD
        Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
=======
        this.showErrorAlert('Error al cargar proveedores');
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      }
    });
  }

<<<<<<< HEAD
  // 🔍 Filtro
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🗑️ Eliminar
  deleteProveedor(proveedor: Proveedor) {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Se eliminará a "${proveedor.Nombre}".`,
=======
  deleteProveedor(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Esta acción no se puede revertir!",
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
<<<<<<< HEAD
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
=======
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDeleteProveedor(id);
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      }
    });
  }

<<<<<<< HEAD
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
=======
  private executeDeleteProveedor(id: number) {
    this.proveedorService.deleteProveedor(id).subscribe({ 
      next: () => {
        this.loadProveedores();
        Swal.fire({
          title: '¡Eliminado!',
          text: 'Proveedor eliminado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          timer: 3000,
          timerProgressBar: true
        });
      }, 
      error: err => {
        console.error(err);
        this.showErrorAlert('Error al eliminar proveedor');
      }
    });
  }

  // ✅ CORREGIDO: Método para cambiar estado (Activar/Desactivar)
  cambiarEstadoProveedor(proveedor: Proveedor) {
    const nuevoEstado: 'A' | 'I' = proveedor.Estado === 'A' ? 'I' : 'A';
    const accion = nuevoEstado === 'A' ? 'activar' : 'desactivar';
    const estadoTexto = nuevoEstado === 'A' ? 'Activo' : 'Inactivo';
    
    Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} proveedor?`,
      text: `El proveedor pasará a estado "${estadoTexto}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 'A' ? '#3085d6' : '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeStatusChange(proveedor, nuevoEstado);
      }
    });
  }

  // ✅ CORREGIDO: Tipo específico para nuevoEstado
  private executeStatusChange(proveedor: Proveedor, nuevoEstado: 'A' | 'I') {
    this.changingState = proveedor.ID_Proveedor;
    
    this.proveedorService.statusProveedor(proveedor.ID_Proveedor, nuevoEstado).subscribe({
      next: (response) => {
        // Actualizar el estado localmente sin recargar toda la lista
        proveedor.Estado = nuevoEstado;
        this.changingState = null;
        
        const mensaje = nuevoEstado === 'A' ? 'Proveedor activado correctamente' : 'Proveedor desactivado correctamente';
        const icon = nuevoEstado === 'A' ? 'success' : 'info';
        
        Swal.fire({
          title: '¡Estado actualizado!',
          text: mensaje,
          icon: icon,
          confirmButtonText: 'Aceptar',
          timer: 3000,
          timerProgressBar: true
        });
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.changingState = null;
        this.showErrorAlert('Error al cambiar el estado del proveedor');
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      }
    });
  }

<<<<<<< HEAD
  // 📝 Abrir Modal
=======
  // ✅ NUEVO: Método para obtener el texto del botón según el estado
  getEstadoButtonText(estado: 'A' | 'I'): string {
    return estado === 'A' ? 'Desactivar' : 'Activar';
  }

  // ✅ NUEVO: Método para obtener el color del botón según el estado
  getEstadoButtonColor(estado: 'A' | 'I'): string {
    return estado === 'A' ? 'warn' : 'primary';
  }

  // ✅ ACTUALIZADO: Método para obtener el icono según el estado - block para desactivar, check para activar
  getEstadoButtonIcon(estado: 'A' | 'I'): string {
    return estado === 'A' ? 'block' : 'check';
  }

  // ✅ NUEVO: Método para verificar si el botón editar debe estar deshabilitado
  canEditProveedor(estado: 'A' | 'I'): boolean {
    return estado === 'A'; // Solo se puede editar si está activo
  }

  // ✅ NUEVO: Método para verificar si el botón eliminar debe estar deshabilitado
  canDeleteProveedor(estado: 'A' | 'I'): boolean {
    return estado === 'I'; // Solo se puede eliminar si está inactivo
  }

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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

<<<<<<< HEAD
  // 🔧 Helpers Visuales
  getEstadoClass(estado: string): string {
    return estado === 'A' ? 'estado-activo' : 'estado-inactivo';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
=======
  // ✅ NUEVO: Método para mostrar alertas de error
  private showErrorAlert(message: string) {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  }

  // ✅ MÉTODO ACTUALIZADO: Para mantener compatibilidad con snackbars existentes
  private showSnackBar(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'success' ? ['snackbar-success'] : ['snackbar-error']
    });
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }
}