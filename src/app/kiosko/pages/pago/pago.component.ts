import { Component, OnInit } from '@angular/core';
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
export class PagoComponent implements OnInit {
  total = 0;
  opcionSeleccionada: string | null = null;
  pagoConfirmado = false;
  mostrarMensajeFinal = false;
  tipoDocumento: string | null = null;

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit() {
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = this.carritoService
      .obtenerProductos()
      .reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  }

  seleccionarOpcion(opcion: string) {
    this.opcionSeleccionada = opcion;
  }

  simularPagoConfirmado() {
    this.pagoConfirmado = true;
  }

  simularPagoTarjeta() {
    this.pagoConfirmado = true;
  }

  seleccionarTipoDocumento(tipo: string) {
    this.tipoDocumento = tipo;
    this.mostrarMensajeFinal = true;
    this.finalizarCompra();
  }

  finalizarSinDocumento() {
    this.tipoDocumento = null;
    this.mostrarMensajeFinal = true;
    this.finalizarCompra();
  }

  finalizarCompra() {
    setTimeout(() => {
      this.carritoService.vaciarCarrito();
    }, 2000);
  }

  volverAlInicio() {
    this.router.navigate(['/']);
    this.reiniciar();
  }

  // NUEVO MÉTODO: Volver al menú
  volverAlMenu() {
    this.router.navigate(['/kiosko/menu']);
  }

  regresar() {
    this.opcionSeleccionada = null;
    this.pagoConfirmado = false;
  }

  reiniciar() {
    this.opcionSeleccionada = null;
    this.pagoConfirmado = false;
    this.mostrarMensajeFinal = false;
    this.tipoDocumento = null;
  }
}