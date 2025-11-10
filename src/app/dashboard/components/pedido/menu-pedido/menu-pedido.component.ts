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
import { CantidadPedidoComponent } from '../cantidad-pedido/cantidad-pedido.component'; // 🔹 Importar el modal

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
  // 🔹 Cambiar a array de ProductoTamano con información extendida
  productosConTamanos: (ProductoTamano & {
    producto?: Producto;
    nombre_categoria?: string;
    nombre_producto?: string;
    descripcion_producto?: string;
  })[] = [];
  
  productosFiltrados: (ProductoTamano & {
    producto?: Producto;
    nombre_categoria?: string;
    nombre_producto?: string;
    descripcion_producto?: string;
  })[] = [];
  
  categorias: CategoriaProducto[] = [];
  categoriaSeleccionada: number | null = null;
  terminoBusqueda: string = '';
  
  // 🔹 Variables de paginación
  pageSize = 6;
  currentPage = 0;
  paginatedProductos: (ProductoTamano & {
    producto?: Producto;
    nombre_categoria?: string;
    nombre_producto?: string;
    descripcion_producto?: string;
  })[] = [];

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
        this.cargarProductosConTamanos();
      },
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  cargarProductosConTamanos(): void {
    this.productoService.getProductos().subscribe({
      next: (data) => {
        // Procesar productos y crear array de ProductoTamano extendido
        const productosExtendidos: (ProductoTamano & {
          producto?: Producto;
          nombre_categoria?: string;
          nombre_producto?: string;
          descripcion_producto?: string;
        })[] = [];

        data
          .filter(p => p.Estado === 'A') // Solo productos activos
          .forEach(producto => {
            const tamanosActivos = producto.tamanos?.filter(t => t.Estado === 'A') || [];
            const nombreCategoria = this.obtenerNombreCategoria(producto.ID_Categoria_P);

            // Crear una entrada por cada tamaño activo
            tamanosActivos.forEach(tamano => {
              productosExtendidos.push({
                ...tamano,
                producto: producto,
                nombre_categoria: nombreCategoria,
                nombre_producto: producto.Nombre,
                descripcion_producto: producto.Descripcion
              });
            });
          });

        this.productosConTamanos = productosExtendidos;
        this.productosFiltrados = [...this.productosConTamanos];
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
  let filtrados = [...this.productosConTamanos];
  
  if (this.categoriaSeleccionada !== null) {
    filtrados = filtrados.filter(p => 
      p.producto?.ID_Categoria_P === this.categoriaSeleccionada
    );
  }
  
  if (this.terminoBusqueda.trim() !== '') {
    const termino = this.terminoBusqueda.toLowerCase();
    filtrados = filtrados.filter(p => 
      p.nombre_producto?.toLowerCase().includes(termino) || 
      (p.nombre_categoria?.toLowerCase().includes(termino) ?? false) ||
      p.descripcion_producto?.toLowerCase().includes(termino) ||
      p.nombre_tamano?.toLowerCase().includes(termino) // 🔹 Nueva línea: buscar por tamaño
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

  // 🔹 MODIFICADO: Ahora abre el modal en lugar de agregar directamente
  abrirModalCantidad(productoTamanoExtendido: ProductoTamano & {
    producto?: Producto;
    nombre_categoria?: string;
    nombre_producto?: string;
    descripcion_producto?: string;
  }) {
    const dialogRef = this.dialog.open(CantidadPedidoComponent, {
      width: '450px',
      data: {
        productoTamano: productoTamanoExtendido
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
}