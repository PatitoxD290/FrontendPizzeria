import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';

export interface CantidadPedidoData {
  producto: Producto;
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
    // 🔹 QUITAMOS MatRadioModule ya que usaremos botones
  ],
  templateUrl: './cantidad-pedido.component.html',
  styleUrls: ['./cantidad-pedido.component.css']
})
export class CantidadPedidoComponent implements OnInit {
  cantidad: number = 1;
  maxCantidad: number = 50;
  
  tamanosDisponibles: ProductoTamano[] = [];
  tamanoSeleccionado: ProductoTamano | null = null;
  precioUnitario: number = 0;
  precioTotal: number = 0;

  constructor(
    public dialogRef: MatDialogRef<CantidadPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CantidadPedidoData
  ) {}

  ngOnInit(): void {
    this.tamanosDisponibles = this.data.producto.tamanos?.filter(t => t.Estado === 'A') || [];
    
    if (this.tamanosDisponibles.length > 0) {
      this.tamanoSeleccionado = this.tamanosDisponibles[0];
      this.precioUnitario = this.tamanoSeleccionado.Precio;
      this.precioTotal = this.precioUnitario * this.cantidad;
    }
    
    if (this.data.producto.Cantidad_Disponible) {
      this.maxCantidad = Math.min(this.data.producto.Cantidad_Disponible, 50);
    }
  }

  // 🔹 CAMBIO: Seleccionar tamaño con botón
  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
    this.precioUnitario = tamano.Precio;
    this.actualizarPrecioTotal();
  }

  aumentarCantidad(): void {
    if (this.cantidad < this.maxCantidad) {
      this.cantidad++;
      this.actualizarPrecioTotal();
    }
  }

  reducirCantidad(): void {
    if (this.cantidad > 1) {
      this.cantidad--;
      this.actualizarPrecioTotal();
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
    this.actualizarPrecioTotal();
    event.target.value = value.toString();
  }

  private actualizarPrecioTotal(): void {
    this.precioTotal = this.precioUnitario * this.cantidad;
  }

  agregarAlPedido(): void {
    if (!this.tamanoSeleccionado) {
      return;
    }

    const detalle: PedidoDetalle = {
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      ID_Producto_T: this.tamanoSeleccionado.ID_Producto_T,
      Cantidad: this.cantidad,
      PrecioTotal: this.precioTotal,
      nombre_producto: this.data.producto.Nombre,
      nombre_categoria: this.data.producto.nombre_categoria || 'Sin categoría',
      nombre_tamano: this.tamanoSeleccionado.nombre_tamano || 'Tamaño único'
    };

    this.dialogRef.close(detalle);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

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
    this.actualizarPrecioTotal();
  }

  get disponibleTexto(): string {
    return `Disponible: ${this.data.producto.Cantidad_Disponible || 0} unidades`;
  }

  get tieneMultiplesTamanos(): boolean {
    return this.tamanosDisponibles.length > 1;
  }
}