import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { RecetaService } from '../../../../core/services/receta.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Angular Material
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductoFormComponent } from '../producto-form/producto-form.component';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css'],
})
export class ProductoListComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  paginatedProductos: Producto[] = [];
  categorias: any[] = [];
  recetas: any[] = [];
  loading = false;

  private destroy$ = new Subject<void>();

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para obtener la ruta de la imagen
  getProductoImage(idProducto: number): string {
    const extensiones = ['png', 'jpg', 'jpeg', 'webp'];
    for (const ext of extensiones) {
      const url = `http://localhost:3000/imagenesCata/producto_${idProducto}_1.${ext}`;
      return url;
    }
    return 'assets/imgs/logo.png';
  }

  // Método para fallback si la imagen falla al cargar
  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo.png';
  }

  async loadProductos() {
    this.loading = true;
    try {
      const [categorias, recetas, productos] = await Promise.all([
        this.categoriaService.getCategoriasProducto().toPromise(),
        this.recetaService.getRecetas().toPromise(),
        this.productoService.getProductos().toPromise(),
      ]);

      this.categorias = categorias || [];
      this.recetas = recetas || [];

      this.productos = (productos || []).map((p) => ({
        ...p,
        nombre_categoria:
          this.categorias.find((c) => c.ID_Categoria_P === p.ID_Categoria_P)?.Nombre ||
          'Sin categoría',
        nombre_receta:
          this.recetas.find((r) => r.ID_Receta === p.ID_Receta)?.Nombre || 'Sin receta',
      }));

      this.setPage(0);
    } catch (err) {
      console.error('Error al cargar datos', err);
      this.showError('Error al cargar productos', 'No se pudieron cargar los datos.');
    } finally {
      this.loading = false;
    }
  }

  setPage(pageIndex: number) {
    const pageSize = this.paginator?.pageSize || 8;
    const startIndex = pageIndex * pageSize;
    this.paginatedProductos = this.productos.slice(startIndex, startIndex + pageSize);
  }

  onPageChange(event: any) {
    this.setPage(event.pageIndex);
  }

  // 🔹 CORRECCIÓN: Obtener tamaños activos del producto
  getTamanosActivos(producto: Producto): ProductoTamano[] {
    return producto.tamanos?.filter(t => t.Estado === 'A') || [];
  }

  // 🔹 CORRECCIÓN: Obtener el precio mínimo de los tamaños activos
  getPrecioMinimo(producto: Producto): number {
    const tamanosActivos = this.getTamanosActivos(producto);
    if (tamanosActivos.length === 0) return 0;
    return Math.min(...tamanosActivos.map(t => t.Precio));
  }

  // 🔹 CORRECCIÓN: Obtener el precio máximo de los tamaños activos
  getPrecioMaximo(producto: Producto): number {
    const tamanosActivos = this.getTamanosActivos(producto);
    if (tamanosActivos.length === 0) return 0;
    return Math.max(...tamanosActivos.map(t => t.Precio));
  }

  // 🔹 CORRECCIÓN: Mostrar rango de precios o precio único
  getDisplayPrecio(producto: Producto): string {
    const tamanosActivos = this.getTamanosActivos(producto);
    
    if (tamanosActivos.length === 0) {
      return 'Sin precios';
    }
    
    const precioMin = this.getPrecioMinimo(producto);
    const precioMax = this.getPrecioMaximo(producto);
    
    if (precioMin === precioMax) {
      return `S/ ${precioMin.toFixed(2)}`;
    } else {
      return `S/ ${precioMin.toFixed(2)} - S/ ${precioMax.toFixed(2)}`;
    }
  }

  // 🔹 CORRECCIÓN: Contar tamaños activos
  getCantidadTamanos(producto: Producto): number {
    return this.getTamanosActivos(producto).length;
  }

  deleteProducto(producto: Producto) {
    Swal.fire({
      title: '¿Eliminar producto?',
      html: `¿Estás seguro de eliminar <strong>"${producto.Nombre}"</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService
          .deleteProducto(producto.ID_Producto)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccess('Producto eliminado', 'El producto fue eliminado correctamente.');
              this.loadProductos();
            },
            error: () => this.showError('Error', 'No se pudo eliminar el producto.'),
          });
      }
    });
  }

 openProductoForm(producto?: Producto) {
  const dialogRef = this.dialog.open(ProductoFormComponent, {
    width: '1000px', // ← Aumenta el ancho para acomodar las dos columnas
    maxWidth: '95vw',
    height: 'auto',
    autoFocus: false,
    data: { producto, categorias: this.categorias, recetas: this.recetas },
  });

  dialogRef
    .afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe((result) => {
      if (result) this.loadProductos();
    });
}

  getEstadoColor(estado: string): string {
    return estado === 'A' ? 'success' : 'warn';
  }

  getEstadoText(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  private showSuccess(title: string, text: string) {
    Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false });
  }

  private showError(title: string, text: string) {
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#d33' });
  }
}