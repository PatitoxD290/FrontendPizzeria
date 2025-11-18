import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { VentaService } from '../../../../core/services/venta.service';
import { PedidoService } from '../../../../core/services/pedido.service'; // 🔥 NUEVO: Servicio de pedidos
import { Venta } from '../../../../core/models/venta.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model'; // 🔥 NUEVO: Modelo de detalles

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-venta-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule // 🔥 NUEVO: Para loading
  ],
  templateUrl: './venta-list.component.html',
  styleUrls: ['./venta-list.component.css']
})
export class VentaListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'cliente', 'tipo', 'metodo', 'montoRecibido', 'vuelto', 'igv', 'total', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<Venta>([]);

  filtroTexto: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';
  cargandoPDF: number | null = null; // 🔥 NUEVO: Para controlar loading individual

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ventaService: VentaService,
    private pedidoService: PedidoService // 🔥 NUEVO: Inyectar servicio de pedidos
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.ventaService.getVentas().subscribe({
      next: (data) => {
        this.dataSource = new MatTableDataSource(data.sort((a, b) => b.ID_Venta - a.ID_Venta));
        this.dataSource.paginator = this.paginator;
        this.configurarFiltro();
      },
      error: (err) => console.error('Error al cargar ventas:', err)
    });
  }

  configurarFiltro() {
    this.dataSource.filterPredicate = (v: Venta, filter: string) => {
      const txt = filter.toLowerCase();
      const coincideTexto =
        v.Cliente_Nombre.toLowerCase().includes(txt) ||
        v.ID_Venta.toString().includes(txt);

      const fechaVenta = new Date(v.Fecha_Registro);
      const desde = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const hasta = this.fechaFin ? new Date(this.fechaFin) : null;

      const coincideFecha =
        (!desde || fechaVenta >= desde) && (!hasta || fechaVenta <= hasta);

      return coincideTexto && coincideFecha;
    };
  }

  aplicarFiltros(): void {
    this.dataSource.filter = this.filtroTexto.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.dataSource.filter = '';
  }

  obtenerTipoVentaTexto(code: 'B' | 'F' | 'N'): string {
    return code === 'B' ? 'BOLETA' : code === 'F' ? 'FACTURA' : 'NOTA';
  }

  obtenerMetodoPagoTexto(code: 'E' | 'T' | 'B'): string {
    return code === 'E' ? 'EFECTIVO' : code === 'T' ? 'TARJETA' : 'BILLETERA DIGITAL';
  }

  obtenerMontoRecibidoTexto(venta: Venta): string {
    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      return `S/${venta.Monto_Recibido.toFixed(2)}`;
    }
    return `S/${venta.Total.toFixed(2)}`;
  }

  obtenerVueltoTexto(venta: Venta): string {
    if (venta.Metodo_Pago === 'E' && venta.Vuelto > 0) {
      return `S/${venta.Vuelto.toFixed(2)}`;
    }
    return '-';
  }

  obtenerTooltipVenta(venta: Venta): string {
    if (venta.Metodo_Pago === 'E') {
      return `Recibido: S/${venta.Monto_Recibido?.toFixed(2) || '0.00'} | Vuelto: S/${venta.Vuelto?.toFixed(2) || '0.00'}`;
    }
    return `Pago con ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // ================================================================
  // 🎯 MÉTODO MEJORADO: Generar PDF con detalles del pedido
  // ================================================================
  async generarPDFVenta(venta: Venta): Promise<void> {
    this.cargandoPDF = venta.ID_Venta;
    
    try {
      // Obtener detalles del pedido
      const detallesPedido = await this.obtenerDetallesPedido(venta.ID_Pedido);
      
      console.log(`📄 Generando PDF para venta ID: ${venta.ID_Venta}, Tipo: ${venta.Tipo_Venta}`);
      
      switch (venta.Tipo_Venta) {
        case 'B':
          this.generarBoletaPDF(venta, detallesPedido);
          break;
        case 'F':
          this.generarFacturaPDF(venta, detallesPedido);
          break;
        case 'N':
          this.generarNotaPDF(venta, detallesPedido);
          break;
        default:
          this.generarComprobanteGeneralPDF(venta, detallesPedido);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      this.cargandoPDF = null;
    }
  }

  // 🔥 NUEVO: Método para obtener detalles del pedido
  private obtenerDetallesPedido(idPedido: number): Promise<PedidoDetalle[]> {
    return new Promise((resolve, reject) => {
      this.pedidoService.getPedidoById(idPedido).subscribe({
        next: (pedido) => {
          resolve(pedido.detalles || []);
        },
        error: (err) => {
          console.error('Error al obtener detalles del pedido:', err);
          resolve([]); // Retornar array vacío en caso de error
        }
      });
    });
  }

  // ================================================================
  // 🧾 MÉTODOS MEJORADOS PARA GENERAR PDFs CON DETALLES
  // ================================================================

  private generarBoletaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297]
    });
    
    const fecha = new Date(venta.Fecha_Registro);
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const numeroBoleta = `BP01-${venta.ID_Venta.toString().padStart(7, '0')}`;

    const pageWidth = 80;
    let yPosition = 10;

    // Encabezado principal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    doc.setFontSize(6);
    doc.text('Jr. 2 de Mayo - Frente a la Plaza de Yarina', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 3;
    doc.text('Pucallpa, Ucayali', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Línea separadora
    doc.setLineWidth(0.2);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Información del documento
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`BOLETA: ${numeroBoleta}`, 5, yPosition);
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaStr} ${horaStr}`, 5, yPosition);
    yPosition += 3;
    doc.text(`Cliente: ${venta.Cliente_Nombre}`, 5, yPosition);
    yPosition += 3;
    doc.text(`Método: ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`, 5, yPosition);
    yPosition += 6;

    // Línea separadora
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // 🔥 MEJORADO: Mostrar detalles del pedido
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    // Cabecera de tabla de productos
    doc.setFontSize(6);
    doc.text('Descripción', 5, yPosition);
    doc.text('Cant', 45, yPosition);
    doc.text('P.Unit', 55, yPosition);
    doc.text('Total', 70, yPosition);
    yPosition += 3;

    // Línea bajo cabecera
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // 🔥 MEJORADO: Productos del pedido
    doc.setFont('helvetica', 'normal');
    detalles.forEach(producto => {
      const nombre = producto.nombre_producto || 'Producto';
      const cantidad = producto.Cantidad || 1;
      const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
      const total = producto.PrecioTotal || 0;
      
      // Truncar nombre si es muy largo
      const nombreTruncado = nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre;
      
      doc.text(nombreTruncado, 5, yPosition);
      doc.text(cantidad.toString(), 45, yPosition);
      doc.text(`S/.${precioUnitario.toFixed(2)}`, 55, yPosition);
      doc.text(`S/.${total.toFixed(2)}`, 70, yPosition);
      
      yPosition += 4;
      
      // Verificar si necesitamos nueva página
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 10;
      }
    });

    // Línea separadora antes de total
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Información de montos
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: S/.${(venta.Total - venta.IGV).toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    doc.text(`IGV (18%): S/.${venta.IGV.toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    
    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      doc.text(`Monto Recibido: S/.${venta.Monto_Recibido.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
      doc.text(`Vuelto: S/.${venta.Vuelto.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
    }
    
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`TOTAL: S/ ${venta.Total.toFixed(2)}`, 5, yPosition);
    yPosition += 8;

    // Monto en letras
    const montoEnLetras = this.convertirNumeroALetras(venta.Total);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(`SON: ${montoEnLetras}`, pageWidth - 10);
    doc.text(lineas, 5, yPosition);
    yPosition += lineas.length * 3 + 6;

    // Información legal
    doc.setFontSize(4);
    doc.text('Exonerado del IGV según Ley N.° 27037 – Zona Oriente (Amazonía Peruana).', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Mensaje de agradecimiento
    doc.setFontSize(6);
    doc.text('¡Gracias por tu compra!', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text('Síguenos: @AITA.PIZZA', pageWidth / 2, yPosition, { align: 'center' });

    this.abrirPDFEnNuevaVentana(doc, `Boleta_${numeroBoleta}.pdf`);
  }

  private generarFacturaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 297]
    });
    
    const fecha = new Date(venta.Fecha_Registro);
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const numeroFactura = `F001-${venta.ID_Venta.toString().padStart(7, '0')}`;

    const pageWidth = 80;
    let yPosition = 10;

    // Encabezado principal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    doc.setFontSize(6);
    doc.text('Jr. 2 de Mayo - Frente a la Plaza de Yarina', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 3;
    doc.text('Pucallpa, Ucayali', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Línea separadora
    doc.setLineWidth(0.2);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Información del documento
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURA: ${numeroFactura}`, 5, yPosition);
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaStr} ${horaStr}`, 5, yPosition);
    yPosition += 3;
    doc.text(`Cliente: ${venta.Cliente_Nombre}`, 5, yPosition);
    yPosition += 3;
    doc.text(`RUC: ${this.extraerRucDeCliente(venta.Cliente_Nombre)}`, 5, yPosition);
    yPosition += 3;
    doc.text(`Método: ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`, 5, yPosition);
    yPosition += 3;
    doc.text(`Condición: Contado`, 5, yPosition);
    yPosition += 6;

    // Línea separadora
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // 🔥 MEJORADO: Mostrar detalles del pedido
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE VENTA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    // Cabecera de tabla de productos
    doc.setFontSize(6);
    doc.text('Descripción', 5, yPosition);
    doc.text('Cant', 45, yPosition);
    doc.text('P.Unit', 55, yPosition);
    doc.text('Total', 70, yPosition);
    yPosition += 3;

    // Línea bajo cabecera
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // 🔥 MEJORADO: Productos del pedido
    doc.setFont('helvetica', 'normal');
    detalles.forEach(producto => {
      const nombre = producto.nombre_producto || 'Producto';
      const cantidad = producto.Cantidad || 1;
      const precioUnitario = (producto.PrecioTotal / cantidad) || 0;
      const total = producto.PrecioTotal || 0;
      
      const nombreTruncado = nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre;
      
      doc.text(nombreTruncado, 5, yPosition);
      doc.text(cantidad.toString(), 45, yPosition);
      doc.text(`S/.${precioUnitario.toFixed(2)}`, 55, yPosition);
      doc.text(`S/.${total.toFixed(2)}`, 70, yPosition);
      
      yPosition += 4;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 10;
      }
    });

    // Línea separadora antes de total
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Información de montos
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: S/.${(venta.Total - venta.IGV).toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    doc.text(`IGV (18%): S/.${venta.IGV.toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    
    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      doc.text(`Monto Recibido: S/.${venta.Monto_Recibido.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
      doc.text(`Vuelto: S/.${venta.Vuelto.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
    }
    
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`TOTAL: S/ ${venta.Total.toFixed(2)}`, 5, yPosition);
    yPosition += 8;

    // Monto en letras
    const montoEnLetras = this.convertirNumeroALetras(venta.Total);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(`SON: ${montoEnLetras}`, pageWidth - 10);
    doc.text(lineas, 5, yPosition);
    yPosition += lineas.length * 3 + 6;

    // Mensaje de agradecimiento
    doc.setFontSize(6);
    doc.text('¡Gracias por su compra! 🍕', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text('Síguenos: @AITA.PIZZA', pageWidth / 2, yPosition, { align: 'center' });

    this.abrirPDFEnNuevaVentana(doc, `Factura_${numeroFactura}.pdf`);
  }

  private generarNotaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150]
    });
    
    const fecha = new Date(venta.Fecha_Registro);
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const pageWidth = 80;
    let yPosition = 10;

    // Encabezado principal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTA DE VENTA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Línea separadora
    doc.setLineWidth(0.2);
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Información del pedido
    doc.setFontSize(7);
    doc.text(`Fecha: ${fechaStr} ${horaStr}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Venta ID: ${venta.ID_Venta}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Cliente: ${venta.Cliente_Nombre}`, 5, yPosition);
    yPosition += 4;
    doc.text(`Método: ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`, 5, yPosition);
    yPosition += 6;

    // Línea separadora
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // 🔥 MEJORADO: Mostrar productos del pedido
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS DEL PEDIDO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    detalles.forEach(producto => {
      const nombre = producto.nombre_producto || 'Producto';
      const cantidad = producto.Cantidad || 1;
      const total = producto.PrecioTotal || 0;
      
      const nombreTruncado = nombre.length > 25 ? nombre.substring(0, 25) + '...' : nombre;
      
      doc.text(`• ${nombreTruncado}`, 5, yPosition);
      doc.text(`S/.${total.toFixed(2)}`, 70, yPosition);
      yPosition += 3;
      doc.text(`Cant: ${cantidad}`, 10, yPosition);
      yPosition += 4;
    });

    // Línea separadora antes de total
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Detalles de montos
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE PAGO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: S/.${(venta.Total - venta.IGV).toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    doc.text(`IGV: S/.${venta.IGV.toFixed(2)}`, 5, yPosition);
    yPosition += 3;
    
    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      doc.text(`Recibido: S/.${venta.Monto_Recibido.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
      doc.text(`Vuelto: S/.${venta.Vuelto.toFixed(2)}`, 5, yPosition);
      yPosition += 3;
    }
    
    yPosition += 2;
    doc.line(5, yPosition, pageWidth - 5, yPosition);
    yPosition += 4;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL: S/ ${venta.Total.toFixed(2)}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Mensaje
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprobante de transacción', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;
    doc.text('¡Gracias por su compra! 🍕', pageWidth / 2, yPosition, { align: 'center' });

    this.abrirPDFEnNuevaVentana(doc, `Nota_Venta_${venta.ID_Venta}.pdf`);
  }

  private generarComprobanteGeneralPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const fecha = new Date(venta.Fecha_Registro);
    const fechaStr = fecha.toLocaleDateString('es-PE');
    const horaStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const titulo = this.obtenerTipoVentaTexto(venta.Tipo_Venta);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`COMPROBANTE DE ${titulo}`, 105, 20, { align: 'center' });

    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('AITA PIZZA S.A.C.', 20, 40);
    doc.text('RUC: 10713414561', 20, 47);
    doc.text('Jr. 2 de Mayo - Frente a la Plaza de Yarina', 20, 54);
    doc.text('Pucallpa, Ucayali', 20, 61);

    // Información del comprobante
    doc.text(`Número: ${venta.ID_Venta}`, 150, 40);
    doc.text(`Fecha: ${fechaStr}`, 150, 47);
    doc.text(`Hora: ${horaStr}`, 150, 54);
    doc.text(`Método: ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`, 150, 61);

    // Datos del cliente
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${venta.Cliente_Nombre}`, 20, 82);

    // 🔥 MEJORADO: Tabla de productos del pedido
    const headersProductos = [['Producto', 'Cantidad', 'P. Unitario', 'Total']];
    const dataProductos = detalles.map(producto => [
      producto.nombre_producto || 'Producto',
      producto.Cantidad.toString(),
      `S/. ${((producto.PrecioTotal / producto.Cantidad) || 0).toFixed(2)}`,
      `S/. ${producto.PrecioTotal.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: headersProductos,
      body: dataProductos,
      startY: 90,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Tabla de resumen de montos
    const headersMontos = [['Descripción', 'Monto']];
    const dataMontos = [
      ['Subtotal', `S/. ${(venta.Total - venta.IGV).toFixed(2)}`],
      ['IGV (18%)', `S/. ${venta.IGV.toFixed(2)}`],
    ];

    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      dataMontos.push(['Monto Recibido', `S/. ${venta.Monto_Recibido.toFixed(2)}`]);
      dataMontos.push(['Vuelto', `S/. ${venta.Vuelto.toFixed(2)}`]);
    }

    dataMontos.push(['TOTAL', `S/. ${venta.Total.toFixed(2)}`]);

    autoTable(doc, {
      head: headersMontos,
      body: dataMontos,
      startY: finalY,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' }
      }
    });

    this.abrirPDFEnNuevaVentana(doc, `Comprobante_${venta.ID_Venta}.pdf`);
  }

  // ================================================================
  // 🔧 MÉTODOS AUXILIARES (sin cambios)
  // ================================================================

  private abrirPDFEnNuevaVentana(doc: jsPDF, nombreArchivo: string): void {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  }

  private extraerRucDeCliente(nombreCliente: string): string {
    return '20123456789';
  }

  private convertirNumeroALetras(numero: number): string {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    
    const entero = Math.floor(numero);
    const decimal = Math.round((numero - entero) * 100);

    if (entero === 0) {
      return `cero con ${decimal.toString().padStart(2, '0')}/100 soles`;
    }

    let letras = '';

    if (entero < 10) {
      letras = unidades[entero];
    } else if (entero < 100) {
      const d = Math.floor(entero / 10);
      const u = entero % 10;
      letras = decenas[d];
      if (u > 0) {
        letras += ' y ' + unidades[u];
      }
    } else {
      letras = entero.toString();
    }

    return `${letras} con ${decimal.toString().padStart(2, '0')}/100 soles`.toUpperCase();
  }
  
  exportarPDF(): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const ventas = this.dataSource.filteredData;
    const fechaGeneracion = new Date().toLocaleString('es-PE');
    
    // Título y cabecera
    this.agregarCabeceraPDF(doc, ventas.length);
    
    // Tabla de datos
    this.agregarTablaPDF(doc, ventas);
    
    // Totales y pie de página
    this.agregarTotalesPDF(doc, ventas);
    
    // Guardar PDF
    doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private agregarCabeceraPDF(doc: jsPDF, totalVentas: number): void {
    // Fondo decorativo
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, 297, 30, 'F');
    
    // Logo o ícono
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('💰', 15, 18);
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS', 25, 18);
    
    // Información de la empresa
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Comercial', 200, 12);
    doc.text('Tel: (01) 123-4567', 200, 17);
    doc.text('Email: info@empresa.com', 200, 22);
    
    // Fecha de generación
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 15, 40);
    
    // Período del reporte
    let periodo = 'Todos los registros';
    if (this.fechaInicio && this.fechaFin) {
      periodo = `Del ${this.fechaInicio} al ${this.fechaFin}`;
    } else if (this.fechaInicio) {
      periodo = `Desde ${this.fechaInicio}`;
    } else if (this.fechaFin) {
      periodo = `Hasta ${this.fechaFin}`;
    }
    
    doc.text(`Período: ${periodo}`, 15, 45);
    doc.text(`Total de ventas: ${totalVentas}`, 200, 40);
  }

  private agregarTablaPDF(doc: jsPDF, ventas: Venta[]): void {
    const headers = [
      ['ID', 'CLIENTE', 'TIPO', 'MÉTODO PAGO', 'MONTO RECIBIDO', 'VUELTO', 'IGV', 'TOTAL', 'FECHA REGISTRO']
    ];

    const data = ventas.map(venta => [
      venta.ID_Venta.toString(),
      venta.Cliente_Nombre,
      this.obtenerTipoVentaTexto(venta.Tipo_Venta),
      this.obtenerMetodoPagoTexto(venta.Metodo_Pago),
      `S/${(venta.Monto_Recibido || 0).toFixed(2)}`,
      venta.Metodo_Pago === 'E' && venta.Vuelto ? `S/${venta.Vuelto.toFixed(2)}` : '-',
      `S/${venta.IGV.toFixed(2)}`,
      `S/${venta.Total.toFixed(2)}`,
      this.formatearFechaPDF(venta.Fecha_Registro) // 🔹 Usa la función corregida para PDF
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' }, // ID
        1: { cellWidth: 40 }, // Cliente
        2: { cellWidth: 25, halign: 'center' }, // Tipo
        3: { cellWidth: 30, halign: 'center' }, // Método Pago
        4: { cellWidth: 25, halign: 'right' }, // Monto Recibido
        5: { cellWidth: 20, halign: 'right' }, // Vuelto
        6: { cellWidth: 20, halign: 'right' }, // IGV
        7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }, // Total
        8: { cellWidth: 30, halign: 'center' } // 🔹 REDUCIDO: Fecha (solo fecha)
      },
      margin: { left: 10, right: 10 }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, ventas: Venta[]): void {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Calcular totales
    const totalIGV = ventas.reduce((sum, venta) => sum + venta.IGV, 0);
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.Total, 0);
    const totalEfectivo = ventas
      .filter(v => v.Metodo_Pago === 'E')
      .reduce((sum, venta) => sum + venta.Total, 0);
    const totalTarjeta = ventas
      .filter(v => v.Metodo_Pago === 'T')
      .reduce((sum, venta) => sum + venta.Total, 0);
    const totalDigital = ventas
      .filter(v => v.Metodo_Pago === 'B')
      .reduce((sum, venta) => sum + venta.Total, 0);

    // Fondo para totales
    doc.setFillColor(240, 240, 240);
    doc.rect(10, finalY + 5, 277, 30, 'F');

    // Totales principales
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    doc.text('RESUMEN DE VENTAS', 15, finalY + 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total IGV: S/${totalIGV.toFixed(2)}`, 15, finalY + 22);
    doc.text(`Total Ventas: S/${totalVentas.toFixed(2)}`, 15, finalY + 28);

    // Métodos de pago
    doc.text('POR MÉTODO DE PAGO:', 120, finalY + 15);
    doc.text(`Efectivo: S/${totalEfectivo.toFixed(2)}`, 120, finalY + 22);
    doc.text(`Tarjeta: S/${totalTarjeta.toFixed(2)}`, 120, finalY + 28);
    doc.text(`Digital: S/${totalDigital.toFixed(2)}`, 200, finalY + 22);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este reporte fue generado automáticamente por el Sistema de Gestión Comercial', 15, 190);
    doc.text('Página 1 de 1', 260, 190);
  }

  // 🔹 CORREGIDO: Para PDF también mostrar solo fecha
  private formatearFechaPDF(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}