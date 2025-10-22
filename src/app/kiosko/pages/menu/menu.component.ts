import { Component } from '@angular/core';
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

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
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
    CarritoFlotanteComponent
  ],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  searchTerm: string = '';
  filtroCategoria: string = 'Pizzas'; // Inicia con Pizzas por defecto

  productos: Producto[] = [
    // CATEGORIA PIZZAS
    { id: 1, nombre: 'AMERICANA', categoria: 'Pizzas', precio: 47.90, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 2, nombre: 'PEPPERONI', categoria: 'Pizzas', precio: 47.90, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 3, nombre: 'HAWAIANA', categoria: 'Pizzas', precio: 48.90, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 4, nombre: 'TROPICAL', categoria: 'Pizzas', precio: 48.90, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 5, nombre: 'SUPREMA', categoria: 'Pizzas', precio: 49.90, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 6, nombre: 'CONTINENTAL', categoria: 'Pizzas', precio: 49.90, imagen: '/assets/imgs/pizza-margarita.jpg'},
    { id: 7, nombre: 'AMAZONICO REGIONAL', categoria: 'Pizzas', precio: 52.90, imagen: '/assets/imgs/pizza-margarita.jpg'},
    { id: 8, nombre: 'AMERICANA SELVATICA', categoria: 'Pizzas', precio: 52.90, imagen: '/assets/imgs/pizza-margarita.jpg'},
    { id: 9, nombre: 'VEGETARIANA', categoria: 'Pizzas', precio: 52.90, imagen: '/assets/imgs/pizza-margarita.jpg'},
    
    // CATEGORIA BEBIDAS
    { id: 10, nombre: 'COCA COLA 500ml', categoria: 'Bebidas', precio: 5, imagen: '/assets/imgs/coca.webp' },
    { id: 11, nombre: 'INCA KOLA 1L', categoria: 'Bebidas', precio: 7, imagen: '/assets/imgs/inca.jpg' },
    { id: 12, nombre: 'PEPSI', categoria: 'Bebidas', precio: 7, imagen: '/assets/imgs/pepsi.jpg' },
    { id: 13, nombre: 'AGUA SAN LUIS', categoria: 'Bebidas', precio: 7, imagen: '/assets/imgs/sanluis.png' },
    { id: 14, nombre: 'PULP DURAZNO', categoria: 'Bebidas', precio: 2, imagen: '/assets/imgs/pulp.jpg' },
    { id: 15, nombre: 'SPRITE', categoria: 'Bebidas', precio: 3, imagen: '/assets/imgs/sprite.jpeg' },

    // CATEGORIA COMBOS
    { id: 16, nombre: 'COMBO 1 Pizza Kids', categoria: 'Combos', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 17, nombre: 'COMBO 1 Pizza Personal', categoria: 'Combos', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 18, nombre: 'COMBO 1 Pizza Familiar', categoria: 'Combos', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 19, nombre: 'COMBO Pareja', categoria: 'Combos', precio: 30, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 20, nombre: 'COMBO 1 Pizza Grande o Familiar', categoria: 'Combos', precio: 30, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 21, nombre: 'COMBO Viernes - Segunda Pizza al 50%', categoria: 'Combos', precio: 30, imagen: '/assets/imgs/pizza-margarita.jpg' },

    // CATEGORIA PIZZAS ESPECIALES
    { id: 22, nombre: 'AMERICANA SELVATICA', categoria: 'Pizzas Especiales', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 23, nombre: 'ESPECIAL DE CARNE', categoria: 'Pizzas Especiales', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 24, nombre: 'ESPECIAL SELVATICA', categoria: 'Pizzas Especiales', precio: 50, imagen: '/assets/imgs/pizza-margarita.jpg' },
    { id: 25, nombre: 'VEGETARIANA', categoria: 'Pizzas Especiales', precio: 30, imagen: '/assets/imgs/pizza-margarita.jpg' },
  ];

  constructor(
    private dialog: MatDialog,
    public carritoService: CarritoService,
    private router: Router
  ) {}

  // ✅ Método para cambiar categoría desde botones superiores
  cambiarCategoriaSuperior(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  // ✅ Método para cambiar categoría desde botones inferiores
  cambiarCategoria(categoria: string): void {
    this.filtroCategoria = categoria;
  }

  // ✅ Verificar si el botón superior Pizzas está activo
  get pizzasActivo(): boolean {
    return this.filtroCategoria === 'Pizzas' || 
           this.filtroCategoria === '' || 
           this.filtroCategoria === 'Combos' || 
           this.filtroCategoria === 'Pizzas Especiales';
  }

  // ✅ Filtro dinámico (MODIFICADO: "Todos" ahora solo muestra Pizzas)
  get productosFiltrados(): Producto[] {
    return this.productos.filter(p => {
      // Si es "Todos" (filtroCategoria vacío), solo mostrar Pizzas
      const categoriaFiltrada = this.filtroCategoria === '' ? 'Pizzas' : this.filtroCategoria;
      
      const coincideCategoria = categoriaFiltrada
        ? p.categoria === categoriaFiltrada
        : true;

      const coincideBusqueda = this.searchTerm
        ? p.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return coincideCategoria && coincideBusqueda;
    });
  }

  // 🛍️ Agregar producto directamente al carrito
  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto({
      ...producto,
      cantidad: 1
    });
  }

  // 🎛️ Abrir modal de personalización
  abrirPersonalizacion(producto: Producto): void {
    const dialogRef = this.dialog.open(DetalleProductoComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: producto
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.agregar) {
        this.carritoService.agregarProducto({
          ...producto,
          ...result.producto,
          cantidad: 1
        });
      }
    });
  }

  // 🔢 Incrementar cantidad en carrito
  incrementarCantidadCarrito(index: number): void {
    this.carritoService.incrementarCantidad(index);
  }

  // 🔢 Decrementar cantidad en carrito
  decrementarCantidadCarrito(index: number): void {
    this.carritoService.decrementarCantidad(index);
  }

  // 🗑️ Eliminar producto del carrito
  eliminarDelCarrito(index: number): void {
    this.carritoService.eliminarProducto(index);
  }

  // 💰 Calcular total del carrito
  calcularTotalCarrito(): number {
    return this.carritoService.obtenerProductos()
      .reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  // ✅ Confirmar pedido
  confirmarPedido(): void {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }
}