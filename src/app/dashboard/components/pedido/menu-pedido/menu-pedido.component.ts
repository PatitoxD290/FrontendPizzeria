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
import { CombosService } from '../../../../core/services/combos.service';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model'; // Importar ComboDetalle

// 🔹 INTERFAZ PARA UNIR PRODUCTOS Y COMBOS
interface MenuItem {
  tipo: 'producto' | 'combo';
  datos: Producto | Combo;
  precio: number;
  nombre: string;
  descripcion: string;
  esCombo?: boolean;
  detallesCombo?: ComboDetalle[]; // 🔹 NUEVO: Agregar detalles del combo
}

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
<<<<<<< HEAD
=======
  productos: Producto[] = [];
  combos: Combo[] = [];
  menuItems: MenuItem[] = [];
  menuItemsFiltrados: MenuItem[] = [];
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  
  // Datos
  productos: Producto[] = []; // Todos los productos cargados
  productosFiltrados: Producto[] = []; // Productos después de aplicar filtros
  paginatedProductos: Producto[] = []; // Productos en la página actual
  categorias: CategoriaProducto[] = [];
  
<<<<<<< HEAD
  // Estados UI
  loading = true;
  categoriaSeleccionada: number | null = null; // null = Todas
  terminoBusqueda: string = '';
  baseUrl = 'http://localhost:3000'; // Ajustar según tu backend

  // Paginación
  pageSize = 8;
  currentPage = 0;
  pageSizeOptions = [8, 12, 16, 24];
=======
  readonly CATEGORIA_COMBOS = -1;
  
  pageSize = 6;
  currentPage = 0;
  paginatedItems: MenuItem[] = [];
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService,
<<<<<<< HEAD
=======
    private tamanoService: TamanoService,
    private combosService: CombosService,
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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
        this.cargarProductosYCombos();
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.loading = false;
      }
    });
  }

