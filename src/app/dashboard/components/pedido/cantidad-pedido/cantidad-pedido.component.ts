import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core Models
import { Producto, ProductoTamano } from '../../../../core/models/producto.model';
import { PedidoDetalle } from '../../../../core/models/pedido.model';
import { Combo, ComboDetalle } from '../../../../core/models/combo.model';

import Swal from 'sweetalert2';

export interface CantidadPedidoData {
  producto?: Producto;
  combo?: Combo;
  esCombo?: boolean;
  detallesCombo?: ComboDetalle[]; // Detalles para mostrar qué incluye
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
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './cantidad-pedido.component.html',
  styleUrls: ['./cantidad-pedido.component.css']
})
export class CantidadPedidoComponent implements OnInit {
  
  // Estado
  cantidad: number = 1;
  maxCantidad: number = 50;
  
  // Datos específicos de Producto
  tamanosDisponibles: ProductoTamano[] = [];
  tamanoSeleccionado: ProductoTamano | null = null;
  
  // Precios
  precioUnitario: number = 0;
  precioTotal: number = 0;

  // Flags
  esCombo: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CantidadPedidoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CantidadPedidoData
  ) {}

  ngOnInit(): void {
    this.esCombo = !!this.data.esCombo;

    if (this.esCombo && this.data.combo) {
      this.inicializarCombo();
    } else if (this.data.producto) {
      this.inicializarProducto();
    } else {
      console.error('Error: No se recibieron datos válidos de Producto ni Combo');
      this.cancelar();
    }
  }

  // --- Lógica de Inicialización ---

  private inicializarProducto() {
    const prod = this.data.producto!;
    
    // Filtrar tamaños activos
    this.tamanosDisponibles = prod.tamanos?.filter(t => t.Estado === 'A') || [];
    
    // Seleccionar el primero por defecto
    if (this.tamanosDisponibles.length > 0) {
      this.seleccionarTamano(this.tamanosDisponibles[0]);
    }
    
    // Validar stock
    if (prod.Cantidad_Disponible) {
      this.maxCantidad = Math.min(prod.Cantidad_Disponible, 100);
    }
  }

  private inicializarCombo() {
    const combo = this.data.combo!;
    
    // Combos tienen precio único
    this.precioUnitario = Number(combo.Precio);
    this.actualizarPrecioTotal();
    
    // Stock de combos es lógico (asumimos disponible si entró aquí)
    this.maxCantidad = 100; 
  }

  // --- Getters para la Vista (HTML) ---

  get nombreDisplay(): string {
    return this.esCombo ? this.data.combo!.Nombre : this.data.producto!.Nombre;
  }

  get categoriaDisplay(): string {
    return this.esCombo ? 'Combo' : (this.data.producto!.nombre_categoria || 'Producto');
  }

  get descripcionDisplay(): string {
    return this.esCombo ? this.data.combo!.Descripcion : this.data.producto!.Descripcion;
  }

  get disponibleTexto(): string {
    if (this.esCombo) return 'Disponible';
    const stock = this.data.producto!.Cantidad_Disponible || 0;
    return stock > 0 ? `Stock: ${stock}` : 'Agotado';
  }

  // 🔹 Helper para mostrar qué incluye el combo
  getProductosCombo(): string {
    if (!this.data.detallesCombo || this.data.detallesCombo.length === 0) {
      return 'Ver descripción';
    }
    // Muestra los primeros 3 productos y "..." si hay más
    const items = this.data.detallesCombo.slice(0, 3).map(d => d.Producto_Nombre);
    if (this.data.detallesCombo.length > 3) {
      items.push(`+${this.data.detallesCombo.length - 3} más`);
    }
    return items.join(', ');
  }

  getInfoCombo(): string {
    if (!this.data.detallesCombo) return '';
    return this.data.detallesCombo
      .map(d => `${d.Producto_Nombre} (${d.Tamano_Nombre}) x${d.Cantidad}`)
      .join('\n');
  }

  // --- Lógica de Interacción ---

  seleccionarTamano(tamano: ProductoTamano): void {
    this.tamanoSeleccionado = tamano;
    this.precioUnitario = Number(tamano.Precio);
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
    if (isNaN(value) || value < 1) value = 1;
    if (value > this.maxCantidad) value = this.maxCantidad;
    
    this.cantidad = value;
    this.actualizarPrecioTotal();
    event.target.value = value.toString();
  }

  validarEntrada(event: any): void {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, '');
    
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

  // --- Acción Final ---

  agregarAlPedido(): void {
    // Validación: Si es producto, debe tener tamaño seleccionado
    if (!this.esCombo && !this.tamanoSeleccionado) {
      Swal.fire('Atención', 'Debes seleccionar un tamaño.', 'warning');
      return;
    }

    // Construir objeto Detalle
    const detalle: PedidoDetalle = {
      ID_Pedido_D: 0,
      ID_Pedido: 0,
      
      // 🟢 IDs (Manejo seguro de undefined)
      ID_Producto_T: this.esCombo ? undefined : this.tamanoSeleccionado!.ID_Producto_T,
      ID_Combo: this.esCombo ? this.data.combo!.ID_Combo : undefined,
      
      Cantidad: this.cantidad,
      PrecioTotal: this.precioTotal,
      
      // 🟢 Datos Visuales
      Nombre_Producto: this.esCombo ? undefined : this.data.producto!.Nombre,
      Nombre_Combo: this.esCombo ? this.data.combo!.Nombre : undefined,
      
      // Helper visual unificado
      Nombre_Item: this.nombreDisplay,
      
      Tamano_Nombre: this.esCombo ? 'Combo' : (this.tamanoSeleccionado?.nombre_tamano || 'Estándar'),
      Tipo: this.esCombo ? 'combo' : 'producto'
    };

    this.dialogRef.close(detalle);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}