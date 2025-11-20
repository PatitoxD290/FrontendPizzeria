import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
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
import { PedidoDetalle, PedidoConDetalle } from '../../../../core/models/pedido.model';

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
export class VentaPedidoComponent {

  // 🔹 Paso 1: Método de pago
  metodoPago: string = 'EFECTIVO';
  recibe: any = '';
  vuelto: number = 0;

  // 🔹 Paso 2: Tipo de comprobante
  pasoActual: 'pago' | 'comprobante' | 'documento' = 'pago';
  tipoComprobante: 'BOLETA' | 'FACTURA' | 'NOTA' | null = null;

  // 🔹 Paso 3: Datos del documento
  tipoDocumento: 'DNI' | 'RUC' = 'DNI';
  numeroDocumento: string = '';

  // 🔹 Estado de carga
  cargando: boolean = false;

  // 🔹 Datos del cliente para PDF
  private clienteData: any = null;

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

  // 🔹 MÉTODOS PARA PASO 1 (PAGO)
  calcularVuelto() {
    const recibeNum = Number(this.recibe) || 0;
    this.vuelto = Math.max(0, recibeNum - this.data.total);
  }

  onRecibeChange() {
    this.calcularVuelto();
  }

  addNumber(num: string) {
    const current = this.recibe.toString();
    if (current === '0' || current === '') {
      this.recibe = num;
    } else {
      this.recibe = current + num;
    }
    this.calcularVuelto();
  }

  deleteLast() {
    const current = this.recibe.toString();
    if (current.length > 1) {
      this.recibe = current.slice(0, -1);
    } else {
      this.recibe = '';
    }
    this.calcularVuelto();
  }

  clearRecibe() {
    this.recibe = '';
    this.vuelto = 0;
  }

  addDecimal() {
    const current = this.recibe.toString();
    if (!current.includes('.')) {
      this.recibe = current + '.';
    }
  }

