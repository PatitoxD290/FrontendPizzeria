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
import { Producto } from '../../../../core/models/producto.model';
import { CategoriaProducto } from '../../../../core/models/categoria.model';
import { TamanoService } from '../../../../core/services/tamano.service'; 
import { MatDialog } from '@angular/material/dialog';
import { InfoTamanoComponent } from '../info-tamano/info-tamano.component';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

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
  productos: (Producto & { nombre_categoria?: string })[] = [];
  productosFiltrados: (Producto & { nombre_categoria?: string })[] = [];
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = ''; 

  // 🔹 Variables de paginación
  pageSize = 6;
  currentPage = 0;
  paginatedProductos: (Producto & { nombre_categoria?: string })[] = [];

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

  cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        this.productos = data.map(p => ({
          ...p,
          nombre_categoria: this.obtenerNombreCategoria(p.ID_Categoria_P)
        }));
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
        (p.nombre_categoria?.toLowerCase().includes(termino) ?? false)
      );
    }

    this.productosFiltrados = filtrados;
    this.currentPage = 0; // Reiniciar a la primera página al filtrar
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

  agregarAlCarrito(prod: Producto) {
    const dialogRef = this.dialog.open(InfoTamanoComponent, {
      width: '400px',
      data: prod
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const detalle: PedidoDetalle = {
          ID_Pedido_D: 0,
          ID_Pedido: 0,
          ID_Producto: prod.ID_Producto,
          ID_Tamano: result.ID_Tamano,
          Cantidad: result.Cantidad,
          PrecioTotal: result.PrecioTotal,
          nombre_producto: prod.Nombre,
          nombre_categoria: prod.nombre_categoria || 'Sin categoría'
        };
        this.ordenService.agregarProducto(detalle as any);
      }
    });
  }
}
