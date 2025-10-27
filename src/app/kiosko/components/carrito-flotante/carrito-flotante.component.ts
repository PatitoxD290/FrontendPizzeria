import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../../core/services/carrito.service';
import { Router } from '@angular/router';

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
    public router: Router
  ) {}

  // Nueva función para verificar si estamos en la página de pago
  esPaginaPago(): boolean {
    return this.router.url.includes('/pago');
  }

  toggleCarrito() {
    // No permitir abrir el carrito en la página de pago
    if (this.esPaginaPago()) {
      return;
    }
    this.visible = !this.visible;
  }

  volver() {
    this.visible = false;
  }

  eliminarProducto(index: number) {
    this.carritoService.eliminarProducto(index);
  }

  incrementarCantidad(index: number) {
    this.carritoService.incrementarCantidad(index);
  }

  decrementarCantidad(index: number) {
    this.carritoService.decrementarCantidad(index);
  }

  confirmarPedido() {
    if (this.carritoService.obtenerProductos().length === 0) {
      alert('⚠️ El carrito está vacío.');
      return;
    }
    
    // Ocultar completamente el carrito antes de navegar
    this.visible = false;
    
    // Navegar a la página de pago
    this.router.navigate(['kiosko/pago']).then(() => {
      // Forzar un cambio de detección para asegurar que el carrito se oculte
      setTimeout(() => {
        this.visible = false;
      }, 0);
    });
  }

  /** ✅ Nueva función para vaciar todo el carrito */
  vaciarCarrito() {
    this.carritoService.vaciarCarrito();
  }

  get total(): number {
    return this.carritoService
      .obtenerProductos()
      .reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }

  get cantidadItemsDistintos(): number {
    return this.carritoService.obtenerProductos().length;
  }
}