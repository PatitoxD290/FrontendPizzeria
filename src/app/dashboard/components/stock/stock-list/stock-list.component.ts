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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Agregar esto
import { MatTooltipModule } from '@angular/material/tooltip'; // Agregar esto
import { Stock } from '../../../../core/models/stock.model';
import { StockService } from '../../../../core/services/stock.service';
import { StockFormComponent } from '../stock-form/stock-form.component';

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
    MatProgressSpinnerModule, // Agregar esto
    MatTooltipModule // Agregar esto
  ]
})
export class StockListComponent implements OnInit {
  displayedColumns: string[] = [
    'ID_Stock', 
    'ID_Insumo', 
    'ID_Proveedor', 
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadStocks();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

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
}