import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CarritoService } from '../../services/carrito/carrito.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent {
  total = 0;
  opcionSeleccionada: string | null = null;
  billeteraSeleccionada: string | null = null;

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    // Calcular total desde el carrito
    this.total = this.carritoService
      .obtenerProductos()
      .reduce((sum, item) => sum + item.subtotal, 0);
  }

  seleccionarOpcion(opcion: string) {
    this.opcionSeleccionada = opcion;
    this.billeteraSeleccionada = null;
  }

  seleccionarBilletera(billetera: string) {
    this.billeteraSeleccionada = billetera;
  }

  generarBoleta() {
    alert('🧾 Generando boleta con la información del pago...');
    this.confirmarPago();
  }

  confirmarPago() {
    alert('✅ Pago realizado con éxito. ¡Gracias por su compra!');
    this.carritoService.vaciarCarrito();
    this.router.navigate(['/']);
    this.reiniciar();
  }

  regresar() {
    if (this.billeteraSeleccionada) {
      this.billeteraSeleccionada = null;
    } else {
      this.opcionSeleccionada = null;
    }
  }

  reiniciar() {
    this.opcionSeleccionada = null;
    this.billeteraSeleccionada = null;
  }
}
