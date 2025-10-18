import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent {
  metodoPago = '';

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  get total() {
    return this.carritoService
      .obtenerProductos()
      .reduce((sum, item) => sum + item.subtotal, 0);
  }

  confirmarPago() {
    if (!this.metodoPago) {
      alert('Por favor selecciona un método de pago.');
      return;
    }

    alert(`✅ Pago confirmado con ${this.metodoPago}. ¡Gracias por tu compra!`);
    this.carritoService.vaciarCarrito();
    this.router.navigate(['/']);
  }
}
