import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Proveedor, ProveedorDTO } from '../../../../core/models/proveedor.model';
import { ProveedorService } from '../../../../core/services/proveedor.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// SweetAlert2
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './proveedor-form.component.html',
  styleUrls: ['./proveedor-form.component.css']
})
export class ProveedorFormComponent {

  // Objeto local para el formulario
  proveedor: {
    ID_Proveedor: number;
    Nombre: string;
    Ruc: string;
    Direccion: string;
    Telefono: string;
    Email: string;
    Persona_Contacto: string;
    Estado: 'A' | 'I';
  };

  guardando = false;

  constructor(
    private proveedorService: ProveedorService,
    private dialogRef: MatDialogRef<ProveedorFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedor?: Proveedor }
  ) {
    // Inicializar datos
    if (data?.proveedor) {
      this.proveedor = { ...data.proveedor };
    } else {
      this.proveedor = {
        ID_Proveedor: 0,
        Nombre: '',
        Ruc: '',
        Direccion: '',
        Telefono: '',
        Email: '',
        Persona_Contacto: '',
        Estado: 'A'
      };
    }
  }

  saveProveedor() {
    // 1. Validaciones básicas
    if (!this.proveedor.Nombre.trim()) {
      Swal.fire('Error', 'El nombre del proveedor es obligatorio', 'warning');
      return;
    }

    if (!this.proveedor.Ruc.trim() || this.proveedor.Ruc.length !== 11) {
      Swal.fire('Error', 'El RUC debe tener exactamente 11 dígitos', 'warning');
      return;
    }

    this.guardando = true;

    // 2. Preparar DTO
    const dto: ProveedorDTO = {
      Nombre: this.proveedor.Nombre.trim(),
      Ruc: this.proveedor.Ruc.trim(),
      Direccion: this.proveedor.Direccion?.trim() || '',
      Telefono: this.proveedor.Telefono?.trim() || '',
      Email: this.proveedor.Email?.trim() || '',
      Persona_Contacto: this.proveedor.Persona_Contacto?.trim() || '',
      Estado: this.proveedor.Estado
    };

    // 3. Enviar al servicio
    if (this.proveedor.ID_Proveedor === 0) {
      // CREAR
      this.proveedorService.createProveedor(dto).subscribe({
        next: () => this.handleSuccess('Proveedor registrado correctamente'),
        error: (err) => this.handleError('crear', err)
      });
    } else {
      // ACTUALIZAR
      this.proveedorService.updateProveedor(this.proveedor.ID_Proveedor, dto).subscribe({
        next: () => this.handleSuccess('Proveedor actualizado correctamente'),
        error: (err) => this.handleError('actualizar', err)
      });
    }
  }

  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire('¡Éxito!', msg, 'success');
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    this.guardando = false;
    console.error(`Error al ${action} proveedor:`, err);
    
    if (err.status === 409) {
      Swal.fire('Duplicado', 'El RUC ingresado ya pertenece a otro proveedor.', 'error');
    } else {
      Swal.fire('Error', `No se pudo ${action} el proveedor.`, 'error');
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}