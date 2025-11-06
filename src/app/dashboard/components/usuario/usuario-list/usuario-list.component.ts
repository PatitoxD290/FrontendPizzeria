import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Usuario } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {

  displayedColumns: string[] = [
    'ID_Usuario',
    'Correo',
    'Perfil',
    'Roll',
    'Estado',
    'Fecha_Registro',
    'acciones'
  ];

  usuarios: Usuario[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios() {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: data => {
        this.usuarios = data;
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.paginator.length = this.usuarios.length;
        });
      },
      error: err => {
        console.error('Error al cargar usuarios', err);
        this.loading = false;
      }
    });
  }

  openNuevo() {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadUsuarios();
    });
  }

  openEditar(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      data: { usuario }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadUsuarios();
    });
  }

  openChangePassword(usuario: Usuario) {
  const dialogRef = this.dialog.open(UsuarioFormComponent, {
    width: '450px',
    data: { usuario, mode: 'password' }
  });

  dialogRef.afterClosed().subscribe(res => {
    if (res) this.loadUsuarios();
  });
}


deleteUsuario(id: number) {

  Swal.fire({
    title: 'Eliminar Usuario',
    text: '¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          this.loadUsuarios();
          Swal.fire({
            title: 'Eliminado',
            text: 'El usuario fue eliminado correctamente.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
        }
      });
    }
  });
}


toggleEstado(usuario: Usuario) {
  const accion = usuario.Estado === 'A' ? 'Desactivar' : 'Activar';

  Swal.fire({
    title: `${accion} Usuario`,
    text: `¿Seguro que deseas ${accion.toLowerCase()} al usuario "${usuario.Perfil}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: accion,
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.usuarioService.statusUsuario(usuario.ID_Usuario).subscribe({
        next: (resp) => {
          usuario.Estado = resp.estado; // Actualiza en tabla sin recargar
          Swal.fire({
            title: 'Completado',
            text: `Usuario ${accion.toLowerCase()}do correctamente.`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: () => {
          Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
        }
      });
    }
  });
}

// Devuelve TRUE si se debe deshabilitar el botón de editar
canEdit(usuario: Usuario): boolean {
  return usuario.Estado === 'A';
}

// Devuelve TRUE si se debe deshabilitar el botón de cambiar contraseña
canChangePassword(usuario: Usuario): boolean {
  return usuario.Estado === 'A';
}

// Devuelve TRUE si se debe habilitar eliminar (solo cuando está INACTIVO)
canDelete(usuario: Usuario): boolean {
  return usuario.Estado === 'I';
}



}
