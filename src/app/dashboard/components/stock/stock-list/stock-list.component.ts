import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Stock } from '../../../../core/models/stock.model';
import { Insumo } from '../../../../core/models/ingrediente.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { StockService } from '../../../../core/services/stock.service';
import { IngredienteService } from '../../../../core/services/ingrediente.service';
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { StockFormComponent } from '../stock-form/stock-form.component';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-stock-list',
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css'],
  imports: [
    CommonModule,
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
    MatTooltipModule
  ]
})
export class StockListComponent implements OnInit {
  displayedColumns: string[] = [
    'ID_Stock', 
    'Nombre_Insumo',
    'Nombre_Proveedor',
    'Cantidad_Recibida', 
    'Costo_Unitario', 
    'Costo_Total', 
    'Fecha_Entrada', 
    'Fecha_Vencimiento', 
    'Estado',
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Stock>();
  loading = false;
  insumos: Insumo[] = [];
  proveedores: Proveedor[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private ingredienteService: IngredienteService,
    private proveedorService: ProveedorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadInsumos();
    this.loadProveedores();
    this.loadStocks();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Filtro personalizado que busca en los nombres
    this.dataSource.filterPredicate = (data: Stock, filter: string) => {
      const searchStr = filter.toLowerCase();
      const insumoNombre = this.getNombreInsumo(data.ID_Insumo).toLowerCase();
      const proveedorNombre = this.getNombreProveedor(data.ID_Proveedor).toLowerCase();
      
      return insumoNombre.includes(searchStr) || 
             proveedorNombre.includes(searchStr) ||
             data.Cantidad_Recibida.toString().includes(searchStr) ||
             data.Costo_Unitario.toString().includes(searchStr);
    };
  }

  // 📥 Cargar insumos
  loadInsumos() {
    this.ingredienteService.getIngredientes().subscribe({
      next: (insumos) => {
        this.insumos = insumos;
      },
      error: (error) => {
        console.error('Error loading insumos:', error);
        this.snackBar.open('Error al cargar los insumos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  // 📥 Cargar proveedores
  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
      },
      error: (error) => {
        console.error('Error loading proveedores:', error);
        this.snackBar.open('Error al cargar los proveedores', 'Cerrar', { duration: 3000 });
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
        this.snackBar.open('Error al cargar los stocks', 'Cerrar', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  // 🔍 Obtener nombre del insumo por ID
  getNombreInsumo(idInsumo: number): string {
    const insumo = this.insumos.find(i => i.ID_Insumo === idInsumo);
    return insumo ? insumo.Nombre : `Insumo #${idInsumo}`;
  }

  // 🔍 Obtener nombre del proveedor por ID
  getNombreProveedor(idProveedor: number | null): string {
    if (!idProveedor) return 'No asignado';
    
    const proveedor = this.proveedores.find(p => p.ID_Proveedor === idProveedor);
    return proveedor ? proveedor.Nombre : `Proveedor #${idProveedor}`;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

openMovimientoModal(stock?: Stock) {
  const dialogRef = this.dialog.open(StockFormComponent, {
    width: '600px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    panelClass: 'stock-form-dialog', // Clase adicional para personalización
    data: stock ? { 
      ID_Stock: stock.ID_Stock,
      stockData: stock 
    } : null
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.loadStocks(); // Recargar la lista después de un movimiento
    }
  });
}

  getEstadoText(estado: string): string {
    const estados: { [key: string]: string } = {
      'A': 'Activo',
      'I': 'Inactivo',
      'C': 'Caducado'
    };
    return estados[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'A': 'estado-activo',
      'I': 'estado-inactivo',
      'C': 'estado-caducado'
    };
    return clases[estado] || '';
  }

  // 🆕 EXPORTAR PDF
  exportarPDF(): void {
    if (this.dataSource.filteredData.length === 0) {
      this.snackBar.open('No hay datos para generar el reporte PDF', 'Cerrar', { 
        duration: 3000,
        panelClass: ['warn-snackbar']
      });
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
    doc.save(`Reporte_Stock_${new Date().toISOString().slice(0, 10)}.pdf`);
    
    this.snackBar.open('Reporte PDF generado correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private agregarCabeceraPDF(doc: jsPDF, totalStocks: number): void {
    // Fondo decorativo - Naranja para stock/inventario
    doc.setFillColor(255, 152, 0);
    doc.rect(0, 0, 297, 30, 'F');
    
    // Logo o ícono
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('📊', 15, 18);
    
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
      ['ID', 'INSUMO', 'PROVEEDOR', 'CANTIDAD', 'COSTO UNIT.', 'COSTO TOTAL', 'FECHA ENTRADA', 'FECHA VENC.', 'ESTADO']
    ];

    const data = stocks.map(stock => [
      stock.ID_Stock.toString(),
      this.getNombreInsumo(stock.ID_Insumo),
      this.getNombreProveedor(stock.ID_Proveedor),
      stock.Cantidad_Recibida.toString(),
      `S/${stock.Costo_Unitario.toFixed(2)}`,
      `S/${stock.Costo_Total.toFixed(2)}`,
      this.formatDateForPDF(stock.Fecha_Entrada),
      stock.Fecha_Vencimiento ? this.formatDateForPDF(stock.Fecha_Vencimiento) : 'No vence',
      this.getEstadoText(stock.Estado)
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
        fillColor: [255, 152, 0], // Naranja
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' }, // ID
        1: { cellWidth: 35 }, // Insumo
        2: { cellWidth: 35 }, // Proveedor
        3: { cellWidth: 15, halign: 'center' }, // Cantidad
        4: { cellWidth: 20, halign: 'right' }, // Costo Unitario
        5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // Costo Total
        6: { cellWidth: 25, halign: 'center' }, // Fecha Entrada
        7: { cellWidth: 25, halign: 'center' }, // Fecha Vencimiento
        8: { cellWidth: 18, halign: 'center' } // Estado
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (data) => {
        // Colorear estados
        if (data.section === 'body' && data.column.index === 8) {
          const estado = data.cell.raw as string;
          const ctx = doc as any;
          
          if (estado === 'Activo') {
            ctx.setTextColor(56, 142, 60); // Verde
          } else if (estado === 'Inactivo') {
            ctx.setTextColor(244, 67, 54); // Rojo
          } else if (estado === 'Caducado') {
            ctx.setTextColor(255, 152, 0); // Naranja
          }
        }
      },
      willDrawCell: (data) => {
        // Restaurar color negro para otras celdas
        if (data.section === 'body' && data.column.index !== 8) {
          const ctx = doc as any;
          ctx.setTextColor(0, 0, 0);
        }
      }
    });
  }

  private agregarTotalesPDF(doc: jsPDF, stocks: Stock[]): void {
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Calcular totales
    const totalRegistros = stocks.length;
    const totalCantidad = stocks.reduce((sum, stock) => sum + stock.Cantidad_Recibida, 0);
    const totalCostoUnitario = stocks.reduce((sum, stock) => sum + stock.Costo_Unitario, 0);
    const totalCostoTotal = stocks.reduce((sum, stock) => sum + stock.Costo_Total, 0);
    
    const stocksActivos = stocks.filter(s => s.Estado === 'A').length;
    const stocksInactivos = stocks.filter(s => s.Estado === 'I').length;
    const stocksCaducados = stocks.filter(s => s.Estado === 'C').length;

    // Fondo para totales
    doc.setFillColor(240, 240, 240);
    doc.rect(10, finalY + 5, 277, 35, 'F');

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
    doc.text(`Valor Total Stock: S/${totalCostoTotal.toFixed(2)}`, 15, finalY + 34);

    // Estados de stock
    doc.text('POR ESTADO:', 120, finalY + 15);
    doc.text(`Activos: ${stocksActivos}`, 120, finalY + 22);
    doc.text(`Inactivos: ${stocksInactivos}`, 120, finalY + 28);
    doc.text(`Caducados: ${stocksCaducados}`, 120, finalY + 34);

    // Métricas adicionales
    doc.text('MÉTRICAS:', 200, finalY + 15);
    doc.text(`Costo Unit. Promedio: S/${(totalCostoUnitario / totalRegistros).toFixed(2)}`, 200, finalY + 22);
    doc.text(`Cantidad Promedio: ${(totalCantidad / totalRegistros).toFixed(1)}`, 200, finalY + 28);

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
}