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
import { PedidoDetalle, PedidoCreacionDTO, DatosPedido } from '../../../../core/models/pedido.model';
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
  recibe: string = '';
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

  // 🔹 Datos calculados
  subTotalCalculado: number = 0;
  totalCalculado: number = 0;

  constructor(
    public dialogRef: MatDialogRef<VentaPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      total: number, 
      codigoPedido: string, 
      idUsuario: number,
      detalles: PedidoDetalle[],
      datosPedido?: DatosPedido[] // 🔹 AGREGADO: Para calcular precios
    },
    private pedidoService: PedidoService,
    private ventaService: VentaService,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    this.calcularMontos(); // 🔹 CALCULAR MONTOS AL INICIAR
  }

  // ============================================================
  // 🧮 CÁLCULO DE MONTOS - CORREGIDO
  // ============================================================

private calcularMontos(): void {
  // 🔹 CALCULAR SUBTOTAL SUMANDO TODOS LOS PRECIOS TOTALES DE DETALLES
  this.subTotalCalculado = this.data.detalles.reduce((total, detalle) => {
    const precioDetalle = detalle.PrecioTotal || 0;
    console.log(`📊 Detalle: ${detalle.Nombre_Item} - PrecioTotal: ${precioDetalle}`);
    return total + precioDetalle;
  }, 0);

  // 🔹 EN TU MODELO, EL TOTAL ES EL MISMO QUE SUBTOTAL (IGV=0)
  this.totalCalculado = this.subTotalCalculado;

  console.log('🔢 Montos calculados:', {
    subtotal: this.subTotalCalculado,
    total: this.totalCalculado,
    detallesCount: this.data.detalles.length
  });
}

  // ============================================================
  // 1️⃣ LÓGICA DE PAGO (CALCULADORA) - ACTUALIZADA
  // ============================================================

  calcularVuelto() {
    const recibeNum = parseFloat(this.recibe) || 0;
    this.vuelto = Math.max(0, recibeNum - this.totalCalculado); // 🔹 USAR totalCalculado
  }

  onRecibeChange() {
    this.calcularVuelto();
  }

  addNumber(num: string) {
    if (this.recibe === '0' || this.recibe === '') {
      this.recibe = num;
    } else {
      this.recibe += num;
    }
    this.calcularVuelto();
  }

  deleteLast() {
    if (this.recibe.length > 1) {
      this.recibe = this.recibe.slice(0, -1);
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
    if (!this.recibe.includes('.')) {
      this.recibe = this.recibe ? this.recibe + '.' : '0.';
    }
  }

  setMontoExacto() {
    this.recibe = this.totalCalculado.toString(); // 🔹 USAR totalCalculado
    this.calcularVuelto();
  }

  validarPago(): boolean {
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO) {
      const recibeNum = parseFloat(this.recibe) || 0;
      
      if (!this.recibe) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto requerido',
          text: 'Por favor ingrese el monto recibido.',
          confirmButtonColor: '#d33'
        });
        return false;
      }
      
      if (recibeNum < this.totalCalculado) { // 🔹 USAR totalCalculado
        Swal.fire({
          icon: 'warning',
          title: 'Monto insuficiente',
          text: `El monto recibido es menor al total a pagar. Faltan S/ ${(this.totalCalculado - recibeNum).toFixed(2)}`,
          confirmButtonColor: '#d33'
        });
        return false;
      }
    } else {
      // Para tarjeta/billetera asumimos pago exacto
      this.recibe = this.totalCalculado.toString(); // 🔹 USAR totalCalculado
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
      this.numeroDocumento = '';
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
      Swal.fire({
        icon: 'warning',
        title: 'Documento requerido',
        text: `Para ${this.getTipoComprobanteText()} debe ingresar ${this.tipoDocumento}.`,
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

    const largoRequerido = this.tipoDocumento === 'DNI' ? 8 : 11;
    if (doc.length !== largoRequerido) {
      Swal.fire({
        icon: 'error',
        title: 'Longitud incorrecta',
        text: `${this.tipoDocumento} debe tener ${largoRequerido} dígitos.`,
        confirmButtonColor: '#d33'
      });
      return false;
    }

    return true;
  }

  confirmarDocumento() {
    if (!this.validarDocumento()) return;

    this.cargando = true;

    this.clienteService.buscarClientePorDocumento(this.numeroDocumento).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.cliente && res.cliente.ID_Cliente) {
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

  // ============================================================
  // 🚀 PROCESO FINAL: CREAR PEDIDO Y VENTA - CORREGIDO
  // ============================================================

private registrarVentaCompleta(idCliente: number) {
  this.cargando = true;

  // 🔹 1. PREPARAR DETALLES CON PRECIOTOTAL CORRECTO - VERIFICAR ESTO
  const detallesDTO = this.data.detalles.map(d => {
    // 🔹 VERIFICAR QUE PRECIOTOTAL ESTÉ CALCULADO CORRECTAMENTE
    const precioTotal = d.PrecioTotal || 0;
    
    console.log('📦 Mapeando detalle para backend:', {
      nombre: d.Nombre_Item,
      cantidad: d.Cantidad,
      precioTotal: precioTotal,
      tipo: d.Tipo
    });

    return {
      ID_Producto_T: d.ID_Producto_T || null,
      ID_Combo: d.ID_Combo || null,
      Cantidad: d.Cantidad,
      PrecioTotal: precioTotal, // 🔹 ESTE DEBE SER > 0
      Complementos: []
    };
  });

  // 🔹 2. CALCULAR SUBTOTAL NUEVAMENTE PARA VERIFICAR
  const subTotalVerificado = detallesDTO.reduce((total, detalle) => {
    return total + (detalle.PrecioTotal || 0);
  }, 0);

  console.log('🔢 Verificación final antes de enviar:', {
    subtotalCalculado: this.subTotalCalculado,
    subtotalVerificado: subTotalVerificado,
    detallesDTO: detallesDTO
  });

  // 🔹 3. CREAR OBJETO PEDIDO DTO CON VALORES CORRECTOS
  const pedidoDTO: PedidoCreacionDTO = {
    ID_Cliente: idCliente,
    ID_Usuario: this.data.idUsuario,
    Notas: this.generarNotas(),
    SubTotal: subTotalVerificado, // 🔹 USAR EL VALOR VERIFICADO
    Estado_P: 'P',
    detalles: detallesDTO
  };

  console.log('📤 FINAL - Enviando Pedido DTO al backend:', pedidoDTO);

    // 🔹 3. LLAMAR AL SERVICIO DE PEDIDOS
    this.pedidoService.createPedido(pedidoDTO).subscribe({
      next: (resPedido) => {
        const idPedidoCreado = resPedido.ID_Pedido;
        
        console.log('✅ Pedido creado:', {
          idPedido: idPedidoCreado,
          subtotal: resPedido.SubTotal
        });

        // 🔹 4. CREAR OBJETO VENTA DTO
        const ventaDTO: VentaCreacionDTO = {
          ID_Pedido: idPedidoCreado,
          ID_Tipo_Venta: this.selectedTipoComprobante!,
          ID_Tipo_Pago: this.selectedMetodoPago,
          ID_Origen_Venta: this.ORIGEN_VENTA.MOSTRADOR,
          Monto_Recibido: parseFloat(this.recibe) || this.totalCalculado // 🔹 USAR TOTAL CALCULADO
        };

        console.log('📤 Enviando Venta DTO:', ventaDTO);

        // 🔹 5. LLAMAR AL SERVICIO DE VENTAS
        this.ventaService.createVenta(ventaDTO).subscribe({
          next: (resVenta) => {
            this.cargando = false;
            
            console.log('✅ Venta creada:', {
              idVenta: resVenta.ID_Venta,
              total: resVenta.Total,
              puntos: resVenta.Puntos_Ganados
            });
            
            // 🔹 GENERAR COMPROBANTE PDF
            this.generarComprobantePDF(resVenta.ID_Venta, idPedidoCreado);
            
            // 🔹 MOSTRAR MENSAJE DE ÉXITO
            this.mostrarMensajeExito(resVenta.Puntos_Ganados, idPedidoCreado, resVenta.ID_Venta);
            
            // 🔹 CERRAR MODAL INDICANDO ÉXITO
            this.dialogRef.close({ 
              registrado: true,
              idPedido: idPedidoCreado,
              idVenta: resVenta.ID_Venta
            });
          },
          error: (err) => {
            this.cargando = false;
            console.error('❌ Error al crear venta:', err);
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
        console.error('❌ Error al crear pedido:', err);
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'Ocurrió un problema al crear el pedido.' 
        });
      }
    });
  }

  private generarNotas(): string {
    const metodoPagoTexto = this.getMetodoPagoText();
    let textoNotas = `Pedido ${this.data.codigoPedido} - ${metodoPagoTexto} - Caja`;
    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
      textoNotas += ` - Recibe: S/${this.recibe} - Vuelto: S/${this.vuelto.toFixed(2)}`;
    }
    return textoNotas;
  }

  private mostrarMensajeExito(puntos: number, idPedido: number, idVenta: number) {
    let mensaje = `
      <div style="text-align: left;">
        <strong>${this.getTipoComprobanteText()} generada exitosamente</strong><br>
        • Pedido: <strong>${this.data.codigoPedido}</strong><br>
        • ID Pedido: <strong>${idPedido}</strong><br>
        • ID Venta: <strong>${idVenta}</strong><br>
        • SubTotal: <strong>S/ ${this.subTotalCalculado.toFixed(2)}</strong><br>
        • Total: <strong>S/ ${this.totalCalculado.toFixed(2)}</strong>
    `;

    if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
      mensaje += `<br>• Recibido: <strong>S/ ${parseFloat(this.recibe).toFixed(2)}</strong>`;
      mensaje += `<br>• Vuelto: <strong>S/ ${this.vuelto.toFixed(2)}</strong>`;
    }

    if (puntos > 0) {
      mensaje += `<br>• <strong>¡Cliente ganó ${puntos} puntos! 🎉</strong>`;
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

  // ============================================================
  // 📄 GENERACIÓN DE PDF (MANTENIDO)
  // ============================================================

  private generarComprobantePDF(idVenta: number, idPedido: number) {
    console.log(`Generando PDF para Venta #${idVenta}, Pedido #${idPedido}`);
    
    if (this.selectedTipoComprobante === this.TIPO_VENTA.BOLETA) {
      this.generarBoletaPDF(idPedido);
    } else if (this.selectedTipoComprobante === this.TIPO_VENTA.FACTURA) {
      this.generarFacturaPDF(idPedido);
    } else {
      this.generarBoletaSimplePDF();
    }
  }

// ============================================================
// 🎯 MÉTODOS PARA GENERAR PDFs - CORREGIDOS
// ============================================================

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
  const marginLeft = 4;
  const marginRight = 4;
  const contentWidth = pageWidth - (marginLeft + marginRight);
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
  if (this.clienteData) {
    const nombreCompleto = `${this.clienteData.Nombre || ''} ${this.clienteData.Apellido || ''}`.trim();
    const clienteText = `Cliente: ${nombreCompleto || '—'}`;
    const clienteLines = doc.splitTextToSize(clienteText, contentWidth);
    doc.text(clienteLines, marginLeft, yPosition);
    yPosition += clienteLines.length * 3;
    
    const dniText = `DNI: ${this.numeroDocumento || '—'}`;
    doc.text(dniText, marginLeft, yPosition);
    yPosition += 4;
  }

  // ========== LÍNEA SEPARADORA ==========
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== DETALLE DE PRODUCTOS Y COMBOS ==========
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  // Cabecera de tabla
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition);
  doc.text('Cant', 33, yPosition);
  doc.text('Total', 48, yPosition, { align: 'right' });
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // 🔹 MOSTRAR PRODUCTOS Y COMBOS - CORREGIDO
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    // 🔹 DETERMINAR SI ES PRODUCTO O COMBO
    const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
    
    // 🔹 CORRECCIÓN: Usar Nombre_Combo y Nombre_Producto según tus modelos
    const nombre = esCombo ? 
      (producto.Nombre_Combo || 'Combo') : 
      (producto.Nombre_Producto || 'Producto');
    
    const cantidad = producto.Cantidad || 1;
    const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
    const total = producto.PrecioTotal || 0;
    
    // 🔹 AGREGAR INDICADOR DE COMBO SI APLICA
    const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
    
    // Truncar nombre para caber en el ancho disponible
    const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
    
    // Una sola línea con todas las columnas
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition);
    doc.text(cantidad.toString(), 33, yPosition);
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' });
    yPosition += 4;
    
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
  
  if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
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

  // Configuración inicial
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
  if (this.clienteData) {
    const razonSocial = this.clienteData.Nombre || 'CLIENTE';
    const razonSocialLines = doc.splitTextToSize(`Cliente: ${razonSocial}`, contentWidth);
    doc.text(razonSocialLines, marginLeft, yPosition);
    yPosition += razonSocialLines.length * 3;
    
    doc.text(`RUC: ${this.numeroDocumento || '—'}`, marginLeft, yPosition);
    yPosition += 3;
  }
  
  doc.text(`Condición: Contado`, marginLeft, yPosition);
  yPosition += 5;

  // ========== LÍNEA SEPARADORA ==========
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // ========== DETALLE DE PRODUCTOS Y COMBOS ==========
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE VENTA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  // Cabecera de tabla
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition);
  doc.text('Cant', 33, yPosition);
  doc.text('Total', 48, yPosition, { align: 'right' });
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // 🔹 MOSTRAR PRODUCTOS Y COMBOS - CORREGIDO
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
    
    // 🔹 CORRECCIÓN: Usar Nombre_Combo y Nombre_Producto según tus modelos
    const nombre = esCombo ? 
      (producto.Nombre_Combo || 'Combo') : 
      (producto.Nombre_Producto || 'Producto');
    
    const cantidad = producto.Cantidad || 1;
    const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
    const total = producto.PrecioTotal || 0;
    
    const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
    const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
    
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition);
    doc.text(cantidad.toString(), 33, yPosition);
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' });
    yPosition += 4;
    
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
  
  if (this.selectedMetodoPago === this.TIPO_PAGO.EFECTIVO && parseFloat(this.recibe) > 0) {
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
  // Tamaño: 58mm x 180mm
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

  // Configuración inicial
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

  // Cabecera de tabla
  doc.setFontSize(7);
  doc.text('Descripción', marginLeft, yPosition);
  doc.text('Precio', 20, yPosition);
  doc.text('Cant', 33, yPosition);
  doc.text('Total', 48, yPosition, { align: 'right' });
  yPosition += 3;

  // Línea bajo cabecera
  doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
  yPosition += 4;

  // 🔹 MOSTRAR PRODUCTOS Y COMBOS - CORREGIDO
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  productos.forEach(producto => {
    const esCombo = producto.ID_Combo && producto.ID_Combo > 0;
    
    // 🔹 CORRECCIÓN: Usar Nombre_Combo y Nombre_Producto según tus modelos
    const nombre = esCombo ? 
      (producto.Nombre_Combo || 'Combo') : 
      (producto.Nombre_Producto || 'Producto');
    
    const cantidad = producto.Cantidad || 1;
    const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
    const total = producto.PrecioTotal || 0;
    
    const nombreConTipo = esCombo ? `${nombre} (COMBO)` : nombre;
    const nombreTruncado = nombreConTipo.length > 18 ? nombreConTipo.substring(0, 18) + '...' : nombreConTipo;
    
    doc.text(nombreTruncado, marginLeft, yPosition);
    doc.text(`S/.${precioUnitario.toFixed(2)}`, 20, yPosition);
    doc.text(cantidad.toString(), 33, yPosition);
    doc.text(`S/.${total.toFixed(2)}`, 48, yPosition, { align: 'right' });
    yPosition += 4;
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

  // ============================================================
  // 🔢 MÉTODO PARA CONVERTIR NÚMERO A LETRAS
  // ============================================================

  private convertirNumeroALetras(numero: number): string {
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

  private convertirCentenas(numero: number): string {
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

  // ============================================================
  // 🔧 MÉTODOS HELPER (CAMBIADOS A PÚBLICOS PARA EL TEMPLATE)
  // ============================================================

  getMetodoPagoText(): string {
    switch(this.selectedMetodoPago) {
      case this.TIPO_PAGO.EFECTIVO: return 'Efectivo';
      case this.TIPO_PAGO.TARJETA: return 'Tarjeta';
      case this.TIPO_PAGO.BILLETERA: return 'Billetera Digital';
      default: return 'Efectivo';
    }
  }

  getTipoComprobanteText(): string {
    switch(this.selectedTipoComprobante) {
      case this.TIPO_VENTA.BOLETA: return 'Boleta';
      case this.TIPO_VENTA.FACTURA: return 'Factura';
      case this.TIPO_VENTA.NOTA: return 'Nota de Venta';
      default: return 'Comprobante';
    }
  }

  // ============================================================
  // 🧭 NAVEGACIÓN
  // ============================================================

  volverAComprobante() {
    this.pasoActual = 'comprobante';
    this.numeroDocumento = '';
  }

  volverAPago() {
    this.pasoActual = 'pago';
    this.selectedTipoComprobante = null;
  }

  cerrar() {
    this.dialogRef.close();
  }
}