import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { PedidoService } from '../../../../core/services/pedido.service';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

@Component({
  selector: 'app-ver-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './ver-detalle-pedido.component.html',
  styleUrls: ['./ver-detalle-pedido.component.css']
})
export class VerDetallePedidoComponent implements OnInit {
  
  detalles: PedidoDetalle[] = [];
  notas: string = '';
  loading = true;
  error = '';

  constructor(
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<VerDetallePedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido_id: number }
  ) {}

  ngOnInit(): void {
    this.cargarDetalles();
  }

  private cargarDetalles(): void {
    this.pedidoService.getPedidoById(this.data.pedido_id).subscribe({
      next: (res) => {
        this.detalles = res.detalles || [];
        this.notas = res.Notas || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles:', err);
        this.error = 'No se pudieron cargar los detalles del pedido.';
        this.loading = false;
      }
    });
  }

  // 🛠️ Helpers Visuales (mantenidos del segundo componente)
  
  getItemName(d: PedidoDetalle): string {
    return d.Nombre_Combo || d.Nombre_Producto || 'Item desconocido';
  }

  getItemDetail(d: PedidoDetalle): string {
    if (d.ID_Combo) return 'Combo';
    return d.Tamano_Nombre || 'Estándar';
  }

  isCombo(d: PedidoDetalle): boolean {
    return !!d.ID_Combo;
  }

  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (Number(d.PrecioTotal) || 0), 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}