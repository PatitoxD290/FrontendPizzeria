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
    MatSelectModule
  ],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent {
  usuario: Usuario;

  constructor(
    private usuarioService: UsuarioService,
    private dialogRef: MatDialogRef<UsuarioFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario?: Usuario }
  ) {
    this.usuario = data?.usuario ?? {
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
    if (this.usuario.ID_Usuario === 0) {
      // Crear nuevo usuario
      this.usuarioService.createUsuario(this.usuario).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear usuario', err)
      });
    } else {
      // Actualizar usuario existente
      this.usuarioService.updateUsuario(this.usuario.ID_Usuario, this.usuario).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar usuario', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}
