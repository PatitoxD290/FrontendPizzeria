import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// Services & Models
import { VentaService } from '../../../../core/services/venta.service';
import { PedidoService } from '../../../../core/services/pedido.service';
import { Venta } from '../../../../core/models/venta.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './venta-list.component.html',
  styleUrls: ['./venta-list.component.css']
})
export class VentaListComponent implements OnInit, AfterViewInit {

  // ================================================================
  // 📊 PROPIEDADES DE LA TABLA Y DATOS
  // ================================================================
  displayedColumns: string[] = [
    'ID_Venta', 
    'Cliente', 
    'Tipo', 
    'Metodo', 
    'Total', 
    'Fecha', 
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Venta>([]);
  loading = false;

  // ================================================================
  // 🔍 FILTROS
  // ================================================================
  filtroTexto: string = '';
  selectedPeriodo: string = 'todos';
  
  // ================================================================
  // 📄 CONTROL PDF
  // ================================================================
  cargandoPDF: number | null = null; 

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ventaService: VentaService,
    private pedidoService: PedidoService 
  ) {}

  // ================================================================
  // 🅰️ NG LIFECYCLE
  // ================================================================
  ngOnInit(): void {
    this.cargarVentas();
  }

  ngAfterViewInit() {
    // Configurar paginación y ordenamiento
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configurar el filtro personalizado
    this.setupFilterPredicate();
  }

