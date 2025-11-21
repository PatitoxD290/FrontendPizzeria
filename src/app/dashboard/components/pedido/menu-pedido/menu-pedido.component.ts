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
  productos: Producto[] = [];
  combos: Combo[] = [];
  menuItems: MenuItem[] = [];
  menuItemsFiltrados: MenuItem[] = [];
  
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = '';
  
  readonly CATEGORIA_COMBOS = -1;
  
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

  // 🔹 CORREGIDO: Cargar productos y combos con detalles
  cargarProductosYCombos(): void {
    // Cargar productos
    this.productoService.getProductos().subscribe({
      next: (productosData) => {
        this.productos = productosData.filter(p => 
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );
        
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
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
  }

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

  filtrarPorCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.aplicarFiltros();
  }

  buscarProducto(): void {
    this.aplicarFiltros();
  }

  private aplicarFiltros(): void {
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

  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedItems = this.menuItemsFiltrados.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

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
    
    const precios = producto.tamanos
      .filter(t => t.Estado === 'A')
      .map(t => t.Precio);
    
    return Math.min(...precios);
  }

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
  }
}