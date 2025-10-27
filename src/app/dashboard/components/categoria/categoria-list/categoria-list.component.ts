// src/app/dashboard/components/categoria/categoria-list/categoria-list.component.ts
import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Categoria } from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../services/categoria.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './categoria-list.component.html',
  styleUrls: ['./categoria-list.component.css']
})
export class CategoriaListComponent implements OnInit {
  @Output() categoriaSeleccionada = new EventEmitter<number>();

  displayedColumns: string[] = ['categoria_id', 'nombre_categoria', 'descripcion_categoria', 'acciones'];
  categorias: Categoria[] = [];
  loading = false;
  categoriaActiva: number | null = 0; // 0 = todos seleccionado

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private categoriaService: CategoriaService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias() {
    this.loading = true;
    this.categoriaService.getCategorias().subscribe({
      next: data => {
        this.categorias = data;
        this.loading = false;
      },
      error: err => {
        console.error('Error al cargar categorías', err);
        this.loading = false;
      }
    });
  }

  seleccionarCategoria(categoria: Categoria | null) {
    const id = categoria ? categoria.categoria_id! : 0;

    // si ya estaba seleccionada, la deselecciona
    if (this.categoriaActiva === id) {
      this.categoriaActiva = 0;
      this.categoriaSeleccionada.emit(0);
    } else {
      this.categoriaActiva = id;
      this.categoriaSeleccionada.emit(id);
    }
  }

  deleteCategoria(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoriaService.deleteCategoria(id).subscribe({
          next: () => {
            Swal.fire('¡Eliminada!', 'La categoría ha sido eliminada.', 'success');
            this.loadCategorias();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar la categoría', 'error')
        });
      }
    });
  }

  openCategoriaForm(categoria?: Categoria) {
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '400px',
      data: { categoria }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadCategorias();
    });
  }
}
