import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pedido } from '../../../core/models/pedido.model';
import { PedidoService } from '../../../core/services/auth/pedido.service';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-pedido-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './pedido-form.component.html',
  styleUrls: ['./pedido-form.component.css']
})
export class PedidoFormComponent {

  pedido: Pedido;

  constructor(
    private pedidoService: PedidoService,
    private dialogRef: MatDialogRef<PedidoFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pedido?: Pedido }
  ) {
    this.pedido = data?.pedido ?? {
      id_pedido: 0,
      id_cliente: 0,
      id_usuario: 0,
      hora_pedido: '',
      estado_p: 'P',
      sub_total: 0,
      notas: '',
      fecha_registro: ''
    };
  }

  savePedido() {
    if (this.pedido.id_pedido === 0) {
      this.pedidoService.createPedido(this.pedido).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al crear pedido', err)
      });
    } else {
      this.pedidoService.updatePedido(this.pedido.id_pedido, this.pedido).subscribe({
        next: () => this.dialogRef.close(true),
        error: (err) => console.error('Error al actualizar pedido', err)
      });
    }
  }

  close() {
    this.dialogRef.close(false);
  }
}