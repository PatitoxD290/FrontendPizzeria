import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
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

  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];

  filtroTexto: string = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  displayedColumns: string[] = ['id', 'cliente', 'tipo', 'metodo', 'igv', 'total', 'fecha'];

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void {
    this.cargarVentas();
  }

  cargarVentas(): void {
    this.ventaService.getVentas().subscribe({
      next: (data) => {
        this.ventas = data;
        this.ventasFiltradas = data;
      },
      error: (err) => console.error('Error al cargar ventas:', err)
    });
  }

  aplicarFiltros(): void {
    this.ventasFiltradas = this.ventas.filter(v => {
      const coincideTexto =
        v.Nombre_cliente.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        v.id_venta.toString().includes(this.filtroTexto);

      const fechaVenta = new Date(v.Fecha_Registro);
      const desde = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const hasta = this.fechaFin ? new Date(this.fechaFin) : null;

      const coincideFecha =
        (!desde || fechaVenta >= desde) && (!hasta || fechaVenta <= hasta);

      return coincideTexto && coincideFecha;
    });
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.ventasFiltradas = this.ventas;
  }

  exportarExcel(): void {
    const hoja = XLSX.utils.json_to_sheet(this.ventasFiltradas.map(v => ({
      ID_Venta: v.id_venta,
      Cliente: v.Nombre_cliente,
      Tipo: v.Tipo_venta,
      Método_Pago: v.Metodo_pago,
      IGV: v.IGV,
      Total: v.Total,
      Fecha_Registro: v.Fecha_Registro,
    })));

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Ventas');

    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    saveAs(blob, `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
