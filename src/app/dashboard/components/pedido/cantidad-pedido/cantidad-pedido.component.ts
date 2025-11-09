import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProductoTamano } from '../../../../core/models/producto.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

export interface CantidadPedidoData {
  productoTamano: ProductoTamano & {
    producto?: any;
    nombre_categoria?: string;
    nombre_producto?: string;
    descripcion_producto?: string;
  };
}

@Component({
  selector: 'app-cantidad-pedido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  templateUrl: './cantidad-pedido.component.html',
  styleUrls: ['./cantidad-pedido.component.css']
})
export class CantidadPedidoComponent {
  cantidad: number = 1;
  maxCantidad: number = 50;

  constructor(
    public dialogRef: MatDialogRef<CantidadPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CantidadPedidoData
  ) {}

  ngOnInit(): void {
    // Establecer cantidad máxima basada en disponibilidad
    if (this.data.productoTamano.producto?.Cantidad_Disponible) {
      this.maxCantidad = Math.min(this.data.productoTamano.producto.Cantidad_Disponible, 50);
    }
  }

  aumentarCantidad(): void {
    if (this.cantidad < this.maxCantidad) {
      this.cantidad++;
    }
  }

  reducirCantidad(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
    }
  }

  onCantidadChange(event: any): void {
    let value = parseInt(event.target.value, 10);
    
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > this.maxCantidad) {
      value = this.maxCantidad;
    }
    
    this.cantidad = value;
    event.target.value = value.toString();
  }

  agregarAlPedido(): void {
    const detalle: PedidoDetalle = {
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      ID_Producto_T: this.data.productoTamano.ID_Producto_T,
      Cantidad: this.cantidad,
      PrecioTotal: this.data.productoTamano.Precio * this.cantidad,
      nombre_producto: this.data.productoTamano.nombre_producto || 'Producto',
      nombre_categoria: this.data.productoTamano.nombre_categoria || 'Sin categoría',
      nombre_tamano: this.data.productoTamano.nombre_tamano || 'Tamaño único'
    };

    this.dialogRef.close(detalle);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  // Método para validar entrada manual
  validarEntrada(event: any): void {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value === '' || parseInt(value, 10) < 1) {
      value = '1';
    } else if (parseInt(value, 10) > this.maxCantidad) {
      value = this.maxCantidad.toString();
    }
    
    input.value = value;
    this.cantidad = parseInt(value, 10);
  }

  get precioTotal(): number {
    return this.data.productoTamano.Precio * this.cantidad;
  }

  get disponibleTexto(): string {
    const disponible = this.data.productoTamano.producto?.Cantidad_Disponible || 0;
    return `Disponible: ${disponible} unidades`;
  }
}