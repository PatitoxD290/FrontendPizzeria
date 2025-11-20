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

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ================================================================
// 🟢 INTERFACES DTO CORREGIDAS - USAR ID_Producto_T
// ================================================================

type PedidoCreacionDTO = Omit<Pedido, 'ID_Pedido' | 'PrecioTotal' | 'Estado_P' | 'SubTotal'> & {
  Estado_P?: 'P' | 'C' | 'E' | 'D';
  detalles: PedidoDetalleCreacionDTO[];
  ID_Usuario?: number | null;
};

type PedidoDetalleCreacionDTO = {
  ID_Producto_T: number;
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

  // Variables para monto recibido y vuelto
  montoRecibido: number = 0;
  solicitandoMontoEfectivo = false;

  // Variables para datos del cliente
  private idClienteParaGuardar: number = 1;
  private clienteData: any = null;

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
    
    if (opcion === 'efectivo') {
      this.solicitarMontoEfectivo();
    } else {
      this.montoRecibido = this.total;
    }
  }

  solicitarMontoEfectivo() {
    this.solicitandoMontoEfectivo = true;
    this.montoRecibido = this.total;
  }

  // Métodos para el teclado numérico del monto
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

  // --- Flujo de Verificación de Código ---

  simularPagoConfirmado() {
    if (this.opcionSeleccionada === 'tarjeta' || this.opcionSeleccionada === 'billetera' || this.opcionSeleccionada === 'yape') {
      this.solicitarCodigoVerificacion();
    } else {
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
        }
      },
      error: (error) => {
        console.error('Error enviando código:', error);
        this.codigoCorrecto = Math.floor(1000 + Math.random() * 9000).toString();
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
    this.mostrarErrorCodigo('Ingrese el código de verificación');
    return;
  }

  // Validar que sea exactamente 4 dígitos numéricos
  if (this.codigoVerificacion.length !== 4 || !/^\d+$/.test(this.codigoVerificacion)) {
    this.errorCodigo = true;
    this.mostrarErrorCodigo('El código debe tener 4 dígitos numéricos');
    return;
  }

  this.verificandoCodigo = true;
  this.errorCodigo = false;

  console.log('🔐 Verificando código:', this.codigoVerificacion);

  this.http.post('http://localhost:3000/api/v2/verificar-pago', {
    email: 'abnerluisnovoa@gmail.com',
    codigo: this.codigoVerificacion
  }).subscribe({
    next: (response: any) => {
      this.verificandoCodigo = false;
      console.log('✅ Respuesta del servidor:', response);
      
      if (response.success) {
        // ✅ CÓDIGO CORRECTO - Continuar con el proceso
        this.solicitandoCodigo = false;
        this.codigoVerificacion = '';
        this.errorCodigo = false;
        this.procesarPago();
      } else {
        // ❌ CÓDIGO INCORRECTO - Bloquear el proceso
        this.errorCodigo = true;
        this.codigoVerificacion = '';
        this.mostrarErrorCodigo(response.message || 'Código incorrecto');
      }
    },
    error: (error) => {
      this.verificandoCodigo = false;
      console.error('❌ Error verificando código:', error);
      
      // ❌ EN CASO DE ERROR DEL SERVIDOR, NO PERMITIR CONTINUAR
      this.errorCodigo = true;
      this.codigoVerificacion = '';
      this.mostrarErrorCodigo('Error al verificar el código. Intente nuevamente.');
      
      // ELIMINAR ESTA LÍNEA QUE PERMITÍA CONTINUAR CON CÓDIGOS INCORRECTOS:
      // if (this.codigoVerificacion.length === 4) {
      //   this.solicitandoCodigo = false;
      //   this.procesarPago();
      // }
    }
  });
}

