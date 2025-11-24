import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

// Core
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
    // Filtrar solo tamaños activos
    this.tamanosDisponibles = this.data.producto.tamanos?.filter(t => t.Estado === 'A') || [];
    
    // Seleccionar el primero por defecto
    if (this.tamanosDisponibles.length > 0) {
      this.seleccionarTamano(this.tamanosDisponibles[0]);
    }
    
    // Validar stock máximo disponible
    if (this.data.producto.Cantidad_Disponible) {
      this.maxCantidad = Math.min(this.data.producto.Cantidad_Disponible, 100); // Limite lógico de 100 o stock real
    }
  }

  // 📏 Selección de Tamaño
  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
    this.precioUnitario = Number(tamano.Precio);
    this.actualizarPrecioTotal();
  }

  // ➕➖ Cantidad
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

  validarEntrada(event: any): void {
    const input = event.target;
    // Eliminar no numéricos
    let value = input.value.replace(/[^0-9]/g, '');
    
    // Validar rangos
    if (value !== '') {
        let num = parseInt(value, 10);
        if (num < 1) num = 1;
        if (num > this.maxCantidad) num = this.maxCantidad;
        this.cantidad = num;
    }
    
    input.value = this.cantidad.toString();
    this.actualizarPrecioTotal();
  }

  private actualizarPrecioTotal(): void {
    this.precioTotal = this.precioUnitario * this.cantidad;
  }

  // 🛒 Acciones Finales
  agregarAlPedido(): void {
    if (!this.tamanoSeleccionado) return;

    // Crear objeto Detalle (compatible con el modelo PedidoDetalle)
    const detalle: PedidoDetalle = {
      ID_Pedido_D: 0, // Temporal
      ID_Pedido: 0,   // Temporal
      ID_Producto_T: this.tamanoSeleccionado.ID_Producto_T,
      Cantidad: this.cantidad,
      PrecioTotal: this.precioTotal,
      
      // Datos visuales para el carrito
      Nombre_Producto: this.data.producto.Nombre,
      // Nombre_Categoria: this.data.producto.nombre_categoria || '', // Opcional si lo tienes en el modelo
      Tamano_Nombre: this.tamanoSeleccionado.nombre_tamano || 'Estándar',
      Tipo: 'producto'
    };

    this.dialogRef.close(detalle);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  // Getters visuales
  get disponibleTexto(): string {
    const stock = this.data.producto.Cantidad_Disponible || 0;
    return stock > 0 ? `Stock: ${stock}` : 'Agotado';
  }
}