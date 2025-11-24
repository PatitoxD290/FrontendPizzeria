import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { VentaService } from '../../../../core/services/venta.service';
import { PedidoService } from '../../../../core/services/pedido.service';
import { ClienteService } from '../../../../core/services/cliente.service';
import { PedidoDetalle, PedidoCreacionDTO } from '../../../../core/models/pedido.model';
import { VentaCreacionDTO } from '../../../../core/models/venta.model';
import { Cliente } from '../../../../core/models/cliente.model';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-venta-pedido',
  standalone: true,
  imports: [
    CommonModule,  
    FormsModule,
    DecimalPipe,   
    MatDialogModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './venta-pedido.component.html',
  styleUrl: './venta-pedido.component.css'
})
export class VentaPedidoComponent implements OnInit {

  // 🔹 Constantes de IDs (Según tu BD)
  readonly TIPO_PAGO = { EFECTIVO: 1, BILLETERA: 2, TARJETA: 3 };
  readonly TIPO_VENTA = { BOLETA: 1, FACTURA: 2, NOTA: 3 };
  readonly ORIGEN_VENTA = { MOSTRADOR: 1 };

  // 🔹 Paso 1: Método de pago
  selectedMetodoPago: number = this.TIPO_PAGO.EFECTIVO;
  recibe: string = ''; // String para manejar input manual
  vuelto: number = 0;

  // 🔹 Paso 2: Tipo de comprobante
  pasoActual: 'pago' | 'comprobante' | 'documento' = 'pago';
  selectedTipoComprobante: number | null = null;

  // 🔹 Paso 3: Datos del documento
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';
  numeroDocumento: string = '';

  // 🔹 Estado
  cargando: boolean = false;
  clienteData: Cliente | null = null;

