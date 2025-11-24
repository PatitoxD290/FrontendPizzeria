import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Proveedor, ProveedorDTO } from '../../../../core/models/proveedor.model';
=======
import { FormsModule, NgForm, Validators, FormControl } from '@angular/forms';
import { Proveedor } from '../../../../core/models/proveedor.model';
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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

import Swal from 'sweetalert2';

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

<<<<<<< HEAD
  // Objeto local para el formulario
  proveedor: {
    ID_Proveedor: number;
=======
  proveedor: Omit<Proveedor, 'Estado' | 'Fecha_registro'> & {
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    Nombre: string;
    Ruc: string;
    Direccion: string;
    Telefono: string;
    Email: string;
    Persona_Contacto: string;
<<<<<<< HEAD
    Estado: 'A' | 'I';
  };

  guardando = false;
=======
  };
  isSaving = false;

  // Expresiones regulares para validación
  readonly ONLY_LETTERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  readonly ONLY_NUMBERS_REGEX = /^\d+$/;
  readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

  constructor(
    private proveedorService: ProveedorService,
    private dialogRef: MatDialogRef<ProveedorFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedor?: Proveedor }
  ) {
<<<<<<< HEAD
    // Inicializar datos
    if (data?.proveedor) {
      this.proveedor = { ...data.proveedor };
=======
    // Crear una copia del proveedor sin Estado y Fecha_registro
    if (data?.proveedor) {
      const { Estado, Fecha_registro, ...proveedorData } = data.proveedor;
      this.proveedor = { ...proveedorData };
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    } else {
      this.proveedor = {
        ID_Proveedor: 0,
        Nombre: '',
        Ruc: '',
        Direccion: '',
        Telefono: '',
        Email: '',
<<<<<<< HEAD
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
=======
        Persona_Contacto: ''
      };
    }
  }

  // Métodos de validación
  validateNombre(): boolean {
    return this.ONLY_LETTERS_REGEX.test(this.proveedor.Nombre);
  }

  validateRuc(): boolean {
    return this.ONLY_NUMBERS_REGEX.test(this.proveedor.Ruc) && this.proveedor.Ruc.length === 11;
  }

  validateTelefono(): boolean {
    if (!this.proveedor.Telefono) return true; // Campo opcional, vacío es válido
    return this.ONLY_NUMBERS_REGEX.test(this.proveedor.Telefono) && this.proveedor.Telefono.length === 9;
  }

  validateEmail(): boolean {
    if (!this.proveedor.Email) return true; // Campo opcional, vacío es válido
    return this.EMAIL_REGEX.test(this.proveedor.Email);
  }

  validateForm(): boolean {
    // Validar campos obligatorios
    if (!this.proveedor.Nombre || !this.proveedor.Ruc) {
      Swal.fire({
        title: 'Campos obligatorios',
        text: 'Los campos Nombre y RUC son obligatorios',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    // Validar formato de campos obligatorios
    if (!this.validateNombre()) {
      Swal.fire({
        title: 'Formato incorrecto',
        text: 'El campo Nombre solo puede contener letras',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    if (!this.validateRuc()) {
      Swal.fire({
        title: 'Formato incorrecto',
        text: 'El campo RUC debe contener exactamente 11 números',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    // Validar campos opcionales si tienen valor
    if (this.proveedor.Telefono && !this.validateTelefono()) {
      Swal.fire({
        title: 'Formato incorrecto',
        text: 'El campo Teléfono debe contener exactamente 9 números',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    if (this.proveedor.Email && !this.validateEmail()) {
      Swal.fire({
        title: 'Formato incorrecto',
        text: 'El campo Email debe tener un formato válido (ejemplo: usuario@dominio.com)',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    return true;
  }

  // Métodos para restricción de entrada
  onNombreInput(event: any): void {
    const input = event.target.value;
    // Remover caracteres que no sean letras o espacios
    this.proveedor.Nombre = input.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  }

  onRucInput(event: any): void {
    const input = event.target.value;
    // Remover caracteres que no sean números y limitar a 11
    const numbersOnly = input.replace(/\D/g, '');
    this.proveedor.Ruc = numbersOnly.slice(0, 11);
  }

  onTelefonoInput(event: any): void {
    const input = event.target.value;
    // Remover caracteres que no sean números y limitar a 9
    const numbersOnly = input.replace(/\D/g, '');
    this.proveedor.Telefono = numbersOnly.slice(0, 9);
  }

  onEmailInput(event: any): void {
    const input = event.target.value;
    // Permitir entrada normal para email, la validación se hará al guardar
    this.proveedor.Email = input;
  }

  saveProveedor() {
    if (this.isSaving) return;

    // Validar el formulario antes de guardar
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;

    if (!this.proveedor.ID_Proveedor || this.proveedor.ID_Proveedor === 0) {
      // Crear nuevo proveedor - el backend asignará el estado automáticamente
      this.proveedorService.createProveedor(this.proveedor as Proveedor).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor creado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 3000,
            timerProgressBar: true
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al crear proveedor', err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo crear el proveedor',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.isSaving = false;
        }
      });
    } else {
      // Actualizar proveedor existente - el backend mantendrá el estado actual
      this.proveedorService.updateProveedor(this.proveedor.ID_Proveedor, this.proveedor as Proveedor).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor actualizado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar',
            timer: 3000,
            timerProgressBar: true
          });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error al actualizar proveedor', err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo actualizar el proveedor',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.isSaving = false;
        }
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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