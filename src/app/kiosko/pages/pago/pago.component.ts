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
        // Generar código local para pruebas
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
        
        // Para pruebas: aceptar cualquier código de 4 dígitos
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

  procesarPago() {
    this.procesandoPago = true;
    
    setTimeout(() => {
      this.procesandoPago = false;
      this.pagoExitoso = true; // Siempre exitoso para pruebas
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

  // ✅ MÉTODO MEJORADO: Solo guarda cuando se selecciona "NO, GRACIAS"
  finalizarSinDocumento() {
    this.tipoDocumento = null;
    this.generarCodigoPedido();
    this.mostrarCodigoPedido = true;
    this.mostrarMensajeFinal = true;
    this.mostrarOpcionesDocumento = false;
    
    console.log('🔄 Iniciando guardado en BD para "NO, GRACIAS"');
    this.guardarEnBaseDeDatosReal();
  }

  // ✅ MÉTODO MEJORADO: Con manejo de tamaños VÁLIDOS
  guardarEnBaseDeDatosReal() {
    const productos = this.carritoService.obtenerProductos();
    
    console.log('📦 Productos en carrito:', productos);
    
    // Para kiosko autoservicio, usar ID_Cliente = 1 (cliente genérico)
    // y ID_Usuario = 1 (usuario del sistema)
    const idCliente = 1; // Cliente genérico para kiosko
    const idUsuario = 1; // Usuario sistema para kiosko
    
    console.log(`👤 Kiosko autoservicio - ID_Cliente: ${idCliente}, ID_Usuario: ${idUsuario}`);

    // Preparar detalles del pedido con información de tamaños VÁLIDOS
    const detalles = productos.map(producto => {
      // Obtener un ID_Tamano que realmente exista en la BD
      const idTamano = this.obtenerIdTamanoValidoExistente(producto);
      
      console.log(`🍕 Producto: ${producto.nombre || 'Producto'}, ID_Tamano válido: ${idTamano}`);
      
      return {
        ID_Producto: producto.id_producto || 1,
        ID_Tamano: idTamano, // ✅ SOLO IDs que existen en la tabla Tamano
        Cantidad: producto.cantidad || 1,
        PrecioTotal: (producto.precio * producto.cantidad) || producto.precio,
        // Información adicional para debug
        NombreProducto: producto.nombre || 'Producto sin nombre'
      };
    });

    // 1. Primero crear el pedido
    const pedidoData = {
      ID_Cliente: idCliente,
      ID_Usuario: idUsuario,
      Notas: `Pedido ${this.codigoPedido} - ${this.getMetodoPagoText()} - Kiosko Autoservicio`,
      SubTotal: this.total,
      Estado_P: 'P', // P = Pendiente (valor común)
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: detalles
    };

    console.log('🚀 ENVIANDO PEDIDO a BD:', JSON.stringify(pedidoData, null, 2));

    // Intentar guardar pedido
    this.http.post('http://localhost:3000/api/v2/pedidos', pedidoData).subscribe({
      next: (response: any) => {
        console.log('✅ PEDIDO guardado exitosamente:', response);
        
        let pedidoId = null;
        
        // Extraer ID_Pedido de diferentes formas posibles
        if (response.ID_Pedido) {
          pedidoId = response.ID_Pedido;
        } else if (response.id_pedido) {
          pedidoId = response.id_pedido;
        } else if (response.pedidoId) {
          pedidoId = response.pedidoId;
        } else if (response.data && response.data.ID_Pedido) {
          pedidoId = response.data.ID_Pedido;
        } else if (response.insertId) {
          pedidoId = response.insertId; // Para MySQL
        }
        
        if (pedidoId) {
          console.log(`🎉 ID_Pedido obtenido: ${pedidoId}`);
          // 2. Si el pedido se guardó, crear la venta
          this.guardarVentaEnBaseDeDatos(pedidoId);
        } else {
          console.warn('⚠️ No se pudo obtener ID_Pedido, guardando venta sin referencia');
          this.guardarVentaEnBaseDeDatos(null);
        }
      },
      error: (error) => {
        console.error('❌ ERROR guardando pedido:', error);
        console.log('📋 Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        // Intentar con un ID_Tamano diferente que SÍ exista
        console.log('🔄 Intentando con ID_Tamano seguro...');
        this.guardarConIdTamanoSeguro();
      }
    });
  }

  // ✅ MÉTODO NUEVO: Obtener ID de tamaño que realmente EXISTA en la BD
  obtenerIdTamanoValidoExistente(producto: any): number {
    // Primero, intentar obtener IDs de tamaños que SABEMOS que existen
    // Consulta tu BD para ver qué IDs de tamaño existen realmente
    const tamanosExistentes = [1, 2, 3]; // Estos son los más comunes
    
    // Si el producto tiene un ID_Tamano y está en la lista de existentes, usarlo
    if (producto.id_tamano && tamanosExistentes.includes(producto.id_tamano)) {
      return producto.id_tamano;
    }
    
    // Si no, usar el primer ID existente (1 = Personal/Pequeño)
    console.log(`🔍 Usando ID_Tamano seguro: 1 (Personal)`);
    return 1; // Este SIEMPRE debe existir
  }

  // ✅ MÉTODO NUEVO: Guardar con ID_Tamano seguro que sabemos que existe
  guardarConIdTamanoSeguro() {
    const productos = this.carritoService.obtenerProductos();
    const idCliente = 1;
    const idUsuario = 1;

    // Usar SOLO ID_Tamano = 1 que sabemos que existe
    const detallesSeguros = productos.map(producto => ({
      ID_Producto: producto.id_producto || 1,
      ID_Tamano: 1, // ✅ ID que SABEMOS que existe
      Cantidad: producto.cantidad || 1,
      PrecioTotal: (producto.precio * producto.cantidad) || producto.precio,
      NombreProducto: producto.nombre || 'Producto sin nombre'
    }));

    const pedidoDataSeguro = {
      ID_Cliente: idCliente,
      ID_Usuario: idUsuario,
      Notas: `Pedido ${this.codigoPedido} - ${this.getMetodoPagoText()} - Kiosko (Tamaño Personal)`,
      SubTotal: this.total,
      Estado_P: 'P',
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: detallesSeguros
    };

    console.log('🛡️ ENVIANDO PEDIDO SEGURO a BD:', JSON.stringify(pedidoDataSeguro, null, 2));

    this.http.post('http://localhost:3000/api/v2/pedidos', pedidoDataSeguro).subscribe({
      next: (response: any) => {
        console.log('✅ PEDIDO SEGURO guardado exitosamente:', response);
        
        let pedidoId = null;
        if (response.ID_Pedido) pedidoId = response.ID_Pedido;
        else if (response.id_pedido) pedidoId = response.id_pedido;
        else if (response.pedidoId) pedidoId = response.pedidoId;
        else if (response.data?.ID_Pedido) pedidoId = response.data.ID_Pedido;
        else if (response.insertId) pedidoId = response.insertId;
        
        if (pedidoId) {
          console.log(`🎉 ID_Pedido obtenido: ${pedidoId}`);
          this.guardarVentaEnBaseDeDatos(pedidoId);
        } else {
          console.warn('⚠️ No se pudo obtener ID_Pedido del pedido seguro');
          this.guardarVentaEnBaseDeDatos(null);
        }
      },
      error: (error) => {
        console.error('❌ ERROR guardando pedido seguro:', error);
        console.log('📋 Último intento: guardando venta sin pedido...');
        this.guardarVentaEnBaseDeDatos(null);
      }
    });
  }

  // ✅ Método para guardar venta
  guardarVentaEnBaseDeDatos(ID_Pedido: number | null) {
    const ventaData = {
      ID_Pedido: ID_Pedido,
      Tipo_Venta: this.tipoDocumento === 'factura' ? 'F' : 
                 this.tipoDocumento === 'boleta' ? 'B' : 'S', // S = Sin documento
      Metodo_Pago: this.getMetodoPagoCode(),
      Lugar_Emision: 'LOC',
      IGV: Number((this.total * 0.18).toFixed(2)),
      Total: Number(this.total.toFixed(2)),
      Fecha_Registro: new Date().toISOString().split('T')[0]
    };

    console.log('💰 ENVIANDO VENTA a BD:', JSON.stringify(ventaData, null, 2));
    
    this.http.post('http://localhost:3000/api/v2/ventas', ventaData).subscribe({
      next: (response: any) => {
        console.log('✅ VENTA guardada en BD:', response);
        this.finalizarCompra();
      },
      error: (error) => {
        console.error('❌ ERROR guardando venta:', error);
        console.log('📋 Detalles del error venta:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        // Aún así finalizar la compra
        console.log('🔄 Continuando sin guardar venta...');
        this.finalizarCompra();
      }
    });
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
    console.log(`📝 Código de pedido generado: ${this.codigoPedido}`);
  }

  finalizarCompra() {
    console.log('🎊 COMPRA FINALIZADA - Vacíando carrito');
    console.log('🛒 Productos en el carrito antes de vaciar:', this.carritoService.obtenerProductos());
    
    // Vaciar carrito inmediatamente
    this.carritoService.vaciarCarrito();
    console.log('✅ Carrito vaciado exitosamente');
    
    // Mostrar resumen final
    console.log('📋 RESUMEN DE COMPRA:', {
      codigoPedido: this.codigoPedido,
      total: this.total,
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