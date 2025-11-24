import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Models & Services
import { Usuario } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { UsuarioFormComponent } from '../usuario-form/usuario-form.component';

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

@Component({
  selector: 'app-usuario-list',
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
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit, AfterViewInit {

  displayedColumns: string[] = [
    'ID_Usuario',
    'Perfil',
    'Correo',
    'Roll',
    'Estado',
    'Fecha_Registro',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Usuario>([]);
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usuarioService: UsuarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Filtro personalizado
    this.dataSource.filterPredicate = (data: Usuario, filter: string) => {
      const searchStr = filter.toLowerCase();
      const perfil = data.Perfil?.toLowerCase() || '';
      const correo = data.Correo?.toLowerCase() || '';
      const rol = this.getRolText(data.Roll).toLowerCase();
      
      return perfil.includes(searchStr) || 
             correo.includes(searchStr) || 
             rol.includes(searchStr);
    };
  }

  // 📥 Cargar usuarios
  loadUsuarios() {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.loading = false;
        
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: err => {
        console.error('Error al cargar usuarios', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
      }
    });
  }

  // 🔍 Filtro
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // 📝 Abrir formularios
  openNuevo() {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadUsuarios();
    });
  }

  openEditar(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '500px',
      disableClose: true,
      data: { usuario, mode: 'form' }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.loadUsuarios();
    });
  }

  openChangePassword(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioFormComponent, {
      width: '450px',
      disableClose: true,
      data: { usuario, mode: 'password' }
    });
    // No es necesario recargar la tabla tras cambiar password, pero es opcional
  }

  // 🗑️ Eliminar
  deleteUsuario(usuario: Usuario) {
    Swal.fire({
      title: '¿Eliminar Usuario?',
      html: `¿Seguro que deseas eliminar a <strong>${usuario.Perfil}</strong>?<br>Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.deleteUsuario(usuario.ID_Usuario).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'El usuario fue eliminado correctamente.', 'success');
            this.loadUsuarios();
          },
          error: (err) => {
            console.error(err);
            if (err.status === 409) {
              Swal.fire('No se puede eliminar', 'El usuario tiene ventas o movimientos asociados. Intenta desactivarlo.', 'warning');
            } else {
              Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
            }
          }
        });
      }
    });
  }

  // 🔄 Activar/Desactivar
  toggleEstado(usuario: Usuario) {
    const accion = usuario.Estado === 'A' ? 'Desactivar' : 'Activar';
    const nuevoEstado = usuario.Estado === 'A' ? 'I' : 'A';
    const colorBtn = usuario.Estado === 'A' ? '#ffc107' : '#28a745';

    Swal.fire({
      title: `${accion} Usuario`,
      html: `¿Seguro que deseas ${accion.toLowerCase()} a <strong>"${usuario.Perfil}"</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: colorBtn,
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarioService.statusUsuario(usuario.ID_Usuario, nuevoEstado).subscribe({
          next: (resp) => {
            // Actualizamos localmente para feedback rápido
            usuario.Estado = nuevoEstado;
            Swal.fire('Completado', `Usuario ${accion.toLowerCase()}do correctamente.`, 'success');
          },
          error: () => {
            Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
          }
        });
      }
    });
  }

  // 🔧 Helpers Visuales
  
  getRolText(rol: string): string {
    return rol === 'A' ? 'Administrador' : 'Empleado';
  }

  getRolClass(rol: string): string {
    return rol === 'A' ? 'rol-admin' : 'rol-empleado';
  }

  getEstadoClass(estado: string): string {
    return estado === 'A' ? 'estado-activo' : 'estado-inactivo';
  }

  getEstadoLabel(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  // Permisos de UI (opcional, depende de tu lógica de negocio)
  canEdit(usuario: Usuario): boolean {
    // Por ejemplo, solo se pueden editar usuarios activos
    return usuario.Estado === 'A';
  }

  canDelete(usuario: Usuario): boolean {
    // Solo permitir borrar si está inactivo (regla de negocio sugerida)
    return usuario.Estado === 'I';
  }
}