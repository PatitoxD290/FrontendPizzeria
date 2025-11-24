import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { StockService } from '../../../../core/services/stock.service';
import { StockMovimiento, Stock } from '../../../../core/models/stock.model';

@Component({
  selector: 'app-ver-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './ver-movimientos.component.html',
  styleUrls: ['./ver-movimientos.component.css']
})
export class VerMovimientosComponent implements OnInit {
  
  movimientos: StockMovimiento[] = [];
  loading = true;
  displayedColumns: string[] = ['Fecha', 'Tipo', 'Cantidad', 'Stock_Resultante', 'Motivo', 'Usuario'];

  constructor(
    private stockService: StockService,
    private dialogRef: MatDialogRef<VerMovimientosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { stock: Stock }
  ) {}

  ngOnInit(): void {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.loading = true;
    this.stockService.getMovimientosByStock(this.data.stock.ID_Stock).subscribe({
      next: (data) => {
        // Ordenar por fecha descendente (más reciente primero)
        this.movimientos = data.sort((a, b) => new Date(b.Fecha_Mov).getTime() - new Date(a.Fecha_Mov).getTime());
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando movimientos', err);
        this.loading = false;
      }
    });
  }

  getTipoColor(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('entrada') || t === 'ajuste') return 'primary'; // Azul/Verde
    if (t.includes('salida')) return 'warn'; // Rojo
    return 'accent';
  }

  getTipoIcon(tipo: string): string {
    const t = tipo.toLowerCase();
    if (t.includes('entrada')) return 'login';
    if (t.includes('salida')) return 'logout';
    return 'tune'; // Ajuste
  }

  close() {
    this.dialogRef.close();
  }
}