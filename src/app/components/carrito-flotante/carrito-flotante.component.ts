import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../core/services/carrito/carrito.service';
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
    private router: Router
  ) {}

  toggleCarrito() {
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
    this.visible = false;
    this.router.navigate(['/pago']);
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
