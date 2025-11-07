import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';


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
    MatIconModule 
  ],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent {
  usuario: Usuario;
  mode: 'form' | 'password' = 'form';
  hidePassword: boolean = true; // <<--- NUEVO


constructor(
  private usuarioService: UsuarioService,
  private dialogRef: MatDialogRef<UsuarioFormComponent>,
  @Inject(MAT_DIALOG_DATA) public data: { usuario?: Usuario, mode?: 'form' | 'password' }
) {
  this.mode = data?.mode || 'form';

  this.usuario = data?.usuario
    ? { 
        ...data.usuario,
        Password: ''   
      }
    : {
        ID_Usuario: 0,
        Correo: '',
        Password: '',
        Perfil: '',
        Roll: 'E',
        Estado: 'A',
        Fecha_Registro: ''
      };
}




saveUsuario() {

  // 1. Si estamos editando solo la contraseña
  if (this.mode === 'password') {

    if (!this.usuario.Password || this.usuario.Password.trim().length < 4) {
      Swal.fire('Error', 'La contraseña debe tener mínimo 4 caracteres.', 'warning');
      return;
    }

    this.usuarioService.changePassword(this.usuario.ID_Usuario, this.usuario.Password!).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          timer: 1600,
          showConfirmButton: false
        });
        this.dialogRef.close(true);
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cambiar la contraseña.', 'error');
      }
    });

    return;
  }

  // 2. Si es nuevo usuario
  if (this.usuario.ID_Usuario === 0) {
    this.usuarioService.createUsuario(this.usuario).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          timer: 1500,
          showConfirmButton: false
        });
        this.dialogRef.close(true);
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'No se pudo crear el usuario.', 'error');
      }
    });
    return;
  }

  // 3. Si es edición normal (sin cambiar contraseña)
  const usuarioSinPassword = { ...this.usuario };
  delete usuarioSinPassword.Password;

  this.usuarioService.updateUsuario(this.usuario.ID_Usuario, usuarioSinPassword).subscribe({
    next: () => {
      Swal.fire({
        icon: 'success',
        title: 'Usuario actualizado',
        timer: 1500,
        showConfirmButton: false
      });
      this.dialogRef.close(true);
    },
    error: err => {
      console.error(err);
      Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error');
    }
  });
}

  close() {
    this.dialogRef.close(false);
  }

soloLetras(event: KeyboardEvent) {
  const char = event.key;

  // Permitimos: letras, espacio, backspace, suprimir, flechas
  const permitidos = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]$/;
  const especiales = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

  if (!permitidos.test(char) && !especiales.includes(char)) {
    event.preventDefault();
  }
}

formatNombreCompleto() {
  if (!this.usuario.Perfil) return;

  // Limpiar espacios múltiples
  this.usuario.Perfil = this.usuario.Perfil.replace(/\s+/g, ' ');

  // Capitalizar cada palabra
  this.usuario.Perfil = this.usuario.Perfil
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}



}
