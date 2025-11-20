import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../../core/services/producto.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { TamanoService } from '../../../../core/services/tamano.service';
import { MatDialog } from '@angular/material/dialog';
import { InfoTamanoComponent } from '../info-tamano/info-tamano.component';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { CantidadPedidoComponent } from '../cantidad-pedido/cantidad-pedido.component';
import { CombosService } from '../../../../core/services/combos.service';
import { Combo } from '../../../../core/models/combo.model';

// 🔹 INTERFAZ PARA UNIR PRODUCTOS Y COMBOS
interface MenuItem {
  tipo: 'producto' | 'combo';
  datos: Producto | Combo;
  precio: number;
  nombre: string;
  descripcion: string;
  esCombo?: boolean;
}

@Component({
  selector: 'app-menu-pedido',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatPaginatorModule
  ],
  templateUrl: './menu-pedido.component.html',
  styleUrls: ['./menu-pedido.component.css']
})
export class MenuPedidoComponent implements OnInit {
  // 🔹 CAMBIO: Ahora tenemos items del menú que pueden ser productos o combos
  productos: Producto[] = [];
  combos: Combo[] = [];
  menuItems: MenuItem[] = [];
  menuItemsFiltrados: MenuItem[] = [];
  
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = '';
  
  // 🔹 NUEVO: Constante para identificar la categoría especial "Combos"
  readonly CATEGORIA_COMBOS = -1;
  
  // 🔹 Variables de paginación
  pageSize = 6;
  currentPage = 0;
  paginatedItems: MenuItem[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService,
    private tamanoService: TamanoService,
    private combosService: CombosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargarProductosYCombos();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  // 🔹 NUEVO: Cargar productos y combos
  cargarProductosYCombos(): void {
    // Cargar productos
    this.productoService.getProductos().subscribe({
      next: (productosData) => {
        // Solo productos activos que tengan tamaños activos
        this.productos = productosData.filter(p => 
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );
        
        // Asignar nombres de categoría
        this.productos.forEach(producto => {
          producto.nombre_categoria = this.obtenerNombreCategoria(producto.ID_Categoria_P);
        });

        // Cargar combos
        this.combosService.getCombos().subscribe({
          next: (combosData) => {
            // Solo combos activos
            this.combos = combosData.filter(c => c.Estado === 'A');
            
            // Combinar productos y combos en un solo array
            this.combinarProductosYCombos();
          },
          error: (err) => console.error('Error cargando combos:', err)
        });
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

  // 🔹 NUEVO: Combinar productos y combos en un solo array para mostrar
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

    // Agregar combos
    this.combos.forEach(combo => {
      this.menuItems.push({
        tipo: 'combo',
        datos: combo,
        precio: combo.Precio,
        nombre: combo.Nombre,
        descripcion: combo.Descripcion,
        esCombo: true
      });
    });

    this.menuItemsFiltrados = [...this.menuItems];
    this.actualizarPaginacion();
  }

  obtenerNombreCategoria(id: number): string {
    const categoria = this.categorias.find(c => c.ID_Categoria_P === id);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.aplicarFiltros();
  }

  buscarProducto(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let filtrados = [...this.menuItems];
    
    // 🔹 FILTRAR POR CATEGORÍA (solo aplica a productos, no a combos)
    if (this.categoriaSeleccionada !== null) {
      // 🔹 NUEVO: Lógica para la categoría especial "Combos"
      if (this.categoriaSeleccionada === this.CATEGORIA_COMBOS) {
        // Mostrar solo combos
        filtrados = filtrados.filter(item => item.esCombo);
      } else {
        // Filtrar por categoría normal (solo productos)
        filtrados = filtrados.filter(item => {
          if (item.tipo === 'producto') {
            const producto = item.datos as Producto;
            return producto.ID_Categoria_P === this.categoriaSeleccionada;
          }
          // Los combos no tienen categoría, así que se muestran solo en "Todos" o "Combos"
          return false;
        });
      }
    }
    
    // 🔹 FILTRAR POR TÉRMINO DE BÚSQUEDA
    if (this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(item => {
        const nombreMatch = item.nombre.toLowerCase().includes(termino);
        const descripcionMatch = item.descripcion.toLowerCase().includes(termino);
        
        // 🔹 CORRECCIÓN: Usar paréntesis para separar las operaciones lógicas
        const categoriaMatch = item.tipo === 'producto' && 
          ((item.datos as Producto).nombre_categoria?.toLowerCase().includes(termino) ?? false);
        
        return nombreMatch || descripcionMatch || categoriaMatch;
      });
    }
    
    this.menuItemsFiltrados = filtrados;
    this.currentPage = 0;
    this.actualizarPaginacion();
  }

  // 🔹 Actualizar la lista visible según la página actual
  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.menuItemsFiltrados.slice(startIndex, endIndex);
  }

  // 🔹 Cambiar de página
  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

  // 🔹 ABRIR MODAL CANTIDAD PARA PRODUCTOS Y COMBOS
  abrirModalCantidad(item: MenuItem) {
    const dialogRef = this.dialog.open(CantidadPedidoComponent, {
      width: '400px',
      data: {
        producto: item.tipo === 'producto' ? item.datos : null,
        combo: item.tipo === 'combo' ? item.datos : null,
        esCombo: item.esCombo
      },
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: PedidoDetalle | undefined) => {
      if (result) {
        // Agregar al carrito con la cantidad seleccionada
        this.ordenService.agregarProducto(result);
      }
    });
  }

  // 🔹 Obtener el precio mínimo del producto
  getPrecioMinimoProducto(producto: Producto): number {
    if (!producto.tamanos || producto.tamanos.length === 0) return 0;
    
    const precios = producto.tamanos
      .filter(t => t.Estado === 'A')
      .map(t => t.Precio);
    
    return Math.min(...precios);
  }

  // 🔹 Verificar si tiene múltiples tamaños (solo para productos)
  tieneMultiplesTamanos(item: MenuItem): boolean {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length > 1 : false;
    }
    return false;
  }

  // 🔹 Obtener información de tamaños disponibles (solo para productos)
  getTamanosDisponibles(item: MenuItem): number {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length : 0;
    }
    return 0;
  }

  // 🔹 Obtener la categoría (solo para productos)
  getCategoria(item: MenuItem): string {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.nombre_categoria || 'Sin categoría';
    }
    return 'Combo';
  }

  // 🔹 Obtener cantidad disponible
  getCantidadDisponible(item: MenuItem): number {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.Cantidad_Disponible || 0;
    }
    // Para combos, podrías implementar lógica específica si es necesario
    return 0; // O un valor por defecto alto
  }

  // 🔹 NUEVO: Obtener el texto del botón de categoría
  getCategoriaTexto(categoriaId: number | null): string {
    if (categoriaId === null) return 'Todos';
    if (categoriaId === this.CATEGORIA_COMBOS) return 'Combos';
    
    const categoria = this.categorias.find(c => c.ID_Categoria_P === categoriaId);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  // 🔹 NUEVO: Verificar si la categoría está seleccionada
  isCategoriaSeleccionada(categoriaId: number | null): boolean {
    return this.categoriaSeleccionada === categoriaId;
  }
}