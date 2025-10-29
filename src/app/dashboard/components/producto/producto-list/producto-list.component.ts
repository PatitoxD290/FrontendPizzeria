import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Producto } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { RecetaService } from '../../../../core/services/receta.service';
import Swal from 'sweetalert2';

// Angular Material
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css']
})
export class ProductoListComponent implements OnInit {

  productos: Producto[] = [];
  categorias: any[] = [];
  recetas: any[] = [];
  paginatedProductos: Producto[] = [];
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  async loadProductos() {
    this.loading = true;
    try {
      const [categorias, recetas, productos] = await Promise.all([
        this.categoriaService.getCategoriasProducto().toPromise(),
        this.recetaService.getRecetas().toPromise(),
        this.productoService.getProductos().toPromise()
      ]);

      this.categorias = categorias || [];
      this.recetas = recetas || [];

      this.productos = (productos || []).map(p => ({
        ...p,
        ID_Categoria_P: this.categorias.find(c => c.ID_Categoria_P === p.ID_Categoria_P)?.Nombre || 'Sin categoría',
        ID_Receta: this.recetas.find(r => r.ID_Receta === p.ID_Receta)?.Nombre || 'Sin receta'
      }));

      this.setPage(0);
    } catch (err) {
      console.error('Error al cargar datos', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: 'No se pudieron cargar los datos.',
        confirmButtonColor: '#d33'
      });
    } finally {
      this.loading = false;
    }
  }

  setPage(pageIndex: number) {
    const pageSize = this.paginator?.pageSize || 5;
    const startIndex = pageIndex * pageSize;
    this.paginatedProductos = this.productos.slice(startIndex, startIndex + pageSize);
  }

  onPageChange(event: any) {
    this.setPage(event.pageIndex);
  }

  deleteProducto(id: number) {
    Swal.fire({
      title: '¿Eliminar este producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then(result => {
      if (result.isConfirmed) {
        this.productoService.deleteProducto(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Producto eliminado',
              text: 'El producto fue eliminado correctamente.',
              timer: 1500,
              showConfirmButton: false
            });
            this.loadProductos();
          },
          error: err => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el producto.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  openProductoForm(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '500px',
      data: { producto }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadProductos();
    });
  }

  filterByCategoria(categoriaId: number) {
    if (!categoriaId) {
      this.paginatedProductos = this.productos;
      return;
    }

    this.paginatedProductos = this.productos.filter(p => p.ID_Categoria_P === categoriaId);

    if (this.paginatedProductos.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin productos',
        text: 'No hay productos en esta categoría.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  }
}
  