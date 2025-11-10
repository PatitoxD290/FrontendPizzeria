import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { RecetaService } from '../../../../core/services/receta.service';
import { TamanoService } from '../../../../core/services/tamano.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Angular Material
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
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
    MatTableModule,
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css'],
})
export class ProductoListComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  paginatedProductos: Producto[] = [];
  categorias: any[] = [];
  recetas: any[] = [];
  tamanos: any[] = [];
  loading = false;

  // Configuración de paginación
  pageSize = 8;
  pageSizeOptions = [4, 8, 12, 16];
  currentPage = 0;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private recetaService: RecetaService,
    private tamanoService: TamanoService,
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
      const [categorias, recetas, tamanos, productos] = await Promise.all([
        this.categoriaService.getCategoriasProducto().toPromise(),
        this.recetaService.getRecetas().toPromise(),
        this.tamanoService.getTamanos().toPromise(),
        this.productoService.getProductos().toPromise(),
      ]);

      this.categorias = categorias || [];
      this.recetas = recetas || [];
      this.tamanos = tamanos || [];

      this.productos = (productos || []).map((p) => ({
        ...p,
        nombre_categoria:
          this.categorias.find((c) => c.ID_Categoria_P === p.ID_Categoria_P)?.Nombre ||
          'Sin categoría',
        nombre_receta:
          this.recetas.find((r) => r.ID_Receta === p.ID_Receta)?.Nombre || 'Sin receta',
        tamanos: p.tamanos?.map(tamano => ({
          ...tamano,
          nombre_tamano: this.getNombreTamano(tamano.ID_Tamano)
        })) || []
      }));

      this.totalItems = this.productos.length;
      this.updatePaginatedData();

    } catch (err) {
      console.error('Error al cargar datos', err);
      this.showError('Error al cargar productos', 'No se pudieron cargar los datos.');
    } finally {
      this.loading = false;
    }
  }

  // Actualizar datos paginados
  updatePaginatedData() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = this.productos.slice(startIndex, endIndex);
  }

  // Manejar cambio de página
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
    
    // Scroll suave hacia arriba al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 🔹 Obtener el nombre del tamaño por ID
  getNombreTamano(idTamano: number): string {
    const tamano = this.tamanos.find(t => t.ID_Tamano === idTamano);
    return tamano?.Tamano || `Tamaño ${idTamano}`;
  }

  // 🔹 Obtener tamaños activos del producto
  getTamanosActivos(producto: Producto): ProductoTamano[] {
    return producto.tamanos?.filter(t => t.Estado === 'A') || [];
  }

  // 🔹 Obtener cantidad de tamaños activos
  getCantidadTamanos(producto: Producto): number {
    return this.getTamanosActivos(producto).length;
  }

  // 🔹 Obtener el precio mínimo de los tamaños activos
  getPrecioMinimo(producto: Producto): number {
    const tamanosActivos = this.getTamanosActivos(producto);
    if (tamanosActivos.length === 0) return 0;
    return Math.min(...tamanosActivos.map(t => t.Precio));
  }

  // 🔹 Obtener el precio máximo de los tamaños activos
  getPrecioMaximo(producto: Producto): number {
    const tamanosActivos = this.getTamanosActivos(producto);
    if (tamanosActivos.length === 0) return 0;
    return Math.max(...tamanosActivos.map(t => t.Precio));
  }

  // 🔹 Mostrar rango de precios o precio único
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

  // 🔹 Obtener información combinada de precios y tamaños
  getPrecioTamanoInfo(producto: Producto): { texto: string, tooltip: string } {
    const tamanosActivos = this.getTamanosActivos(producto);
    const cantidadTamanos = this.getCantidadTamanos(producto);
    
    if (tamanosActivos.length === 0) {
      return {
        texto: 'Sin tamaños',
        tooltip: 'No hay tamaños disponibles para este producto'
      };
    }

    const precioTexto = this.getDisplayPrecio(producto);
    const tamanosTexto = `${cantidadTamanos} tamaño${cantidadTamanos !== 1 ? 's' : ''}`;
    
    const texto = `${precioTexto} • ${tamanosTexto}`;
    const tooltip = this.getTamanosConPrecios(producto);
    
    return { texto, tooltip };
  }

  // 🔹 Obtener lista de tamaños con precios para tooltip
  getTamanosConPrecios(producto: Producto): string {
    const tamanosActivos = this.getTamanosActivos(producto);
    if (tamanosActivos.length === 0) return 'Sin tamaños disponibles';
    
    return tamanosActivos
      .map(t => `${t.nombre_tamano || this.getNombreTamano(t.ID_Tamano)}: S/ ${t.Precio.toFixed(2)}`)
      .join('\n');
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
              // Resetear a la primera página después de eliminar
              this.resetToFirstPage();
            },
            error: () => this.showError('Error', 'No se pudo eliminar el producto.'),
          });
      }
    });
  }

  // Resetear a la primera página
  resetToFirstPage() {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updatePaginatedData();
  }

  openProductoForm(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      autoFocus: false,
      data: { 
        producto, 
        categorias: this.categorias, 
        recetas: this.recetas,
        tamanos: this.tamanos
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loadProductos();
          // Resetear a la primera página después de agregar/editar
          this.resetToFirstPage();
        }
      });
  }

  getEstadoColor(estado: string): string {
    return estado === 'A' ? 'success' : 'warn';
  }

  getEstadoText(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  getStockColor(cantidad: number): string {
    if (cantidad === 0) return 'warn';
    if (cantidad <= 10) return 'accent';
    return 'primary';
  }

  getStockText(cantidad: number): string {
    if (cantidad === 0) return 'Agotado';
    if (cantidad <= 10) return 'Bajo stock';
    return 'En stock';
  }

  // 🔹 Método para truncar texto
  truncateText(text: string, maxLength: number): string {
    if (!text) return 'Sin descripción';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private showSuccess(title: string, text: string) {
    Swal.fire({ icon: 'success', title, text, timer: 2000, showConfirmButton: false });
  }

  private showError(title: string, text: string) {
    Swal.fire({ icon: 'error', title, text, confirmButtonColor: '#d33' });
  }
}