<<<<<<< HEAD
  cargarProductos() {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Filtrar solo productos activos y con tamaños activos
        this.productos = data.filter(p => 
=======
  // 🔹 CORREGIDO: Cargar productos y combos con detalles
  cargarProductosYCombos(): void {
    // Cargar productos
    this.productoService.getProductos().subscribe({
      next: (productosData) => {
        this.productos = productosData.filter(p => 
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );
<<<<<<< HEAD

        // Enriquecer con nombre de categoría (opcional, ya que filtramos por ID)
        this.productos.forEach(p => {
          p.nombre_categoria = this.obtenerNombreCategoria(p.ID_Categoria_P);
        });

        // Inicializar vista
        this.aplicarFiltros();
        this.loading = false;
=======
        
        this.productos.forEach(producto => {
          producto.nombre_categoria = this.obtenerNombreCategoria(producto.ID_Categoria_P);
        });

        // Cargar combos con detalles
        this.combosService.getCombos().subscribe({
          next: (combosData) => {
            // Solo combos activos
            this.combos = combosData.filter(c => c.Estado === 'A');
            
            // Combinar productos y combos en un solo array
            this.combinarProductosYCombos();
          },
          error: (err) => console.error('Error cargando combos:', err)
        });
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loading = false;
      }
    });
  }

<<<<<<< HEAD
  // 🔍 Filtros
=======
  // 🔹 CORREGIDO: Combinar productos y combos con detalles
  combinarProductosYCombos(): void {
    this.menuItems = [];

    // Agregar productos
    this.productos.forEach(producto => {
      const precioMinimo = this.getPrecioMinimoProducto(producto);
      this.menuItems.push({
        tipo: 'producto',
        datos: producto,
        precio: precioMinimo,
        nombre: producto.Nombre,
        descripcion: producto.Descripcion,
        esCombo: false
      });
    });

    // 🔹 CORREGIDO: Agregar combos con detalles
    this.combos.forEach(combo => {
      // Usar el combo extendido que incluye detalles
      const comboConDetalles = combo as any;
      this.menuItems.push({
        tipo: 'combo',
        datos: combo,
        precio: combo.Precio,
        nombre: combo.Nombre,
        descripcion: combo.Descripcion,
        esCombo: true,
        detallesCombo: comboConDetalles.detalles || [] // 🔹 NUEVO: Incluir detalles
      });
    });

    this.menuItemsFiltrados = [...this.menuItems];
    this.actualizarPaginacion();
  }

  obtenerNombreCategoria(id: number): string {
    const categoria = this.categorias.find(c => c.ID_Categoria_P === id);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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
<<<<<<< HEAD
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
=======
    let filtrados = [...this.menuItems];
    
    if (this.categoriaSeleccionada !== null) {
      if (this.categoriaSeleccionada === this.CATEGORIA_COMBOS) {
        filtrados = filtrados.filter(item => item.esCombo);
      } else {
        filtrados = filtrados.filter(item => {
          if (item.tipo === 'producto') {
            const producto = item.datos as Producto;
            return producto.ID_Categoria_P === this.categoriaSeleccionada;
          }
          return false;
        });
      }
    }
    
    if (this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(item => {
        const nombreMatch = item.nombre.toLowerCase().includes(termino);
        const descripcionMatch = item.descripcion.toLowerCase().includes(termino);
        
        const categoriaMatch = item.tipo === 'producto' && 
          ((item.datos as Producto).nombre_categoria?.toLowerCase().includes(termino) ?? false);
        
        return nombreMatch || descripcionMatch || categoriaMatch;
      });
    }
    
    this.menuItemsFiltrados = filtrados;
    this.currentPage = 0;
    this.actualizarPaginacion();
  }

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.menuItemsFiltrados.slice(startIndex, endIndex);
  }

<<<<<<< HEAD
  onPageChange(event: PageEvent): void {
=======
  onPageChange(event: any): void {
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
    
    // Scroll suave al inicio del grid
    const grid = document.getElementById('menu-grid');
    if(grid) grid.scrollIntoView({ behavior: 'smooth' });
  }

<<<<<<< HEAD
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
    return 'assets/imgs/error.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/error.png';
  }

  // Precios
  getPrecioDisplay(producto: Producto): string {
    if (!producto.tamanos || producto.tamanos.length === 0) return 'S/ 0.00';
=======
abrirModalCantidad(item: MenuItem) {
  const dialogRef = this.dialog.open(CantidadPedidoComponent, {
    width: '400px',
    data: {
      producto: item.tipo === 'producto' ? item.datos : null,
      combo: item.tipo === 'combo' ? item.datos : null,
      esCombo: item.esCombo,
      detallesCombo: item.detallesCombo // 🔹 NUEVO: Pasar detalles del combo
    },
    disableClose: false,
    autoFocus: false
  });

  dialogRef.afterClosed().subscribe((result: PedidoDetalle | undefined) => {
    if (result) {
      this.ordenService.agregarProducto(result);
    }
  });
}

  getPrecioMinimoProducto(producto: Producto): number {
    if (!producto.tamanos || producto.tamanos.length === 0) return 0;
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    
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

<<<<<<< HEAD
  // Información de Tamaños
  getInfoTamanos(producto: Producto): string {
    const count = producto.tamanos?.filter(t => t.Estado === 'A').length || 0;
    if (count > 1) return `${count} opciones`;
    if (count === 1) return 'Tamaño único';
    return 'Sin opciones';
=======
  tieneMultiplesTamanos(item: MenuItem): boolean {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length > 1 : false;
    }
    return false;
  }

  getTamanosDisponibles(item: MenuItem): number {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length : 0;
    }
    return 0;
  }

  getCategoria(item: MenuItem): string {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.nombre_categoria || 'Sin categoría';
    }
    return 'Combo';
  }

  getCantidadDisponible(item: MenuItem): number {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.Cantidad_Disponible || 0;
    }
    return 0;
  }

  // 🔹 NUEVO: Obtener los productos incluidos en el combo
  getProductosCombo(item: MenuItem): string {
    if (item.tipo === 'combo' && item.detallesCombo) {
      const productos = item.detallesCombo.map(detalle => 
        `${detalle.Producto_Nombre} (${detalle.Tamano_Nombre}) x${detalle.Cantidad}`
      );
      return productos.join(', ');
    }
    return '';
  }

  // 🔹 NUEVO: Obtener información resumida del combo para tooltip
  getInfoCombo(item: MenuItem): string {
    if (item.tipo === 'combo' && item.detallesCombo) {
      const productos = item.detallesCombo.map(detalle => 
        `${detalle.Cantidad}x ${detalle.Producto_Nombre} - ${detalle.Tamano_Nombre}`
      );
      return `Incluye:\n${productos.join('\n')}`;
    }
    return '';
  }

  getCategoriaTexto(categoriaId: number | null): string {
    if (categoriaId === null) return 'Todos';
    if (categoriaId === this.CATEGORIA_COMBOS) return 'Combos';
    
    const categoria = this.categorias.find(c => c.ID_Categoria_P === categoriaId);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  isCategoriaSeleccionada(categoriaId: number | null): boolean {
    return this.categoriaSeleccionada === categoriaId;
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }
}