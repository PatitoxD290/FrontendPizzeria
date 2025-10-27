import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { Output, EventEmitter } from '@angular/core';

import { CategoriaService } from '../../../../core/services/categoria.service';
import { CategoriaProducto, CategoriaInsumos } from '../../../../core/models/categoria.model';
import { CategoriaFormComponent } from '../categoria-form/categoria-form.component';

@Component({
  selector: 'app-categoria-list',
  standalone: true,
  imports: [
    CommonModule,
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

  categorias: (CategoriaProducto | CategoriaInsumos)[] = [];
  loading = false;
  tipoCategoria: 'producto' | 'insumo' = 'producto'; // 🔹 alterna entre ambos tipos

  categoriaActiva: number | null = 0;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  // 🔁 Cargar categorías según el tipo
  loadCategorias() {
    this.loading = true;
    if (this.tipoCategoria === 'producto') {
      this.categoriaService.getCategoriasProducto().subscribe({
        next: data => {
          this.categorias = data;
          this.loading = false;
        },
        error: err => {
          console.error('Error al cargar categorías de producto', err);
          this.loading = false;
        }
      });
    } else {
      this.categoriaService.getCategoriasInsumos().subscribe({
        next: data => {
          this.categorias = data;
          this.loading = false;
        },
        error: err => {
          console.error('Error al cargar categorías de insumos', err);
          this.loading = false;
        }
      });
    }
  }

  // 🧠 Alternar entre productos e insumos
  toggleTipo() {
    this.tipoCategoria = this.tipoCategoria === 'producto' ? 'insumo' : 'producto';
    this.loadCategorias();
  }

  // 🗑️ Eliminar categoría
  deleteCategoria(categoria: CategoriaProducto | CategoriaInsumos) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const id = (categoria as any).id_categoria_p || (categoria as any).id_categoria_i;

        const deleteObs =
          this.tipoCategoria === 'producto'
            ? this.categoriaService.deleteCategoriaProducto(id)
            : this.categoriaService.deleteCategoriaInsumo(id);

        deleteObs.subscribe({
          next: () => {
            Swal.fire('¡Eliminada!', 'La categoría ha sido eliminada.', 'success');
            this.loadCategorias();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar la categoría', 'error')
        });
      }
    });
  }

  // 📝 Abrir modal para crear/editar
  openCategoriaForm(categoria?: CategoriaProducto | CategoriaInsumos) {
    const dialogRef = this.dialog.open(CategoriaFormComponent, {
      width: '400px',
      data: { categoria, tipo: this.tipoCategoria }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadCategorias();
    });
  }
  
  @Output() categoriaSeleccionada = new EventEmitter<number>();

  // Método para emitir la categoría seleccionada
  seleccionarCategoria(categoria: CategoriaProducto | CategoriaInsumos) {
    const id = (categoria as any).id_categoria_p || (categoria as any).id_categoria_i;
    this.categoriaActiva = id;
    this.categoriaSeleccionada.emit(id);
  }

}
