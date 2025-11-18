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
        this.showSnackBar('Error al cargar proveedores', 'error');
      }
    });
  }

  deleteProveedor(id: number) {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    
    this.proveedorService.deleteProveedor(id).subscribe({ 
      next: () => {
        this.loadProveedores();
        this.showSnackBar('Proveedor eliminado correctamente', 'success');
      }, 
      error: err => {
        console.error(err);
        this.showSnackBar('Error al eliminar proveedor', 'error');
      }
    });
  }

  // ✅ NUEVO: Método para cambiar estado (Activar/Desactivar)
  cambiarEstadoProveedor(proveedor: Proveedor) {
    const nuevoEstado = proveedor.Estado === 'A' ? 'I' : 'A';
    const accion = nuevoEstado === 'A' ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${accion} este proveedor?`)) return;

    this.changingState = proveedor.ID_Proveedor;
    
    this.proveedorService.statusProveedor(proveedor.ID_Proveedor, nuevoEstado).subscribe({
      next: (response) => {
        // Actualizar el estado localmente sin recargar toda la lista
        proveedor.Estado = nuevoEstado;
        this.changingState = null;
        
        const mensaje = nuevoEstado === 'A' ? 'Proveedor activado correctamente' : 'Proveedor desactivado correctamente';
        this.showSnackBar(mensaje, 'success');
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.changingState = null;
        this.showSnackBar('Error al cambiar el estado del proveedor', 'error');
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

  // ✅ NUEVO: Método para obtener el icono según el estado
  getEstadoButtonIcon(estado: 'A' | 'I'): string {
    return estado === 'A' ? 'toggle_off' : 'toggle_on';
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

  // ✅ NUEVO: Método auxiliar para mostrar notificaciones
  private showSnackBar(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'success' ? ['snackbar-success'] : ['snackbar-error']
    });
  }
}