  // 🔹 Validar paso de pago
  validarPago(): boolean {
    if (this.metodoPago === 'EFECTIVO') {
      const recibeNum = Number(this.recibe) || 0;

      if (recibeNum < this.data.total) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto insuficiente',
          text: 'El monto recibido es menor al total a pagar.',
          confirmButtonColor: '#d33'
        });
        return false;
      }

      if (!this.recibe || this.recibe === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Monto requerido',
          text: 'Por favor ingrese el monto recibido.',
          confirmButtonColor: '#d33'
        });
        return false;
      }
    } else {
      this.recibe = this.data.total;
      this.vuelto = 0;
    }
    return true;
  }

  // 🔹 Avanzar al paso de comprobante
  confirmarPago() {
    if (this.validarPago()) {
      this.pasoActual = 'comprobante';
    }
  }

  // 🔹 MÉTODOS PARA PASO 2 (COMPROBANTE)
  seleccionarComprobante(tipo: 'BOLETA' | 'FACTURA' | 'NOTA') {
    this.tipoComprobante = tipo;
    
    if (tipo === 'NOTA') {
      // Para nota, usar cliente genérico y proceder directamente
      this.registrarVentaCompleta(1); // ID_Cliente = 1 para "Clientes Varios"
    } else {
      // Para boleta/factura, avanzar al paso de documento
      this.pasoActual = 'documento';
      if (tipo === 'FACTURA') {
        this.tipoDocumento = 'RUC';
      } else {
        this.tipoDocumento = 'DNI';
      }
    }
  }

  // 🔹 MÉTODOS PARA PASO 3 (DOCUMENTO)
  soloNumeros(event: any) {
    this.numeroDocumento = event.target.value.replace(/[^0-9]/g, '');
  }

  validarDocumento(): boolean {
    const doc = this.numeroDocumento.trim();
    
    if (!doc) {
      Swal.fire({
        icon: 'warning',
        title: 'Documento requerido',
        text: `Para ${this.tipoComprobante?.toLowerCase()} debe ingresar ${this.tipoDocumento}.`,
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if (!/^\d+$/.test(doc)) {
      Swal.fire({
        icon: 'error',
        title: 'Documento inválido',
        text: 'Solo se permiten números.',
        confirmButtonColor: '#d33'
      });
      return false;
    }

    if ((this.tipoDocumento === 'DNI' && doc.length !== 8) ||
        (this.tipoDocumento === 'RUC' && doc.length !== 11)) {
      Swal.fire({
        icon: 'error',
        title: 'Longitud incorrecta',
        text: `${this.tipoDocumento} debe tener ${this.tipoDocumento === 'DNI' ? 8 : 11} dígitos.`,
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  }

  // 🔹 Buscar cliente usando la API (que automáticamente lo crea si no existe)
  confirmarDocumento() {
    if (!this.validarDocumento()) return;

    const doc = this.numeroDocumento.trim();
    this.cargando = true;

    this.clienteService.buscarClientePorDocumento(doc).subscribe({
      next: (res) => {
        this.cargando = false;
        
        if (res.cliente && res.cliente.ID_Cliente) {
          // 🔹 Cliente encontrado o creado automáticamente por el backend
          this.clienteData = res.cliente;
          this.registrarVentaCompleta(res.cliente.ID_Cliente);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo obtener el ID del cliente. Intente nuevamente.',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al buscar/crear cliente:', err);
        
        let mensajeError = 'Error al procesar el documento';
        if (err.error?.error) {
          mensajeError = err.error.error;
        } else if (err.status === 404) {
          mensajeError = 'Documento no encontrado en registros públicos';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensajeError,
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // 🔹 MÉTODO PRINCIPAL PARA REGISTRAR TODO
  private registrarVentaCompleta(idCliente: number) {
    this.cargando = true;

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
    }));

    // Crear texto para notas
    const metodoPagoTexto = this.metodoPago;
    let textoNotas = `Pedido ${this.data.codigoPedido} - ${metodoPagoTexto} - Caja`;
    if (this.metodoPago === 'EFECTIVO' && this.recibe > 0) {
      textoNotas += ` - Recibe: S/${this.recibe} - Vuelto: S/${this.vuelto}`;
    }

    // Crear PedidoConDetalle
    const pedidoData: PedidoConDetalle = {
      ID_Pedido: 0,
      ID_Cliente: idCliente,
      ID_Usuario: this.data.idUsuario,
      Notas: textoNotas,
      SubTotal: this.data.total,
      Estado_P: 'P',
      Fecha_Registro: new Date().toISOString().split('T')[0],
      Hora_Pedido: new Date().toTimeString().split(' ')[0],
      detalles: detallesPedido
    };

    console.log('📦 Detalles del pedido a enviar:', detallesPedido);

    // 🔹 Registrar pedido y venta
    this.pedidoService.createPedido(pedidoData).subscribe({
      next: (res) => {
        const idPedidoCreado = res.ID_Pedido;

        // Registrar venta
        this.ventaService.createVenta({
          ID_Pedido: idPedidoCreado,
          Tipo_Venta: tipoVentaConvertido,
          Metodo_Pago: metodoPagoConvertido,
          Lugar_Emision: 'A',
          IGV_Porcentaje: 18,
          Monto_Recibido: Number(this.recibe) || this.data.total
        }).subscribe({
          next: (ventaResponse) => {
            this.cargando = false;
            
            // 🔹 Generar comprobante PDF
            this.generarComprobante(ventaResponse.ID_Venta, tipoVentaConvertido, idPedidoCreado);
            
            // 🔹 Mostrar mensaje de éxito
            this.mostrarMensajeExito(tipoVentaConvertido, idPedidoCreado, ventaResponse.ID_Venta);
            
            // 🔹 Cerrar modal indicando éxito
            this.dialogRef.close({ registrado: true });
          },
          error: (err) => {
            this.cargando = false;
            console.error('Error al crear venta:', err);
            Swal.fire({ 
              icon: 'error', 
              title: 'Error en venta', 
              text: 'El pedido se creó pero hubo un problema al registrar la venta.' 
            });
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al crear pedido:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'Ocurrió un problema al crear el pedido.' 
        });
      },
    });
  }

  // 🔹 Mostrar mensaje de éxito con detalles
  private mostrarMensajeExito(tipoComprobante: string, idPedido: number, idVenta: number) {
    const tipoTexto = {
      'B': 'Boleta',
      'F': 'Factura', 
      'N': 'Nota'
    }[tipoComprobante] || 'Comprobante';

    let mensaje = `
      <div style="text-align: left;">
        <strong>${tipoTexto} generada exitosamente</strong><br>
        • Pedido: <strong>${this.data.codigoPedido}</strong><br>
        • ID Pedido: <strong>${idPedido}</strong><br>
        • ID Venta: <strong>${idVenta}</strong><br>
        • Total: <strong>S/ ${this.data.total.toFixed(2)}</strong>
    `;

    if (this.metodoPago === 'EFECTIVO' && this.recibe > 0) {
      mensaje += `<br>• Recibido: <strong>S/ ${Number(this.recibe).toFixed(2)}</strong>`;
      mensaje += `<br>• Vuelto: <strong>S/ ${this.vuelto.toFixed(2)}</strong>`;
    }

    mensaje += `</div>`;

    Swal.fire({
      icon: 'success',
      title: 'Venta Registrada',
      html: mensaje,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745'
    });
  }

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
  volverAComprobante() {
    this.pasoActual = 'comprobante';
    this.numeroDocumento = '';
  }

  volverAPago() {
    this.pasoActual = 'pago';
    this.tipoComprobante = null;
  }

  cerrar() {
    this.dialogRef.close();
  }
}