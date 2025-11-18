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

import { VentaService } from '../../../../core/services/venta.service';
import { Venta } from '../../../../core/models/venta.model';

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
    MatTooltipModule
  ],
  templateUrl: './venta-list.component.html',
  styleUrls: ['./venta-list.component.css']
})
export class VentaListComponent implements OnInit {

  displayedColumns: string[] = ['id', 'cliente', 'tipo', 'metodo', 'montoRecibido', 'vuelto', 'igv', 'total', 'fecha'];
  dataSource = new MatTableDataSource<Venta>([]);

  filtroTexto: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private ventaService: VentaService) {}

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

  // 🔹 CORREGIDO: Mostrar solo fecha (sin hora)
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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