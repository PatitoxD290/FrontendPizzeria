import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Modelos y Servicios
import { Usuario, UsuarioDTO } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent {
  
  // Objeto local para el formulario
  // Nota: Password es opcional en la interfaz base para lectura, pero aquí lo usamos para binding
  usuario: Usuario & { Password?: string };
  
  mode: 'form' | 'password' = 'form';
  hidePassword: boolean = true;
  guardando: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private dialogRef: MatDialogRef<UsuarioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario?: Usuario, mode?: 'form' | 'password' }
  ) {
    this.mode = data?.mode || 'form';

    if (data?.usuario) {
      // EDICIÓN: Copiar datos existentes
      this.usuario = { 
        ...data.usuario,
        Password: '' // Limpiar password (no se edita aquí salvo en modo password)
      };
    } else {
      // CREACIÓN: Datos vacíos por defecto
      this.usuario = {
        ID_Usuario: 0,
        Correo: '',
        Password: '',
        Perfil: '',
        Roll: 'E', // Empleado por defecto
        Estado: 'A',
        Fecha_Registro: ''
      };
    }
  }

  saveUsuario() {
    // 1. MODO: CAMBIAR CONTRASEÑA
    if (this.mode === 'password') {
      if (!this.usuario.Password || this.usuario.Password.trim().length < 4) {
        Swal.fire('Atención', 'La contraseña debe tener mínimo 4 caracteres.', 'warning');
        return;
      }

      this.guardando = true;
      this.usuarioService.changePassword(this.usuario.ID_Usuario, this.usuario.Password!).subscribe({
        next: () => this.handleSuccess('Contraseña actualizada correctamente'),
        error: (err) => this.handleError('cambiar la contraseña', err)
      });
      return;
    }

    // 2. MODO: FORMULARIO (CREAR / EDITAR DATOS)
    
    // Validaciones básicas
    if (!this.usuario.Perfil.trim() || !this.usuario.Correo.trim()) {
      Swal.fire('Atención', 'Nombre y Correo son obligatorios.', 'warning');
      return;
    }

    // Preparar DTO
    const dto: UsuarioDTO = {
      Perfil: this.usuario.Perfil.trim(),
      Correo: this.usuario.Correo.trim(),
      Roll: this.usuario.Roll,
      Estado: this.usuario.Estado
    };

    this.guardando = true;

    if (this.usuario.ID_Usuario === 0) {
      // CREAR NUEVO
      if (!this.usuario.Password || this.usuario.Password.trim().length < 4) {
        this.guardando = false;
        Swal.fire('Atención', 'Para crear un usuario, la contraseña es obligatoria (mín. 4 caracteres).', 'warning');
        return;
      }
      
      // Agregar password al DTO solo al crear
      dto.Password = this.usuario.Password;

      this.usuarioService.createUsuario(dto).subscribe({
        next: () => this.handleSuccess('Usuario creado exitosamente'),
        error: (err) => this.handleError('crear el usuario', err)
      });

    } else {
      // ACTUALIZAR EXISTENTE (Sin password)
      this.usuarioService.updateUsuario(this.usuario.ID_Usuario, dto).subscribe({
        next: () => this.handleSuccess('Usuario actualizado exitosamente'),
        error: (err) => this.handleError('actualizar el usuario', err)
      });
    }
  }

  // Helpers
  private handleSuccess(msg: string) {
    this.guardando = false;
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: msg,
      timer: 1500,
      showConfirmButton: false
    });
    this.dialogRef.close(true);
  }

  private handleError(action: string, err: any) {
    this.guardando = false;
    console.error(err);
    if (err.status === 409) {
      Swal.fire('Duplicado', 'El correo electrónico ya está registrado.', 'warning');
    } else {
      Swal.fire('Error', `No se pudo ${action}.`, 'error');
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  // Utilidades de formato
  soloLetras(event: KeyboardEvent) {
    const char = event.key;
    const permitidos = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]$/;
    const especiales = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (!permitidos.test(char) && !especiales.includes(char)) {
      event.preventDefault();
    }
  }

  formatNombreCompleto() {
    if (!this.usuario.Perfil) return;
    // Eliminar espacios dobles y capitalizar
    this.usuario.Perfil = this.usuario.Perfil.replace(/\s+/g, ' ');
    this.usuario.Perfil = this.usuario.Perfil
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}