  constructor(
    public dialogRef: MatDialogRef<VentaPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      total: number, 
      codigoPedido: string, 
      idUsuario: number,
      detalles: PedidoDetalle[]
    },
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    // Si el total es 0, podría ser una cortesía, pero asumimos pago normal
  }

  // ============================================================
  // 1️⃣ LÓGICA DE PAGO (CALCULADORA)
  // ============================================================

  calcularVuelto() {
    const recibeNum = parseFloat(this.recibe) || 0;
    this.vuelto = Math.max(0, recibeNum - this.data.total);
  }

  onRecibeChange() {
    this.calcularVuelto();
  }

  addNumber(num: string) {
    if (this.recibe === '0') this.recibe = num;
    else this.recibe += num;
    this.calcularVuelto();
  }

  deleteLast() {
    if (this.recibe.length > 0) {
      this.recibe = this.recibe.slice(0, -1);
      this.calcularVuelto();
    }
  }

  clearRecibe() {
    this.recibe = '';
    this.vuelto = 0;
  }

  addDecimal() {
    if (!this.recibe.includes('.')) {
      this.recibe = this.recibe ? this.recibe + '.' : '0.';
    }
  }

  setMontoExacto() {
    this.recibe = this.data.total.toString();
    this.calcularVuelto();
  }

  validarPago(): boolean {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      const recibeNum = parseFloat(this.recibe) || 0;
      
      if (!this.recibe) {
        Swal.fire('Monto requerido', 'Ingrese el monto recibido.', 'warning');
        return false;
      }
      if (recibeNum < this.data.total) {
        Swal.fire('Monto insuficiente', `Faltan S/ ${(this.data.total - recibeNum).toFixed(2)}`, 'error');
        return false;
      }
    } else {
      // Para tarjeta/billetera asumimos pago exacto
      this.recibe = this.data.total.toString();
      this.vuelto = 0;
    }
    return true;
  }

  confirmarPago() {
    if (this.validarPago()) {
      this.pasoActual = 'comprobante';
    }
  }

  // ============================================================
  // 2️⃣ SELECCIÓN DE COMPROBANTE
  // ============================================================

  seleccionarComprobante(tipoId: number) {
    this.selectedTipoComprobante = tipoId;

    if (tipoId === this.TIPO_VENTA.NOTA) {
      // Nota de Venta -> Cliente "Varios" (ID 1) directo
      this.registrarVentaCompleta(1);
    } else {
      // Boleta o Factura -> Pedir Documento
      this.pasoActual = 'documento';
      this.tipoDocumento = (tipoId === this.TIPO_VENTA.FACTURA) ? 'RUC' : 'DNI';
      this.numeroDocumento = ''; // Limpiar anterior
    }
  }

  // ============================================================
  // 3️⃣ DATOS DEL CLIENTE
  // ============================================================

  soloNumeros(event: any) {
    this.numeroDocumento = event.target.value.replace(/[^0-9]/g, '');
  }

  validarDocumento(): boolean {
    const doc = this.numeroDocumento.trim();
    
    if (!doc) {
      Swal.fire('Requerido', `Ingrese el ${this.tipoDocumento} del cliente.`, 'warning');
      return false;
    }

    const largoRequerido = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (doc.length !== largoRequerido) {
      Swal.fire('Inválido', `El ${this.tipoDocumento} debe tener ${largoRequerido} dígitos.`, 'error');
      return false;
    }

    return true;
  }

  confirmarDocumento() {
    if (!this.validarDocumento()) return;

    this.cargando = true;

    // Buscar cliente en API (Backend crea si no existe)
    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.cliente && res.cliente.ID_Cliente) {
          this.clienteData = res.cliente;
          this.registrarVentaCompleta(res.cliente.ID_Cliente);
        } else {
          Swal.fire('Error', 'No se pudo obtener el ID del cliente.', 'error');
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo validar el documento. Intente nuevamente.', 'error');
      }
    });
  }

  // ============================================================
  // 🚀 PROCESO FINAL: CREAR PEDIDO Y VENTA
  // ============================================================

  private registrarVentaCompleta(idCliente: number) {
    this.cargando = true;

<<<<<<< HEAD
    // 1. Preparar Detalles para el Backend (DTO Limpio)
    const detallesDTO = this.data.detalles.map(d => ({
      ID_Producto_T: d.ID_Producto_T || null, // Ojo: Asegurar que el modelo PedidoDetalle tenga esto
      ID_Combo: d.ID_Combo || null,           // O ID_Combo si es combo
      Cantidad: d.Cantidad,
      PrecioTotal: d.PrecioTotal
=======
    // Convertir método de pago a sigla
    const metodoPagoMap: any = {
      'EFECTIVO': 'E',
      'TARJETA': 'T',
      'BILLETERA': 'B'
    };
    const metodoPagoConvertido = metodoPagoMap[this.metodoPago];

    // Convertir tipo de comprobante a sigla
    const tipoVentaMap: any = {
      'BOLETA': 'B',
      'FACTURA': 'F',
      'NOTA': 'N'
    };
    const tipoVentaConvertido = tipoVentaMap[this.tipoComprobante!];

    // 🔹 CORRECCIÓN: Incluir ID_Combo en los detalles del pedido
    const detallesPedido: PedidoDetalle[] = this.data.detalles.map((d) => ({
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      ID_Producto_T: d.ID_Producto_T,
      ID_Combo: d.ID_Combo, // 🔹 NUEVO: Incluir ID_Combo
      Cantidad: d.Cantidad,
      PrecioTotal: d.PrecioTotal,
      nombre_producto: d.nombre_producto,
      nombre_categoria: d.nombre_categoria,
      nombre_tamano: d.nombre_tamano,
      nombre_combo: d.nombre_combo // 🔹 NUEVO: Incluir nombre_combo si existe
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    }));

    // 2. Crear Objeto Pedido DTO
    const pedidoDTO: PedidoCreacionDTO = {
      ID_Cliente: idCliente,
      ID_Usuario: this.data.idUsuario,
      Notas: `Venta ${this.data.codigoPedido}`, // Puedes agregar más info aquí
      SubTotal: this.data.total,
      detalles: detallesDTO
    };

<<<<<<< HEAD
    // 3. Llamar al servicio de Pedidos
    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedidoCreado = resPedido.ID_Pedido;
=======
    console.log('📦 Detalles del pedido a enviar:', detallesPedido);

    // 🔹 Registrar pedido y venta
    this.pedidoService.createPedido(pedidoData).subscribe({
      next: (res) => {
        const idPedidoCreado = res.ID_Pedido;
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

        // 4. Crear Objeto Venta DTO
        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedidoCreado,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago,
          ID_Origen_Venta: this.ORIGEN_VENTA.MOSTRADOR,
          Monto_Recibido: parseFloat(this.recibe) || this.data.total
        };

        // 5. Llamar al servicio de Ventas
        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.cargando = false;
            
            // Éxito: Generar PDF y cerrar
            this.generarComprobantePDF(resVenta.ID_Venta, idPedidoCreado);
            
            // Feedback
            this.mostrarExito(resVenta.Puntos_Ganados); // Puntos vienen del backend
            
            // Cerrar modal retornando true
            this.dialogRef.close({ registrado: true });
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error creando venta:', err);
            Swal.fire('Error', 'El pedido se creó pero falló el registro de venta.', 'error');
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error creando pedido:', err);
        Swal.fire('Error', 'No se pudo crear el pedido.', 'error');
      }
    });
  }

  private mostrarExito(puntos: number) {
    let msg = 'Venta registrada correctamente.';
    if (puntos > 0) {
      msg += `<br><strong>¡Cliente ganó ${puntos} puntos! 🎉</strong>`;
    }
    
    Swal.fire({
      icon: 'success',
      title: '¡Listo!',
      html: msg,
      timer: 3000,
      showConfirmButton: false
    });
  }

<<<<<<< HEAD
  // ============================================================
  // 📄 GENERACIÓN DE PDF (Simplificada, usa la lógica de VentaService)
  // ============================================================
  // Nota: Idealmente deberías llamar a VentaService.generarPDFVenta(venta), 
  // pero aquí no tenemos el objeto Venta completo aún.
  // Reutilizamos la lógica visual local para inmediatez.

  private generarComprobantePDF(idVenta: number, idPedido: number) {
    // Aquí puedes implementar la misma lógica de PDF que hicimos en VentaListComponent
    // O simplemente llamar a un endpoint que descargue el PDF.
    // Por ahora, dejaré el esqueleto para que no falle.
    console.log(`Generando PDF para Venta #${idVenta}, Pedido #${idPedido}`);
    // ... (Tu lógica de jsPDF aquí si deseas impresión inmediata) ...
  }

  // Navegación
=======
  // 🔹 MÉTODO PARA GENERAR PDF (ACTUALIZADO PARA MOSTRAR COMBOS)
  private generarComprobante(idVenta: number, tipoComprobante: string, idPedido: number) {
    console.log(`Generando ${tipoComprobante} para venta ID: ${idVenta}`);
    
    if (tipoComprobante === 'B') {
      this.generarBoletaPDF(idPedido);
    } else if (tipoComprobante === 'F') {
      this.generarFacturaPDF(idPedido);
    } else {
      this.generarBoletaSimplePDF();
    }
  }

  // ================================================================
  // 🎯 MÉTODOS PARA GENERAR PDFs - ACTUALIZADOS PARA COMBOS
  // ================================================================

  generarBoletaPDF(pedidoId: number) {
    // Tamaño: 58mm x 297mm (formato ticket largo)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 297]
    });
    
    const productos = this.data.detalles;
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
    doc.text(`Canal: Caja`, marginLeft, yPosition);
    yPosition += 3;
    
    // ========== INFORMACIÓN DEL CLIENTE ==========
    // Nombre completo (Nombre + Apellido)
    const nombreCompleto = `${this.clienteData?.Nombre || ''} ${this.clienteData?.Apellido || ''}`.trim();
    const clienteText = `Cliente: ${nombreCompleto || '—'}`;
    const clienteLines = doc.splitTextToSize(clienteText, contentWidth);
    doc.text(clienteLines, marginLeft, yPosition);
    yPosition += clienteLines.length * 3;
    
    // DNI del cliente
    const dniText = `DNI: ${this.numeroDocumento || '—'}`;
    doc.text(dniText, marginLeft, yPosition);
    yPosition += 4;

    // ========== LÍNEA SEPARADORA ==========
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 4;

    // ========== DETALLE DE PRODUCTOS Y COMBOS ==========
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    // Cabecera de tabla - COLUMNAS MÁS A LA IZQUIERDA
    doc.setFontSize(7);
    doc.text('Descripción', marginLeft, yPosition);
    doc.text('Precio', 20, yPosition); // Precio más a la izquierda
    doc.text('Cant', 33, yPosition); // Cant más a la izquierda
    doc.text('Total', 48, yPosition, { align: 'right' }); // Total mantiene posición
    yPosition += 3;

    // Línea bajo cabecera
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 4;

    // 🔹 ACTUALIZADO: Mostrar productos y combos
    doc.setFont('helvetica', 'normal');
    productos.forEach(producto => {
      // 🔹 DETERMINAR SI ES PRODUCTO O COMBO
      const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
      const nombre = esCombo ? 
        (producto.nombre_combo || 'Combo') : 
        (producto.nombre_producto || 'Producto');
      
      const cantidad = producto.Cantidad || 1;
      const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
      const total = producto.PrecioTotal || 0;
      
      // 🔹 AGREGAR INDICADOR DE COMBO SI APLICA
      const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
      
      // Truncar nombre para caber en el ancho disponible
      const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
      
      // Una sola línea con todas las columnas
      doc.text(nombreTruncado, marginLeft, yPosition);
      doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition); // Precio
      doc.text(cantidad.toString(), 33, yPosition); // Cantidad
      doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' }); // Total
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
    doc.text(`TOTAL: S/ ${this.data.total.toFixed(2)}`, marginLeft, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text(`Pago: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
    yPosition += 3;
    
    if (this.metodoPago === 'EFECTIVO' && this.recibe > 0) {
      doc.text(`Vuelto: S/ ${this.vuelto.toFixed(2)}`, marginLeft, yPosition);
      yPosition += 3;
    }
    yPosition += 5;

    // ========== MONTO EN LETRAS ==========
    const montoEnLetras = this.convertirNumeroALetras(this.data.total);
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
  }

  generarFacturaPDF(pedidoId: number) {
    // Tamaño: 58mm x 297mm (formato ticket largo)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 297]
    });
    
    const productos = this.data.detalles;
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
    doc.text(`Canal: Caja`, marginLeft, yPosition);
    yPosition += 3;
    
    // ========== INFORMACIÓN DEL CLIENTE ==========
    // Razón Social usando el campo Nombre
    const razonSocial = this.clienteData?.Nombre || 'CLIENTE';
    const razonSocialLines = doc.splitTextToSize(`Cliente: ${razonSocial}`, contentWidth);
    doc.text(razonSocialLines, marginLeft, yPosition);
    yPosition += razonSocialLines.length * 3;
    
    // RUC usando el campo DNI
    doc.text(`RUC: ${this.numeroDocumento || '—'}`, marginLeft, yPosition);
    yPosition += 3;
    
    doc.text(`Condición: Contado`, marginLeft, yPosition);
    yPosition += 5;

    // ========== LÍNEA SEPARADORA ==========
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 4;

    // ========== DETALLE DE PRODUCTOS Y COMBOS ==========
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

    // 🔹 ACTUALIZADO: Mostrar productos y combos
    doc.setFont('helvetica', 'normal');
    productos.forEach(producto => {
      // 🔹 DETERMINAR SI ES PRODUCTO O COMBO
      const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
      const nombre = esCombo ? 
        (producto.nombre_combo || 'Combo') : 
        (producto.nombre_producto || 'Producto');
      
      const cantidad = producto.Cantidad || 1;
      const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
      const total = producto.PrecioTotal || 0;
      
      // 🔹 AGREGAR INDICADOR DE COMBO SI APLICA
      const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
      
      // Truncar nombre para caber en el ancho disponible
      const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
      
      // Una sola línea con todas las columnas
      doc.text(nombreTruncado, marginLeft, yPosition);
      doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition); // Precio
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
    doc.text(`TOTAL: S/ ${this.data.total.toFixed(2)}`, marginLeft, yPosition);
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text(`Pago: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
    yPosition += 3;
    
    if (this.metodoPago === 'EFECTIVO' && this.recibe > 0) {
      doc.text(`Vuelto: S/ ${this.vuelto.toFixed(2)}`, marginLeft, yPosition);
      yPosition += 3;
    }
    yPosition += 5;

    // ========== MONTO EN LETRAS ==========
    const montoEnLetras = this.convertirNumeroALetras(this.data.total);
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
  }

  generarBoletaSimplePDF() {
    // Tamaño: 58mm x 180mm (más largo para mejor organización)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 180]
    });
    
    const productos = this.data.detalles;
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
    doc.text(`Código: ${this.data.codigoPedido}`, marginLeft, yPosition);
    yPosition += 4;
    doc.text(`Método: ${this.getMetodoPagoText()}`, marginLeft, yPosition);
    yPosition += 6;

    // ========== LÍNEA SEPARADORA ==========
    doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
    yPosition += 4;

    // ========== DETALLE DE PRODUCTOS Y COMBOS ==========
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

    // 🔹 ACTUALIZADO: Mostrar productos y combos
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    productos.forEach(producto => {
      // 🔹 DETERMINAR SI ES PRODUCTO O COMBO
      const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
      const nombre = esCombo ? 
        (producto.nombre_combo || 'Combo') : 
        (producto.nombre_producto || 'Producto');
      
      const cantidad = producto.Cantidad || 1;
      const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
      const total = producto.PrecioTotal || 0;
      
      // 🔹 AGREGAR INDICADOR DE COMBO SI APLICA
      const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
      
      // Truncar nombre para caber en el ancho disponible
      const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
      
      // Una sola línea con todas las columnas
      doc.text(nombreTruncado, marginLeft, yPosition);
      doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition); // Precio
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
    doc.text(`TOTAL: S/ ${this.data.total.toFixed(2)}`, marginLeft, yPosition);
    yPosition += 6;

    // ========== CÓDIGO DE PEDIDO DESTACADO ==========
    doc.setFontSize(9);
    doc.text('CÓDIGO PEDIDO:', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(this.data.codigoPedido, pageWidth / 2, yPosition, { align: 'center' });
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
  // 🔢 MÉTODO PARA CONVERTIR NÚMERO A LETRAS (COPIADO DE PAGO.COMPONENT)
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

  // 🔹 Método helper para texto de método de pago
  private getMetodoPagoText(): string {
    switch(this.metodoPago) {
      case 'EFECTIVO': return 'Efectivo';
      case 'TARJETA': return 'Tarjeta';
      case 'BILLETERA': return 'Billetera Digital';
      default: return 'Efectivo';
    }
  }

  // 🔹 MÉTODOS DE NAVEGACIÓN
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  volverAComprobante() {
    this.pasoActual = 'comprobante';
  }

  volverAPago() {
    this.pasoActual = 'pago';
  }

  cerrar() {
    this.dialogRef.close();
  }
}