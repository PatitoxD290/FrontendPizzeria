import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

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
  @Output() openEdit = new EventEmitter<Usuario>();

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

  constructor(private usuarioService: UsuarioService) {}

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

  deleteUsuario(id: number) {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.usuarioService.deleteUsuario(id).subscribe({
      next: () => this.loadUsuarios(),
      error: err => console.error(err)
    });
  }
}
