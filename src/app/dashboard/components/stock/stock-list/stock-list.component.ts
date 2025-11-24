import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

// Models & Services
import { Stock } from '../../../../core/models/stock.model';
import { Insumo } from '../../../../core/models/insumo.model';
import { Proveedor } from '../../../../core/models/proveedor.model';
import { StockService } from '../../../../core/services/stock.service';
import { InsumoService } from '../../../../core/services/insumo.service'; 
import { ProveedorService } from '../../../../core/services/proveedor.service';
import { StockFormComponent } from '../stock-form/stock-form.component';
// 👇 IMPORTANTE: Importar el nuevo componente
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
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit, AfterViewInit {
  
  displayedColumns: string[] = [
    'ID_Stock', 
    'Nombre_Insumo',
    'Nombre_Proveedor',
    'Cantidad_Recibida', 
    'Nivel_Stock', 
    'Costo_Total', 
    'Fecha_Entrada', 
    'Fecha_Vencimiento', 
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<Stock>();
  loading = false;
  
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
    this.loadStocks();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    this.dataSource.filterPredicate = (data: Stock, filter: string) => {
      const searchStr = filter.toLowerCase();
      const insumo = data.Nombre_Insumo?.toLowerCase() || '';
      const proveedor = this.getNombreProveedor(data.ID_Proveedor).toLowerCase();
      const estadoLlenado = data.Estado_Llenado?.toLowerCase() || '';
      
      return insumo.includes(searchStr) || 
             proveedor.includes(searchStr) ||
             estadoLlenado.includes(searchStr) ||
             data.ID_Stock.toString().includes(searchStr);
    };
  }

  loadProveedores() {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => this.proveedores = data,
      error: (err) => console.error('Error loading proveedores', err)
    });
  }

  loadStocks() {
    this.loading = true;
    this.stockService.getStocks().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stocks', err);
        this.showSnackBar('Error al cargar el inventario', 'error');
        this.loading = false;
      }
    });
  }

  getNombreProveedor(id: number | null | undefined): string {
    if (!id) return '---';
    const p = this.proveedores.find(prov => prov.ID_Proveedor === id);
    return p ? p.Nombre : 'Desconocido';
  }

  getProgressBarColor(porcentaje: number | undefined): string {
    if (!porcentaje) return 'primary';
    if (porcentaje <= 10) return 'warn';
    if (porcentaje <= 30) return 'accent';
    return 'primary';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

<<<<<<< HEAD
  openMovimientoModal(stock?: Stock) {
    const dialogRef = this.dialog.open(StockFormComponent, {
      width: '600px',
      disableClose: true,
      data: stock ? { stockData: stock } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadStocks();
    });
  }
=======
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
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c

  // ✅ NUEVO: Método para ver historial
  verMovimientos(stock: Stock) {
    this.dialog.open(VerMovimientosComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { stock }
    });
  }

  exportarPDF(): void {
    if (this.dataSource.filteredData.length === 0) {
      this.showSnackBar('No hay datos para exportar', 'warning');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const data = this.dataSource.filteredData;

    doc.setFillColor(0, 150, 136);
    doc.rect(0, 0, 297, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Reporte de Inventario (Stock)', 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 220, 16);

    const columns = [
      'ID', 'Insumo', 'Unidad', 'Proveedor', 'Cantidad', 'Costo Unit.', 'Total', 'Estado Stock', 'Vencimiento'
    ];

    const rows = data.map(s => [
      s.ID_Stock.toString(),
      s.Nombre_Insumo || '',
      s.Unidad_Med || '',
      this.getNombreProveedor(s.ID_Proveedor),
      s.Cantidad_Recibida.toString(),
      `S/ ${s.Costo_Unitario.toFixed(2)}`,
      `S/ ${s.Costo_Total.toFixed(2)}`,
      s.Estado_Llenado || '',
      s.Fecha_Vencimiento ? new Date(s.Fecha_Vencimiento).toLocaleDateString() : 'N/A'
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [0, 150, 136] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 }, 
        4: { halign: 'center' }, 
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const valorTotal = data.reduce((sum, i) => sum + i.Costo_Total, 0);
    
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Valor Total del Inventario: S/ ${valorTotal.toFixed(2)}`, 14, finalY);

    doc.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private showSnackBar(msg: string, type: 'success' | 'error' | 'warning') {
    this.snackBar.open(msg, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'success' ? ['snackbar-success'] : ['snackbar-error']
    });
  }
}