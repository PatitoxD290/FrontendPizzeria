import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DetalleProductoComponent } from '../../components/detalle-producto/detalle-producto.component';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Router } from '@angular/router';
import { CarritoFlotanteComponent } from '../../components/carrito-flotante/carrito-flotante.component';
import { ProductoService } from '../../../dashboard/services/producto.service';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: number;
  precio: number;
  imagen: string;
  cantidad?: number;
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
    CarritoFlotanteComponent,
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
})
export class MenuComponent implements OnInit {
  searchTerm: string = '';
  filtroCategoria: string = 'Pizzas';
  productos: Producto[] = [];

  // 🗺️ Mapa temporal de categorías según IDs de tu backend
  CATEGORY_MAP: Record<number, string> = {
    1: 'Pizzas',
    2: 'Bebidas',
    3: 'Combos',
    4: 'Pizzas Especiales',
  };

  constructor(
    private dialog: MatDialog,
    public carritoService: CarritoService,
    private productoService: ProductoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarProductosDesdeService();
  }

  // ✅ Cargar productos reales desde el servicio
  private cargarProductosDesdeService(): void {
    this.productoService.getProductos().subscribe({
      next: (data: any) => {
        const rawArray = Array.isArray(data) ? data : data ? [data] : [];
        this.productos = rawArray.map((item: any) => ({
          id: item.producto_id ?? item.id ?? 0,
          nombre: item.nombre_producto ?? item.nombre ?? 'Sin nombre',
          descripcion: item.descripcion_producto ?? item.descripcion ?? 'No llego',
          categoria: item.categoria_id ?? 0,
          precio: Number(item.precio_venta ?? item.precio ?? 0) || 0,
          imagen: `http://localhost:3000/imagenesCata/producto_${
            item.producto_id ?? item.id ?? 0
          }_1.png`,
          cantidad: item.cantidad ?? 1,
        }));
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.productos = [];
      },
    });
  }

  // 🧭 Obtener el nombre de la categoría desde el ID
  getNombreCategoria(id: number): string {
    return this.CATEGORY_MAP[id] ?? `Categoría ${id}`;
  }

  get productosFiltrados(): Producto[] {
    return this.productos.filter((p) => {
      const categoriaNombre = this.getNombreCategoria(p.categoria);
      const categoriaFiltrada = this.filtroCategoria === '' ? 'Pizzas' : this.filtroCategoria;
      const coincideCategoria = categoriaFiltrada ? categoriaNombre === categoriaFiltrada : true;
      const coincideBusqueda = this.searchTerm
        ? p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
      return coincideCategoria && coincideBusqueda;
    });
  }

  cambiarCategoriaSuperior(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  cambiarCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  get pizzasActivo(): boolean {
    return (
      this.filtroCategoria === 'Pizzas' ||
      this.filtroCategoria === '' ||
      this.filtroCategoria === 'Combos' ||
      this.filtroCategoria === 'Pizzas Especiales'
    );
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto({
      ...producto,
      cantidad: 1,
    });
  }

  abrirPersonalizacion(producto: Producto): void {
    const dialogRef = this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: producto,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.agregar) {
        this.carritoService.agregarProducto({
          ...producto,
          ...result.producto,
          cantidad: 1,
        });
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
    return this.carritoService
      .obtenerProductos()
      .reduce((total, item) => total + item.precio * item.cantidad, 0);
  }

  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }
}
