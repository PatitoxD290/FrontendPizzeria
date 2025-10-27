import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CarritoService } from '../../../core/services/carrito.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  mostrarCodigoPedido = false;

  // Nuevas variables para la verificación por código
  solicitandoCodigo = false;
  codigoVerificacion = '';
  codigoEnviado = false;
  codigoCorrecto = '';
  verificandoCodigo = false;
  errorCodigo = false;

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private http: HttpClient
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
    this.solicitarCodigoVerificacion();
  }

  simularPagoTarjeta() {
    this.solicitarCodigoVerificacion();
  }

  // Nueva función para solicitar código de verificación
  solicitarCodigoVerificacion() {
    this.solicitandoCodigo = true;
    this.generarYEnviarCodigo();
  }

  generarYEnviarCodigo() {
    // Ya no generamos el código aquí, lo genera el backend
    this.enviarCodigoPorEmail().subscribe({
      next: (response: any) => {
        console.log('Código enviado correctamente:', response);
        this.codigoEnviado = true;
        // Para desarrollo, guardamos el código que devuelve el backend
        if (response.codigo) {
          this.codigoCorrecto = response.codigo.toString();
          console.log('Código generado por backend:', this.codigoCorrecto);
        }
      },
      error: (error) => {
        console.error('Error enviando código:', error);
        // En caso de error, generar código localmente como fallback
        this.codigoCorrecto = Math.floor(1000 + Math.random() * 9000).toString();
        console.log('Código generado localmente (para pruebas):', this.codigoCorrecto);
        this.codigoEnviado = true;
      }
    });
  }

  enviarCodigoPorEmail() {
    // URL CORREGIDA según tu configuración de rutas
    return this.http.post('http://localhost:3000/api/v2/codigo-pago', {
      email: 'abnerluisnovoa@gmail.com' // Tu correo destino
    });
  }

  verificarCodigo() {
    if (!this.codigoVerificacion) {
      this.errorCodigo = true;
      return;
    }

    this.verificandoCodigo = true;
    this.errorCodigo = false;

    // Verificación con el backend
    this.http.post('http://localhost:3000/api/v2/verificar-pago', {
      email: 'abnerluisnovoa@gmail.com',
      codigo: this.codigoVerificacion
    }).subscribe({
      next: (response: any) => {
        this.verificandoCodigo = false;
        
        if (response.success) {
          // Código correcto, proceder con el pago
          this.solicitandoCodigo = false;
          this.procesarPago();
        } else {
          // Código incorrecto
          this.errorCodigo = true;
          this.codigoVerificacion = '';
        }
      },
      error: (error) => {
        this.verificandoCodigo = false;
        this.errorCodigo = true;
        this.codigoVerificacion = '';
        console.error('Error verificando código:', error);
        
        // Fallback para desarrollo: verificación local
        if (this.codigoVerificacion === this.codigoCorrecto) {
          this.solicitandoCodigo = false;
          this.procesarPago();
        }
      }
    });
  }

  reenviarCodigo() {
    this.codigoEnviado = false;
    this.codigoVerificacion = '';
    this.errorCodigo = false;
    this.generarYEnviarCodigo();
  }

  cancelarVerificacion() {
    this.solicitandoCodigo = false;
    this.codigoVerificacion = '';
    this.codigoEnviado = false;
    this.errorCodigo = false;
    this.opcionSeleccionada = null;
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
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.dni = value.slice(0, 8);
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
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.ruc = value.slice(0, 11);
  }

  // Métodos para el código de verificación
  addCodigoNumber(num: string) {
    if (this.codigoVerificacion.length < 4) {
      this.codigoVerificacion += num;
    }
  }

  deleteCodigoLast() {
    this.codigoVerificacion = this.codigoVerificacion.slice(0, -1);
  }

  clearCodigo() {
    this.codigoVerificacion = '';
    this.errorCodigo = false;
  }

  onCodigoInputChange(event: any) {
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.codigoVerificacion = value.slice(0, 4);
    this.errorCodigo = false;
  }

  confirmarBoleta() {
    if (this.dni && this.dni.length === 8) {
      this.tipoDocumento = 'boleta';
      this.codigoPedido = '';
      this.mostrarCodigoPedido = false;
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
      this.codigoPedido = '';
      this.mostrarCodigoPedido = false;
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
    this.generarCodigoPedido();
    this.mostrarCodigoPedido = true;
    this.mostrarMensajeFinal = true;
    this.mostrarOpcionesDocumento = false;
    this.finalizarCompra();
  }

  generarCodigoPedido() {
    const numeros = '0123456789';
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let codigo = '';
    
    for (let i = 0; i < 2; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }
    
    for (let i = 0; i < 2; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    
    this.codigoPedido = codigo;
  }

  finalizarCompra() {
    // Aquí guardarías el pedido en la base de datos
    this.guardarPedidoEnBaseDeDatos();
    
    setTimeout(() => {
      this.carritoService.vaciarCarrito();
    }, 2000);
  }

  guardarPedidoEnBaseDeDatos() {
    // Aquí implementarías la lógica para guardar el pedido
    // y los detalles del pedido en tu base de datos
    const productos = this.carritoService.obtenerProductos();
    
    // Ejemplo de cómo podrías estructurar los datos
    const pedidoData = {
      total: this.total,
      tipo_documento: this.tipoDocumento,
      documento: this.tipoDocumento === 'boleta' ? this.dni : this.tipoDocumento === 'factura' ? this.ruc : null,
      codigo_pedido: this.codigoPedido,
      productos: productos
    };

    // Llamar a tu servicio para guardar el pedido
    console.log('Guardando pedido:', pedidoData);
    // this.pedidoService.guardarPedido(pedidoData).subscribe(...);
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
    this.solicitandoCodigo = false;
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
    this.solicitandoCodigo = false;
    this.dni = '';
    this.ruc = '';
    this.codigoPedido = '';
    this.mostrarCodigoPedido = false;
    this.codigoVerificacion = '';
    this.codigoEnviado = false;
    this.codigoCorrecto = '';
    this.verificandoCodigo = false;
    this.errorCodigo = false;
  }
}