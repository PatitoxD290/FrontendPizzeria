// src/app/kiosko/components/menu/menu.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { ProductoService } from '../../../dashboard/services/producto.service';
import { CategoriaService } from '../../../dashboard/services/categoria.service';
import { CarritoService } from '../../services/carrito/carrito.service';
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';
import { CarritoFlotanteComponent } from '../../components/carrito-flotante/carrito-flotante.component';
import { Producto } from '../../../core/models/producto.model';
import { Categoria } from '../../../core/models/categoria.model';

interface ProductoConCategoria extends Producto {
  nombre_categoria: string;
  imagen: string; // siempre string
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    CarritoFlotanteComponent
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  searchTerm: string = '';
  filtroCategoria: string = ''; // Mostrar todos al inicio
  productos: ProductoConCategoria[] = [];
  categorias: Categoria[] = [];

  constructor(
    private productoService: ProductoService,
    private categoriaService: CategoriaService,
    private dialog: MatDialog,
    public carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  private cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data: Categoria[]) => {
        this.categorias = data || [];
        this.cargarProductos();
      },
      error: (err) => console.error('Error al cargar categorías', err)
    });
  }

  private cargarProductos(): void {
    this.productoService.getProductos().subscribe({
      next: (data: Producto[]) => {
        if (!data || data.length === 0) {
          console.warn('No se encontraron productos');
          return;
        }

        this.productos = data.map(p => {
          const nombreCat = this.obtenerNombreCategoria(p.categoria_id);
          // Si es Bebidas, imagen sanluis, sino pizza
          const imagenPredeterminada = nombreCat.toLowerCase() === 'bebidas'
            ? '/assets/imgs/sanluis.png'
            : '/assets/imgs/pizza-margarita.jpg';

          return {
            ...p,
            imagen: imagenPredeterminada,
            nombre_categoria: nombreCat
          };
        });
      },
      error: (err) => console.error('Error al cargar productos', err)
    });
  }

  private obtenerNombreCategoria(categoria_id: number): string {
    const categoria = this.categorias.find(c => c.categoria_id === categoria_id);
    return categoria ? categoria.nombre_categoria : 'Sin categoría';
  }

  cambiarCategoriaSuperior(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  cambiarCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  get pizzasActivo(): boolean {
    return ['Pizzas', 'Combos', 'Pizzas Especiales'].includes(this.filtroCategoria);
  }

  get productosFiltrados(): ProductoConCategoria[] {
    return this.productos.filter(p => {
      const coincideCategoria =
        !this.filtroCategoria ||
        p.nombre_categoria.toLowerCase().includes(this.filtroCategoria.toLowerCase());

      const coincideBusqueda = this.searchTerm
        ? p.nombre_producto.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return coincideCategoria && coincideBusqueda;
    });
  }

  agregarAlCarrito(producto: ProductoConCategoria): void {
    this.carritoService.agregarProducto({ ...producto, cantidad: 1 });
  }

  abrirPersonalizacion(producto: ProductoConCategoria): void {
    const dialogRef = this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: producto
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.agregar) {
        this.carritoService.agregarProducto({ ...producto, ...result.producto, cantidad: 1 });
      }
    });
  }

  incrementarCantidadCarrito(index: number): void {
    this.carritoService.incrementarCantidad(index);
  }

  decrementarCantidadCarrito(index: number): void {
    this.carritoService.decrementarCantidad(index);
  }

  eliminarDelCarrito(index: number): void {
    this.carritoService.eliminarProducto(index);
  }

  calcularTotalCarrito(): number {
    return this.carritoService.obtenerProductos()
      .reduce((total, item) => total + (item.precio_venta * (item.cantidad || 1)), 0);
  }

  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }
}
