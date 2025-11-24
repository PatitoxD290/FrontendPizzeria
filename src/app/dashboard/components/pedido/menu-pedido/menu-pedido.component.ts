import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios y Modelos
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { Producto } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

// Componentes
import { CantidadPedidoComponent } from '../cantidad-pedido/cantidad-pedido.component';

@Component({
  selector: 'app-menu-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './menu-pedido.component.html',
  styleUrls: ['./menu-pedido.component.css']
})
export class MenuPedidoComponent implements OnInit {
  
  // Datos
  productos: Producto[] = []; // Todos los productos cargados
  productosFiltrados: Producto[] = []; // Productos después de aplicar filtros
  paginatedProductos: Producto[] = []; // Productos en la página actual
  categorias: CategoriaProducto[] = [];
  
  // Estados UI
  loading = true;
  categoriaSeleccionada: number | null = null; // null = Todas
  terminoBusqueda: string = '';
  baseUrl = 'http://localhost:3000'; // Ajustar según tu backend

  // Paginación
  pageSize = 8;
  currentPage = 0;
  pageSizeOptions = [8, 12, 16, 24];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  // 📥 Carga Inicial
  cargarDatosIniciales() {
    this.loading = true;
    
    // Cargar Categorías
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.loading = false;
      }
    });
  }

  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Filtrar solo productos activos y con tamaños activos
        this.productos = data.filter(p => 
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );

        // Enriquecer con nombre de categoría (opcional, ya que filtramos por ID)
        this.productos.forEach(p => {
          p.nombre_categoria = this.obtenerNombreCategoria(p.ID_Categoria_P);
        });

        // Inicializar vista
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loading = false;
      }
    });
  }

  // 🔍 Filtros
  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.currentPage = 0; // Resetear página al cambiar filtro
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  buscarProducto(): void {
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultado = [...this.productos];

    // 1. Filtro por Categoría
    if (this.categoriaSeleccionada !== null) {
      resultado = resultado.filter(p => p.ID_Categoria_P === this.categoriaSeleccionada);
    }

    // 2. Filtro por Texto
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(p => 
        p.Nombre.toLowerCase().includes(term) ||
        p.nombre_categoria?.toLowerCase().includes(term) ||
        p.Descripcion?.toLowerCase().includes(term)
      );
    }

    this.productosFiltrados = resultado;
    this.actualizarPaginacion();
  }

  // 📄 Paginación
  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = this.productosFiltrados.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
    
    // Scroll suave al inicio del grid
    const grid = document.getElementById('menu-grid');
    if(grid) grid.scrollIntoView({ behavior: 'smooth' });
  }

  // 🛒 Acción Principal: Abrir Modal
  seleccionarProducto(producto: Producto) {
    // Si no tiene stock, no hacer nada (o mostrar alerta)
    if (producto.Cantidad_Disponible <= 0) return;

    const dialogRef = this.dialog.open(CantidadPedidoComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: { producto }, // Pasamos el producto completo
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result: PedidoDetalle | undefined) => {
      if (result) {
        // El modal devuelve un objeto listo para el carrito
        this.ordenService.agregarProducto(result);
      }
    });
  }

  // 🖼️ Helpers Visuales
  obtenerNombreCategoria(id: number): string {
    const cat = this.categorias.find(c => c.ID_Categoria_P === id);
    return cat ? cat.Nombre : 'General';
  }

  // ✅ CORREGIDO: Lógica de imagen con URL correcta
  getProductoImage(producto: Producto): string {
    if (producto.imagenes && producto.imagenes.length > 0) {
      // Extraer solo el nombre del archivo (ej: producto_1_1.jpg) eliminando rutas relativas
      const filename = producto.imagenes[0].split(/[/\\]/).pop();
      // Construir la URL absoluta a la carpeta pública
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/no-image.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/no-image.png';
  }

  // Precios
  getPrecioDisplay(producto: Producto): string {
    if (!producto.tamanos || producto.tamanos.length === 0) return 'S/ 0.00';
    
    const precios = producto.tamanos
      .filter(t => t.Estado === 'A')
      .map(t => Number(t.Precio));
    
    if (precios.length === 0) return 'S/ 0.00';

    const min = Math.min(...precios);
    const max = Math.max(...precios);

    if (precios.length > 1 && min !== max) {
      return `Desde S/ ${min.toFixed(2)}`;
    }
    return `S/ ${min.toFixed(2)}`;
  }

  // Información de Tamaños
  getInfoTamanos(producto: Producto): string {
    const count = producto.tamanos?.filter(t => t.Estado === 'A').length || 0;
    if (count > 1) return `${count} opciones`;
    if (count === 1) return 'Tamaño único';
    return 'Sin opciones';
  }
}