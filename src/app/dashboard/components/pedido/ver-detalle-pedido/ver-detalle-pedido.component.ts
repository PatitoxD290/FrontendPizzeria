import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PedidoService } from '../../../../core/services/pedido.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

@Component({
  selector: 'app-ver-detalle-pedido',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './ver-detalle-pedido.component.html',
  styleUrls: ['./ver-detalle-pedido.component.css']
})
export class VerDetallePedidoComponent implements OnInit {
  detalles: PedidoDetalle[] = [];
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

  /** 🔹 Cargar los detalles del pedido */
  private cargarDetalles(): void {
    this.pedidoService.getPedidoDetalles(this.data.pedido_id).subscribe({
      next: (res) => {
        this.detalles = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles:', err);
        this.error = 'No se pudieron cargar los detalles del pedido.';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  /** 🔹 Calcular total del pedido */
  getTotal(): number {
    return this.detalles.reduce((acc, d) => acc + (Number(d.PrecioTotal) || 0), 0);
  }
}