// 🔹 NUEVO MÉTODO PARA MOSTRAR ERRORES DE CÓDIGO
mostrarErrorCodigo(mensaje: string) {
  this.errorCodigo = true;
  // Puedes mostrar un toast, alert o mantener el mensaje en la interfaz
  console.error('❌ Error en código:', mensaje);
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

  // --- Lógica de Procesamiento y Documento ---

procesarPago() {
  // Verificar que no estamos en medio de una verificación de código
  if (this.solicitandoCodigo || this.verificandoCodigo) {
    console.warn('⚠️ Intento de procesar pago durante verificación de código');
    return;
  }

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

  // --- Métodos de Teclados Numéricos ---
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
  // 🎯 MÉTODOS PARA GENERAR PDFs - BOLETA Y FACTURA
  // ================================================================

  confirmarBoleta() {
    if (!this.dni || this.dni.length !== 8) {
      alert('Ingrese un DNI válido de 8 dígitos');
      return;
    }

    this.procesandoPago = true;
    this.tipoDocumento = 'boleta';
    this.solicitandoDni = false;

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
          this.clienteData = clienteEncontrado;
          console.log('✅ Cliente encontrado. ID_Cliente:', this.idClienteParaGuardar);
        } else {
          console.warn('⚠️ Cliente no encontrado en la respuesta, usando genérico (ID 1)');
          this.idClienteParaGuardar = 1;
          this.clienteData = { 
            Nombre: 'CLIENTE GENERAL',
            DNI: this.dni,
            Direccion: 'LIMA - LIMA'
          };
        }
        
        this.guardarEnBaseDeDatosReal();
      },
      error: (err) => {
        console.warn('❌ Error buscando cliente, usando genérico (ID 1):', err);
        this.idClienteParaGuardar = 1;
        this.clienteData = { 
          Nombre: 'CLIENTE GENERAL',
          DNI: this.dni,
          Direccion: 'LIMA - LIMA'
        };
        this.guardarEnBaseDeDatosReal();
      }
    });
  }

  cancelarDni() {
  this.solicitandoDni = false;
  this.mostrarOpcionesDocumento = true;
  this.dni = '';
}

// 🔹 AGREGAR ESTE MÉTODO FALTANTE
cancelarRuc() {
  this.solicitandoRuc = false;
  this.mostrarOpcionesDocumento = true;
  this.ruc = '';
}

  confirmarFactura() {
    if (!this.ruc || this.ruc.length !== 11) {
      alert('Ingrese un RUC válido de 11 dígitos');
      return;
    }

    this.procesandoPago = true;
    this.tipoDocumento = 'factura';
    this.solicitandoRuc = false;

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
          this.clienteData = clienteEncontrado;
          console.log('✅ Cliente encontrado. ID_Cliente:', this.idClienteParaGuardar);
        } else {
          console.warn('⚠️ Cliente no encontrado en la respuesta, usando genérico (ID 1)');
          this.idClienteParaGuardar = 1;
          this.clienteData = { 
            Razon_Social: 'CLIENTE GENERAL',
            RUC: this.ruc,
            Direccion: 'LIMA - LIMA'
          };
        }
        
        this.guardarEnBaseDeDatosReal();
      },
      error: (err) => {
        console.warn('❌ Error buscando cliente, usando genérico (ID 1):', err);
        this.idClienteParaGuardar = 1;
        this.clienteData = { 
          Razon_Social: 'CLIENTE GENERAL',
          RUC: this.ruc,
          Direccion: 'LIMA - LIMA'
        };
        this.guardarEnBaseDeDatosReal();
      }
    });
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

// ================================================================
// 🎯 MÉTODOS PARA GENERAR PDFs - CORREGIDOS CON TAMAÑO DE BOLETA/FACTURA
// ================================================================

