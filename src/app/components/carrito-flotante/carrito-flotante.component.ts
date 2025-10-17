import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../core/services/carrito/carrito.service';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
  selector: 'app-carrito-flotante',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './carrito-flotante.component.html',
  styleUrls: ['./carrito-flotante.component.css']
})
export class CarritoFlotanteComponent {
  visible = false;

  constructor(
    public carritoService: CarritoService,
    private router: Router,
    private authService: AuthService
  ) {}

  // Método para alternar la visibilidad del carrito
  toggleCarrito() {
    this.visible = !this.visible;
  }

  // Método para cerrar el carrito
  volver() {
    this.visible = false;
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
    this.visible = false;
    this.router.navigate(['/pago']);
  }

  // Vaciar el carrito
  vaciarCarrito() {
    this.carritoService.vaciarCarrito();
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
