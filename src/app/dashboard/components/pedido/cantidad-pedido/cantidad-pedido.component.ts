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
import { Combo, ComboDetalle } from '../../../../core/models/combo.model'; // Importar ComboDetalle

export interface CantidadPedidoData {
  producto?: Producto;
  combo?: Combo;
  esCombo?: boolean;
  detallesCombo?: ComboDetalle[]; // 🔹 NUEVO: Agregar detalles del combo
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
<<<<<<< HEAD
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
=======
    if (this.data.esCombo && this.data.combo) {
      // 🔹 LÓGICA PARA COMBOS
      this.precioUnitario = this.data.combo.Precio;
      this.precioTotal = this.precioUnitario * this.cantidad;
      this.maxCantidad = 50; // Máximo por defecto para combos
    } else if (this.data.producto) {
      // 🔹 LÓGICA PARA PRODUCTOS (existente)
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
  }

  // 🔹 NUEVO: Obtener productos incluidos en el combo
  getProductosCombo(): string {
    if (this.data.esCombo && this.data.detallesCombo) {
      const productos = this.data.detallesCombo.map(detalle => 
        `${detalle.Cantidad}x ${detalle.Producto_Nombre} (${detalle.Tamano_Nombre})`
      );
      return productos.join(', ');
    }
    return '';
  }

  // 🔹 NUEVO: Obtener información detallada del combo para tooltip
  getInfoCombo(): string {
    if (this.data.esCombo && this.data.detallesCombo) {
      const productos = this.data.detallesCombo.map(detalle => 
        `${detalle.Cantidad}x ${detalle.Producto_Nombre} - ${detalle.Tamano_Nombre}`
      );
      return `Este combo incluye:\n${productos.join('\n')}`;
    }
    return '';
  }

  seleccionarTamano(tamano: ProductoTamano): void {
    if (!this.data.esCombo) {
      this.tamanoSeleccionado = tamano;
      this.precioUnitario = tamano.Precio;
      this.actualizarPrecioTotal();
    }
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
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
<<<<<<< HEAD
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

=======
    let detalle: PedidoDetalle;

    if (this.data.esCombo && this.data.combo) {
      // 🔹 CREAR DETALLE PARA COMBO
      detalle = {
        ID_Pedido_D: 0,
        ID_Pedido: 0,
        ID_Producto_T: 0, // No aplica para combos
        ID_Combo: this.data.combo.ID_Combo, // 🔹 NUEVO: ID del combo
        Cantidad: this.cantidad,
        PrecioTotal: this.precioTotal,
        nombre_producto: this.data.combo.Nombre,
        nombre_categoria: 'Combo',
        nombre_tamano: 'Combo',
        nombre_combo: this.data.combo.Nombre, // 🔹 NUEVO: Nombre del combo
        // 🔹 NUEVO: Agregar información de detalles del combo
        detallesCombo: this.data.detallesCombo || []
      };
    } else if (this.tamanoSeleccionado && this.data.producto) {
      // 🔹 CREAR DETALLE PARA PRODUCTO (existente)
      detalle = {
        ID_Pedido_D: 0,
        ID_Pedido: 0,
        ID_Producto_T: this.tamanoSeleccionado.ID_Producto_T,
        Cantidad: this.cantidad,
        PrecioTotal: this.precioTotal,
        nombre_producto: this.data.producto.Nombre,
        nombre_categoria: this.data.producto.nombre_categoria || 'Sin categoría',
        nombre_tamano: this.tamanoSeleccionado.nombre_tamano || 'Tamaño único'
      };
    } else {
      return;
    }

>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
    this.dialogRef.close(detalle);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  // Getters visuales
  get disponibleTexto(): string {
<<<<<<< HEAD
    const stock = this.data.producto.Cantidad_Disponible || 0;
    return stock > 0 ? `Stock: ${stock}` : 'Agotado';
=======
    if (this.data.esCombo) {
      return 'Disponible';
    } else if (this.data.producto) {
      return `Disponible: ${this.data.producto.Cantidad_Disponible || 0} unidades`;
    }
    return 'Disponible';
  }

  get tieneMultiplesTamanos(): boolean {
    return !this.data.esCombo && this.tamanosDisponibles.length > 1;
  }

  // 🔹 NUEVO: Verificar si es un combo
  get esCombo(): boolean {
    return this.data.esCombo || false;
  }

  // 🔹 NUEVO: Obtener nombre del item
  get nombreItem(): string {
    if (this.data.esCombo && this.data.combo) {
      return this.data.combo.Nombre;
    } else if (this.data.producto) {
      return this.data.producto.Nombre;
    }
    return 'Producto';
  }

  // 🔹 NUEVO: Obtener descripción del item
  get descripcionItem(): string {
    if (this.data.esCombo && this.data.combo) {
      return this.data.combo.Descripcion;
    } else if (this.data.producto) {
      return this.data.producto.Descripcion;
    }
    return '';
  }

  // 🔹 NUEVO: Obtener categoría del item
  get categoriaItem(): string {
    if (this.data.esCombo) {
      return 'Combo';
    } else if (this.data.producto) {
      return this.data.producto.nombre_categoria || 'Sin categoría';
    }
    return '';
>>>>>>> 71628ab0a6a7f3d7dbb4c222b0490f1c7f17032c
  }
}