generarBoletaPDF(pedidoId: number) {
  // Tamaño: 58mm x 297mm (formato ticket largo)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 297]
  });
  
  const productos = this.carritoService.obtenerProductos();
  const fecha = new Date();
  
  // Formatear fecha y hora
  const fechaStr = fecha.toLocaleDateString('es-PE');
  const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  // Número de boleta (simulado)
  const numeroBoleta = `BP01-${pedidoId.toString().padStart(7, '0')}`;

  // Configuración inicial - MÁRGENES 4mm EN AMBOS LADOS
  const pageWidth = 58;
  const marginLeft = 4; // Margen izquierdo 4mm
  const marginRight = 4; // Margen derecho 4mm
  const contentWidth = pageWidth - (marginLeft + marginRight); // Ancho disponible para contenido
  let yPosition = 8;

  // ========== ENCABEZADO PRINCIPAL ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BOLETA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  doc.setFontSize(9);
  doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  
  doc.setFontSize(7);
  doc.text('Jr. 2 de Mayo - Yarina', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 3;
  doc.text('Pucallpa, Ucayali', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // ========== LÍNEA SEPARADORA ==========
  doc.setLineWidth(0.2);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== INFORMACIÓN DEL DOCUMENTO ==========
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`BOLETA: ${numeroBoleta}`, marginLeft, yPosition);
  yPosition += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${fechaStr} ${horaStr}`, marginLeft, yPosition);
  yPosition += 3;
  doc.text(`Canal: Autoservicio`, marginLeft, yPosition);
  yPosition += 3;
  
  // ========== INFORMACIÓN DEL CLIENTE ==========
  // Nombre completo (Nombre + Apellido)
  const nombreCompleto = `${this.clienteData?.Nombre || ''} ${this.clienteData?.Apellido || ''}`.trim();
  const clienteText = `Cliente: ${nombreCompleto || '—'}`;
  const clienteLines = doc.splitTextToSize(clienteText, contentWidth);
  doc.text(clienteLines, marginLeft, yPosition);
  yPosition += clienteLines.length * 3;
  
  // DNI del cliente
  const dniText = `DNI: ${this.clienteData?.DNI || '—'}`;
  doc.text(dniText, marginLeft, yPosition);
  yPosition += 4;

  // ========== LÍNEA SEPARADORA ==========
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== DETALLE DE PRODUCTOS ==========
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  // Cabecera de tabla - COLUMNAS MÁS A LA IZQUIERDA
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition); // Precio más a la izquierda (antes 25)
  doc.text('Cant', 30, yPosition); // Cant más a la izquierda pero no tanto (antes 35)
  doc.text('Total', 48, yPosition, { align: 'right' }); // Total mantiene posición
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // Productos
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    const nombre = producto.nombre || 'Producto';
    const cantidad = producto.cantidad || 1;
    const precio = producto.precio || 0;
    const total = precio * cantidad;
    
    // Truncar nombre para caber en el ancho disponible (más espacio ahora)
    const nombreTruncado = nombre.length > 18 ? nombre.substring(0, 18) + '...' : nombre; // Más caracteres disponibles
    
    // Una sola línea con todas las columnas
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precio.toFixed(2)}`, 20, yPosition); // Precio más a la izquierda
    doc.text(cantidad.toString(), 33, yPosition); // Cant más a la izquierda pero no tanto
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' }); // Total mantiene posición
    yPosition += 4; // Un solo incremento de posición
    
    // Verificar si necesitamos nueva página
    if (yPosition > 285) {
      doc.addPage([58, 297]);
      yPosition = 8;
    }
  });

  // ========== LÍNEA SEPARADORA ANTES DE TOTAL ==========
  yPosition += 2;
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== TOTALES ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, marginLeft, yPosition);
  yPosition += 5;
  
  doc.setFontSize(8);
  doc.text(`Pago: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
  yPosition += 3;
  doc.text(`Vuelto: S/ ${this.calcularVuelto().toFixed(2)}`, marginLeft, yPosition);
  yPosition += 5;

  // ========== MONTO EN LETRAS ==========
  const montoEnLetras = this.convertirNumeroALetras(this.total);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const lineas = doc.splitTextToSize(`SON: ${montoEnLetras}`, contentWidth);
  doc.text(lineas, marginLeft, yPosition);
  yPosition += lineas.length * 2.5 + 4;

  // ========== INFORMACIÓN LEGAL ==========
  doc.setFontSize(5);
  const leyenda = 'Exonerado IGV Ley 27037 - Zona Oriente';
  const leyendaLines = doc.splitTextToSize(leyenda, contentWidth);
  doc.text(leyendaLines, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += leyendaLines.length * 2.5 + 4;

  // ========== MENSAJE FINAL ==========
  doc.setFontSize(7);
  doc.text('¡Gracias por tu compra!', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('@AITA.PIZZA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 3;
  doc.setFont('helvetica', 'italic');
  doc.text('"Sabor auténtico"', pageWidth / 2, yPosition, { align: 'center' });

  // Abrir en nueva ventana
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  
  this.mostrarMensajeFinal = true;
}

generarFacturaPDF(pedidoId: number) {
  // Tamaño: 58mm x 297mm (formato ticket largo)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 297]
  });
  
  const productos = this.carritoService.obtenerProductos();
  const fecha = new Date();
  
  // Formatear fecha y hora
  const fechaStr = fecha.toLocaleDateString('es-PE');
  const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  
  // Número de factura (simulado)
  const numeroFactura = `F001-${pedidoId.toString().padStart(7, '0')}`;

  // Configuración inicial - MÁRGENES 4mm EN AMBOS LADOS
  const pageWidth = 58;
  const marginLeft = 4;
  const marginRight = 4;
  const contentWidth = pageWidth - (marginLeft + marginRight);
  let yPosition = 8;

  // ========== ENCABEZADO PRINCIPAL ==========
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  doc.setFontSize(9);
  doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  
  doc.setFontSize(7);
  doc.text('Jr. 2 de Mayo - Yarina', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 3;
  doc.text('Pucallpa, Ucayali', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  // ========== LÍNEA SEPARADORA ==========
  doc.setLineWidth(0.2);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== INFORMACIÓN DEL DOCUMENTO ==========
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURA: ${numeroFactura}`, marginLeft, yPosition);
  yPosition += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${fechaStr} ${horaStr}`, marginLeft, yPosition);
  yPosition += 3;
  doc.text(`Canal: Autoservicio`, marginLeft, yPosition);
  yPosition += 3;
  
  // ========== INFORMACIÓN DEL CLIENTE ==========
  // Razón Social usando el campo Nombre
  const razonSocial = this.clienteData?.Nombre || 'CLIENTE';
  const razonSocialLines = doc.splitTextToSize(`Cliente: ${razonSocial}`, contentWidth);
  doc.text(razonSocialLines, marginLeft, yPosition);
  yPosition += razonSocialLines.length * 3;
  
  // RUC usando el campo DNI
  doc.text(`RUC: ${this.clienteData?.DNI || '—'}`, marginLeft, yPosition);
  yPosition += 3;
  
  // Se eliminó la sección de dirección
  
  doc.text(`Condición: Contado`, marginLeft, yPosition);
  yPosition += 5;

  // ========== LÍNEA SEPARADORA ==========
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== DETALLE DE PRODUCTOS ==========
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE VENTA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  // Cabecera de tabla - MISMAS COLUMNAS QUE BOLETA
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition); // Nueva columna Precio
  doc.text('Cant', 33, yPosition); // Misma posición que boleta
  doc.text('Total', 48, yPosition, { align: 'right' }); // Misma posición que boleta
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // Productos - Mismo formato que boleta
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    const nombre = producto.nombre || 'Producto';
    const cantidad = producto.cantidad || 1;
    const precio = producto.precio || 0;
    const total = precio * cantidad;
    
    // Truncar nombre para caber en el ancho disponible
    const nombreTruncado = nombre.length > 18 ? nombre.substring(0, 18) + '...' : nombre;
    
    // Una sola línea con todas las columnas
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precio.toFixed(2)}`, 20, yPosition); // Precio
    doc.text(cantidad.toString(), 33, yPosition); // Cantidad
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' }); // Total
    yPosition += 4; // Un solo incremento de posición
    
    if (yPosition > 285) {
      doc.addPage([58, 297]);
      yPosition = 8;
    }
  });

  // ========== LÍNEA SEPARADORA ANTES DE TOTAL ==========
  yPosition += 2;
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== TOTALES ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, marginLeft, yPosition);
  yPosition += 5;
  
  doc.setFontSize(8);
  doc.text(`Pago: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
  yPosition += 3;
  doc.text(`Vuelto: S/ ${this.calcularVuelto().toFixed(2)}`, marginLeft, yPosition);
  yPosition += 5;

  // ========== MONTO EN LETRAS ==========
  const montoEnLetras = this.convertirNumeroALetras(this.total);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const lineas = doc.splitTextToSize(`SON: ${montoEnLetras}`, contentWidth);
  doc.text(lineas, marginLeft, yPosition);
  yPosition += lineas.length * 2.5 + 5;

  // ========== MENSAJE FINAL ==========
  doc.setFontSize(7);
  doc.text('¡Gracias por su compra!', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('@AITA.PIZZA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 3;
  doc.setFont('helvetica', 'italic');
  doc.text('"Sabor auténtico"', pageWidth / 2, yPosition, { align: 'center' });

  // Abrir en nueva ventana
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
  
  this.mostrarMensajeFinal = true;
}

generarBoletaSimplePDF() {
  // Tamaño: 58mm x 180mm (más largo para mejor organización)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [58, 180]
  });
  
  const productos = this.carritoService.obtenerProductos();
  const fecha = new Date();
  
  // Formatear fecha y hora
  const fechaStr = fecha.toLocaleDateString('es-PE');
  const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  // Configuración inicial - MÁRGENES 4mm EN AMBOS LADOS
  const pageWidth = 58;
  const marginLeft = 4;
  const marginRight = 4;
  const contentWidth = pageWidth - (marginLeft + marginRight);
  let yPosition = 8;

  // ========== ENCABEZADO PRINCIPAL ==========
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('DE PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  
  doc.setFontSize(8);
  doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  
  doc.setFont('helvetica', 'normal');
  doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;

  // ========== LÍNEA SEPARADORA ==========
  doc.setLineWidth(0.2);
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== INFORMACIÓN DEL PEDIDO ==========
  doc.setFontSize(7);
  doc.text(`Fecha: ${fechaStr} ${horaStr}`, marginLeft, yPosition);
  yPosition += 4;
  doc.text(`Código: ${this.codigoPedido}`, marginLeft, yPosition);
  yPosition += 4;
  doc.text(`Método: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
  yPosition += 6;

  // ========== LÍNEA SEPARADORA ==========
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== DETALLE DE PRODUCTOS ==========
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  // Cabecera de tabla - MISMAS COLUMNAS QUE BOLETA
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition); // Nueva columna Precio
  doc.text('Cant', 33, yPosition); // Misma posición que boleta
  doc.text('Total', 48, yPosition, { align: 'right' }); // Misma posición que boleta
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // Productos - Mismo formato que boleta
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    const nombre = producto.nombre || 'Producto';
    const cantidad = producto.cantidad || 1;
    const precio = producto.precio || 0;
    const total = precio * cantidad;
    
    // Truncar nombre para caber en el ancho disponible
    const nombreTruncado = nombre.length > 18 ? nombre.substring(0, 18) + '...' : nombre;
    
    // Una sola línea con todas las columnas
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precio.toFixed(2)}`, 20, yPosition); // Precio
    doc.text(cantidad.toString(), 33, yPosition); // Cantidad
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' }); // Total
    yPosition += 4; // Un solo incremento de posición
  });

  // ========== LÍNEA SEPARADORA ANTES DE TOTAL ==========
  yPosition += 2;
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== TOTAL ==========
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, marginLeft, yPosition);
  yPosition += 6;

  // ========== CÓDIGO DE PEDIDO DESTACADO ==========
  doc.setFontSize(9);
  doc.text('CÓDIGO PEDIDO:', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(this.codigoPedido, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  // ========== MENSAJE IMPORTANTE ==========
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Presente este código', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 3;
  doc.text('para recoger su pedido', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  doc.text('¡Gracias por su compra!', pageWidth / 2, yPosition, { align: 'center' });

  // Abrir en nueva ventana
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

// ================================================================
// 🔢 MÉTODO PARA CONVERTIR NÚMERO A LETRAS
// ================================================================

convertirNumeroALetras(numero: number): string {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const entero = Math.floor(numero);
  const decimal = Math.round((numero - entero) * 100);

  if (entero === 0) {
    return `cero con ${decimal.toString().padStart(2, '0')}/100 soles`;
  }

  let letras = '';

  // Miles
  if (entero >= 1000) {
    const miles = Math.floor(entero / 1000);
    if (miles === 1) {
      letras += 'mil ';
    } else {
      letras += this.convertirCentenas(miles) + ' mil ';
    }
  }

  // Centenas restantes
  const resto = entero % 1000;
  letras += this.convertirCentenas(resto);

  // Eliminar espacios extra y capitalizar primera letra
  letras = letras.trim();
  if (letras.length > 0) {
    letras = letras.charAt(0).toUpperCase() + letras.slice(1);
  }

  return `${letras} con ${decimal.toString().padStart(2, '0')}/100 soles`;
}

convertirCentenas(numero: number): string {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (numero === 100) return 'cien';
  
  const c = Math.floor(numero / 100);
  const r = numero % 100;
  const d = Math.floor(r / 10);
  const u = r % 10;

  let resultado = '';

  if (c > 0) {
    resultado += centenas[c] + ' ';
  }

  if (r === 0) {
    return resultado.trim();
  }

  if (r < 10) {
    resultado += unidades[r];
  } else if (r < 20) {
    resultado += especiales[r - 10];
  } else {
    resultado += decenas[d];
    if (u > 0) {
      resultado += ' y ' + unidades[u];
    }
  }

  return resultado.trim();
}

  // ================================================================
  // 🔄 MÉTODOS DE GUARDADO ACTUALIZADOS
  // ================================================================

guardarEnBaseDeDatosReal() {
  const productos = this.carritoService.obtenerProductos();
  const idCliente = this.idClienteParaGuardar;
  const idUsuario = null;

  console.log('📦 Productos del carrito:', JSON.stringify(productos, null, 2));

  // 🔹 CORRECCIÓN: Agrupar complementos por combo y crear un solo registro por combo
  const detalles: any[] = [];
  const combosProcesados = new Set<number>();

  for (const producto of productos) {
    // 🔹 SI ES UN COMBO PRINCIPAL
    if (producto.esCombo && producto.ID_Combo && !combosProcesados.has(producto.ID_Combo)) {
      // Buscar todos los complementos asociados a este combo
      const complementosDelCombo = productos.filter(p => 
        p.esComplementoCombo && p.ID_Combo_Asociado === producto.ID_Combo
      );

      // 🔹 CREAR UN SOLO REGISTRO PARA EL COMBO + TODOS SUS COMPLEMENTOS
      const detalleCombo = {
        ID_Combo: producto.ID_Combo,
        Cantidad: producto.cantidad || 1,
        Precio: producto.precio || producto.Precio || 0,
        // 🔹 NUEVO: Incluir información de complementos en el mismo registro
        Complementos: complementosDelCombo.map(comp => ({
          ID_Producto_T: comp.ID_Producto_T,
          Precio: comp.precio || 0
        }))
      };

      detalles.push(detalleCombo);
      combosProcesados.add(producto.ID_Combo); // Marcar como procesado
      
      console.log(`🔍 Combo ${producto.ID_Combo} procesado con ${complementosDelCombo.length} complementos`);

    } 
    // 🔹 SI ES UN PRODUCTO INDIVIDUAL (NO ES COMPLEMENTO DE COMBO)
    else if (producto.ID_Producto_T && !producto.esComplementoCombo && !producto.esCombo) {
      const detalleProducto = {
        ID_Producto_T: producto.ID_Producto_T,
        Cantidad: producto.cantidad || 1,
        Precio: producto.precio || producto.Precio || 0
      };
      detalles.push(detalleProducto);
      
      console.log(`🔍 Producto individual ${producto.ID_Producto_T} agregado`);
    }
    // 🔹 LOS COMPLEMENTOS DE COMBOS SE IGNORAN AQUÍ PORQUE YA SE PROCESARON CON SU COMBO
  }

  console.log('📋 Detalles finales a enviar:', JSON.stringify(detalles, null, 2));

  // Validar que hay detalles
  if (detalles.length === 0) {
    console.error('❌ ERROR: No hay detalles válidos para enviar');
    alert('Error: No se pudo procesar el pedido. Por favor, intente nuevamente.');
    return;
  }

  const detallesInvalidos = detalles.filter(d => 
    (!d.ID_Producto_T && !d.ID_Combo)
  );
  
  if (detallesInvalidos.length > 0) {
    console.error('❌ ERROR: Hay productos sin ID válido:', detallesInvalidos);
    alert('Error: No se pudo identificar algunos productos. Por favor, intente nuevamente.');
    return;
  }

  let notasDePedido: string;
  if (this.tipoDocumento === null) {
    notasDePedido = `Pedido ${this.codigoPedido} - ${this.getMetodoPagoText()} - Kiosko Autoservicio`;
  } else {
    notasDePedido = `${this.getMetodoPagoText()} - Kiosko Autoservicio`;
  }

  const pedidoData = {
    ID_Cliente: idCliente,
    ID_Usuario: idUsuario,
    Notas: notasDePedido,
    Estado_P: 'P',
    Fecha_Registro: new Date().toISOString().split('T')[0],
    Hora_Pedido: new Date().toTimeString().split(' ')[0],
    detalles: detalles
  };

  console.log('🚀 ENVIANDO PEDIDO CON DETALLES CORREGIDOS:', JSON.stringify(pedidoData, null, 2));

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
        
        // Generar el PDF correspondiente según el tipo de documento
        if (this.tipoDocumento === 'boleta') {
          this.generarBoletaPDF(pedidoId);
        } else if (this.tipoDocumento === 'factura') {
          this.generarFacturaPDF(pedidoId);
        } else {
          this.generarBoletaSimplePDF();
        }
        
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

  guardarVentaEnBaseDeDatos(ID_Pedido: number) { 
    const ventaData: VentaCreacionDTO = {
      ID_Pedido: ID_Pedido,
      Tipo_Venta: this.tipoDocumento === 'factura' ? 'F' : 
                    this.tipoDocumento === 'boleta' ? 'B' : 'N',
      Metodo_Pago: this.getMetodoPagoCode(),
      Lugar_Emision: 'A',
      IGV_Porcentaje: 18,
      Monto_Recibido: this.montoRecibido
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

  // --- Métodos Helper ---

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
    this.clienteData = null;
  }
}