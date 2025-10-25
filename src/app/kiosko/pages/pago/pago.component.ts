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
  procesandoPago = false;
  pagoExitoso = false;
  mostrarOpcionesDocumento = false;
  solicitandoDni = false;
  solicitandoRuc = false;
  dni = '';
  ruc = '';
  codigoPedido = '';
  mostrarCodigoPedido = false; // Nueva variable para controlar la visualización

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
    this.procesarPago();
  }

  simularPagoTarjeta() {
    this.procesarPago();
  }

  procesarPago() {
    this.procesandoPago = true;
    
    // Simular procesamiento de pago por 2-5 segundos
    setTimeout(() => {
      this.procesandoPago = false;
      
      // Simular resultado aleatorio del pago (80% éxito, 20% rechazado)
      this.pagoExitoso = Math.random() > 0.2;
      this.pagoConfirmado = true;
      
      if (this.pagoExitoso) {
        // Mostrar resultado por 2 segundos y luego ir a opciones de documento
        setTimeout(() => {
          this.mostrarOpcionesDocumento = true;
          this.pagoConfirmado = false;
        }, 2000);
      }
    }, 2000 + Math.random() * 3000); // Entre 2 y 5 segundos
  }

  reintentarPago() {
    this.pagoConfirmado = false;
    this.pagoExitoso = false;
    this.mostrarOpcionesDocumento = false;
    this.opcionSeleccionada = null;
  }

  solicitarDni() {
    this.solicitandoDni = true;
    this.mostrarOpcionesDocumento = false;
  }

  solicitarRuc() {
    this.solicitandoRuc = true;
    this.mostrarOpcionesDocumento = false;
  }

  // Métodos para el teclado numérico del DNI
  addNumber(num: string) {
    if (this.dni.length < 8) {
      this.dni += num;
    }
  }

  deleteLast() {
    this.dni = this.dni.slice(0, -1);
  }

  clearDni() {
    this.dni = '';
  }

  onDniInputChange(event: any) {
    // Asegura que solo acepte números
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.dni = value.slice(0, 8); // Máximo 8 dígitos
  }

  // Métodos para el teclado numérico del RUC
  addRucNumber(num: string) {
    if (this.ruc.length < 11) {
      this.ruc += num;
    }
  }

  deleteRucLast() {
    this.ruc = this.ruc.slice(0, -1);
  }

  clearRuc() {
    this.ruc = '';
  }

  onRucInputChange(event: any) {
    // Asegura que solo acepte números
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.ruc = value.slice(0, 11); // Máximo 11 dígitos
  }

  confirmarBoleta() {
    if (this.dni && this.dni.length === 8) {
      this.tipoDocumento = 'boleta';
      // NO generar código de pedido para boleta
      this.codigoPedido = '';
      this.mostrarCodigoPedido = false; // No mostrar código de pedido
      this.mostrarMensajeFinal = true;
      this.solicitandoDni = false;
      this.finalizarCompra();
    } else {
      alert('Ingrese un DNI válido de 8 dígitos');
    }
  }

  cancelarDni() {
    this.solicitandoDni = false;
    this.mostrarOpcionesDocumento = true;
    this.dni = '';
  }

  confirmarFactura() {
    if (this.ruc && this.ruc.length === 11) {
      this.tipoDocumento = 'factura';
      // NO generar código de pedido para factura
      this.codigoPedido = '';
      this.mostrarCodigoPedido = false; // No mostrar código de pedido
      this.mostrarMensajeFinal = true;
      this.solicitandoRuc = false;
      this.finalizarCompra();
    } else {
      alert('Ingrese un RUC válido de 11 dígitos');
    }
  }

  cancelarRuc() {
    this.solicitandoRuc = false;
    this.mostrarOpcionesDocumento = true;
    this.ruc = '';
  }

  finalizarSinDocumento() {
    this.tipoDocumento = null;
    // SOLO generar código de pedido para "No, gracias"
    this.generarCodigoPedido();
    this.mostrarCodigoPedido = true; // Mostrar código de pedido
    this.mostrarMensajeFinal = true;
    this.mostrarOpcionesDocumento = false;
    this.finalizarCompra();
  }

  generarCodigoPedido() {
    const numeros = '0123456789';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    
    // Generar 2 números
    for (let i = 0; i < 2; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }
    
    // Generar 2 letras
    for (let i = 0; i < 2; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    
    this.codigoPedido = codigo;
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

  volverAlMenu() {
    this.router.navigate(['/kiosko/menu']);
  }

  regresar() {
    this.opcionSeleccionada = null;
    this.pagoConfirmado = false;
    this.procesandoPago = false;
    this.mostrarOpcionesDocumento = false;
    this.solicitandoDni = false;
    this.solicitandoRuc = false;
  }

  reiniciar() {
    this.opcionSeleccionada = null;
    this.pagoConfirmado = false;
    this.mostrarMensajeFinal = false;
    this.tipoDocumento = null;
    this.procesandoPago = false;
    this.pagoExitoso = false;
    this.mostrarOpcionesDocumento = false;
    this.solicitandoDni = false;
    this.solicitandoRuc = false;
    this.dni = '';
    this.ruc = '';
    this.codigoPedido = '';
    this.mostrarCodigoPedido = false;
  }
}