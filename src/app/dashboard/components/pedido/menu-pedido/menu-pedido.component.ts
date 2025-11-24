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
import { CombosService } from '../../../../core/services/combos.service';
import { OrdenService } from '../../../../core/services/orden.service';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { TamanoService } from '../../../../core/services/tamano.service';

// Componentes
import { CantidadPedidoComponent } from '../cantidad-pedido/cantidad-pedido.component';
import { InfoTamanoComponent } from '../info-tamano/info-tamano.component';

// Interface para items unificados del menú
interface MenuItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  esCombo: boolean;
  disponible: boolean;
  cantidadDisponible: number;
  // Para productos
  producto?: Producto;
  // Para combos
  combo?: Combo;
  // Para mostrar tamaños disponibles
  tamanosDisponibles?: string;
  // Para mantener compatibilidad con funciones existentes
  tipo: 'producto' | 'combo';
  datos: Producto | Combo;
  detallesCombo?: ComboDetalle[];
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
  
  // Datos
  productos: Producto[] = [];
  combos: Combo[] = [];
  categorias: CategoriaProducto[] = [];
  
  // Items unificados para mostrar
  menuItems: MenuItem[] = [];
  menuItemsFiltrados: MenuItem[] = [];
  paginatedItems: MenuItem[] = [];
  
  // Estados UI
  loading = true;
  categoriaSeleccionada: number | string | null = null;
  terminoBusqueda: string = '';
  baseUrl = 'http://localhost:3000';

  // Constantes - CORREGIDO: usar number para consistencia
  readonly CATEGORIA_COMBOS = -1; // Cambiado de 'combos' a -1

  // Paginación
  pageSize = 8;
  currentPage = 0;
  pageSizeOptions = [8, 12, 16, 24];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private combosService: CombosService,
    private ordenService: OrdenService,
    private tamanoService: TamanoService,
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

  cargarProductosYCombos() {
    // Cargar productos
    this.productoService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos.filter(p => 
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );

        // Cargar combos
        this.combosService.getCombos().subscribe({
          next: (combos) => {
            this.combos = combos.filter(c => c.Estado === 'A');
            this.procesarItemsMenu();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error cargando combos:', err);
            this.procesarItemsMenu();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.loading = false;
      }
    });
  }

  procesarItemsMenu() {
    this.menuItems = [];

    // Procesar productos
    this.productos.forEach(producto => {
      const precioMin = this.obtenerPrecioMinimo(producto);
      
      this.menuItems.push({
        id: producto.ID_Producto,
        nombre: producto.Nombre,
        descripcion: producto.Descripcion || '',
        precio: precioMin,
        categoria: this.obtenerNombreCategoria(producto.ID_Categoria_P),
        esCombo: false,
        disponible: producto.Cantidad_Disponible > 0,
        cantidadDisponible: producto.Cantidad_Disponible,
        producto: producto,
        tamanosDisponibles: this.getTamanosDisponibles(producto),
        tipo: 'producto',
        datos: producto
      });
    });

    // Procesar combos
    this.combos.forEach(combo => {
      const comboConDetalles = combo as any;
      
      this.menuItems.push({
        id: combo.ID_Combo,
        nombre: combo.Nombre,
        descripcion: combo.Descripcion || '',
        precio: combo.Precio,
        categoria: 'Combos',
        esCombo: true,
        disponible: true,
        cantidadDisponible: 100,
        combo: combo,
        tipo: 'combo',
        datos: combo,
        detallesCombo: comboConDetalles.detalles || []
      });
    });

    this.aplicarFiltros();
  }

  // 🔍 Filtros - CORREGIDO: Tipos consistentes
  isCategoriaSeleccionada(categoriaId: number | null): boolean {
    return this.categoriaSeleccionada === categoriaId;
  }

  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  buscarProducto(): void {
    this.currentPage = 0;
    if (this.paginator) this.paginator.firstPage();
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
    let resultado = [...this.menuItems];

    // 1. Filtro por Categoría - CORREGIDO: Comparación de tipos consistentes
    if (this.categoriaSeleccionada !== null) {
      if (this.categoriaSeleccionada === this.CATEGORIA_COMBOS) {
        resultado = resultado.filter(item => item.esCombo);
      } else {
        resultado = resultado.filter(item => 
          !item.esCombo && 
          item.producto?.ID_Categoria_P === this.categoriaSeleccionada
        );
      }
    }

    // 2. Filtro por Texto
    if (this.terminoBusqueda.trim()) {
      const term = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(item => 
        item.nombre.toLowerCase().includes(term) ||
        item.descripcion.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term)
      );
    }

    this.menuItemsFiltrados = resultado;
    this.actualizarPaginacion();
  }

  // 📄 Paginación
  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.menuItemsFiltrados.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

  // 🛒 Acción Principal: Abrir Modal
  abrirModalCantidad(item: MenuItem) {
    if (!item.disponible) return;

    const dialogRef = this.dialog.open(CantidadPedidoComponent, {
      width: '450px',
      maxWidth: '95vw',
      data: { 
        producto: item.producto,
        combo: item.combo,
        esCombo: item.esCombo,
        detallesCombo: item.detallesCombo
      },
      panelClass: 'custom-dialog-container',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe((result: PedidoDetalle | undefined) => {
      if (result) {
        this.ordenService.agregarProducto(result);
      }
    });
  }

  // 🖼️ Helpers
  obtenerNombreCategoria(id: number): string {
    const cat = this.categorias.find(c => c.ID_Categoria_P === id);
    return cat ? cat.Nombre : 'General';
  }

  obtenerCategoriaId(item: MenuItem): number | null {
    return item.producto?.ID_Categoria_P || null;
  }

  obtenerPrecioMinimo(producto: Producto): number {
    if (!producto.tamanos || producto.tamanos.length === 0) return 0;
    
    const precios = producto.tamanos
      .filter(t => t.Estado === 'A')
      .map(t => Number(t.Precio));
    
    return precios.length > 0 ? Math.min(...precios) : 0;
  }

  getTamanosDisponibles(producto: Producto): string {
    const count = producto.tamanos?.filter(t => t.Estado === 'A').length || 0;
    return count > 1 ? `${count} tamaños` : '1 tamaño';
  }

  tieneMultiplesTamanos(item: MenuItem): boolean {
    return !item.esCombo && (item.producto?.tamanos?.filter(t => t.Estado === 'A').length || 0) > 1;
  }

  // 🔹 FUNCIONES MANTENIDAS DEL COMPONENTE ORIGINAL
  getPrecioMinimoProducto(producto: Producto): number {
    return this.obtenerPrecioMinimo(producto);
  }

  getTamanosDisponiblesCount(item: MenuItem): number {
    if (item.tipo === 'producto') {
      const producto = item.datos as Producto;
      return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length : 0;
    }
    return 0;
  }

  getCategoria(item: MenuItem): string {
    return item.categoria;
  }

  getCantidadDisponible(item: MenuItem): number {
    return item.cantidadDisponible;
  }

  getInfoCombo(item: MenuItem): string {
    if (!item.detallesCombo) return '';
    return item.detallesCombo
      .map(d => `${d.Producto_Nombre} (${d.Tamano_Nombre}) x${d.Cantidad}`)
      .join('\n');
  }

  getProductosCombo(item: MenuItem): string {
    if (!item.detallesCombo || item.detallesCombo.length === 0) {
      return 'Ver descripción';
    }
    const items = item.detallesCombo.slice(0, 3).map(d => d.Producto_Nombre);
    if (item.detallesCombo.length > 3) {
      items.push(`+${item.detallesCombo.length - 3} más`);
    }
    return items.join(', ');
  }

  getCategoriaTexto(categoriaId: number | null): string {
    if (categoriaId === null) return 'Todos';
    if (categoriaId === this.CATEGORIA_COMBOS) return 'Combos';
    
    const categoria = this.categorias.find(c => c.ID_Categoria_P === categoriaId);
    return categoria ? categoria.Nombre : 'Sin categoría';
  }

  // Imágenes
  getProductoImage(item: MenuItem): string {
    if (item.esCombo && item.combo?.imagenes && item.combo.imagenes.length > 0) {
      const filename = item.combo.imagenes[0].split(/[/\\]/).pop();
      return `${this.baseUrl}/imagenesCata/${filename}`;
    } else if (!item.esCombo && item.producto?.imagenes && item.producto.imagenes.length > 0) {
      const filename = item.producto.imagenes[0].split(/[/\\]/).pop();
      return `${this.baseUrl}/imagenesCata/${filename}`;
    }
    return 'assets/imgs/logo-aita/logo.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/imgs/logo-aita/logo.png';
  }
}