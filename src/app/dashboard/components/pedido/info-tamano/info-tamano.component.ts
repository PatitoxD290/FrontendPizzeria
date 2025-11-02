import { Component, Inject, OnInit } from '@angular/core';
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
export class InfoTamanoComponent implements OnInit {
  tamanos: Tamano[] = [];
  tamanoSeleccionado: Tamano | null = null;
  cantidad: number = 1;
  mostrarTamano: boolean = true;
  idTamanoForzado: number | null = null; // 🔹 Si hay que enviar ID fijo

  constructor(
    private tamanoService: TamanoService,
    public dialogRef: MatDialogRef<InfoTamanoComponent>,
    @Inject(MAT_DIALOG_DATA) public producto: Producto
  ) {}

  ngOnInit() {
    this.verificarCategoria();
    if (this.mostrarTamano) {
      this.cargarTamanos();
    }
  }

  // 🔹 Ocultar tamaño y forzar ID=1 en bebidas/combos
  verificarCategoria() {
    const categoriasForzadas = ['bebida', 'bebidas', 'combo', 'combos'];
    const nombreCat = this.producto.nombre_categoria?.toLowerCase() || '';

    if (categoriasForzadas.includes(nombreCat)) {
      this.mostrarTamano = false;
      this.idTamanoForzado = 1;
    } else {
      this.mostrarTamano = true;
      this.idTamanoForzado = null;
    }
  }

  cargarTamanos() {
    this.tamanoService.getTamanos().subscribe({
      next: (data) => (this.tamanos = data),
      error: (err) => console.error(err)
    });
  }

  getPrecioTotal(): number {
    if (this.idTamanoForzado !== null) {
      return this.producto.Precio_Base * this.cantidad;
    }

    if (this.mostrarTamano && !this.tamanoSeleccionado) {
      return this.producto.Precio_Base * this.cantidad;
    }

    return (this.producto.Precio_Base + (this.tamanoSeleccionado?.Variacion_Precio ?? 0)) * this.cantidad;
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

  // ✅ Validar selección de tamaño si aplica
  if (this.mostrarTamano && !this.tamanoSeleccionado) {
    Swal.fire({
      icon: 'warning',
      title: 'Selecciona un tamaño',
      text: 'Debes elegir un tamaño antes de agregar al pedido.',
      confirmButtonColor: '#1976d2'
    });
    return;
  }

  const idTamanoEnviar = this.idTamanoForzado ?? this.tamanoSeleccionado?.ID_Tamano ?? 0;
  const nombreTamano = this.idTamanoForzado ? 'Estándar' : this.tamanoSeleccionado?.Tamano ?? '—';

  // ✅ Si llega aquí, todo es válido
  this.dialogRef.close({
    ID_Producto: this.producto.ID_Producto,
    ID_Tamano: idTamanoEnviar,
    Cantidad: this.cantidad,
    PrecioTotal: this.getPrecioTotal(),
    nombre_producto: this.producto.Nombre,
    nombre_categoria: this.producto.nombre_categoria || 'Sin categoría',
    nombre_tamano: nombreTamano
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
