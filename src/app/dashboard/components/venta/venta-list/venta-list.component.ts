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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

  // 🔹 ACTUALIZADO: Agregar columnas de Monto_Recibido y Vuelto
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

  // 🔹 NUEVO: Método para formatear monto recibido
  obtenerMontoRecibidoTexto(venta: Venta): string {
    // Si es efectivo, mostrar monto recibido y vuelto
    if (venta.Metodo_Pago === 'E' && venta.Monto_Recibido > 0) {
      return `S/${venta.Monto_Recibido.toFixed(2)}`;
    }
    // Para otros métodos, mostrar solo el total
    return `S/${venta.Total.toFixed(2)}`;
  }

  // 🔹 NUEVO: Método para mostrar información de vuelto
  obtenerVueltoTexto(venta: Venta): string {
    if (venta.Metodo_Pago === 'E' && venta.Vuelto > 0) {
      return `S/${venta.Vuelto.toFixed(2)}`;
    }
    return '-';
  }

  // 🔹 NUEVO: Método para obtener tooltip informativo
  obtenerTooltipVenta(venta: Venta): string {
    if (venta.Metodo_Pago === 'E') {
      return `Recibido: S/${venta.Monto_Recibido?.toFixed(2) || '0.00'} | Vuelto: S/${venta.Vuelto?.toFixed(2) || '0.00'}`;
    }
    return `Pago con ${this.obtenerMetodoPagoTexto(venta.Metodo_Pago)}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  exportarExcel(): void {
    const hoja = XLSX.utils.json_to_sheet(this.dataSource.filteredData.map(v => ({
      ID_Venta: v.ID_Venta,
      Cliente: v.Cliente_Nombre,
      Tipo: this.obtenerTipoVentaTexto(v.Tipo_Venta),
      Método_Pago: this.obtenerMetodoPagoTexto(v.Metodo_Pago),
      Monto_Recibido: v.Monto_Recibido || 0,
      Vuelto: v.Vuelto || 0,
      IGV: v.IGV,
      Total: v.Total,
      Fecha_Registro: this.formatearFecha(v.Fecha_Registro),
    })));

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Ventas');

    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}