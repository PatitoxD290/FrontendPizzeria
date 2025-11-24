import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios
import { CarritoService } from '../../../core/services/carrito.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth/auth.service';

// Modelos (DTOs)
import { PedidoCreacionDTO, PedidoDetalleDTO } from '../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../core/models/venta.model';
import { Cliente } from '../../../core/models/cliente.model';

// Utils
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DecimalPipe
  ],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css']
})
export class PagoComponent implements OnInit {

  // 🔹 Constantes de IDs (BD)
  readonly TIPO_PAGO = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
  readonly TIPO_VENTA = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
  readonly ORIGEN_VENTA = { KIOSKO: 3 }; // Asumiendo ID 3 para Kiosko

  // Estado del flujo
  total = 0;
  
  // Paso 1: Método de Pago
  selectedMetodoPago: number | null = null;
  montoRecibido: number = 0;
  vuelto: number = 0;
  
  // Paso 2: Comprobante
  pasoActual: 'pago' | 'comprobante' | 'documento' | 'final' = 'pago';
  selectedTipoComprobante: number | null = null;

  // Paso 3: Documento
  tipoDocumento: 'DNI' | 'RUC' | null = null;
  numeroDocumento: string = '';
  
  // Control UI
  recibeString: string = ''; // Para el teclado numérico
  procesando = false;
  codigoPedidoGenerado: string = '';
  clienteData: Cliente | null = null;

  // Verificación Código (Simulado)
  solicitandoCodigo = false;
  codigoVerificacion = '';

  constructor(
    private carritoService: CarritoService,
    private router: Router,
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.total = this.carritoService.obtenerTotal();
    if (this.total === 0) {
      this.router.navigate(['/kiosko/menu']);
    }
  }

  // ============================================================
  // 1️⃣ PASO 1: SELECCIÓN DE PAGO
  // ============================================================

  seleccionarMetodo(idMetodo: number) {
    this.selectedMetodoPago = idMetodo;
    
    if (idMetodo === this.TIPO_PAGO.EFECTIVO) {
      this.recibeString = '';
      this.montoRecibido = 0;
      this.vuelto = 0;
      // Se mantiene en la vista para ingresar monto
    } else {
      // Tarjeta/Billetera: Simulamos flujo de verificación
      this.montoRecibido = this.total;
      this.vuelto = 0;
      this.solicitandoCodigo = true; // Activa modal de código simulado
    }
  }

  // Lógica del Teclado Numérico (Efectivo)
  addNumber(num: string) {
    if (this.recibeString === '0') this.recibeString = num;
    else this.recibeString += num;
    this.calcularVuelto();
  }

  addDecimal() {
    if (!this.recibeString.includes('.')) {
      this.recibeString = this.recibeString ? this.recibeString + '.' : '0.';
    }
  }

  deleteLast() {
    this.recibeString = this.recibeString.slice(0, -1);
    this.calcularVuelto();
  }

  clearMonto() {
    this.recibeString = '';
    this.calcularVuelto();
  }

  calcularVuelto() {
    this.montoRecibido = parseFloat(this.recibeString) || 0;
    this.vuelto = Math.max(0, this.montoRecibido - this.total);
  }

  confirmarPagoEfectivo() {
    if (this.montoRecibido < this.total) {
      Swal.fire('Monto insuficiente', `Faltan S/ ${(this.total - this.montoRecibido).toFixed(2)}`, 'warning');
      return;
    }
    this.pasoActual = 'comprobante';
  }

<<<<<<< HEAD
  // Lógica de Verificación (Tarjeta/Yape)
  verificarCodigoSimulado() {
    // Simulamos espera
    this.procesando = true;
    setTimeout(() => {
      this.procesando = false;
      this.solicitandoCodigo = false;
      this.pasoActual = 'comprobante';
    }, 1500);
=======
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
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }

  cancelarVerificacion() {
    this.solicitandoCodigo = false;
    this.selectedMetodoPago = null;
  }

  // ============================================================
  // 2️⃣ PASO 2: SELECCIÓN DE COMPROBANTE
  // ============================================================

<<<<<<< HEAD
  seleccionarComprobante(idTipo: number) {
    this.selectedTipoComprobante = idTipo;

    if (idTipo === this.TIPO_VENTA.NOTA) {
      // Sin documento -> Cliente Varios (ID 1) directo
      this.procesarVentaFinal(1);
=======
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
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    } else {
      // Boleta/Factura -> Pedir documento
      this.tipoDocumento = (idTipo === this.TIPO_VENTA.FACTURA) ? 'RUC' : 'DNI';
      this.numeroDocumento = '';
      this.pasoActual = 'documento';
    }
  }

  // ============================================================
  // 3️⃣ PASO 3: DOCUMENTO CLIENTE
  // ============================================================

  // Teclado para DNI/RUC
  addDocNumber(num: string) {
    const maxLen = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (this.numeroDocumento.length < maxLen) {
      this.numeroDocumento += num;
    }
  }

