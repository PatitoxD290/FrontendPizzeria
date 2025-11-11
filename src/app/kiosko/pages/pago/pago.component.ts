import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CarritoService } from '../../../core/services/carrito.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Servicios
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';

// Modelos
import { Pedido, PedidoDetalle, PedidoConDetalle } from '../../../core/models/pedido.model';
import { Venta, VentaCreacionDTO } from '../../../core/models/venta.model';

// ================================================================
// 🟢 INTERFACES DTO CORREGIDAS - USAR ID_Producto_T
// ================================================================

type PedidoCreacionDTO = Omit<Pedido, 'ID_Pedido' | 'PrecioTotal' | 'Estado_P' | 'SubTotal'> & {
  Estado_P?: 'P' | 'C' | 'E' | 'D';
  detalles: PedidoDetalleCreacionDTO[];
};

// 🔹 CORRECCIÓN: Usar solo ID_Producto_T en lugar de ID_Producto + ID_Tamano
type PedidoDetalleCreacionDTO = {
  ID_Producto_T: number; // ✅ Usar ID_Producto_T que ya incluye producto, tamaño y precio
  Cantidad: number;
};

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

  // 🔹 NUEVO: Variables para monto recibido y vuelto
  montoRecibido: number = 0;
  solicitandoMontoEfectivo = false;

  private idClienteParaGuardar: number = 1; // 1 = Cliente Genérico por defecto

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private http: HttpClient,
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService
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
    
    // 🔹 NUEVO: Si es efectivo, solicitar monto recibido
    if (opcion === 'efectivo') {
      this.solicitarMontoEfectivo();
    } else {
      // Para otros métodos, el monto recibido es igual al total
      this.montoRecibido = this.total;
    }
  }

  // 🔹 NUEVO: Método para solicitar monto en efectivo
  solicitarMontoEfectivo() {
    this.solicitandoMontoEfectivo = true;
    this.montoRecibido = this.total; // Valor por defecto
  }

  // 🔹 NUEVO: Métodos para el teclado numérico del monto
  addMontoNumber(num: string) {
    const current = this.montoRecibido.toString();
    if (current === '0') {
      this.montoRecibido = parseInt(num);
    } else {
      this.montoRecibido = parseFloat(current + num);
    }
  }

  deleteMontoLast() {
    const current = this.montoRecibido.toString();
    if (current.length > 1) {
      this.montoRecibido = parseFloat(current.slice(0, -1));
    } else {
      this.montoRecibido = 0;
    }
  }

  clearMonto() {
    this.montoRecibido = 0;
  }

  addMontoDecimal() {
    const current = this.montoRecibido.toString();
    if (!current.includes('.')) {
      this.montoRecibido = parseFloat(current + '.');
    }
  }

  onMontoInputChange(event: any) {
    const value = event.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || value === '.') {
      this.montoRecibido = 0;
    } else {
      this.montoRecibido = parseFloat(value);
    }
  }

  confirmarMontoEfectivo() {
    if (this.montoRecibido < this.total) {
      alert('El monto recibido no puede ser menor al total a pagar');
      return;
    }
    this.solicitandoMontoEfectivo = false;
    this.simularPagoConfirmado();
  }

  cancelarMontoEfectivo() {
    this.solicitandoMontoEfectivo = false;
    this.opcionSeleccionada = null;
    this.montoRecibido = 0;
  }

  // --- Flujo de Verificación de Código (Con ajustes) ---

  simularPagoConfirmado() {
    // Para tarjeta/billetera, solicitar código de verificación
    if (this.opcionSeleccionada === 'tarjeta' || this.opcionSeleccionada === 'billetera' || this.opcionSeleccionada === 'yape') {
      this.solicitarCodigoVerificacion();
    } else {
      // Para efectivo, procesar directamente
      this.procesarPago();
    }
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
        setTimeout(() => {
          this.codigoEnviado = true;
        }, 2000);
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
        console.error('Error verificando código:', error);
        if (this.codigoVerificacion.length === 4) {
          console.log('✅ Código aceptado (modo pruebas)');
          this.solicitandoCodigo = false;
          this.procesarPago();
        } else {
          this.errorCodigo = true;
          this.codigoVerificacion = '';
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

  // --- Lógica de Procesamiento y Documento (Con ajustes) ---

  procesarPago() {
    this.procesandoPago = true;
    setTimeout(() => {
      this.procesandoPago = false;
      this.pagoExitoso = true;
      this.pagoConfirmado = true;
      if (this.pagoExitoso) {
        setTimeout(() => {
          this.mostrarOpcionesDocumento = true;
          this.pagoConfirmado = false;
        }, 2000);
      }
    }, 2000);
  }

  reintentarPago() {
    this.pagoConfirmado = false;
    this.pagoExitoso = false;
    this.mostrarOpcionesDocumento = false;
    this.opcionSeleccionada = null;
    this.solicitandoMontoEfectivo = false;
    this.montoRecibido = 0;
  }

  solicitarDni() {
    this.solicitandoDni = true;
    this.mostrarOpcionesDocumento = false;
  }

  solicitarRuc() {
    this.solicitandoRuc = true;
    this.mostrarOpcionesDocumento = false;
  }

  // --- Métodos de Teclados Numéricos (Sin cambios) ---
  addNumber(num: string) { if (this.dni.length < 8) this.dni += num; }
  deleteLast() { this.dni = this.dni.slice(0, -1); }
  clearDni() { this.dni = ''; }
  onDniInputChange(event: any) { const value = event.target.value.replace(/[^0-9]/g, ''); this.dni = value.slice(0, 8); }
  addRucNumber(num: string) { if (this.ruc.length < 11) this.ruc += num; }
  deleteRucLast() { this.ruc = this.ruc.slice(0, -1); }
  clearRuc() { this.ruc = ''; }
  onRucInputChange(event: any) { const value = event.target.value.replace(/[^0-9]/g, ''); this.ruc = value.slice(0, 11); }
  addCodigoNumber(num: string) { if (this.codigoVerificacion.length < 4) this.codigoVerificacion += num; }
  deleteCodigoLast() { this.codigoVerificacion = this.codigoVerificacion.slice(0, -1); }
  clearCodigo() { this.codigoVerificacion = ''; this.errorCodigo = false; }
  onCodigoInputChange(event: any) { const value = event.target.value.replace(/[^0-9]/g, ''); this.codigoVerificacion = value.slice(0, 4); this.errorCodigo = false; }

  // ================================================================
  // 🔄 MÉTODOS DE GUARDADO CORREGIDOS - INCLUYENDO MONTO_RECIBIDO
  // ================================================================

  confirmarBoleta() {
    if (!this.dni || this.dni.length !== 8) {
      alert('Ingrese un DNI válido de 8 dígitos');
      return;
    }

    this.procesandoPago = true;
    this.tipoDocumento = 'boleta';
    this.solicitandoDni = false;
    this.mostrarMensajeFinal = true;

    console.log(`🔍 Buscando cliente DNI: ${this.dni}`);
    this.clienteService.buscarClientePorDocumento(this.dni).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del servicio:', response);
        
        let clienteEncontrado;
        
        if (response.cliente) {
          clienteEncontrado = response.cliente;
        } else if (response.ID_Cliente) {
          clienteEncontrado = response;
        } else {
          clienteEncontrado = response;
        }

        if (clienteEncontrado && clienteEncontrado.ID_Cliente) {
          this.idClienteParaGuardar = clienteEncontrado.ID_Cliente;
          console.log('✅ Cliente encontrado. ID_Cliente:', this.idClienteParaGuardar);
        } else {
          console.warn('⚠️ Cliente no encontrado en la respuesta, usando genérico (ID 1)');
          this.idClienteParaGuardar = 1;
        }
        
        this.guardarEnBaseDeDatosReal();
      },
      error: (err) => {
        console.warn('❌ Error buscando cliente, usando genérico (ID 1):', err);
        this.idClienteParaGuardar = 1;
        this.guardarEnBaseDeDatosReal();
      }
    });
  }

  cancelarDni() {
    this.solicitandoDni = false;
    this.mostrarOpcionesDocumento = true;
    this.dni = '';
  }

  confirmarFactura() {
    if (!this.ruc || this.ruc.length !== 11) {
      alert('Ingrese un RUC válido de 11 dígitos');
      return;
    }

    this.procesandoPago = true;
    this.tipoDocumento = 'factura';
    this.solicitandoRuc = false;
    this.mostrarMensajeFinal = true;

    console.log(`🔍 Buscando cliente RUC: ${this.ruc}`);
    this.clienteService.buscarClientePorDocumento(this.ruc).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del servicio:', response);
        
        let clienteEncontrado;
        
        if (response.cliente) {
          clienteEncontrado = response.cliente;
        } else if (response.ID_Cliente) {
          clienteEncontrado = response;
        } else {
          clienteEncontrado = response;
        }

        if (clienteEncontrado && clienteEncontrado.ID_Cliente) {
          this.idClienteParaGuardar = clienteEncontrado.ID_Cliente;
          console.log('✅ Cliente encontrado. ID_Cliente:', this.idClienteParaGuardar);
        } else {
          console.warn('⚠️ Cliente no encontrado en la respuesta, usando genérico (ID 1)');
          this.idClienteParaGuardar = 1;
        }
        
        this.guardarEnBaseDeDatosReal();
      },
      error: (err) => {
        console.warn('❌ Error buscando cliente, usando genérico (ID 1):', err);
        this.idClienteParaGuardar = 1;
        this.guardarEnBaseDeDatosReal();
      }
    });
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
    this.idClienteParaGuardar = 1;
    
    console.log('🔄 Iniciando guardado en BD para "NO, GRACIAS"');
    this.guardarEnBaseDeDatosReal();
  }

  // 🔹 ACTUALIZADO: Incluir Monto_Recibido en la venta
  guardarEnBaseDeDatosReal() {
    const productos = this.carritoService.obtenerProductos();
    const idCliente = this.idClienteParaGuardar;
    const idUsuario = 1;

    console.log('📦 Productos del carrito:', JSON.stringify(productos, null, 2));
    console.log(`👤 ID_Cliente: ${idCliente}, ID_Usuario: ${idUsuario}`);

    // ✅ CORRECCIÓN: Usar ID_Producto_T que ya incluye producto, tamaño y precio
    const detalles: PedidoDetalleCreacionDTO[] = productos.map(producto => {
      // 🔹 Obtener ID_Producto_T (campo principal)
      const idProductoT = producto.ID_Producto_T || producto.id_producto_t || 0;
      
      // 🔹 Obtener cantidad
      const cantidad = producto.cantidad || 1;
      
      console.log(`📝 Detalle: ID_Producto_T=${idProductoT}, Cantidad=${cantidad}`);
      
      return {
        ID_Producto_T: idProductoT, // ✅ Usar ID_Producto_T
        Cantidad: cantidad
      };
    });

    // Validar que todos los detalles tengan ID_Producto_T válido
    const detallesInvalidos = detalles.filter(d => !d.ID_Producto_T || d.ID_Producto_T === 0);
    if (detallesInvalidos.length > 0) {
      console.error('❌ ERROR: Hay productos sin ID_Producto_T válido:', detallesInvalidos);
      alert('Error: No se pudo identificar algunos productos. Por favor, intente nuevamente.');
      return;
    }

    let notasDePedido: string;
    if (this.tipoDocumento === null) {
      notasDePedido = `Pedido ${this.codigoPedido} - ${this.getMetodoPagoText()} - Kiosko Autoservicio`;
    } else {
      notasDePedido = `${this.getMetodoPagoText()} - Kiosko Autoservicio`;
    }

    const pedidoData: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: idUsuario,
      Notas: notasDePedido,
      Estado_P: 'P',
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: detalles
    };

    console.log('🚀 ENVIANDO PEDIDO CON ID_Producto_T:', JSON.stringify(pedidoData, null, 2));

    this.pedidoService.createPedido(pedidoData as any).subscribe({
      next: (response: any) => {
        console.log('✅ PEDIDO guardado exitosamente:', response);
        
        let pedidoId = null;
        if (response.ID_Pedido) {
          pedidoId = response.ID_Pedido;
        } else if (response.id_pedido) {
          pedidoId = response.id_pedido;
        } else if (response.pedidoId) {
          pedidoId = response.pedidoId;
        } else if (response.data?.ID_Pedido) {
          pedidoId = response.data.ID_Pedido;
        } else if (response.insertId) { 
          pedidoId = response.insertId;
        }
        
        if (pedidoId) {
          console.log(`🎉 ID_Pedido obtenido: ${pedidoId}`);
          this.guardarVentaEnBaseDeDatos(pedidoId);
        } else {
          console.warn('⚠️ No se pudo obtener ID_Pedido. No se guardará la Venta.', response);
          this.finalizarCompra();
        }
      },
      error: (error) => {
        console.error('❌ ERROR guardando pedido:', error);
        alert('Error al guardar el pedido. Por favor, intente nuevamente.');
      }
    });
  }

  // 🔹 ACTUALIZADO: Incluir Monto_Recibido en la venta
  guardarVentaEnBaseDeDatos(ID_Pedido: number) { 
    const ventaData: VentaCreacionDTO = {
      ID_Pedido: ID_Pedido,
      Tipo_Venta: this.tipoDocumento === 'factura' ? 'F' : 
                    this.tipoDocumento === 'boleta' ? 'B' : 'N',
      Metodo_Pago: this.getMetodoPagoCode(),
      Lugar_Emision: 'A',
      IGV_Porcentaje: 18,
      Monto_Recibido: this.montoRecibido // 🔹 NUEVO: Incluir monto recibido
    };

    console.log('💰 ENVIANDO VENTA:', JSON.stringify(ventaData, null, 2));
    
    this.ventaService.createVenta(ventaData).subscribe({
      next: (response: any) => {
        console.log('✅ VENTA guardada en BD:', response);
        this.finalizarCompra();
      },
      error: (error) => {
        console.error('❌ ERROR guardando venta:', error);
        console.log('🔄 Continuando sin guardar venta...');
        this.finalizarCompra();
      }
    });
  }

  // --- Métodos Helper y de Navegación (Con ajustes) ---

  getMetodoPagoCode(): 'E' | 'T' | 'B' {
    switch(this.opcionSeleccionada) {
      case 'efectivo': return 'E';
      case 'tarjeta': return 'T';
      case 'billetera': return 'B';
      case 'yape': return 'B';
      default: return 'E';
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

  // 🔹 NUEVO: Calcular vuelto
  calcularVuelto(): number {
    return Math.max(0, this.montoRecibido - this.total);
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
    console.log(`📝 Código de pedido generado: ${this.codigoPedido}`);
  }

  finalizarCompra() {
    console.log('🎊 COMPRA FINALIZADA - Vacíando carrito');
    this.carritoService.vaciarCarrito();
    console.log('✅ Carrito vaciado exitosamente');
    console.log('📋 RESUMEN DE COMPRA:', {
      codigoPedido: this.codigoPedido,
      total: this.total,
      montoRecibido: this.montoRecibido,
      vuelto: this.calcularVuelto(),
      tipoDocumento: this.tipoDocumento,
      metodoPago: this.getMetodoPagoText()
    });
  }

  volverAlInicio() {
    console.log('🏠 Volviendo al inicio...');
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
    this.solicitandoMontoEfectivo = false;
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
    this.solicitandoMontoEfectivo = false;
    this.dni = '';
    this.ruc = '';
    this.codigoPedido = '';
    this.mostrarCodigoPedido = false;
    this.codigoVerificacion = '';
    this.codigoEnviado = false;
    this.codigoCorrecto = '';
    this.verificandoCodigo = false;
    this.errorCodigo = false;
    this.montoRecibido = 0;
    this.idClienteParaGuardar = 1;
  }
}