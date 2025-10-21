import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioFormComponent } from '../../components/usuario/usuario-form/usuario-form.component';
import { UsuarioListComponent } from '../../components/usuario/usuario-list/usuario-list.component';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, UsuarioListComponent],
  templateUrl: './usuario.page.html',
  styleUrls: ['./usuario.page.css']
})
export class UsuarioPage {

  constructor(private dialog: MatDialog) {}

  openNuevoUsuario(usuarioList: UsuarioListComponent) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      data: {} // Crear nuevo usuario
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) usuarioList.loadUsuarios();
    });
  }

  openEditarUsuario(usuarioList: UsuarioListComponent, usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      data: { usuario }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) usuarioList.loadUsuarios();
    });
  }
}
