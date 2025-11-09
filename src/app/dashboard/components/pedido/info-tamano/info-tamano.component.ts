import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-info-tamano',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './info-tamano.component.html',
  styleUrls: ['./info-tamano.component.css']
})
export class InfoTamanoComponent implements OnInit {
  primerTamano: ProductoTamano | null = null;
  cantidad: number = 1;

  constructor(
    public dialogRef: MatDialogRef<InfoTamanoComponent>,
    @Inject(MAT_DIALOG_DATA) public producto: Producto
  ) {}

  ngOnInit() {
    // 🔹 Obtener el primer tamaño activo del producto
    this.obtenerPrimerTamano();
  }

  // 🔹 CORRECCIÓN: Obtener el primer ProductoTamano activo
  obtenerPrimerTamano() {
    if (this.producto.tamanos && this.producto.tamanos.length > 0) {
      const tamanosActivos = this.producto.tamanos.filter(t => t.Estado === 'A');
      this.primerTamano = tamanosActivos.length > 0 ? tamanosActivos[0] : null;
    } else {
      this.primerTamano = null;
    }
  }

  // 🔹 CORRECCIÓN: Calcular precio basado en ProductoTamano
  getPrecioTotal(): number {
    if (!this.primerTamano) {
      return 0;
    }
    return this.primerTamano.Precio * this.cantidad;
  }

  // 🔹 Validar que cantidad sea solo número entero positivo
  validarCantidad(event: any) {
    const valor = event.target.value.trim();

    // Solo permitir números enteros
    if (!/^\d*$/.test(valor)) {
      event.target.value = valor.replace(/\D/g, '');
    }

    const num = parseInt(event.target.value || '0', 10);

    // Si es menor o igual a 0, mantener el campo vacío
    if (isNaN(num) || num <= 0) {
      this.cantidad = 0;
      return;
    }

    this.cantidad = num;
  }

  // 🔹 CORRECCIÓN: Agregar al pedido usando ID_Producto_T
  agregarAlPedido() {
    // ✅ Validación estricta de cantidad
    if (!this.cantidad || isNaN(this.cantidad) || this.cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'Debes ingresar una cantidad mayor o igual a 1.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    // ✅ Validar que el producto tenga tamaños disponibles
    if (!this.primerTamano) {
      Swal.fire({
        icon: 'error',
        title: 'Producto no disponible',
        text: 'Este producto no tiene tamaños disponibles.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    // ✅ CORRECCIÓN: Enviar solo la cantidad, usando el primer ProductoTamano
    this.dialogRef.close({
      ID_Producto_T: this.primerTamano.ID_Producto_T, // ✅ Usar ID_Producto_T
      Cantidad: this.cantidad,
      PrecioTotal: this.getPrecioTotal(),
      nombre_producto: this.producto.Nombre,
      nombre_categoria: this.producto.nombre_categoria || 'Sin categoría',
      nombre_tamano: this.primerTamano.nombre_tamano || 'Tamaño único'
    });

    Swal.fire({
      icon: 'success',
      title: 'Agregado al pedido',
      text: `${this.producto.Nombre} x${this.cantidad}`,
      showConfirmButton: false,
      timer: 1500,
      background: '#f0f0f0'
    });
  }

  incrementarCantidad() {
    this.cantidad++;
  }

  decrementarCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
    } else {
      this.cantidad = 1; // nunca baja de 1
    }
  }

  cancelar() {
    this.dialogRef.close();
  }
}