import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

// Core
import { Producto } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';

// Componentes
import { ProductoFormComponent } from '../producto-form/producto-form.component';
import Swal from 'sweetalert2';

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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css'],
})
export class ProductoListComponent implements OnInit, OnDestroy {
cambiarEstadoProducto(_t69: Producto,$event: PointerEvent) {
throw new Error('Method not implemented.');
}
  
  // Datos
  productos: Producto[] = [];
  paginatedProductos: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  
  // UI
  loading = false;
  error = '';
  baseUrl = 'https://backend-pizza-git-175143409336.us-central1.run.app';

  // Paginación
  pageSize = 8;
  pageSizeOptions = [4, 8, 12, 16];
  currentPage = 0;
  totalItems = 0;

  // Filtros - IMPORTANTE: Cambiar a string inicialmente
  terminoBusqueda = '';
  filtroCategoria: any = 0; // Cambiado a 'any' para manejar string/number

  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================
  // 📥 CARGA DE DATOS
  // ============================================================

  loadData() {
    this.loading = true;
    this.error = '';
    
    forkJoin({
      productos: this.productoService.getProductos(),
      categorias: this.categoriaService.getCategoriasProducto()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.categorias = data.categorias;
        
        // Enriquecer productos con nombre de categoría
        this.productos = data.productos.map(p => ({
          ...p,
          nombre_categoria: this.getNombreCategoria(p.ID_Categoria_P, data.categorias)
        }));

        this.totalItems = this.productos.length;
        this.aplicarFiltros();
        this.loading = false;
        
        console.log('Datos cargados:', {
          productos: this.productos.length,
          categorias: this.categorias.length,
          primeraCategoria: this.categorias[0]
        });
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
        this.showError('Error', 'No se pudieron cargar los productos.');
      }
    });
  }

  // ============================================================
  // 🔍 FILTROS Y PAGINACIÓN - CORREGIDOS
  // ============================================================

  // NUEVO MÉTODO para manejar cambio de categoría
  onCategoriaChange(event: any) {
    console.log('Evento change categoría:', event);
    console.log('Valor seleccionado:', event.target.value);
    console.log('Tipo del valor:', typeof event.target.value);
    
    // Convertir a número
    this.filtroCategoria = Number(event.target.value);
    console.log('filtroCategoria después de convertir:', this.filtroCategoria);
    
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    console.log('=== APLICANDO FILTROS ===');
    console.log('terminoBusqueda:', this.terminoBusqueda);
    console.log('filtroCategoria:', this.filtroCategoria, 'tipo:', typeof this.filtroCategoria);
    console.log('Productos totales:', this.productos.length);

    let resultado = [...this.productos];

    // Filtro por texto
    if (this.terminoBusqueda && this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase().trim();
      resultado = resultado.filter(p => 
        p.Nombre.toLowerCase().includes(term) || 
        (p.Descripcion && p.Descripcion.toLowerCase().includes(term)) ||
        (p.nombre_categoria && p.nombre_categoria.toLowerCase().includes(term))
      );
    }

    // Filtro por categoría - CORREGIDO
    if (this.filtroCategoria && this.filtroCategoria !== 0) {
      const categoriaId = Number(this.filtroCategoria);
      console.log('Filtrando por categoría ID:', categoriaId);
      console.log('Productos antes de filtrar por categoría:', resultado.length);
      
      resultado = resultado.filter(p => {
        const coincide = p.ID_Categoria_P === categoriaId;
        console.log(`Producto ${p.Nombre} - Categoría: ${p.ID_Categoria_P}, Coincide: ${coincide}`);
        return coincide;
      });
      
      console.log('Productos después de filtrar por categoría:', resultado.length);
    }

    this.totalItems = resultado.length;
    console.log('Total items después de filtros:', this.totalItems);
    
    // Resetear a primera página si es necesario
    if (this.currentPage * this.pageSize >= this.totalItems && this.totalItems > 0) {
      this.currentPage = 0;
      if (this.paginator) {
        this.paginator.firstPage();
      }
    }

    // Aplicar paginación
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = resultado.slice(startIndex, endIndex);

    console.log('Resultado final:', {
      totalFiltrados: this.totalItems,
      mostrando: this.paginatedProductos.length,
      paginaActual: this.currentPage
    });
    console.log('=== FIN FILTROS ===');
  }

  limpiarFiltros() {
    console.log('Limpiando filtros...');
    this.terminoBusqueda = '';
    this.filtroCategoria = 0;
    this.currentPage = 0;
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
    
    this.aplicarFiltros();
  }

  onPageChange(event: PageEvent) {
    console.log('Cambio de página:', event);
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.aplicarFiltros();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // 🖼️ HELPERS VISUALES
  // ============================================================

  getProductoImage(producto: Producto): string {
    if (producto.imagenes && producto.imagenes.length > 0 && producto.imagenes[0]) {
      const filename = producto.imagenes[0].split('/').pop();
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/logo-aita/logo.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo-aita/logo.png';
  }

  getNombreCategoria(id: number, categorias: CategoriaProducto[]): string {
    const categoria = categorias.find(c => c.ID_Categoria_P === id);
    return categoria?.Nombre || 'Sin Categoría';
  }

  // 🔹 Métodos para estado del producto
  getEstadoColor(estado: string): string {
    return estado === 'A' ? 'success' : 'warn';
  }

  getEstadoText(estado: string): string {
    return estado === 'A' ? 'Activo' : 'Inactivo';
  }

  // 🔹 Métodos para stock
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

  // 🔹 Obtener información de precios y tamaños
  getPrecioTamanoInfo(producto: Producto): { texto: string, tooltip: string } {
    const tamanos = producto.tamanos || [];
    const cantidadTamanos = tamanos.length;
    
    if (cantidadTamanos === 0) {
      return {
        texto: 'Sin precios',
        tooltip: 'No hay tamaños configurados para este producto'
      };
    }

    const precios = tamanos.map(t => t.Precio || 0);
    const precioMin = Math.min(...precios);
    const precioMax = Math.max(...precios);
    
    let precioTexto = '';
    if (precioMin === precioMax) {
      precioTexto = `S/ ${precioMin.toFixed(2)}`;
    } else {
      precioTexto = `S/ ${precioMin.toFixed(2)} - S/ ${precioMax.toFixed(2)}`;
    }

    const tamanosTexto = `${cantidadTamanos} tamaño${cantidadTamanos !== 1 ? 's' : ''}`;
    const texto = `${precioTexto} • ${tamanosTexto}`;
    const tooltip = this.getTamanosConPrecios(producto);
    
    return { texto, tooltip };
  }

  // 🔹 Obtener lista de tamaños con precios para tooltip
  getTamanosConPrecios(producto: Producto): string {
    const tamanos = producto.tamanos || [];
    if (tamanos.length === 0) return 'Sin tamaños disponibles';
    
    return tamanos
      .map(t => `${t.nombre_tamano || 'Tamaño'}: S/ ${(t.Precio || 0).toFixed(2)}`)
      .join('\n');
  }

  // ============================================================
  // 🛠️ ACCIONES CRUD
  // ============================================================

  openProductoForm(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      height: 'auto',
      autoFocus: false,
      disableClose: true,
      data: { 
        producto,
        categorias: this.categorias
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadData();
          this.resetToFirstPage();
        }
      });
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
        this.productoService.deleteProducto(producto.ID_Producto)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showSuccess('Producto eliminado', 'El producto fue eliminado correctamente.');
              this.loadData();
              this.resetToFirstPage();
            },
            error: (err) => {
              console.error(err);
              if (err.status === 409) {
                this.showError('No se puede eliminar', 'El producto está en uso en combos o ventas.');
              } else {
                this.showError('Error', 'No se pudo eliminar el producto.');
              }
            }
          });
      }
    });
  }

  // ============================================================
  // 🔧 MÉTODOS AUXILIARES
  // ============================================================

  private resetToFirstPage() {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.aplicarFiltros();
  }

  private showSuccess(title: string, text: string) {
    Swal.fire({ 
      icon: 'success', 
      title, 
      text, 
      timer: 2000, 
      showConfirmButton: false 
    });
  }

  private showError(title: string, text: string) {
    Swal.fire({ 
      icon: 'error', 
      title, 
      text, 
      confirmButtonColor: '#d33' 
    });
  }

  // ============================================================
  // 🎯 MÉTODO PARA VERIFICAR DATOS
  // ============================================================

  verificarDatos() {
    console.log('=== VERIFICACIÓN DE DATOS ===');
    console.log('Categorías disponibles:', this.categorias);
    console.log('Productos con sus categorías:');
    this.productos.forEach(p => {
      console.log(`- ${p.Nombre}: ID_Categoria_P=${p.ID_Categoria_P}, nombre_categoria=${p.nombre_categoria}`);
    });
    console.log('=============================');
  }
}