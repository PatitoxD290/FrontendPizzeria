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
  // 🔹 CAMBIO: Ahora solo productos generales
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = '';
  
  // 🔹 Variables de paginación
  pageSize = 6;
  currentPage = 0;
  paginatedProductos: Producto[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private ordenService: OrdenService,
    private tamanoService: TamanoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categoriaService.getCategoriasProducto().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargarProductos();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  // 🔹 CAMBIO: Cargar solo productos generales
  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Solo productos activos que tengan tamaños activos
        this.productos = data.filter(p => 
          p.Estado === 'A' && 
          p.tamanos && 
          p.tamanos.some(t => t.Estado === 'A')
        );
        
        // Asignar nombres de categoría
        this.productos.forEach(producto => {
          producto.nombre_categoria = this.obtenerNombreCategoria(producto.ID_Categoria_P);
        });

        this.productosFiltrados = [...this.productos];
        this.actualizarPaginacion();
      },
      error: (err) => console.error('Error cargando productos:', err)
    });
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
    let filtrados = [...this.productos];
    
    if (this.categoriaSeleccionada !== null) {
      filtrados = filtrados.filter(p => p.ID_Categoria_P === this.categoriaSeleccionada);
    }
    
    if (this.terminoBusqueda.trim() !== '') {
      const termino = this.terminoBusqueda.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.Nombre.toLowerCase().includes(termino) || 
        (p.nombre_categoria?.toLowerCase().includes(termino) ?? false) ||
        p.Descripcion.toLowerCase().includes(termino)
      );
    }
    
    this.productosFiltrados = filtrados;
    this.currentPage = 0;
    this.actualizarPaginacion();
  }

  // 🔹 Actualizar la lista visible según la página actual
  actualizarPaginacion(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedProductos = this.productosFiltrados.slice(startIndex, endIndex);
  }

  // 🔹 Cambiar de página
  onPageChange(event: any): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.actualizarPaginacion();
  }

  // 🔹 CAMBIO: Abrir modal pasando el PRODUCTO (no productoTamano)
  abrirModalCantidad(producto: Producto) {
    const dialogRef = this.dialog.open(CantidadPedidoComponent, {
      width: '400px',
      data: {
        producto: producto // 🔹 Pasamos el producto completo con sus tamaños
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

  // 🔹 NUEVO: Obtener el precio mínimo del producto para mostrar
  getPrecioMinimo(producto: Producto): number {
    if (!producto.tamanos || producto.tamanos.length === 0) return 0;
    
    const precios = producto.tamanos
      .filter(t => t.Estado === 'A')
      .map(t => t.Precio);
    
    return Math.min(...precios);
  }

  // 🔹 NUEVO: Verificar si tiene múltiples tamaños
  tieneMultiplesTamanos(producto: Producto): boolean {
    return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length > 1 : false;
  }

  // 🔹 NUEVO: Obtener información de tamaños disponibles
  getTamanosDisponibles(producto: Producto): number {
    return producto.tamanos ? producto.tamanos.filter(t => t.Estado === 'A').length : 0;
  }
}