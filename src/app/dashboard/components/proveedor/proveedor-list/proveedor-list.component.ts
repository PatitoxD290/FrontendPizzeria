// src/app/dashboard/components/proveedor-list/proveedor-list.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { ProveedorService } from '../../../../core/services/proveedor.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProveedorFormComponent } from '../proveedor-form/proveedor-form.component';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './proveedor-list.component.html',
  styleUrls: ['./proveedor-list.component.css']
})
export class ProveedorListComponent implements OnInit {

  displayedColumns: string[] = ['proveedor_id', 'nombre_proveedor', 'ruc', 'direccion', 'telefono', 'email', 'persona_contacto', 'estado', 'fecha_registro', 'acciones'];
  proveedores: Proveedor[] = [];
  loading = false;
  changingState: number | null = null; // Para controlar el loading por botón

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private proveedorService: ProveedorService, 
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores() {
    this.loading = true;
    this.proveedorService.getProveedores().subscribe({
      next: data => {
        this.proveedores = data;
        this.loading = false;
        setTimeout(() => { if (this.paginator) this.paginator.length = this.proveedores.length; });
      },
      error: err => { 
        console.error('Error al cargar proveedores', err); 
        this.loading = false;
        this.showErrorAlert('Error al cargar proveedores');
      }
    });
  }

  deleteProveedor(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡Esta acción no se puede revertir!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDeleteProveedor(id);
      }
    });
  }

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
      }
    });
  }

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

  openProveedorForm(proveedor?: Proveedor) {
    const dialogRef = this.dialog.open(ProveedorFormComponent, { 
      width: '500px', 
      data: { proveedor } 
    });
    dialogRef.afterClosed().subscribe(result => { 
      if (result) this.loadProveedores(); 
    });
  }

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
  }
}