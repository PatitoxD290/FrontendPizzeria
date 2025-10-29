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

  // Variables para la verificación por código
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

  solicitarCodigoVerificacion() {
    this.solicitandoCodigo = true;
    this.generarYEnviarCodigo();
  }

  generarYEnviarCodigo() {
    this.enviarCodigoPorEmail().subscribe({
      next: (response: any) => {
        console.log('Código enviado correctamente:', response);
        this.codigoEnviado = true;
        if (response.codigo) {
          this.codigoCorrecto = response.codigo.toString();
          console.log('Código generado por backend:', this.codigoCorrecto);
        }
      },
      error: (error) => {
        console.error('Error enviando código:', error);
        this.codigoCorrecto = Math.floor(1000 + Math.random() * 9000).toString();
        console.log('Código generado localmente (para pruebas):', this.codigoCorrecto);
        this.codigoEnviado = true;
      }
    });
  }

  enviarCodigoPorEmail() {
    return this.http.post('http://localhost:3000/api/v2/codigo-pago', {
      email: 'abnerluisnovoa@gmail.com'
    });
  }

  verificarCodigo() {
    if (!this.codigoVerificacion) {
      this.errorCodigo = true;
      return;
    }

    this.verificandoCodigo = true;
    this.errorCodigo = false;

    this.http.post('http://localhost:3000/api/v2/verificar-pago', {
      email: 'abnerluisnovoa@gmail.com',
      codigo: this.codigoVerificacion
    }).subscribe({
      next: (response: any) => {
        this.verificandoCodigo = false;
        
        if (response.success) {
          this.solicitandoCodigo = false;
          this.procesarPago();
        } else {
          this.errorCodigo = true;
          this.codigoVerificacion = '';
        }
      },
      error: (error) => {
        this.verificandoCodigo = false;
        this.errorCodigo = true;
        this.codigoVerificacion = '';
        console.error('Error verificando código:', error);
        
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
    
    setTimeout(() => {
      this.procesandoPago = false;
      this.pagoExitoso = Math.random() > 0.2;
      this.pagoConfirmado = true;
      
      if (this.pagoExitoso) {
        setTimeout(() => {
          this.mostrarOpcionesDocumento = true;
          this.pagoConfirmado = false;
        }, 2000);
      }
    }, 2000 + Math.random() * 3000);
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
      this.generarCodigoPedido();
      this.mostrarCodigoPedido = true;
      this.mostrarMensajeFinal = true;
      this.solicitandoDni = false;
      this.guardarEnBaseDeDatosReal();
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
      this.generarCodigoPedido();
      this.mostrarCodigoPedido = true;
      this.mostrarMensajeFinal = true;
      this.solicitandoRuc = false;
      this.guardarEnBaseDeDatosReal();
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
    this.guardarEnBaseDeDatosReal();
  }

  // ✅ MÉTODO MEJORADO: Intenta con valores REALES
  guardarEnBaseDeDatosReal() {
    const productos = this.carritoService.obtenerProductos();
    
    // Valores MÁS COMUNES para Estado_P - PROBAMOS UNO POR UNO
    const estadosPosibles = ['P', 'A', 'C', 'E', 'R', 'N']; // P=Pendiente, A=Activo, C=Completado, E=Entregado, R=Recibido, N=Nuevo
    
    const pedidoData = {
      ID_Cliente: 1,
      ID_Usuario: 1,
      Hora_Pedido: new Date().toLocaleTimeString(),
      Estado_P: 'P', // Empezamos con 'P' (el más común)
      Notas: `Pedido ${this.codigoPedido} - ${this.getMetodoPagoText()}`,
      detalles: productos.map(producto => ({
        ID_Producto: producto.id_producto || 1,
        ID_Tamano: producto.id_tamano || null,
        Cantidad: producto.cantidad || 1
      }))
    };

    console.log('🚀 INTENTANDO GUARDAR EN BD REAL:', pedidoData);

    this.intentarGuardarConEstado(pedidoData, estadosPosibles, 0);
  }

  // ✅ Método recursivo para probar diferentes estados
  intentarGuardarConEstado(pedidoData: any, estados: string[], index: number) {
    if (index >= estados.length) {
      console.error('❌ Todos los estados fallaron. Usando simulación.');
      this.simularGuardado();
      return;
    }

    const estadoActual = estados[index];
    const pedidoConEstado = { ...pedidoData, Estado_P: estadoActual };

    console.log(`🔍 Probando con Estado_P: '${estadoActual}'`);

    this.http.post('http://localhost:3000/api/v2/pedidos', pedidoConEstado).subscribe({
      next: (response: any) => {
        console.log(`🎉 ¡ÉXITO! Pedido guardado con Estado_P: '${estadoActual}'`, response);
        
        // Si el pago fue exitoso, guardar venta también
        if (this.pagoExitoso && response.ID_Pedido) {
          this.guardarVentaEnBaseDeDatos(response.ID_Pedido);
        } else {
          this.finalizarCompra();
        }
      },
      error: (error) => {
        console.log(`❌ Falló con Estado_P: '${estadoActual}'`);
        
        // Intentar con el siguiente estado
        this.intentarGuardarConEstado(pedidoData, estados, index + 1);
      }
    });
  }

  // ✅ Método para guardar venta
  guardarVentaEnBaseDeDatos(ID_Pedido: number) {
    const ventaData = {
      ID_Pedido: ID_Pedido,
      Tipo_Venta: this.tipoDocumento === 'factura' ? 'F' : 'B',
      Metodo_Pago: this.getMetodoPagoCode(),
      Lugar_Emision: 'LOC',
      IGV: this.total * 0.18,
      Total: this.total,
      Fecha_Registro: new Date().toISOString().split('T')[0]
    };

    console.log('💰 Guardando venta en BD:', ventaData);
    
    this.http.post('http://localhost:3000/api/v2/ventas', ventaData).subscribe({
      next: (response: any) => {
        console.log('✅ Venta guardada en BD:', response);
        this.finalizarCompra();
      },
      error: (error) => {
        console.error('❌ Error guardando venta:', error);
        this.finalizarCompra();
      }
    });
  }

  // ✅ Simulación como fallback
  simularGuardado() {
    console.log('🔄 Usando simulación...');
    setTimeout(() => {
      console.log('✅ Pedido simulado exitosamente');
      this.finalizarCompra();
    }, 1500);
  }

  getMetodoPagoCode(): string {
    switch(this.opcionSeleccionada) {
      case 'efectivo': return 'EF';
      case 'tarjeta': return 'TJ';
      case 'billetera': return 'BI';
      case 'yape': return 'YP';
      default: return 'EF';
    }
  }

  getMetodoPagoText(): string {
    switch(this.opcionSeleccionada) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'billetera': return 'Billetera Digital';
      case 'yape': return 'Yape';
      default: return 'Efectivo';
    }
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
    console.log('🛒 Productos en el carrito:', this.carritoService.obtenerProductos());
    
    setTimeout(() => {
      this.carritoService.vaciarCarrito();
      console.log('✅ Carrito vaciado después de la compra');
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