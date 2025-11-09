import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-venta-pedido',
  standalone: true,
  imports: [
    CommonModule,  
    FormsModule,
    DecimalPipe,   
    MatDialogModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './venta-pedido.component.html',
  styleUrl: './venta-pedido.component.css'
})
export class VentaPedidoComponent {

  metodoPago: string = 'EFECTIVO';
  recibe: any = '';
  vuelto: number = 0;

  constructor(
    public dialogRef: MatDialogRef<VentaPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { total: number }
  ) {}

  calcularVuelto() {
    const recibeNum = Number(this.recibe) || 0;
    this.vuelto = recibeNum - this.data.total;
  }

  cerrar() {
    this.dialogRef.close();
  }

  confirmar() {
    // Si el método de pago es EFECTIVO, validar monto recibido
    if (this.metodoPago === 'EFECTIVO') {
      const recibeNum = Number(this.recibe) || 0;

      if (recibeNum < this.data.total) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto insuficiente',
          text: 'El monto recibido es menor al total a pagar.',
          confirmButtonColor: '#d33'
        });
        return; // ← No cierra el modal ni registra nada
      }
    }

    // 🔹 MODIFICADO: Pasar también el método de pago en texto completo
    this.dialogRef.close({
      metodoPago: this.metodoPago, // 🔹 Se pasa el texto completo (EFECTIVO, TARJETA, BILLETERA)
      recibe: this.recibe,
      vuelto: this.vuelto
    });
  }
}