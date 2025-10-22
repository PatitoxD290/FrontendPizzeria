import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
}

@Component({
  selector: 'app-carrito-flotante',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './carrito-flotante.component.html',
  styleUrls: ['./carrito-flotante.component.css']
})
export class CarritoFlotanteComponent implements OnInit {
  carritoVisible = true;
  productos: Producto[] = [];

  constructor(
    public carritoService: CarritoService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.inicializarProductos();
  }

  inicializarProductos() {
    this.productos = [
      {
        id: 1,
        nombre: 'Box Engasse',
        precio: 15000,
        imagen: 'img/boxengasse.png',
        cantidad: 1
      },
      {
        id: 2,
        nombre: 'English Horse',
        precio: 25000,
        imagen: 'img/englishrose.png',
        cantidad: 1
      },
      {
        id: 3,
        nombre: 'Knock Nap',
        precio: 35000,
        imagen: 'img/knocknap.png',
        cantidad: 1
      },
      {
        id: 4,
        nombre: 'La Night',
        precio: 18000,
        imagen: 'img/lanight.png',
        cantidad: 1
      },
      {
        id: 5,
        nombre: 'Silver All',
        precio: 32000,
        imagen: 'img/silverall.png',
        cantidad: 1
      },
      {
        id: 6,
        nombre: 'Skin Glam',
        precio: 18000,
        imagen: 'img/skinglam.png',
        cantidad: 1
      },
      {
        id: 7,
        nombre: 'Midimix',
        precio: 54000,
        imagen: 'img/midimix.png',
        cantidad: 1
      },
      {
        id: 8,
        nombre: 'Sir Blue',
        precio: 32000,
        imagen: 'img/sirblue.png',
        cantidad: 1
      },
      {
        id: 9,
        nombre: 'Middlesteel',
        precio: 42800,
        imagen: 'img/middlesteel.png',
        cantidad: 1
      }
    ];
  }

  // Agregar producto al carrito
  agregarAlCarrito(producto: Producto) {
    const productoParaCarrito = {
      ...producto,
      cantidad: 1
    };
    this.carritoService.agregarProducto(productoParaCarrito);
  }

  // Eliminar un producto del carrito
  eliminarProducto(index: number) {
    this.carritoService.eliminarProducto(index);
  }

  // Incrementar la cantidad de un producto
  incrementarCantidad(index: number) {
    this.carritoService.incrementarCantidad(index);
  }

  // Decrementar la cantidad de un producto
  decrementarCantidad(index: number) {
    this.carritoService.decrementarCantidad(index);
  }

  // Confirmar el pedido y navegar a la página de pago
  confirmarPedido() {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    this.router.navigate(['/kiosko/pago']);
  }

  // Calcular el total de los productos en el carrito
  get total(): number {
    return this.carritoService
      .obtenerProductos()
      .reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }

  // Obtener la cantidad de productos distintos en el carrito
  get cantidadItemsDistintos(): number {
    return this.carritoService.obtenerProductos().length;
  }

  // Verificar si el usuario está logueado y si está en la página de pago
  get isLoggedIn(): boolean {
    return this.authService.getUser() !== null;
  }

  get isInPagoPage(): boolean {
    return this.router.url.includes('/pago');
  }

  // Verificar si estamos en la página de registro cliente
  get isInRegistrarPage(): boolean {
    return this.router.url.includes('/registrar');
  }

  // Verificar si estamos en la página de login
  get isInLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  // El carrito solo debe mostrarse si no estamos en las páginas de pago ni de registro y si el usuario no está logueado
  get mostrarCarrito(): boolean {
    return !this.isInPagoPage && !this.isInRegistrarPage && !this.isLoggedIn && !this.isInLoginPage;
  }
}