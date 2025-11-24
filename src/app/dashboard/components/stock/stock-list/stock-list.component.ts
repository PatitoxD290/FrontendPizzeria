import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

// Models & Services
import { Stock } from '../../../../core/models/stock.model';
import { Insumo } from '../../../../core/models/insumo.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { StockService } from '../../../../core/services/stock.service';
import { InsumoService } from '../../../../core/services/insumo.service'; 
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { StockFormComponent } from '../stock-form/stock-form.component';
import { VerMovimientosComponent } from '../ver-movimientos/ver-movimientos.component';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit, AfterViewInit {
  
  dataSource = new MatTableDataSource<Stock>();
  loading = false;
  
  // 📦 Datos auxiliares
  proveedores: Proveedor[] = [];
  insumos: Insumo[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private insumoService: InsumoService,
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProveedores();
    this.loadInsumos();
    this.loadStocks();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // 🔍 Filtro personalizado
    this.dataSource.filterPredicate = (data: Stock, filter: string) => {
      const searchStr = filter.toLowerCase();
      const insumo = data.Nombre_Insumo?.toLowerCase() || '';
      const proveedor = this.getNombreProveedor(data.ID_Proveedor).toLowerCase();
      const estadoLlenado = data.Estado_Llenado?.toLowerCase() || '';
      const unidadMed = data.Unidad_Med?.toLowerCase() || '';
      
      return insumo.includes(searchStr) || 
             proveedor.includes(searchStr) ||
             estadoLlenado.includes(searchStr) ||
             unidadMed.includes(searchStr) ||
             data.ID_Stock.toString().includes(searchStr) ||
             data.Cantidad_Recibida.toString().includes(searchStr);
    };
  }

  // 📥 Cargar proveedores
  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
      },
      error: (error) => {
        console.error('Error loading proveedores:', error);
        this.showSnackBar('Error al cargar los proveedores', 'error');
      }
    });
  }

  // 📥 Cargar insumos
  loadInsumos() {
    this.insumoService.getInsumos().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (error) => {
        console.error('Error loading insumos:', error);
        this.showSnackBar('Error al cargar los insumos', 'error');
      }
    });
  }

  // 📦 Cargar stocks
  loadStocks() {
    this.loading = true;
    this.stockService.getStocks().subscribe({
      next: (stocks) => {
        this.dataSource.data = stocks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stocks:', error);
        this.showSnackBar('Error al cargar el inventario', 'error');
        this.loading = false;
      }
    });
  }

  // 🔍 Obtener nombre del proveedor por ID
  getNombreProveedor(id: number | null | undefined): string {
    if (!id) return 'No asignado';
    const proveedor = this.proveedores.find(p => p.ID_Proveedor === id);
    return proveedor ? proveedor.Nombre : `Proveedor #${id}`;
  }

  // ⏰ Verificar si está vencido
  isVencido(fechaVencimiento: string | null): boolean {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    // Limpiar las horas para comparar solo fechas
    hoy.setHours(0, 0, 0, 0);
    fechaVenc.setHours(0, 0, 0, 0);
    return fechaVenc < hoy;
  }

  // 🏷️ Obtener clase CSS para estado de vencimiento
  getEstadoVencimientoClass(fechaVencimiento: string | null): string {
    if (!fechaVencimiento) return 'no-vencimiento';
    return this.isVencido(fechaVencimiento) ? 'vencido' : 'vigente';
  }

  // 🎨 Clase CSS para la barra de progreso según el porcentaje
  getProgressBarClass(porcentaje: number | undefined): string {
    if (!porcentaje) return 'progress-high';
    if (porcentaje <= 10) return 'progress-low';
    if (porcentaje <= 30) return 'progress-medium';
    return 'progress-high';
  }

  // 🔍 Aplicar filtro de búsqueda
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 🧹 Limpiar filtros
  limpiarFiltros() {
    const input = document.querySelector('.search-input-compact') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    this.dataSource.filter = '';
  }

  // 📝 Abrir modal para movimiento de stock
  openMovimientoModal(stock?: Stock) {
    const dialogRef = this.dialog.open(StockFormComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'stock-form-dialog',
      data: stock ? { stockData: stock } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStocks(); // Recargar la lista después de un movimiento
      }
    });
  }

  // 📋 Ver historial de movimientos
  verMovimientos(stock: Stock) {
    this.dialog.open(VerMovimientosComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { stock }
    });
  }

  // 🆕 EXPORTAR PDF - Versión mejorada
  exportarPDF(): void {
    if (this.dataSource.filteredData.length === 0) {
      this.showSnackBar('No hay datos para generar el reporte PDF', 'warning');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const stocks = this.dataSource.filteredData;
    
    // Título y cabecera
    this.agregarCabeceraPDF(doc, stocks.length);
    
    // Tabla de datos
    this.agregarTablaPDF(doc, stocks);
    
    // Totales y pie de página
    this.agregarTotalesPDF(doc, stocks);
    
    // Guardar PDF
    doc.save(`Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
    
    this.showSnackBar('Reporte PDF generado correctamente', 'success');
  }

  private agregarCabeceraPDF(doc: jsPDF, totalStocks: number): void {
    // Fondo decorativo
    doc.setFillColor(0, 150, 136);
    doc.rect(0, 0, 297, 30, 'F');
    
    // Logo o ícono
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('📦', 15, 18);
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE INVENTARIO - STOCK', 25, 18);
    
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
    doc.text(`Total de registros: ${totalStocks}`, 200, 40);
  }

  private agregarTablaPDF(doc: jsPDF, stocks: Stock[]): void {
    const headers = [
      ['ID', 'INSUMO', 'UNIDAD', 'PROVEEDOR', 'CANTIDAD', 'COSTO UNIT.', 'COSTO TOTAL', 'ESTADO STOCK', 'FECHA VENC.', 'ESTADO']
    ];

    const data = stocks.map(stock => [
      stock.ID_Stock.toString(),
      stock.Nombre_Insumo || 'N/A',
      stock.Unidad_Med || 'N/A',
      this.getNombreProveedor(stock.ID_Proveedor),
      stock.Cantidad_Recibida.toString(),
      `S/${stock.Costo_Unitario?.toFixed(2) || '0.00'}`,
      `S/${stock.Costo_Total?.toFixed(2) || '0.00'}`,
      stock.Estado_Llenado || 'N/A',
      stock.Fecha_Vencimiento ? this.formatDateForPDF(stock.Fecha_Vencimiento) : 'No vence',
      this.getEstadoVencimientoClass(stock.Fecha_Vencimiento)
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [0, 150, 136],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 22 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 15, halign: 'center' },
        8: { cellWidth: 18, halign: 'center' },
        9: { cellWidth: 12, halign: 'center' }
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        // Colorear estados de vencimiento
        if (data.section === 'body' && data.column.index === 9) {
          const estado = data.cell.raw as string;
          const ctx = doc as any;
          
          if (estado === 'vencido') {
            ctx.setTextColor(244, 67, 54); // Rojo
          } else if (estado === 'vigente') {
            ctx.setTextColor(56, 142, 60); // Verde
          } else {
            ctx.setTextColor(158, 158, 158); // Gris
          }
        }
      }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, stocks: Stock[]): void {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Calcular totales
    const totalRegistros = stocks.length;
    const totalCantidad = stocks.reduce((sum, stock) => sum + stock.Cantidad_Recibida, 0);
    const totalCostoTotal = stocks.reduce((sum, stock) => sum + (stock.Costo_Total || 0), 0);
    const vencidos = stocks.filter(stock => this.isVencido(stock.Fecha_Vencimiento)).length;

    // Fondo para totales
    doc.setFillColor(240, 240, 240);
    doc.rect(10, finalY + 5, 277, 30, 'F');

    // Restaurar color negro
    doc.setTextColor(0, 0, 0);

    // Totales principales
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    doc.text('RESUMEN DE INVENTARIO', 15, finalY + 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Registros: ${totalRegistros}`, 15, finalY + 22);
    doc.text(`Cantidad Total: ${totalCantidad} unidades`, 15, finalY + 28);
    doc.text(`Valor Total Inventario: S/${totalCostoTotal.toFixed(2)}`, 15, finalY + 34);

    // Estados
    doc.text(`Lotes vencidos: ${vencidos}`, 120, finalY + 22);
    doc.text(`Lotes vigentes: ${totalRegistros - vencidos}`, 120, finalY + 28);

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Este reporte fue generado automáticamente por el Sistema de Gestión Comercial', 15, 190);
    doc.text('Página 1 de 1', 260, 190);
  }

  private formatDateForPDF(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // 💬 Mostrar notificaciones
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const panelClass = type === 'success' ? ['success-snackbar'] : 
                      type === 'error' ? ['error-snackbar'] : 
                      ['warn-snackbar'];
    
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: panelClass
    });
  }

  // Propiedad computada para filteredData
  get filteredData(): Stock[] {
    return this.dataSource.filteredData;
  }
}