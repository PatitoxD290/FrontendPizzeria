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
    this.vuelto = Math.max(0, recibeNum - this.data.total);
  }

  // 🔹 NUEVO: Método para manejar cambios en el input
  onRecibeChange() {
    this.calcularVuelto();
  }

  // 🔹 NUEVO: Métodos para el teclado numérico
  addNumber(num: string) {
    const current = this.recibe.toString();
    if (current === '0' || current === '') {
      this.recibe = num;
    } else {
      this.recibe = current + num;
    }
    this.calcularVuelto();
  }

  deleteLast() {
    const current = this.recibe.toString();
    if (current.length > 1) {
      this.recibe = current.slice(0, -1);
    } else {
      this.recibe = '';
    }
    this.calcularVuelto();
  }

  clearRecibe() {
    this.recibe = '';
    this.vuelto = 0;
  }

  addDecimal() {
    const current = this.recibe.toString();
    if (!current.includes('.')) {
      this.recibe = current + '.';
    }
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
        return;
      }

      if (!this.recibe || this.recibe === '') {
        Swal.fire({
          icon: 'warning',
          title: 'Monto requerido',
          text: 'Por favor ingrese el monto recibido.',
          confirmButtonColor: '#d33'
        });
        return;
      }
    } else {
      // Para otros métodos de pago, el monto recibido es igual al total
      this.recibe = this.data.total;
      this.vuelto = 0;
    }

    // 🔹 MODIFICADO: Pasar también el método de pago en texto completo y los montos
    this.dialogRef.close({
      metodoPago: this.metodoPago,
      recibe: Number(this.recibe) || this.data.total,
      vuelto: this.vuelto,
      montoRecibido: Number(this.recibe) || this.data.total // 🔹 NUEVO: Para enviar al backend
    });
  }
}