  // ================================================================
  // 📥 MÉTODOS DE CARGA DE DATOS
  // ================================================================
  cargarVentas(): void {
    this.loading = true;
    this.ventaService.getVentas().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
        
        // Configurar paginación después de cargar datos
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Error al cargar ventas:', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar las ventas', 'error');
      }
    });
  }

  // ================================================================
  // 🔍 MÉTODOS DE FILTRADO
  // ================================================================
  setupFilterPredicate() {
    this.dataSource.filterPredicate = (venta: Venta, filter: string) => {
      // El parámetro 'filter' es el valor que se establece en dataSource.filter
      // En nuestro caso, usamos un trigger, pero los filtros reales están en las propiedades
      
      // 1. Filtro de Texto
      const term = this.filtroTexto.trim().toLowerCase();
      const matchText = term === '' || 
        (venta.Cliente_Nombre?.toLowerCase().includes(term) || false) ||
        (venta.ID_Venta?.toString().includes(term) || false) ||
        (venta.Tipo_Venta_Nombre?.toLowerCase().includes(term) || false);

      // 2. Filtro de Periodo
      let matchPeriodo = true;
      if (this.selectedPeriodo !== 'todos') {
        const fechaVenta = new Date(venta.Fecha_Registro);
        const hoy = new Date();
        
        switch (this.selectedPeriodo) {
          case 'hoy':
            matchPeriodo = this.esMismoDia(fechaVenta, hoy);
            break;
          case 'semana':
            matchPeriodo = this.esEstaSemana(fechaVenta);
            break;
          case 'mes':
            matchPeriodo = this.esEsteMes(fechaVenta);
            break;
          case 'mes_anterior':
            matchPeriodo = this.esMesAnterior(fechaVenta);
            break;
        }
      }
      
      return matchText && matchPeriodo;
    };
  }

  // 🗓️ Métodos para filtros de fecha (se mantienen igual)
  private esMismoDia(fecha1: Date, fecha2: Date): boolean {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
  }

  private esEstaSemana(fecha: Date): boolean {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    finSemana.setHours(23, 59, 59, 999);
    
    return fecha >= inicioSemana && fecha <= finSemana;
  }

  private esEsteMes(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getMonth() === hoy.getMonth() && 
           fecha.getFullYear() === hoy.getFullYear();
  }

  private esMesAnterior(fecha: Date): boolean {
    const hoy = new Date();
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const inicioMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1);
    const finMesAnterior = new Date(mesAnterior.getFullYear(), mesAnterior.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return fecha >= inicioMesAnterior && fecha <= finMesAnterior;
  }

  // 🎛️ Aplicar Filtros
  aplicarFiltros(): void {
    // Usar un trigger único para forzar el re-filtrado
    this.dataSource.filter = Math.random().toString();
    
    // Ir a la primera página cuando se aplican filtros
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🔄 Cambio de Periodo
  onPeriodoChange(): void {
    this.aplicarFiltros();
  }

  // 🧹 Limpiar Filtros
  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.selectedPeriodo = 'todos';
    this.aplicarFiltros();
  }

  // ================================================================
  // 🎨 HELPERS VISUALES
  // ================================================================
  getMetodoPagoLabel(venta: Venta): string {
    if (venta.Metodo_Pago_Nombre) return venta.Metodo_Pago_Nombre;
    switch (venta.ID_Tipo_Pago) {
      case 1: return 'Efectivo';
      case 2: return 'YAPE/PLIN';
      case 3: return 'Tarjeta';
      default: return 'Otro';
    }
  }

  getTipoVentaLabel(venta: Venta): string {
    return venta.Tipo_Venta_Nombre || (venta.ID_Tipo_Venta === 1 ? 'BOLETA' : 
           venta.ID_Tipo_Venta === 2 ? 'FACTURA' : 'NOTA');
  }

  // ================================================================
  // 🔧 MÉTODO PARA OBTENER DATOS VISIBLES (para el paginator length)
  // ================================================================
  getTotalFiltrado(): number {
    return this.dataSource.filteredData.length;
  }

  // ================================================================
  // 📄 GENERACIÓN DE PDF - MÉTODO PRINCIPAL
  // ================================================================
  async generarPDFVenta(venta: Venta): Promise<void> {
    this.cargandoPDF = venta.ID_Venta;
    
    try {
      const detallesPedido = await this.obtenerDetallesPedido(venta.ID_Pedido);
      
      switch (venta.ID_Tipo_Venta) {
        case 1: // Boleta
          this.generarBoletaPDF(venta, detallesPedido);
          break;
        case 2: // Factura
          this.generarFacturaPDF(venta, detallesPedido);
          break;
        default:
          this.generarComprobanteGeneralPDF(venta, detallesPedido);
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire('Error', 'No se pudo generar el comprobante', 'error');
    } finally {
      this.cargandoPDF = null;
    }
  }

  // ================================================================
  // 🔧 MÉTODOS AUXILIARES PDF
  // ================================================================
  private obtenerDetallesPedido(idPedido: number): Promise<PedidoDetalle[]> {
    return new Promise((resolve) => {
      this.pedidoService.getPedidoDetalles(idPedido).subscribe({
        next: (detalles) => resolve(detalles || []),
        error: () => resolve([])
      });
    });
  }

  // ================================================================
  // 📊 EXPORTACIÓN DE REPORTE PDF COMPLETO
  // ================================================================
  exportarPDF(): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const ventas = this.dataSource.filteredData;
    
    // Título y cabecera
    this.agregarCabeceraPDF(doc, ventas.length);
    
    // Tabla de datos
    this.agregarTablaPDF(doc, ventas);
    
    // Totales y pie de página
    this.agregarTotalesPDF(doc, ventas);
    
    // Guardar PDF
    doc.save(`Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ================================================================
  // 🧾 MÉTODOS AUXILIARES PARA REPORTE COMPLETO
  // ================================================================
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
    if (this.selectedPeriodo !== 'todos') {
      periodo = `Período: ${this.selectedPeriodo}`;
    }
    
    doc.text(periodo, 15, 45);
    doc.text(`Total de ventas: ${totalVentas}`, 200, 40);
  }

  private agregarTablaPDF(doc: jsPDF, ventas: Venta[]): void {
    const headers = [
      ['ID', 'CLIENTE', 'TIPO', 'MÉTODO PAGO', 'MONTO RECIBIDO', 'VUELTO', 'IGV', 'TOTAL', 'FECHA REGISTRO']
    ];

    const data = ventas.map(venta => [
      venta.ID_Venta.toString(),
      venta.Cliente_Nombre || 'Cliente General',
      this.getTipoVentaLabel(venta),
      this.getMetodoPagoLabel(venta),
      `S/${(venta.Monto_Recibido || 0).toFixed(2)}`,
      venta.ID_Tipo_Pago === 1 && venta.Vuelto ? `S/${venta.Vuelto.toFixed(2)}` : '-',
      `S/${venta.IGV?.toFixed(2) || '0.00'}`,
      `S/${venta.Total.toFixed(2)}`,
      this.formatearFechaParaPDF(venta.Fecha_Registro)
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
        8: { cellWidth: 30, halign: 'center' } // Fecha
      },
      margin: { left: 10, right: 10 }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, ventas: Venta[]): void {
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    
    // Calcular totales
    const totalIGV = ventas.reduce((sum, venta) => sum + (venta.IGV || 0), 0);
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.Total, 0);
    const totalEfectivo = ventas
      .filter(v => v.ID_Tipo_Pago === 1)
      .reduce((sum, venta) => sum + venta.Total, 0);
    const totalTarjeta = ventas
      .filter(v => v.ID_Tipo_Pago === 3)
      .reduce((sum, venta) => sum + venta.Total, 0);
    const totalDigital = ventas
      .filter(v => v.ID_Tipo_Pago === 2)
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

  private formatearFechaParaPDF(fecha: string | Date): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // ================================================================
  // 🧾 MÉTODOS DE GENERACIÓN DE PDF ESPECÍFICOS
  // ================================================================
  private generarBoletaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    let y = 10;

    // ENCABEZADO
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('BOLETA DE VENTA ELECTRÓNICA', pageWidth / 2, y, { align: 'center' });
    y += 5;
    
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 10713414561', pageWidth / 2, y, { align: 'center' });
    y += 6;

    // INFORMACIÓN DE VENTA
    doc.text(`Serie: B001-${venta.ID_Venta.toString().padStart(6, '0')}`, 5, y); y += 4;
    doc.text(`Fecha: ${new Date(venta.Fecha_Registro).toLocaleString()}`, 5, y); y += 4;
    doc.text(`Cliente: ${venta.Cliente_Nombre || 'Público General'}`, 5, y); y += 4;
    doc.text(`Pago: ${this.getMetodoPagoLabel(venta)}`, 5, y); y += 6;

    // LÍNEA SEPARADORA
    doc.line(5, y, pageWidth - 5, y); y += 4;

    // DETALLES DE PRODUCTOS
    doc.setFontSize(7).setFont('helvetica', 'bold');
    doc.text('Cant.', 5, y); 
    doc.text('Descripción', 15, y); 
    doc.text('Total', 75, y, { align: 'right' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    detalles.forEach(d => {
      const nombre = d.Nombre_Producto || d.Nombre_Combo || 'Item';
      const desc = d.Tamano_Nombre ? `${nombre} (${d.Tamano_Nombre})` : nombre;
      
      const splitTitle = doc.splitTextToSize(desc, 55);
      
      doc.text(d.Cantidad.toString(), 5, y);
      doc.text(splitTitle, 15, y);
      doc.text(Number(d.PrecioTotal).toFixed(2), 75, y, { align: 'right' });
      
      y += (splitTitle.length * 3) + 2;
    });

    y += 2;
    doc.line(5, y, pageWidth - 5, y); y += 5;

    // TOTALES
    doc.setFontSize(9).setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${Number(venta.Total).toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
    
    // VUELTO (si aplica)
    if (venta.ID_Tipo_Pago === 1 && venta.Monto_Recibido > 0) {
      doc.setFontSize(7).setFont('helvetica', 'normal');
      doc.text(`Recibido: S/ ${Number(venta.Monto_Recibido).toFixed(2)}`, 75, y, { align: 'right' }); y += 4;
      doc.text(`Vuelto: S/ ${Number(venta.Vuelto).toFixed(2)}`, 75, y, { align: 'right' }); y += 6;
    }

    // PIE DE PÁGINA
    doc.setFontSize(7);
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, y + 5, { align: 'center' });

    this.abrirPDFEnNuevaVentana(doc, `Boleta_${venta.ID_Venta}.pdf`);
  }

  private generarFacturaPDF(venta: Venta, detalles: PedidoDetalle[]): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    let y = 10;

    // ENCABEZADO
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('FACTURA ELECTRÓNICA', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(8);
    doc.text('AITA PIZZA S.A.C.', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // INFORMACIÓN DE FACTURA
    doc.setFont('helvetica', 'normal');
    doc.text(`Serie: F001-${venta.ID_Venta.toString().padStart(6, '0')}`, 5, y); y += 4;
    doc.text(`RUC Cliente: 20... (Simulado)`, 5, y); y += 4; 
    doc.text(`Razón Social: ${venta.Cliente_Nombre}`, 5, y); y += 6;

    // LÍNEA SEPARADORA
    doc.line(5, y, pageWidth - 5, y); y += 4;

    // DETALLES DE PRODUCTOS
    doc.setFontSize(7).setFont('helvetica', 'bold');
    doc.text('Cant.', 5, y); 
    doc.text('Descripción', 15, y); 
    doc.text('Total', 75, y, { align: 'right' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    detalles.forEach(d => {
      const nombre = d.Nombre_Producto || d.Nombre_Combo || 'Item';
      const desc = d.Tamano_Nombre ? `${nombre} (${d.Tamano_Nombre})` : nombre;
      const split = doc.splitTextToSize(desc, 55);
      
      doc.text(d.Cantidad.toString(), 5, y);
      doc.text(split, 15, y);
      doc.text(Number(d.PrecioTotal).toFixed(2), 75, y, { align: 'right' });
      y += (split.length * 3) + 2;
    });

    // LÍNEA SEPARADORA ANTES DE TOTAL
    y += 2;
    doc.line(5, y, pageWidth - 5, y); y += 5;

    // TOTAL
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: S/ ${Number(venta.Total).toFixed(2)}`, 75, y, { align: 'right' });

    this.abrirPDFEnNuevaVentana(doc, `Factura_${venta.ID_Venta}.pdf`);
  }

  private generarComprobanteGeneralPDF(venta: Venta, detalles: PedidoDetalle[]) {
    this.generarBoletaPDF(venta, detalles);
  }

  // ================================================================
  // 🔧 MÉTODOS UTILITARIOS
  // ================================================================
  private abrirPDFEnNuevaVentana(doc: jsPDF, nombreArchivo: string): void {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  }
}