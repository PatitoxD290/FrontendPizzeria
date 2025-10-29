import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TamanoService } from '../../../../core/services/tamano.service';
import { Tamano } from '../../../../core/models/tamano.model';
import { Producto } from '../../../../core/models/producto.model';
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-info-tamano',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './info-tamano.component.html',
  styleUrls: ['./info-tamano.component.css']
})
export class InfoTamanoComponent {
  tamanos: Tamano[] = [];
  tamanoSeleccionado: Tamano | null = null;
  cantidad: number = 1;

  constructor(
    private tamanoService: TamanoService,
    public dialogRef: MatDialogRef<InfoTamanoComponent>,
    @Inject(MAT_DIALOG_DATA) public producto: Producto
  ) {
    this.cargarTamanos();
  }

  cargarTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (data) => this.tamanos = data,
      error: (err) => console.error(err)
    });
  }

  getPrecioTotal(): number {
    if (!this.tamanoSeleccionado) return this.producto.Precio_Base * this.cantidad;
    return (this.producto.Precio_Base + this.tamanoSeleccionado.Variacion_Precio) * this.cantidad;
  }

  agregarAlPedido() {
    if (!this.tamanoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un tamaño',
        text: 'Debes elegir un tamaño antes de agregar al pedido',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    this.dialogRef.close({
      ID_Producto: this.producto.ID_Producto,
      ID_Tamano: this.tamanoSeleccionado.ID_Tamano,
      Cantidad: this.cantidad,
      PrecioTotal: this.getPrecioTotal(),
      nombre_producto: this.producto.Nombre,
      nombre_categoria: this.producto.Descripcion, // o categoría real si la tienes
      nombre_tamano: this.tamanoSeleccionado.Tamano // 🔹 agrega esto
    });

    Swal.fire({
      icon: 'success',
      title: 'Agregado al pedido',
      text: `${this.producto.Nombre} (${this.tamanoSeleccionado.Tamano}) x${this.cantidad}`,
      showConfirmButton: false,
      timer: 1500,
      background: '#f0f0f0'
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
