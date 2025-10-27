import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PedidoService } from '../../../../core/services/auth/pedido.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-ver-detalle-pedido',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule, MatCardModule, MatButtonModule],
  templateUrl: './ver-detalle-pedido.component.html',
  styleUrls: ['./ver-detalle-pedido.component.css']
})
export class VerDetallePedidoComponent implements OnInit {
  detalleTexto: string = '';
  loading = true;

  constructor(
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<VerDetallePedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido_id: number }
  ) {}

  ngOnInit(): void {
    this.pedidoService.getPedidoDetalles(this.data.pedido_id).subscribe({
      next: (res) => {
        this.detalleTexto = res.detalle;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles:', err);
        this.detalleTexto = 'No se pudieron cargar los detalles.';
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
