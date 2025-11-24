import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Modelos
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model'; // Importante para el tipado de retorno

import Swal from 'sweetalert2';

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
  maxCantidad: number = 100; // Límite lógico de seguridad

  constructor(
    public dialogRef: MatDialogRef<InfoTamanoComponent>,
    @Inject(MAT_DIALOG_DATA) public producto: Producto
  ) {}

  ngOnInit() {
    // 1. Obtener el primer tamaño activo (Lógica de selección rápida)
    this.obtenerPrimerTamano();
    
    // 2. Validar stock máximo
    if (this.producto.Cantidad_Disponible) {
      this.maxCantidad = this.producto.Cantidad_Disponible;
    }
  }

  obtenerPrimerTamano() {
    if (this.producto.tamanos && this.producto.tamanos.length > 0) {
      // Filtramos solo los activos
      const tamanosActivos = this.producto.tamanos.filter(t => t.Estado === 'A');
      // Tomamos el primero (ideal para productos de tamaño único)
      this.primerTamano = tamanosActivos.length > 0 ? tamanosActivos[0] : null;
    } else {
      this.primerTamano = null;
    }
  }

  getPrecioTotal(): number {
    if (!this.primerTamano) return 0;
    return this.primerTamano.Precio * this.cantidad;
  }

  // 🔢 Validaciones de Cantidad
  validarCantidad(event: any) {
    const input = event.target;
    let valor = input.value.replace(/[^0-9]/g, ''); // Solo números

    // Si está vacío o es 0, forzar a 1
    if (!valor || parseInt(valor, 10) <= 0) {
      valor = '1';
    } 
    // Si supera el stock, limitar
    else if (parseInt(valor, 10) > this.maxCantidad) {
      valor = this.maxCantidad.toString();
    }

    input.value = valor;
    this.cantidad = parseInt(valor, 10);
  }

  incrementarCantidad() {
    if (this.cantidad < this.maxCantidad) {
      this.cantidad++;
    }
  }

  decrementarCantidad() {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  // 🛒 Agregar al Pedido
  agregarAlPedido() {
    // Validaciones finales
    if (!this.primerTamano) {
      Swal.fire('Error', 'Este producto no tiene precios configurados.', 'error');
      return;
    }

    if (this.cantidad <= 0 || isNaN(this.cantidad)) {
      Swal.fire('Cantidad inválida', 'Ingresa una cantidad mayor a 0.', 'warning');
      return;
    }

    // Construir objeto de retorno compatible con PedidoDetalle
    const detalle: PedidoDetalle = {
      ID_Pedido_D: 0, // Temporal
      ID_Pedido: 0,   // Temporal
      ID_Producto_T: this.primerTamano.ID_Producto_T, // ✅ ID Correcto
      
      Cantidad: this.cantidad,
      PrecioTotal: this.getPrecioTotal(),
      
      // Datos visuales
      Nombre_Producto: this.producto.Nombre,
      // Nombre_Categoria: this.producto.nombre_categoria, // Opcional
      Tamano_Nombre: this.primerTamano.nombre_tamano || 'Estándar',
      Tipo: 'producto'
    };

    // Retornar datos y cerrar
    this.dialogRef.close(detalle);

    // Feedback rápido
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: 'success',
      title: 'Agregado',
      text: `${this.producto.Nombre} x${this.cantidad}`
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
  
  // Getters visuales
  get stockTexto(): string {
    return this.producto.Cantidad_Disponible > 0 
      ? `${this.producto.Cantidad_Disponible} disponibles` 
      : 'Agotado';
  }
}