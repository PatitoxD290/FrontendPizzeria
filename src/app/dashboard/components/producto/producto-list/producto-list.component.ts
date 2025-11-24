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
    MatSelectModule
  ],
  templateUrl: './producto-list.component.html',
  styleUrls: ['./producto-list.component.css'],
})
export class ProductoListComponent implements OnInit, OnDestroy {
  
  // Datos
  productos: Producto[] = [];
  paginatedProductos: Producto[] = [];
  categorias: CategoriaProducto[] = [];
  
  // UI
  loading = false;
  error = '';
  baseUrl = 'http://localhost:3000'; // Base de tu backend

  // Paginación
  pageSize = 8;
  pageSizeOptions = [4, 8, 12, 16];
  currentPage = 0;
  totalItems = 0;

  // Filtros
  terminoBusqueda = '';
  filtroCategoria = 0;

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

  // 📥 Carga inicial de datos
  loadData() {
    this.loading = true;
    
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

        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }

  // 🔍 Filtros y Paginación
  aplicarFiltros() {
    let resultado = [...this.productos];

    // Filtro por texto
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.Nombre.toLowerCase().includes(term) || 
        (p.Descripcion && p.Descripcion.toLowerCase().includes(term))
      );
    }

    // Filtro por categoría
    if (this.filtroCategoria > 0) {
      resultado = resultado.filter(p => p.ID_Categoria_P === this.filtroCategoria);
    }

    this.totalItems = resultado.length;
    
    if (this.paginator && this.currentPage * this.pageSize >= this.totalItems) {
      this.currentPage = 0;
      this.paginator.firstPage();
    }

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = resultado.slice(startIndex, endIndex);
  }

  limpiarFiltros() {
    this.terminoBusqueda = '';
    this.filtroCategoria = 0;
    this.aplicarFiltros();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.aplicarFiltros();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 🖼️ Helpers Visuales (LÓGICA DE IMAGEN SOLICITADA)
  getProductoImage(producto: Producto): string {
    // Verificamos si el backend nos devolvió el nombre del archivo (ej: /uploads/producto_1_1.jpg)
    if (producto.imagenes && producto.imagenes.length > 0) {
      // Extraemos solo el nombre del archivo (producto_1_1.jpg) para ignorar la carpeta /uploads/ del backend
      const filename = producto.imagenes[0].split('/').pop();
      
      // Construimos la ruta correcta: localhost:3000/imagenesCata/producto_1_1.jpg
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/logo.png'; // Fallback si no hay imagen
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo.png';
  }

  getNombreCategoria(id: number, categorias: CategoriaProducto[]): string {
    return categorias.find(c => c.ID_Categoria_P === id)?.Nombre || 'Sin Categoría';
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-agotado';
    if (stock <= 10) return 'stock-bajo';
    return 'stock-ok';
  }

  // 🛠️ Acciones CRUD
  openProductoForm(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoFormComponent, {
      width: '1000px',
      maxWidth: '95vw',
      disableClose: true,
      data: { producto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  deleteProducto(producto: Producto) {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: `Se eliminará "${producto.Nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteProducto(producto.ID_Producto).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Producto eliminado correctamente', 'success');
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            if (err.status === 409) {
              Swal.fire('No se puede eliminar', 'El producto está en uso en combos o ventas.', 'error');
            } else {
              Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
            }
          }
        });
      }
    });
  }
}