  deleteDocLast() {
    this.numeroDocumento = this.numeroDocumento.slice(0, -1);
  }

  clearDoc() {
    this.numeroDocumento = '';
  }

  confirmarDocumento() {
    const len = this.numeroDocumento.length;
    const req = this.tipoDocumento === 'DNI' ? 8 : 11;

    if (len !== req) {
      Swal.fire('Error', `El ${this.tipoDocumento} debe tener ${req} dígitos.`, 'error');
      return;
    }

    this.procesando = true;
    
    // Buscar/Crear Cliente
    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        const cliente = res.cliente || res;
        this.clienteData = cliente;
        this.procesarVentaFinal(cliente.ID_Cliente);
      },
      error: (err) => {
        console.error(err);
        this.procesando = false;
        Swal.fire('Error', 'No se pudo validar el documento. Intente nuevamente.', 'error');
      }
    });
  }

  // ============================================================
  // 🚀 PROCESO FINAL: REGISTRO EN BD
  // ============================================================

  private procesarVentaFinal(idCliente: number) {
    this.procesando = true;

    // 1. Obtener items del carrito
    const itemsCarrito = this.carritoService.obtenerProductos();
    
    // 2. Generar código único visual
    this.generarCodigoPedido();

    // 3. Mapear detalles (usando DTO)
    const detallesDTO: PedidoDetalleDTO[] = itemsCarrito.map(i => ({
      ID_Producto_T: i.idProductoT || undefined,
      ID_Combo: i.idCombo || undefined,
      Cantidad: i.cantidad,
      PrecioTotal: i.precioTotal
    }));

    // 4. Pedido DTO - ✅ CORREGIDO: ID_Usuario = 1 (Usuario Sistema)
    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: 1, // Usamos 1 para indicar Kiosko/Sistema, ya que el backend espera un número
      Notas: `Kiosko - ${this.codigoPedidoGenerado}`,
      SubTotal: this.total,
      Estado_P: 'P',
      detalles: detallesDTO
    };

    // 5. Crear Pedido
    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedido = resPedido.ID_Pedido;

        // 6. Venta DTO - ✅ CORREGIDO: Eliminado IGV_Porcentaje
        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedido,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago!,
          ID_Origen_Venta: this.ORIGEN_VENTA.KIOSKO,
          Monto_Recibido: this.montoRecibido
          // IGV_Porcentaje eliminado, el backend lo calcula
        };

        // 7. Crear Venta
        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.procesando = false;
            this.pasoActual = 'final';
            
            // Generar PDF
            this.generarPDF(idPedido, resVenta.ID_Venta);
            
            // Limpiar carrito
            this.carritoService.vaciarCarrito();
          },
          error: (err) => {
            this.procesando = false;
            console.error('Error venta:', err);
            Swal.fire('Error', 'No se pudo registrar la venta.', 'error');
          }
        });
      },
      error: (err) => {
        this.procesando = false;
        console.error('Error pedido:', err);
        Swal.fire('Error', 'No se pudo crear el pedido.', 'error');
      }
    });
  }

  generarCodigoPedido() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.codigoPedidoGenerado = `K-${rand}`;
  }

  volverInicio() {
    this.router.navigate(['/']);
  }

  // ============================================================
  // 📄 GENERACIÓN DE PDF (Simplificada)
  // ============================================================
  
  generarPDF(idPedido: number, idVenta: number) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200]
    });

    const fecha = new Date().toLocaleString();
    let y = 10;

    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', 40, y, { align: 'center' }); y += 5;
    doc.setFontSize(8);
    doc.text('AITA PIZZA - KIOSKO', 40, y, { align: 'center' }); y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Venta: #${idVenta}`, 5, y); y += 4;
    doc.text(`Fecha: ${fecha}`, 5, y); y += 4;
    doc.text(`Pedido: ${this.codigoPedidoGenerado}`, 5, y); y += 6;
    
    // Cliente
    if (this.clienteData) {
      doc.text(`Cliente: ${this.clienteData.Nombre}`, 5, y); y += 4;
      doc.text(`Doc: ${this.numeroDocumento}`, 5, y); y += 6;
    }

    doc.line(5, y, 75, y); y += 4;

    doc.text('Detalle enviado a cocina.', 5, y); y += 6;
    
    doc.line(5, y, 75, y); y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${this.total.toFixed(2)}`, 75, y, { align: 'right' }); y += 10;

    doc.setFontSize(12);
    doc.text(`TURNO: ${this.codigoPedidoGenerado}`, 40, y, { align: 'center' });
    
    // Abrir
    window.open(doc.output('bloburl'), '_blank');
  }

  // Navegación interna
  volverAPago() {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      this.selectedMetodoPago = null; // Volver a selección
    } else {
      this.selectedMetodoPago = null;
      this.solicitandoCodigo = false;
    }
  }

  volverAComprobante() {
    this.pasoActual = 'comprobante';
    this.numeroDocumento = '';
  }
}