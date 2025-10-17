import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DetalleProductoComponent } from '../detalle-producto/detalle-producto.component';
import { CarritoFlotanteComponent } from '../carrito-flotante/carrito-flotante.component'; // 🛒
import { CarritoService } from '../../core/services/carrito/carrito.service'; // 🛍️ servicio del carrito

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  imagen: string;
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
    CarritoFlotanteComponent // 🛒 Importamos carrito flotante aquí
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  searchTerm: string = '';
  filtroCategoria: string = '';

  productos: Producto[] = [
    { id: 1, nombre: 'Pizza Margarita', categoria: 'Pizzas', precio: 25, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 2, nombre: 'Pizza Pepperoni', categoria: 'Pizzas', precio: 28, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 3, nombre: 'Pizza Hawaiana', categoria: 'Pizzas', precio: 28, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 4, nombre: 'Coca Cola 500ml', categoria: 'Bebidas', precio: 5, imagen: '/imgs/coca.webp' },
    { id: 5, nombre: 'Inca Kola 1L', categoria: 'Bebidas', precio: 7, imagen: '/imgs/inca.jpg' },
    { id: 6, nombre: 'Pepsi', categoria: 'Bebidas', precio: 7, imagen: '/imgs/pepsi.jpg' },
    { id: 7, nombre: 'Agua San Luis', categoria: 'Bebidas', precio: 7, imagen: '/imgs/sanluis.png' },
    { id: 8, nombre: 'Pulp Durazno', categoria: 'Bebidas', precio: 2, imagen: '/imgs/pulp.jpg' },
    { id: 9, nombre: 'Sprite', categoria: 'Bebidas', precio: 3, imagen: '/imgs/sprite.jpeg' },
    { id: 10, nombre: 'Combo 1 Pizza Kids', categoria: 'Combos', precio: 50, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 11, nombre: 'Combo 1 Pizza Personal', categoria: 'Combos', precio: 50, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 12, nombre: 'Combo 1 Pizza Familiar', categoria: 'Combos', precio: 50, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 13, nombre: 'Combo Pareja', categoria: 'Combos', precio: 30, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 14, nombre: 'Combo 1 Pizza Grande o Familiar', categoria: 'Combos', precio: 30, imagen: '/imgs/pizza-margarita.jpg' },
    { id: 15, nombre: 'Combo Viernes - Segunda Pizza al 50%', categoria: 'Combos', precio: 30, imagen: '/imgs/pizza-margarita.jpg' }
  ];

  constructor(
    private dialog: MatDialog,
    private carritoService: CarritoService // 🛍️ inyectamos servicio
  ) {}

  // ✅ Filtro dinámico
  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      const coincideCategoria = this.filtroCategoria
        ? p.categoria === this.filtroCategoria
        : true;

      const coincideBusqueda = this.searchTerm
        ? p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return coincideCategoria && coincideBusqueda;
    });
  }

  // 🛍️ Abrir modal de detalle
  abrirDetalleProducto(producto: Producto) {
    const dialogRef = this.dialog.open(DetalleProductoComponent, {
      width: '400px',
      data: producto
    });

    // 👇 Si el usuario confirma desde el modal, agregamos al carrito
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'agregar') {
        this.carritoService.agregarProducto(producto);
      }
    });
  }
}
